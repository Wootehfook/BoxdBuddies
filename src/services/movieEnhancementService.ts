import { tmdbService, Movie as TMDBMovie } from './tmdbService';

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
  letterboxdUrl?: string;
}

interface RateLimiter {
  requests: number[];
  limit: number;
  window: number; // in milliseconds
}

class MovieEnhancementService {
  private rateLimiter: RateLimiter;
  private cache: Map<string, TMDBMovie> = new Map();

  constructor() {
    // TMDB allows 50 requests per second
    this.rateLimiter = {
      requests: [],
      limit: 40, // Stay under the limit
      window: 1000 // 1 second
    };
  }

  // Set TMDB API key
  setApiKey(apiKey: string): void {
    tmdbService.setApiKey(apiKey);
  }

  // Check if API key is available
  hasApiKey(): boolean {
    return tmdbService.hasApiKey();
  }

  // Rate limiting helper
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => now - time < this.rateLimiter.window
    );

    // If we're at the limit, wait
    if (this.rateLimiter.requests.length >= this.rateLimiter.limit) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = this.rateLimiter.window - (now - oldestRequest) + 50; // Add 50ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.rateLimiter.requests.push(now);
  }

  // Extract year from title if present
  private extractYearFromTitle(title: string): { cleanTitle: string; year?: number } {
    const yearMatch = title.match(/\((\d{4})\)$/);
    if (yearMatch) {
      return {
        cleanTitle: title.replace(/\s*\(\d{4}\)$/, '').trim(),
        year: parseInt(yearMatch[1])
      };
    }
    return { cleanTitle: title };
  }

  // Create cache key for movie lookup
  private getCacheKey(title: string, year?: number): string {
    return `${title.toLowerCase()}|${year || 'unknown'}`;
  }

  // Search for movie on TMDB with fuzzy matching
  private async searchTMDBMovie(title: string, year?: number): Promise<TMDBMovie | null> {
    const cacheKey = this.getCacheKey(title, year);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      await this.waitForRateLimit();
      
      const { movies } = await tmdbService.searchMovies(title, 1);
      
      if (movies.length === 0) {
        this.cache.set(cacheKey, null as any);
        return null;
      }

      // Find best match considering year if available
      let bestMatch = movies[0];
      
      if (year) {
        const exactYearMatch = movies.find(movie => movie.year === year);
        if (exactYearMatch) {
          bestMatch = exactYearMatch;
        } else {
          // Find closest year match within 2 years
          const closeMatches = movies.filter(movie => 
            Math.abs(movie.year - year) <= 2
          );
          if (closeMatches.length > 0) {
            bestMatch = closeMatches[0];
          }
        }
      }

      this.cache.set(cacheKey, bestMatch);
      return bestMatch;
      
    } catch (error) {
      console.error(`Error searching for movie "${title}":`, error);
      this.cache.set(cacheKey, null as any);
      return null;
    }
  }

  // Enhance a single movie with TMDB data
  async enhanceMovie(letterboxdMovie: Movie): Promise<Movie> {
    // If no API key, return original movie
    if (!this.hasApiKey()) {
      return letterboxdMovie;
    }

    // Extract year from title if not provided
    const { cleanTitle, year: extractedYear } = this.extractYearFromTitle(letterboxdMovie.title);
    const searchYear = letterboxdMovie.year || extractedYear;

    try {
      const tmdbMovie = await this.searchTMDBMovie(cleanTitle, searchYear);
      
      if (!tmdbMovie) {
        // Return original movie if no TMDB match found
        return {
          ...letterboxdMovie,
          title: cleanTitle,
          year: searchYear || letterboxdMovie.year
        };
      }

      // Merge Letterboxd and TMDB data
      return {
        ...letterboxdMovie,
        id: tmdbMovie.id,
        title: cleanTitle,
        year: searchYear || tmdbMovie.year,
        posterPath: tmdbMovie.poster_path,
        overview: tmdbMovie.overview,
        rating: tmdbMovie.rating
      };
      
    } catch (error) {
      console.error(`Error enhancing movie "${letterboxdMovie.title}":`, error);
      return letterboxdMovie;
    }
  }

  // Enhance multiple movies with progress tracking
  async enhanceMovies(
    movies: Movie[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<Movie[]> {
    const enhancedMovies: Movie[] = [];
    
    for (let i = 0; i < movies.length; i++) {
      const enhanced = await this.enhanceMovie(movies[i]);
      enhancedMovies.push(enhanced);
      
      if (onProgress) {
        onProgress(i + 1, movies.length);
      }
    }
    
    return enhancedMovies;
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    };
  }
}

export const movieEnhancementService = new MovieEnhancementService();
export default movieEnhancementService;
