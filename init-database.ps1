# PowerShell script to initialize TMDB database
# Replace YOUR_ADMIN_SECRET with the actual secret value you set

$adminSecret = "23wesdxc@#WESDXC"  # Replace this with actual secret
$url = "https://b571b1b6.boxdbuddy.pages.dev/admin/tmdb-sync"

$headers = @{
    "Authorization" = "Bearer $adminSecret"
    "Content-Type"  = "application/json"
}

$body = @{
    action = "sync_popular"
} | ConvertTo-Json

Write-Host "Initializing TMDB database..." -ForegroundColor Yellow
Write-Host "This may take a few minutes to sync 1000+ popular movies..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Database initialization successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure to replace YOUR_ADMIN_SECRET with the actual secret" -ForegroundColor Yellow
}