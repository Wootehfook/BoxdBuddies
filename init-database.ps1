# AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
# PowerShell script to initialize TMDB database
# Securely prompt for admin secret at runtime

# Prompt for admin secret securely
$adminSecret = Read-Host "Enter your admin secret" -AsSecureString
$adminSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecret))
$url = "https://b571b1b6.boxdbuddy.pages.dev/admin/tmdb-sync"

$headers = @{
    "Authorization" = "Bearer $adminSecretPlain"
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