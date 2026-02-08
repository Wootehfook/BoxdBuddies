# BoxdBuddy TMDB Database Full Sync Script
# AI Generated: GitHub Copilot - 2025-12-26
# Purpose: Ensure database is fully synced and up to date with TMDB

Write-Host "🎬 BoxdBuddy TMDB Database Full Sync" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is available
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm/npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Configuration
$CF_PAGES_PROJECT = if ($env:CF_PAGES_PROJECT -and $env:CF_PAGES_PROJECT.Trim()) { $env:CF_PAGES_PROJECT } else { 'boxdbud' }
$BASE_URL = if ($env:CF_PAGES_BASE_URL -and $env:CF_PAGES_BASE_URL.Trim()) { $env:CF_PAGES_BASE_URL } else { "https://$CF_PAGES_PROJECT.pages.dev" }
$ADMIN_SYNC_TOKEN = if ($env:ADMIN_SYNC_TOKEN -and $env:ADMIN_SYNC_TOKEN.Trim()) { $env:ADMIN_SYNC_TOKEN } else { 'admin-sync-token' }
$DATABASE_NAME = "boxdbuddy-movies"

if ($ADMIN_SYNC_TOKEN -eq 'admin-sync-token') {
    Write-Host "⚠️  ADMIN_SYNC_TOKEN not set; using default token" -ForegroundColor Yellow
}

# Helper: Extract property value from wrangler JSON output
function Get-FirstPropertyValue {
    param(
        [Parameter(Mandatory = $true)] $obj,
        [string[]] $candidateNames
    )
    if ($null -eq $obj) { return $null }
    if ($obj -is [System.Array]) {
        foreach ($item in $obj) {
            $val = Get-FirstPropertyValue -obj $item -candidateNames $candidateNames
            if ($null -ne $val) { return $val }
        }
        return $null
    }
    $props = @()
    try { $props = $obj.PSObject.Properties } catch { $props = @() }
    
    foreach ($name in $candidateNames) {
        if ($props.Name -contains $name) { return ($obj.$name) }
    }
    
    if ($props.Name -contains 'results' -and $obj.results -is [System.Array] -and $obj.results.Count -gt 0) {
        return Get-FirstPropertyValue -obj $obj.results[0] -candidateNames $candidateNames
    }
    
    foreach ($p in $props) {
        if ($p.Name -ne 'meta' -and $p.Name -ne 'success') {
            $val = Get-FirstPropertyValue -obj $p.Value -candidateNames $candidateNames
            if ($null -ne $val) { return $val }
        }
    }
    return $null
}

# Helper: Deploy latest code
function Invoke-Deploy {
    Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
    npm run build | Out-Null
    $deployOutput = npx wrangler pages deploy dist --project-name $CF_PAGES_PROJECT 2>&1
    $deployOutputStr = ($deployOutput | Out-String)
    
    $pattern = "https://[a-z0-9-]+\." + [regex]::Escape($CF_PAGES_PROJECT) + "\.pages\.dev"
    $lines = $deployOutputStr -split "`n"
    $candidates = @()
    foreach ($line in $lines) {
        if ($line -match $pattern -and $line -notmatch '(?i)alias') {
            $urlMatches = [regex]::Matches($line, $pattern)
            foreach ($m in $urlMatches) { $candidates += $m.Value }
        }
    }
    
    if ($candidates.Count -gt 0 -and -not ($env:CF_PAGES_BASE_URL -and $env:CF_PAGES_BASE_URL.Trim())) {
        $script:BASE_URL = $candidates[0]
        Write-Host "✓ Deployed to: $BASE_URL" -ForegroundColor Green
    }
    else {
        Write-Host "✓ Deployed to: $BASE_URL" -ForegroundColor Green
    }
}

# Helper: Query database with JSON parsing
function Invoke-DatabaseQuery {
    param(
        [Parameter(Mandatory = $true)] [string] $Query,
        [string[]] $PropertyNames
    )
    
    $output = npx wrangler d1 execute $DATABASE_NAME --remote --json --command $Query 2>$null
    $json = $null
    try { $json = ($output | Out-String) | ConvertFrom-Json -ErrorAction Stop } catch { $json = $null }
    if ($null -eq $json) {
        $filtered = ($output | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
        try { $json = $filtered | ConvertFrom-Json -ErrorAction Stop } catch { return $null }
    }
    
    if ($PropertyNames) {
        return Get-FirstPropertyValue -obj $json -candidateNames $PropertyNames
    }
    return $json
}

# Step 1: Check current database status
Write-Host "📊 Step 1: Checking current database status..." -ForegroundColor Cyan
$totalMovies = Invoke-DatabaseQuery -Query "SELECT COUNT(*) as total_movies FROM tmdb_movies;" -PropertyNames @('total_movies', 'COUNT(*)', 'total')
if (-not ($totalMovies -is [int])) { try { $totalMovies = [int]$totalMovies } catch { $totalMovies = 0 } }

$highestId = 0
$metaCount = Invoke-DatabaseQuery -Query "SELECT COUNT(*) as count FROM sync_metadata WHERE key = 'highest_movie_id_synced';" -PropertyNames @('count', 'COUNT(*)')
if ($metaCount -and $metaCount -gt 0) {
    $highestIdStr = Invoke-DatabaseQuery -Query "SELECT value FROM sync_metadata WHERE key = 'highest_movie_id_synced' LIMIT 1;" -PropertyNames @('value')
    if ($highestIdStr -and "$highestIdStr" -match '^[0-9]+$') {
        $highestId = [int]$highestIdStr
    }
}

$recentCount = Invoke-DatabaseQuery -Query "SELECT COUNT(*) as recent_movies FROM tmdb_movies WHERE last_updated > datetime('now', '-1 day');" -PropertyNames @('recent_movies', 'COUNT(*)', 'total')
if (-not ($recentCount -is [int])) { try { $recentCount = [int]$recentCount } catch { $recentCount = 0 } }

Write-Host "  • Total movies in database: $totalMovies" -ForegroundColor White
Write-Host "  • Highest synced movie ID: $highestId" -ForegroundColor White
Write-Host "  • Movies updated (last 24h): $recentCount" -ForegroundColor White
Write-Host ""

# Step 2: Deploy latest code
Write-Host "📦 Step 2: Deploying latest code..." -ForegroundColor Cyan
Invoke-Deploy
Write-Host ""

# Step 3: Sync by Movie ID (incremental)
Write-Host "🆔 Step 3: Running incremental sync by Movie ID..." -ForegroundColor Cyan
$startMovieId = $highestId + 1
$maxMoviesToSync = 500  # Configurable
Write-Host "  Starting from movie ID: $startMovieId" -ForegroundColor White
Write-Host "  Max movies to sync: $maxMoviesToSync" -ForegroundColor White

$chunkSize = 100
$totalSyncedById = 0
$totalErrorsById = 0
$remaining = $maxMoviesToSync

while ($remaining -gt 0) {
    $take = [Math]::Min($chunkSize, $remaining)
    
    $body = @{
        syncType     = "movieId"
        startMovieId = $startMovieId
        maxMovies    = $take
    } | ConvertTo-Json
    
    try {
        $result = curl.exe -sS --max-time 45 -X POST "$BASE_URL/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer $ADMIN_SYNC_TOKEN" `
            -d $body | ConvertFrom-Json
        
        if ($result.success) {
            $totalSyncedById += $result.synced
            $totalErrorsById += $result.errors
            $startMovieId = $result.highestId + 1
            $remaining -= $take
            Write-Host "  ✓ Synced $($result.synced) movies (up to ID $($result.highestId))" -ForegroundColor Green
            
            if ($result.synced -eq 0) {
                Write-Host "  • No more movies found, stopping incremental sync" -ForegroundColor DarkGray
                break
            }
        }
        else {
            Write-Host "  ⚠ Chunk failed: $($result.error)" -ForegroundColor Yellow
            $totalErrorsById++
            break
        }
    }
    catch {
        Write-Host "  ⚠ Request failed: $_" -ForegroundColor Yellow
        $totalErrorsById++
        break
    }
    
    if ($remaining -gt 0) { Start-Sleep -Milliseconds 500 }
}

Write-Host "  Summary: Synced $totalSyncedById movies, $totalErrorsById errors" -ForegroundColor White
Write-Host ""

# Step 4: Sync recent changes
Write-Host "🔄 Step 4: Syncing recently modified movies..." -ForegroundColor Cyan
$daysBack = 7
$startDate = (Get-Date).AddDays(-$daysBack).ToString("yyyy-MM-dd")
Write-Host "  Checking changes since: $startDate" -ForegroundColor White

$body = @{
    syncType  = "changes"
    startDate = $startDate
} | ConvertTo-Json

try {
    $result = curl.exe -sS --max-time 45 -X POST "$BASE_URL/admin/tmdb-sync" `
        -H "Content-Type: application/json" `
        -H "Authorization: Bearer $ADMIN_SYNC_TOKEN" `
        -d $body | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "  ✓ Updated $($result.synced) modified movies, $($result.errors) errors" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ Changes sync failed: $($result.error)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ⚠ Request failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Sync current year and future releases
Write-Host "📅 Step 5: Syncing current year and future releases..." -ForegroundColor Cyan
$currentYear = (Get-Date).Year
$futureYear = $currentYear + 10
$startDate = "$currentYear-01-01"
$endDate = "$futureYear-12-31"
Write-Host "  Date range: $startDate to $endDate" -ForegroundColor White

$totalPagesToSync = 20  # ~400 movies
$pagesPerBatch = 2
$numBatches = [Math]::Ceiling($totalPagesToSync / $pagesPerBatch)
$totalSyncedByYear = 0
$totalErrorsByYear = 0

for ($batch = 1; $batch -le $numBatches; $batch++) {
    $startPage = ($batch - 1) * $pagesPerBatch + 1
    $endPage = [Math]::Min($batch * $pagesPerBatch, $totalPagesToSync)
    $batchPages = $endPage - $startPage + 1
    
    $body = @{
        syncType         = 'current_year'
        releaseYearStart = $startDate
        releaseYearEnd   = $endDate
        maxPages         = $batchPages
        startPage        = $startPage
    } | ConvertTo-Json
    
    try {
        $result = curl.exe -sS --max-time 45 -X POST "$BASE_URL/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer $ADMIN_SYNC_TOKEN" `
            -d $body | ConvertFrom-Json
        
        if ($result.success) {
            $totalSyncedByYear += $result.synced
            $totalErrorsByYear += $result.errors
        }
        else {
            Write-Host "  ⚠ Batch $batch failed: $($result.error)" -ForegroundColor Yellow
            $totalErrorsByYear++
        }
    }
    catch {
        Write-Host "  ⚠ Batch $batch request failed: $_" -ForegroundColor Yellow
        $totalErrorsByYear++
    }
    
    if ($batch -lt $numBatches) { Start-Sleep -Seconds 1 }
}

Write-Host "  ✓ Synced $totalSyncedByYear current/future movies, $totalErrorsByYear errors" -ForegroundColor Green
Write-Host ""

# Step 6: Final status check
Write-Host "📊 Step 6: Final database status..." -ForegroundColor Cyan
$finalTotal = Invoke-DatabaseQuery -Query "SELECT COUNT(*) as total_movies FROM tmdb_movies;" -PropertyNames @('total_movies', 'COUNT(*)', 'total')
if (-not ($finalTotal -is [int])) { try { $finalTotal = [int]$finalTotal } catch { $finalTotal = 0 } }

$finalHighestId = 0
$finalMetaCount = Invoke-DatabaseQuery -Query "SELECT COUNT(*) as count FROM sync_metadata WHERE key = 'highest_movie_id_synced';" -PropertyNames @('count', 'COUNT(*)')
if ($finalMetaCount -and $finalMetaCount -gt 0) {
    $finalHighestIdStr = Invoke-DatabaseQuery -Query "SELECT value FROM sync_metadata WHERE key = 'highest_movie_id_synced' LIMIT 1;" -PropertyNames @('value')
    if ($finalHighestIdStr -and "$finalHighestIdStr" -match '^[0-9]+$') {
        $finalHighestId = [int]$finalHighestIdStr
    }
}

$deltaMovies = $finalTotal - $totalMovies
Write-Host "  • Total movies: $finalTotal (Δ $deltaMovies)" -ForegroundColor White
Write-Host "  • Highest synced ID: $finalHighestId" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "✅ Sync Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  By Movie ID:      $totalSyncedById movies" -ForegroundColor White
Write-Host "  Recent Changes:   Updated modified movies" -ForegroundColor White
Write-Host "  Current/Future:   $totalSyncedByYear movies" -ForegroundColor White
Write-Host "  Total Added:      $deltaMovies movies" -ForegroundColor Cyan
Write-Host "  Final Count:      $finalTotal movies" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Run this script regularly to keep your database up to date!" -ForegroundColor Yellow
