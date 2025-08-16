# PowerShell script to initialize TMDB database
# Replace YOUR_ADMIN_SECRET with the actual secret value you set

$adminSecret = "YOUR_ADMIN_SECRET"  # Replace this with actual secret
$url = "https://9b2a0ee5.boxdbuddy.pages.dev/admin/tmdb-sync"

$headers = @{
    "Authorization" = "Bearer $adminSecret"
    "Content-Type" = "application/json"
}

Write-Host "Initializing TMDB database..." -ForegroundColor Yellow
Write-Host "This may take a few minutes to sync 1000+ popular movies..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers
    Write-Host "✅ Database initialization successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure to replace YOUR_ADMIN_SECRET with the actual secret" -ForegroundColor Yellow
}