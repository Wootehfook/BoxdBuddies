import axios from 'axios';

// TMDB API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// API key will be set dynamically from user input
let TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path?: string;
  overview?: string;
  rating?: number;
}

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = TMDB_API_KEY;
  }

  // Set API key dynamically
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    TMDB_API_KEY = apiKey;
  }

  // Check if API key is available
  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'demo_key');
  }

  // Convert TMDB movie to our internal format
  private convertTMDBMovie(tmdbMovie: TMDBMovie): Movie {
    return {
      id: tmdbMovie.id,
      title: tmdbMovie.title,
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 0,
      poster_path: tmdbMovie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}` : undefined,
      overview: tmdbMovie.overview,
      rating: tmdbMovie.vote_average
    };
  }

  // Search for movies by title
  async searchMovies(query: string, page: number = 1): Promise<{ movies: Movie[], totalPages: number }> {
    try {
      const response = await axios.get<TMDBSearchResponse>(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
          include_adult: false
        }
      });

      const movies = response.data.results.map(movie => this.convertTMDBMovie(movie));
      
      return {
        movies,
        totalPages: response.data.total_pages
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
    }
  }

  // Get popular movies
  async getPopularMovies(page: number = 1): Promise<{ movies: Movie[], totalPages: number }> {
    try {
      const response = await axios.get<TMDBSearchResponse>(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: this.apiKey,
          page
        }
      });

      const movies = response.data.results.map(movie => this.convertTMDBMovie(movie));
      
      return {
        movies,
        totalPages: response.data.total_pages
      };
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw new Error('Failed to fetch popular movies');
    }
  }

  // Get movie details by ID
  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const response = await axios.get<TMDBMovie>(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey
        }
      });

      return this.convertTMDBMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw new Error('Failed to fetch movie details');
    }
  }

  // Generate sample watchlist with real movie data (for demo)
  async generateSampleWatchlist(): Promise<Movie[]> {
    try {
      // Get a mix of popular movies
      const { movies } = await this.getPopularMovies();
      
      // Return a random subset of 4-8 movies
      const shuffled = movies.sort(() => 0.5 - Math.random());
      const count = Math.floor(Math.random() * 5) + 4; // 4-8 movies
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error generating sample watchlist:', error);
      // Fallback to static data if API fails
      return this.getFallbackMovies();
    }
  }

  // Fallback movies if API is unavailable
  private getFallbackMovies(): Movie[] {
    return [
      { id: 238, title: "The Godfather", year: 1972, overview: "An organized crime dynasty's aging patriarch transfers control to his reluctant son." },
      { id: 278, title: "The Shawshank Redemption", year: 1994, overview: "Two imprisoned men bond over years, finding solace and eventual redemption." },
      { id: 680, title: "Pulp Fiction", year: 1994, overview: "The lives of two mob hitmen, a boxer, and others intertwine in four tales of violence." },
      { id: 155, title: "The Dark Knight", year: 2008, overview: "Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy." },
      { id: 424, title: "Schindler's List", year: 1993, overview: "In WWII, industrialist Oskar Schindler saves over a thousand Polish-Jewish refugees." },
      { id: 13, title: "Forrest Gump", year: 1994, overview: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man." }
    ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3);
  }
}

export const tmdbService = new TMDBService();
export default tmdbService;
