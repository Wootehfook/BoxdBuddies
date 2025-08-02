// Test file to verify TMDB integration functionality
import { movieEnhancementService } from './src/services/movieEnhancementService';

// Test movies from the previous terminal output
const testMovies = [
  { id: 1, title: "The Handmaiden", year: 2016 },
  { id: 2, title: "Holy Motors", year: 2012 },
  { id: 3, title: "A Tale of Two Sisters", year: 2003 },
  { id: 4, title: "Godzilla Minus One", year: 2023 },
  { id: 5, title: "The French Dispatch", year: 2021 }
];

// Function to test enhancement
async function testEnhancement() {
  console.log("Testing TMDB enhancement...");
  
  // Test with a demo API key (would need real key for actual testing)
  try {
    const enhanced = await movieEnhancementService.enhanceMovie(testMovies[0]);
    console.log("Enhanced movie:", enhanced);
  } catch (error) {
    console.log("Enhancement test (expected without API key):", error.message);
  }
  
  // Test cache stats
  const stats = movieEnhancementService.getCacheStats();
  console.log("Cache stats:", stats);
}

// Export for browser console testing
window.testTMDB = testEnhancement;
