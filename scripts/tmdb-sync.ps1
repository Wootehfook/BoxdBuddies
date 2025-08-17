# BoxdBuddy TMDB Database Sync Script
# AI Generated: GitHub Copilot - 2025-08-16

Write-Host "🎬 BoxdBuddy TMDB Database Sync Utility" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if wrangler is available
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm/npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
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
            
            Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
            npm run build
            npx wrangler pages deploy dist --project-name boxdbuddy
            
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
                
                $result = curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
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
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
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
            
            $result = curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
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
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        Write-Host "📡 Starting sync..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
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
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        Write-Host "📡 Starting sync for pages $startPage to $maxPages..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "5" {
        Write-Host "🎯 Starting extended sync (100 batches)..." -ForegroundColor Green
        Write-Host "⚠️  This will take ~40 minutes and run 100 separate sync operations (~20,000 movies)" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            
            Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
            npm run build
            npx wrangler pages deploy dist --project-name boxdbuddy
            
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
                
                $result = curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
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
            
            Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
            npm run build
            npx wrangler pages deploy dist --project-name boxdbuddy
            
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
                
                $result = curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
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
        Write-Host "🕐 Triggering daily update job..." -ForegroundColor Green
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        Write-Host "📡 Starting daily update..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/scheduled/tmdb-daily-update" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token"
    }
    "7" {
        Write-Host "🆔 Starting incremental sync by Movie ID..." -ForegroundColor Green
        
        # Get the last synced movie ID from database
        Write-Host "� Checking last synced movie ID..." -ForegroundColor Blue
        $lastIdResult = npx wrangler d1 execute boxdbuddy-movies --remote --command "SELECT value FROM sync_metadata WHERE key = 'highest_movie_id_synced';" | ConvertFrom-Json
        
        $startMovieId = 1
        if ($lastIdResult -and $lastIdResult.Count -gt 0) {
            $startMovieId = [int]$lastIdResult[0].value + 1
            Write-Host "📍 Resuming from movie ID: $startMovieId" -ForegroundColor Cyan
        }
        else {
            Write-Host "📍 No previous sync found, starting from movie ID: 1" -ForegroundColor Cyan
        }
        
        $maxMovies = Read-Host "Enter max movies to sync (default: 500)"
        if (-not $maxMovies) { $maxMovies = 500 }
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        $body = @{
            syncType     = "movieId"
            startMovieId = [int]$startMovieId
            maxMovies    = [int]$maxMovies
        } | ConvertTo-Json
        
        Write-Host "📡 Starting incremental sync..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "8" {
        Write-Host "🔄 Starting changes sync (modified movies)..." -ForegroundColor Green
        
        $daysBack = Read-Host "Enter days back to check for changes (default: 1, max: 14)"
        if (-not $daysBack) { $daysBack = 1 }
        
        $startDate = (Get-Date).AddDays(-$daysBack).ToString("yyyy-MM-dd")
        Write-Host "📅 Checking for changes since: $startDate" -ForegroundColor Cyan
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        $body = @{
            syncType  = "changes"
            startDate = $startDate
        } | ConvertTo-Json
        
        Write-Host "📡 Starting changes sync..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/admin/tmdb-sync" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token" `
            -d $body
    }
    "9" {
        Write-Host "🕐 Triggering daily update job..." -ForegroundColor Green
        
        Write-Host "🚀 Deploying latest code..." -ForegroundColor Blue
        npm run build
        npx wrangler pages deploy dist --project-name boxdbuddy
        
        Write-Host "📡 Starting daily update..." -ForegroundColor Blue
        curl -X POST "https://boxdbuddy.pages.dev/scheduled/tmdb-daily-update" `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer admin-sync-token"
    }
    "10" {
        Write-Host "📊 Checking sync status..." -ForegroundColor Green
        Write-Host "Querying database for sync metadata..." -ForegroundColor Blue
        
        # Show comprehensive sync status
        Write-Host "📈 Total movies:" -ForegroundColor Yellow
        npx wrangler d1 execute boxdbuddy-movies --remote --command "SELECT COUNT(*) as total_movies FROM tmdb_movies;"
        
        Write-Host "`n📅 Last sync dates:" -ForegroundColor Yellow
        npx wrangler d1 execute boxdbuddy-movies --remote --command "SELECT key, value, updated_at FROM sync_metadata;"
        
        Write-Host "`n🆔 Movie ID range:" -ForegroundColor Yellow
        npx wrangler d1 execute boxdbuddy-movies --remote --command "SELECT MIN(id) as min_id, MAX(id) as max_id FROM tmdb_movies;"
        
        Write-Host "`n📊 Recent additions (last 24 hours):" -ForegroundColor Yellow
        npx wrangler d1 execute boxdbuddy-movies --remote --command "SELECT COUNT(*) as recent_movies FROM tmdb_movies WHERE last_updated > datetime('now', '-1 day');"
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Note: The sync process includes rate limiting and will respect TMDB API limits." -ForegroundColor Gray
Write-Host "📈 Progress will be logged to the console during execution." -ForegroundColor Gray