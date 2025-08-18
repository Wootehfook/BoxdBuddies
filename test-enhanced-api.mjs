#!/usr/bin/env node
// AI Generated: GitHub Copilot - 2025-01-18
// Manual test script for enhanced API endpoints

const BASE_URL = 'https://boxdbuddy.pages.dev';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}:`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      if (data.movies && Array.isArray(data.movies)) {
        console.log(`   📽️  Found ${data.movies.length} movies`);
        if (data.movies[0]) {
          console.log(`   🎬 Sample: ${data.movies[0].title} (${data.movies[0].year})`);
        }
      }
      if (data.services) {
        console.log(`   🏥 Health: ${data.status}`);
        console.log(`   🔧 Services: ${Object.keys(data.services).join(', ')}`);
      }
    } else {
      console.log(`   ❌ Error: ${data.error?.message || data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing Enhanced BoxdBuddy API Endpoints\n');
  
  // Test enhanced health check
  await testEndpoint(
    'Enhanced Health Check',
    `${BASE_URL}/api/health`
  );
  
  // Test popular movies endpoint
  await testEndpoint(
    'Popular Movies (Page 1)',
    `${BASE_URL}/api/popular?page=1`
  );
  
  // Test popular movies with region
  await testEndpoint(
    'Popular Movies (UK Region)',
    `${BASE_URL}/api/popular?page=1&region=GB`
  );
  
  // Test enhanced search endpoint
  await testEndpoint(
    'Enhanced Search (Matrix)',
    `${BASE_URL}/search?q=matrix&page=1`
  );
  
  // Test movie details endpoint
  await testEndpoint(
    'Movie Details (Fight Club - ID 550)',
    `${BASE_URL}/api/movie/550`
  );
  
  // Test movie details with credits
  await testEndpoint(
    'Movie Details with Credits',
    `${BASE_URL}/api/movie/550?append_to_response=credits`
  );
  
  // Test non-existent movie
  await testEndpoint(
    'Non-existent Movie (Should 404)',
    `${BASE_URL}/api/movie/999999`
  );
  
  // Test batch enhancement endpoint
  await testEndpoint(
    'Batch Movie Enhancement',
    `${BASE_URL}/api/enhance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movies: [
          { title: 'The Matrix', year: 1999 },
          { title: 'Inception', year: 2010 },
          { title: 'Pulp Fiction', year: 1994 }
        ]
      })
    }
  );
  
  // Test batch enhancement with too many movies (should fail)
  await testEndpoint(
    'Batch Enhancement (Rate Limited)',
    `${BASE_URL}/api/enhance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movies: Array(51).fill({ title: 'Test Movie', year: 2023 })
      })
    }
  );
  
  // Test CORS preflight
  await testEndpoint(
    'CORS Preflight Check',
    `${BASE_URL}/api/popular`,
    {
      method: 'OPTIONS'
    }
  );
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testEndpoint };