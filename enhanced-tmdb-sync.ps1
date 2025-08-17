# Enhanced PowerShell script for respectful TMDB database synchronization
# AI Generated: GitHub Copilot - 2025-08-16T23:00:00Z

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("popular", "top_rated", "recent", "comprehensive", "status")]
    [string]$SyncType = "popular",
    
    [Parameter(Mandatory = $false)]
    [string]$AdminSecret = ""
)

# AI Generated: GitHub Copilot - 2025-08-16T23:00:00Z
# Secure credential handling - prompt if not provided
if ([string]::IsNullOrEmpty($AdminSecret)) {
    Write-Host "🔐 Admin secret required for authentication" -ForegroundColor Yellow
    $adminSecretSecure = Read-Host "Enter your admin secret" -AsSecureString
    $AdminSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecretSecure))
}

$url = "https://c59b032e.boxdbuddy.pages.dev/admin/tmdb-sync"

$headers = @{
    "Authorization" = "Bearer $AdminSecret"
    "Content-Type"  = "application/json"
}

switch ($SyncType) {
    "popular" {
        $body = @{ action = "sync_popular" } | ConvertTo-Json
        Write-Host "🎬 Syncing Popular Movies (Top 1000)..." -ForegroundColor Yellow
        Write-Host "This respects TMDB rate limits with 300ms delays between requests" -ForegroundColor Cyan
    }
    "top_rated" {
        $body = @{ action = "sync_top_rated" } | ConvertTo-Json
        Write-Host "⭐ Syncing Top Rated Movies (Top 500)..." -ForegroundColor Yellow
    }
    "recent" {
        $body = @{ action = "sync_recent" } | ConvertTo-Json
        Write-Host "🆕 Syncing Recent/Now Playing Movies..." -ForegroundColor Yellow
    }
    "comprehensive" {
        $body = @{ action = "sync_comprehensive" } | ConvertTo-Json
        Write-Host "🚀 Comprehensive Sync (All Categories)..." -ForegroundColor Yellow
        Write-Host "This will take 5-10 minutes and sync 1500+ movies respectfully" -ForegroundColor Cyan
    }
    "status" {
        # Check database status
        Write-Host "📊 Checking Database Status..." -ForegroundColor Yellow
        try {
            $testResponse = Invoke-RestMethod -Uri ($url -replace '/admin/tmdb-sync', '/test') -Method GET
            Write-Host "✅ Database Status: $($testResponse.status)" -ForegroundColor Green
            Write-Host "📈 Database Connected: $($testResponse.database)" -ForegroundColor White
            Write-Host "🔑 Has API Key: $($testResponse.hasApiKey)" -ForegroundColor White
            Write-Host "🔐 Has Admin Secret: $($testResponse.hasAdminSecret)" -ForegroundColor White
            return
        }
        catch {
            Write-Host "❌ Status Check Failed: $($_.Exception.Message)" -ForegroundColor Red
            return
        }
    }
}

Write-Host "" 
Write-Host "📋 TMDB API Respectful Usage:" -ForegroundColor Cyan
Write-Host "  • Rate Limit: 3.5 requests/second (under 4/sec limit)" -ForegroundColor White
Write-Host "  • Proper User-Agent with contact info" -ForegroundColor White
Write-Host "  • Handles 429 rate limit responses gracefully" -ForegroundColor White
Write-Host "  • Only syncs if data is older than 12-24 hours" -ForegroundColor White
Write-Host ""

$startTime = Get-Date

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    
    if ($response.synced) {
        Write-Host "  Movies Synced: $($response.synced)" -ForegroundColor White
    }
    if ($response.apiCalls) {
        Write-Host "  API Calls Made: $($response.apiCalls)" -ForegroundColor White
        Write-Host "  Rate: $($response.ratePerSecond) calls/second" -ForegroundColor White
    }
    if ($response.duration) {
        Write-Host "  Server Duration: $($response.duration) seconds" -ForegroundColor White
    }
    Write-Host "  Total Duration: $([math]::Round($duration, 1)) seconds" -ForegroundColor White
    
    if ($response.message) {
        Write-Host ""
        Write-Host "💡 $($response.message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎯 Usage Examples:" -ForegroundColor Cyan
    Write-Host "  .\enhanced-tmdb-sync.ps1 -SyncType popular" -ForegroundColor White
    Write-Host "  .\enhanced-tmdb-sync.ps1 -SyncType comprehensive" -ForegroundColor White
    Write-Host "  .\enhanced-tmdb-sync.ps1 -SyncType status" -ForegroundColor White
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*401*") {
        Write-Host ""
        Write-Host "🔐 Authentication Error - Check Admin Secret" -ForegroundColor Yellow
        Write-Host "Current secret: $AdminSecret" -ForegroundColor Gray
    }
    elseif ($_.Exception.Message -like "*429*") {
        Write-Host ""
        Write-Host "⏱️ Rate Limited - TMDB is protecting their service" -ForegroundColor Yellow
        Write-Host "Wait a few minutes and try again" -ForegroundColor Gray
    }
    elseif ($_.Exception.Message -like "*500*") {
        Write-Host ""
        Write-Host "🔧 Server Error - Check function logs" -ForegroundColor Yellow
        Write-Host "The sync may have partially completed" -ForegroundColor Gray
    }
}