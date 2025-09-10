# BoxdBuddy TMDB Database Sync Script
# AI Generated: GitHub Copilot - 2025-08-16

Write-Host "🎬 BoxdBuddy TMDB Database Sync Utility" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if wrangler is available
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm/npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Resolve Cloudflare Pages project and base URL (override via env vars if set)
$CF_PAGES_PROJECT = if ($env:CF_PAGES_PROJECT -and $env:CF_PAGES_PROJECT.Trim()) { $env:CF_PAGES_PROJECT } else { 'boxdbud' }
$BASE_URL = if ($env:CF_PAGES_BASE_URL -and $env:CF_PAGES_BASE_URL.Trim()) { $env:CF_PAGES_BASE_URL } else { "https://$CF_PAGES_PROJECT.pages.dev" }

# Helper: Deploy and capture preview base URL from Wrangler output
function Invoke-DeployAndSetPreviewBaseUrl {
    param(
        [Parameter(Mandatory = $true)] [string] $ProjectName
    )
    Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
    npm run build
    $deployOutput = npx wrangler pages deploy dist --project-name $ProjectName 2>&1
    $deployOutputStr = ($deployOutput | Out-String)

    # Try to extract the preview URL (hash subdomain), prefer lines that are not the alias URL
    $pattern = "https://[a-z0-9-]+\." + [regex]::Escape($ProjectName) + "\.pages\.dev"
    $lines = $deployOutputStr -split "`n"
    $candidates = @()
    foreach ($line in $lines) {
        if ($line -match $pattern) {
            # Skip alias lines to prefer the unique preview URL
            if ($line -notmatch '(?i)alias') {
                $urlMatches = [regex]::Matches($line, $pattern)
                foreach ($m in $urlMatches) { $candidates += $m.Value }
            }
        }
    }
    if ($candidates.Count -eq 0) {
        # Fallback: accept any match (including alias) if no non-alias match was found
        foreach ($line in $lines) {
            if ($line -match $pattern) {
                $urlMatches = [regex]::Matches($line, $pattern)
                foreach ($m in $urlMatches) { $candidates += $m.Value }
            }
        }
    }

    if ($candidates.Count -gt 0) {
        $previewUrl = $candidates[0]
        if (-not ($env:CF_PAGES_BASE_URL -and $env:CF_PAGES_BASE_URL.Trim())) {
            # Only override BASE_URL if not explicitly set via env var
            $script:BASE_URL = $previewUrl
            Write-Host "🔗 Using preview base URL: $BASE_URL" -ForegroundColor Cyan
        }
        else {
            Write-Host "ℹ️ CF_PAGES_BASE_URL is set; keeping configured base URL: $BASE_URL" -ForegroundColor DarkCyan
        }
    }
    else {
        Write-Host "⚠️  Could not detect preview URL from deploy output. Using default: $BASE_URL" -ForegroundColor Yellow
    }
}

# Helper: Ensure the deployed functions are responding before starting sync
function Invoke-EnsureFunctionsReady {
    param(
        [Parameter(Mandatory = $true)] [string] $HealthUrl,
        [int] $TimeoutSeconds = 60,
        [int] $IntervalSeconds = 2
    )
    Write-Host "🧪 Checking functions health at: $HealthUrl" -ForegroundColor Blue
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = curl.exe -sS --max-time 5 -w "`n%{http_code}" "$HealthUrl"
            if ($resp) {
                $parts = $resp -split "`n"
                $body = ($parts[0..($parts.Length - 2)] -join "`n").Trim()
                $code = $parts[-1].Trim()
                if ($code -eq "200" -and $body -match '"functions_working"\s*:\s*true') {
                    Write-Host "✅ Functions are ready (HTTP 200)" -ForegroundColor Green
                    return $true
                }
            }
        }
        catch { }
        Start-Sleep -Seconds $IntervalSeconds
    }
    Write-Host "⚠️  Functions health check timed out after $TimeoutSeconds seconds" -ForegroundColor Yellow
    return $false
}

# Helper: Extract the first matching property value from an unknown JSON shape
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
    foreach ($p in $props) {
        $val = Get-FirstPropertyValue -obj $p.Value -candidateNames $candidateNames
        if ($null -ne $val) { return $val }
    }
    return $null
}

Write-Host ""
Write-Host "Available sync options:" -ForegroundColor Yellow
Write-Host "1. 🔄 Full sync (50 batches, 500 pages, ~10,000 movies, ~20 mins)" -ForegroundColor White
Write-Host "2. 🚀 Quick sync (5 batches, 50 pages, ~1,000 movies, ~2 mins)" -ForegroundColor White
Write-Host "3. 🧪 Test sync (1 batch, 5 pages, ~100 movies, ~30 secs)" -ForegroundColor White
Write-Host "4. 📦 Single batch (10 pages, ~200 movies, ~25 secs)" -ForegroundColor White
Write-Host "5. 🎯 Extended sync (100 batches, 1000 pages, ~20,000 movies, ~40 mins)" -ForegroundColor White
Write-Host "6. 🎪 Mega sync (200 batches, 2000 pages, ~40,000 movies, ~80 mins)" -ForegroundColor White
Write-Host "7. 🆔 Incremental sync by Movie ID (resumes from last ID, ~5 mins)" -ForegroundColor Yellow
Write-Host "8. 🔄 Changes sync (updates modified movies, ~2 mins)" -ForegroundColor Yellow
Write-Host "9. 🕐 Trigger daily update job manually" -ForegroundColor White
Write-Host "10. 📊 Check sync status" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-10)"

switch ($choice) {
    "1" {
        Write-Host "🔄 Starting full initial sync (50 batches)..." -ForegroundColor Green
        Write-Host "⚠️  This will take ~20 minutes and run 50 separate sync operations" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            
            Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
            
            $totalSynced = 0
            $totalErrors = 0
            
            for ($batch = 1; $batch -le 50; $batch++) {
                $startPage = ($batch - 1) * 10 + 1
                $maxPages = $batch * 10
                
                Write-Host "📦 Batch $batch/50: Pages $startPage to $maxPages" -ForegroundColor Cyan
                
                $body = @{
                    startPage = $startPage
                    maxPages  = $maxPages
                } | ConvertTo-Json
                
                $result = curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
                    -H "Content-Type: application/json" `
                    -H "Authorization: Bearer admin-sync-token" `
                    -d $body | ConvertFrom-Json
                
                if ($result.success) {
                    $totalSynced += $result.synced
                    $totalErrors += $result.errors
                    Write-Host "✅ Batch $batch complete: +$($result.synced) movies, $($result.errors) errors" -ForegroundColor Green
                }
                else {
                    Write-Host "❌ Batch $batch failed: $($result.error)" -ForegroundColor Red
                }
                
                # Brief pause between batches - each batch already takes ~20 seconds with built-in rate limiting
                if ($batch -lt 50) {
                    Write-Host "⏳ Waiting 0.5 seconds before next batch..." -ForegroundColor Gray
                    Start-Sleep -Milliseconds 500
                }
            }
            
            Write-Host "🎉 Full sync complete! Total: $totalSynced movies, $totalErrors errors" -ForegroundColor Green
        }
    }
    "2" {
        Write-Host "🚀 Starting quick sync (5 batches)..." -ForegroundColor Green
        
        Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
        
        $totalSynced = 0
        $totalErrors = 0
        
        for ($batch = 1; $batch -le 5; $batch++) {
            $startPage = ($batch - 1) * 10 + 1
            $maxPages = $batch * 10
            
            Write-Host "� Batch $batch/5: Pages $startPage to $maxPages" -ForegroundColor Cyan
            
            $body = @{
                startPage = $startPage
                maxPages  = $maxPages
            } | ConvertTo-Json
            
            $result = curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
                -H "Content-Type: application/json" `
                -H "Authorization: Bearer admin-sync-token" `
                -d $body | ConvertFrom-Json
            
            if ($result.success) {
                $totalSynced += $result.synced
                $totalErrors += $result.errors
                Write-Host "✅ Batch $batch complete: +$($result.synced) movies, $($result.errors) errors" -ForegroundColor Green
            }
            else {
                Write-Host "❌ Batch $batch failed: $($result.error)" -ForegroundColor Red
            }
            
            # Brief pause between batches - each batch already includes rate limiting
            if ($batch -lt 5) {
                Write-Host "⏳ Waiting 0.5 seconds before next batch..." -ForegroundColor Gray
                Start-Sleep -Milliseconds 500
            }
        }
        
        Write-Host "🎉 Quick sync complete! Total: $totalSynced movies, $totalErrors errors" -ForegroundColor Green
    }
    "3" {
        Write-Host "🧪 Starting test sync..." -ForegroundColor Green
        $body = @{
            startPage = 1
            maxPages  = 5
        } | ConvertTo-Json
        
        Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
        
        Write-Host "📡 Starting sync..." -ForegroundColor Blue
        curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "4" {
        Write-Host "📦 Starting single batch sync..." -ForegroundColor Green
        $startPage = Read-Host "Enter start page (1-1000)"
        $maxPages = [int]$startPage + 9
        
        $body = @{
            startPage = [int]$startPage
            maxPages  = $maxPages
        } | ConvertTo-Json
        
        Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
        
        Write-Host "📡 Starting sync for pages $startPage to $maxPages..." -ForegroundColor Blue
        curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "5" {
        Write-Host "🎯 Starting extended sync (100 batches)..." -ForegroundColor Green
        Write-Host "⚠️  This will take ~40 minutes and run 100 separate sync operations (~20,000 movies)" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            
            Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
            
            $totalSynced = 0
            $totalErrors = 0
            
            for ($batch = 1; $batch -le 100; $batch++) {
                $startPage = ($batch - 1) * 10 + 1
                $maxPages = $batch * 10
                
                Write-Host "📦 Batch $batch/100: Pages $startPage to $maxPages" -ForegroundColor Cyan
                
                $body = @{
                    startPage = $startPage
                    maxPages  = $maxPages
                } | ConvertTo-Json
                
                $result = curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
                    -H "Content-Type: application/json" `
                    -H "Authorization: Bearer admin-sync-token" `
                    -d $body | ConvertFrom-Json
                
                if ($result.success) {
                    $totalSynced += $result.synced
                    $totalErrors += $result.errors
                    Write-Host "✅ Batch $batch complete: +$($result.synced) movies, $($result.errors) errors (Total: $totalSynced)" -ForegroundColor Green
                }
                else {
                    Write-Host "❌ Batch $batch failed: $($result.error)" -ForegroundColor Red
                }
                
                # Brief pause between batches
                if ($batch -lt 100) {
                    Write-Host "⏳ Waiting 0.5 seconds before next batch..." -ForegroundColor Gray
                    Start-Sleep -Milliseconds 500
                }
            }
            
            Write-Host "🎉 Extended sync complete! Total: $totalSynced movies, $totalErrors errors" -ForegroundColor Green
        }
    }
    "6" {
        Write-Host "🎪 Starting mega sync (200 batches)..." -ForegroundColor Green
        Write-Host "⚠️  This will take ~80 minutes and run 200 separate sync operations (~40,000 movies)" -ForegroundColor Yellow
        Write-Host "⚠️  This is a massive operation - make sure you have time!" -ForegroundColor Red
        $confirm = Read-Host "Are you absolutely sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            
            Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
            
            $totalSynced = 0
            $totalErrors = 0
            
            for ($batch = 1; $batch -le 200; $batch++) {
                $startPage = ($batch - 1) * 10 + 1
                $maxPages = $batch * 10
                
                Write-Host "📦 Batch $batch/200: Pages $startPage to $maxPages" -ForegroundColor Cyan
                
                $body = @{
                    startPage = $startPage
                    maxPages  = $maxPages
                } | ConvertTo-Json
                
                $result = curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
                    -H "Content-Type: application/json" `
                    -H "Authorization: Bearer admin-sync-token" `
                    -d $body | ConvertFrom-Json
                
                if ($result.success) {
                    $totalSynced += $result.synced
                    $totalErrors += $result.errors
                    Write-Host "✅ Batch $batch complete: +$($result.synced) movies, $($result.errors) errors (Total: $totalSynced)" -ForegroundColor Green
                }
                else {
                    Write-Host "❌ Batch $batch failed: $($result.error)" -ForegroundColor Red
                }
                
                # Brief pause between batches
                if ($batch -lt 200) {
                    Write-Host "⏳ Waiting 0.5 seconds before next batch..." -ForegroundColor Gray
                    Start-Sleep -Milliseconds 500
                }
                
                # Progress checkpoint every 25 batches
                if ($batch % 25 -eq 0) {
                    Write-Host "🏁 Checkpoint: $batch/200 batches complete ($totalSynced movies synced)" -ForegroundColor Magenta
                }
            }
            
            Write-Host "🎉 Mega sync complete! Total: $totalSynced movies, $totalErrors errors" -ForegroundColor Green
        }
    }
    "7" {
        Write-Host "🆔 Starting incremental sync by Movie ID..." -ForegroundColor Green
        
        # Get the last synced movie ID from database
        Write-Host "🔎 Checking last synced movie ID..." -ForegroundColor Blue
        # Query highest synced movie id as a numeric scalar and request JSON output from wrangler
        # Note: Without --json, wrangler prints a table with unicode glyphs which breaks ConvertFrom-Json
        $wranglerOutput = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COALESCE(MAX(CAST(value AS INTEGER)), 0) AS highest_movie_id_synced FROM sync_metadata WHERE key = 'highest_movie_id_synced';"

        # Try to parse JSON robustly; some wrangler versions may include extra lines, so join and filter
        $lastIdResult = $null
        try {
            $lastIdResult = ($wranglerOutput | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null
        }
        catch {
            # Fallback: keep only lines that look like JSON and try again
            $jsonOnly = ($wranglerOutput | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try {
                $lastIdResult = $jsonOnly | ConvertFrom-Json -ErrorAction Stop 2>$null
            }
            catch {
                $lastIdResult = $null
            }
        }

        $highestSynced = Get-FirstPropertyValue -obj $lastIdResult -candidateNames @('highest_movie_id_synced', 'value')

        # Also capture current total movie count before sync for status reporting
        $preCountOutput = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COUNT(*) AS total_movies FROM tmdb_movies;"
        $preCountJson = $null
        try { $preCountJson = ($preCountOutput | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $preCountJson = $null }
        if ($null -eq $preCountJson) {
            $preCountFiltered = ($preCountOutput | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $preCountJson = $preCountFiltered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $preCountJson = $null }
        }
        $preTotalMovies = Get-FirstPropertyValue -obj $preCountJson -candidateNames @('total_movies', 'COUNT(*)', 'total')
        if (-not ($preTotalMovies -is [int])) { try { $preTotalMovies = [int]$preTotalMovies } catch { $preTotalMovies = 0 } }
        $prevHighest = 0
        if ($null -ne $highestSynced -and "$highestSynced" -match '^[0-9]+$') { $prevHighest = [int]$highestSynced }

        Write-Host "🧾 Pre-sync status: total_movies=$preTotalMovies, highest_movie_id_synced=$prevHighest" -ForegroundColor DarkCyan
        
        $startMovieId = 1
        if ($null -ne $highestSynced -and "$highestSynced" -match '^[0-9]+$') {
            $startMovieId = [int]$highestSynced + 1
            Write-Host "📍 Resuming from movie ID: $startMovieId" -ForegroundColor Cyan
        }
        else {
            Write-Host "📍 No previous sync found, starting from movie ID: 1" -ForegroundColor Cyan
        }
        
        $maxMovies = Read-Host "Enter max movies to sync (default: 15)"
        if (-not $maxMovies) { $maxMovies = 15 }
        
        Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
        # Wait for functions to be ready; do not block if they aren't, but warn
        $healthUrl = "$BASE_URL/api/health"
        Invoke-EnsureFunctionsReady -HealthUrl $healthUrl | Out-Null
        
        # Run in small chunks to avoid Cloudflare timeouts
        $remaining = [int]$maxMovies
        $chunkSize = 10
        $totalSyncedThisRun = 0
        $totalErrorsThisRun = 0
        while ($remaining -gt 0) {
            $take = [Math]::Min($chunkSize, $remaining)
            $attemptSize = $take
            $succeeded = $false
            $attempts = 0
            while (-not $succeeded -and $attempts -lt 3) {
                $attempts++
                $body = @{
                    syncType     = "movieId"
                    startMovieId = [int]$startMovieId
                    maxMovies    = [int]$attemptSize
                } | ConvertTo-Json

                Write-Host ("📡 Starting incremental sync chunk: {0} movies from ID {1} (URL: {2}, timeout 45s)" -f $attemptSize, $startMovieId, "$BASE_URL/admin/tmdb-sync") -ForegroundColor Blue
                $syncResponse = curl.exe -sS --fail-with-body --max-time 45 -w "`n%{http_code}" -X POST "$BASE_URL/admin/tmdb-sync" `
                    -H "Content-Type: application/json" `
                    -H "Authorization: Bearer admin-sync-token" `
                    -d $body
                $srParts = $syncResponse -split "`n"
                $srBody = ($srParts[0..($srParts.Length - 2)] -join "`n").Trim()
                $srCode = $srParts[-1].Trim()
                $syncJson = $null
                try { $syncJson = ($srBody | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $syncJson = $null }
                if ($syncJson -and ($srCode -eq "200" -or $srCode -eq "204")) {
                    $synced = [int]$syncJson.synced
                    $errors = [int]$syncJson.errors
                    $newHighest = [int]$syncJson.highestId
                    $message = $syncJson.message
                    $totalSyncedThisRun += $synced
                    $totalErrorsThisRun += $errors
                    Write-Host ("✅ Chunk complete: synced={0}, errors={1}, highestId={2}{3}" -f $synced, $errors, $newHighest, $(if ($message) { ", message='" + $message + "'" } else { '' })) -ForegroundColor Green

                    if ($newHighest -gt 0) { $startMovieId = $newHighest + 1 }
                    # Decrement remaining by actual synced count to honor the 'maxMovies' semantic
                    $remaining -= $synced
                    $succeeded = $true
                }
                else {
                    Write-Host ("❌ Chunk failed (HTTP {0}). Body:" -f $srCode) -ForegroundColor Red
                    Write-Host ($srBody | Out-String) -ForegroundColor Yellow
                    if ($attemptSize -gt 1 -and $attempts -lt 3) {
                        $attemptSize = [Math]::Max(1, [Math]::Floor($attemptSize / 2))
                        Write-Host ("🔁 Retrying with smaller chunk size: {0}" -f $attemptSize) -ForegroundColor DarkYellow
                        Start-Sleep -Seconds 1
                    }
                    else {
                        break
                    }
                }
            }
            if (-not $succeeded) { break }
            if ($remaining -gt 0) { Start-Sleep -Milliseconds 400 }
        }
        Write-Host ("🏁 Incremental sync summary this run: synced={0}, errors={1}" -f $totalSyncedThisRun, $totalErrorsThisRun) -ForegroundColor Magenta

        # Post-sync: query updated totals and highest synced id
        $postCountOutput = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COUNT(*) AS total_movies FROM tmdb_movies;"
        $postCountJson = $null
        try { $postCountJson = ($postCountOutput | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $postCountJson = $null }
        if ($null -eq $postCountJson) {
            $postCountFiltered = ($postCountOutput | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $postCountJson = $postCountFiltered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $postCountJson = $null }
        }
        $postTotalMovies = Get-FirstPropertyValue -obj $postCountJson -candidateNames @('total_movies', 'COUNT(*)', 'total')
        if (-not ($postTotalMovies -is [int])) { try { $postTotalMovies = [int]$postTotalMovies } catch { $postTotalMovies = 0 } }

        $postHighestOutput = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COALESCE(MAX(CAST(value AS INTEGER)), 0) AS highest_movie_id_synced FROM sync_metadata WHERE key = 'highest_movie_id_synced';"
        $postHighestJson = $null
        try { $postHighestJson = ($postHighestOutput | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $postHighestJson = $null }
        if ($null -eq $postHighestJson) {
            $postHighestFiltered = ($postHighestOutput | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $postHighestJson = $postHighestFiltered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $postHighestJson = $null }
        }
        $postHighest = Get-FirstPropertyValue -obj $postHighestJson -candidateNames @('highest_movie_id_synced', 'value')
        if (-not ($postHighest -is [int])) { try { $postHighest = [int]$postHighest } catch { $postHighest = $prevHighest } }

        $deltaMovies = $postTotalMovies - $preTotalMovies
        Write-Host ("📊 Post-sync status: total_movies={0} (Δ {1}), highest_movie_id_synced={2}" -f $postTotalMovies, $deltaMovies, $postHighest) -ForegroundColor Cyan
    }
    "8" {
        Write-Host "🔄 Starting changes sync (modified movies)..." -ForegroundColor Green
        
        $daysBack = Read-Host "Enter days back to check for changes (default: 1, max: 14)"
        if (-not $daysBack) { $daysBack = 1 }
        
        $startDate = (Get-Date).AddDays(-$daysBack).ToString("yyyy-MM-dd")
        Write-Host "📅 Checking for changes since: $startDate" -ForegroundColor Cyan
        
        Invoke-DeployAndSetPreviewBaseUrl -ProjectName $CF_PAGES_PROJECT
        
        $body = @{
            syncType  = "changes"
            startDate = $startDate
        } | ConvertTo-Json
        
        Write-Host "📡 Starting changes sync..." -ForegroundColor Blue
        curl.exe -sS -X POST "$BASE_URL/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "9" {
        Write-Host "🕐 Triggering daily update job..." -ForegroundColor Green
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name $CF_PAGES_PROJECT
        
        Write-Host "📡 Starting daily update..." -ForegroundColor Blue
        curl.exe -sS -X POST "$BASE_URL/scheduled/tmdb-daily-update" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token"
    }
    "10" {
        Write-Host "📊 Checking sync status..." -ForegroundColor Green
        Write-Host "Querying database for sync metadata..." -ForegroundColor Blue

        # Total movies
        $totalOut = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COUNT(*) as total_movies FROM tmdb_movies;"
        $totalJson = $null
        try { $totalJson = ($totalOut | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $totalJson = $null }
        if ($null -eq $totalJson) {
            $filtered = ($totalOut | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $totalJson = $filtered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $totalJson = $null }
        }
        $totalMovies = Get-FirstPropertyValue -obj $totalJson -candidateNames @('total_movies', 'COUNT(*)', 'total')
        try { $totalMovies = [int]$totalMovies } catch { }
        Write-Host ("📈 Total movies: {0}" -f $totalMovies) -ForegroundColor Yellow

        # Last sync metadata
        $metaOut = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT key, value, updated_at FROM sync_metadata ORDER BY updated_at DESC;"
        $metaJson = $null
        try { $metaJson = ($metaOut | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $metaJson = $null }
        if ($null -eq $metaJson) {
            $filtered = ($metaOut | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $metaJson = $filtered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $metaJson = $null }
        }
        Write-Host "`n📅 Last sync metadata (key → value @ updated_at):" -ForegroundColor Yellow
        if ($metaJson) {
            # Try to print a few entries nicely
            $rows = @()
            if ($metaJson.result) { $rows = $metaJson.result } elseif ($metaJson -is [System.Array]) { $rows = $metaJson } else { $rows = @($metaJson) }
            $i = 0
            foreach ($row in $rows) {
                if ($null -ne $row.key -and $null -ne $row.value) {
                    Write-Host (" - {0} → {1} @ {2}" -f $row.key, $row.value, $row.updated_at)
                    $i++
                    if ($i -ge 10) { break }
                }
            }
            if ($rows.Count -gt 10) { Write-Host ("   …and {0} more" -f ($rows.Count - 10)) -ForegroundColor DarkGray }
        }
        else {
            Write-Host "(no metadata found)" -ForegroundColor DarkGray
        }

        # Movie ID range
        $rangeOut = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT MIN(id) as min_id, MAX(id) as max_id FROM tmdb_movies;"
        $rangeJson = $null
        try { $rangeJson = ($rangeOut | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $rangeJson = $null }
        if ($null -eq $rangeJson) {
            $filtered = ($rangeOut | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $rangeJson = $filtered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $rangeJson = $null }
        }
        $minId = Get-FirstPropertyValue -obj $rangeJson -candidateNames @('min_id', 'MIN(id)')
        $maxId = Get-FirstPropertyValue -obj $rangeJson -candidateNames @('max_id', 'MAX(id)')
        Write-Host ("`n🆔 Movie ID range: min={0}, max={1}" -f $minId, $maxId) -ForegroundColor Yellow

        # Recent additions (last 24 hours)
        $recentOut = npx wrangler d1 execute boxdbuddy-movies --remote --json --command "SELECT COUNT(*) as recent_movies FROM tmdb_movies WHERE last_updated > datetime('now', '-1 day');"
        $recentJson = $null
        try { $recentJson = ($recentOut | Out-String) | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $recentJson = $null }
        if ($null -eq $recentJson) {
            $filtered = ($recentOut | Where-Object { $_ -match '^[\s]*[\{\[]' }) -join "`n"
            try { $recentJson = $filtered | ConvertFrom-Json -ErrorAction Stop 2>$null } catch { $recentJson = $null }
        }
        $recent = Get-FirstPropertyValue -obj $recentJson -candidateNames @('recent_movies', 'COUNT(*)', 'total')
        try { $recent = [int]$recent } catch { }
        Write-Host ("`n📊 Recent additions (last 24 hours): {0}" -f $recent) -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Note: The sync process includes rate limiting and will respect TMDB API limits." -ForegroundColor Gray
Write-Host "📈 Progress will be logged to the console during execution." -ForegroundColor Gray