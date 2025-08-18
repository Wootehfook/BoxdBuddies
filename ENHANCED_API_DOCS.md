# Enhanced API Endpoints Documentation

## Overview

BoxdBuddy now includes comprehensive API capabilities with enhanced endpoints featuring dual caching, CORS support, and intelligent movie matching.

## New API Endpoints

### 🏥 Enhanced Health Check

**Endpoint**: `GET /api/health`

Enhanced health check with detailed service status reporting including database connectivity, KV storage, and TMDB API health.

**Response Example**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-18T03:30:00.000Z",
  "project": "boxdbud",
  "environment": "cloudflare-pages",
  "services": {
    "database": { "status": "healthy", "message": "Database responsive" },
    "kv_storage": { "status": "healthy", "message": "KV storage responsive" },
    "tmdb_api": { "status": "healthy", "message": "TMDB API responsive" }
  }
}
```

### 🔥 Popular Movies

**Endpoint**: `GET /api/popular`

Get popular movies with pagination and dual caching (Cloudflare Cache + KV storage).

**Parameters**:

- `page` (optional): Page number (1-500, default: 1)
- `region` (optional): Region code (default: 'US')

**Response Example**:

```json
{
  "page": 1,
  "total_pages": 500,
  "total_results": 10000,
  "movies": [
    {
      "id": 693134,
      "title": "Dune: Part Two",
      "year": 2024,
      "poster_path": "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      "poster_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      "overview": "Follow the mythic journey of Paul Atreides...",
      "vote_average": 8.2,
      "runtime": 166,
      "popularity": 2847.543
    }
  ]
}
```

### 🎬 Movie Details

**Endpoint**: `GET /api/movie/{id}`

Get detailed information about a specific movie with database fallback and credits.

**Parameters**:

- `id`: TMDB Movie ID
- `append_to_response` (optional): Additional data to include (default: 'credits')

**Response Example**:

```json
{
  "id": 550,
  "title": "Fight Club",
  "year": 1999,
  "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "poster_url": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "overview": "A ticking-time-bomb insomniac...",
  "vote_average": 8.433,
  "runtime": 139,
  "director": "David Fincher",
  "genres": [{ "id": 18, "name": "Drama" }],
  "credits": {
    "cast": [
      { "id": 819, "name": "Edward Norton", "character": "The Narrator" }
    ],
    "crew": [{ "id": 7467, "name": "David Fincher", "job": "Director" }]
  }
}
```

### 🔍 Batch Movie Enhancement

**Endpoint**: `POST /api/enhance`

Enhance multiple movies with TMDB data using intelligent year-based matching. Rate limited to 50 movies per request.

**Request Body**:

```json
{
  "movies": [
    { "title": "The Matrix", "year": 1999 },
    { "title": "Inception", "year": 2010 }
  ]
}
```

**Response Example**:

```json
{
  "success": true,
  "enhanced": 2,
  "errors": 0,
  "total": 2,
  "movies": [
    {
      "id": 603,
      "title": "The Matrix",
      "year": 1999,
      "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
    }
  ]
}
```

### 🔎 Enhanced Search

**Endpoint**: `GET /search`

Enhanced search with dual caching layer and improved database fallback.

**Parameters**:

- `q`: Search query (minimum 2 characters)
- `page` (optional): Page number (default: 1)

**Response Example**:

```json
{
  "movies": [...],
  "totalPages": 1,
  "totalRecords": 5,
  "source": "database"
}
```

## Enhanced Features

### 🌐 CORS Support

All endpoints include comprehensive CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 🚀 Dual Caching Strategy

1. **Cloudflare Edge Cache**: Fast response times (5-30 minutes)
2. **KV Storage**: Persistent caching (15 minutes - 2 hours)
3. **Graceful Fallbacks**: Database → TMDB API → Error

### 📊 Rate Limiting

- Batch enhancement: Maximum 50 movies per request
- Intelligent batch processing with delays between API calls
- Comprehensive error handling with specific error codes

### 🎯 Intelligent Matching

- Exact title and year matching
- Fuzzy title matching with year constraints
- Close year matching (±2 years tolerance)
- Popularity-based ranking for multiple matches

### 🖼️ Full Poster URLs

All movie responses include both `poster_path` and `poster_url` fields for immediate use.

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "SPECIFIC_ERROR_CODE",
    "timestamp": "2025-01-18T03:30:00.000Z",
    "details": {...}
  }
}
```

Common error codes:

- `TMDB_API_KEY_MISSING`: TMDB API key not configured
- `MISSING_QUERY`: Search query required
- `RATE_LIMIT_EXCEEDED`: Too many movies in batch request
- `MOVIE_NOT_FOUND`: Movie ID does not exist
- `INVALID_MOVIE_ID`: Invalid movie ID format

## Testing

Run the manual test script to verify all endpoints:

```bash
node test-enhanced-api.mjs
```

This will test all new endpoints including edge cases and error conditions.
