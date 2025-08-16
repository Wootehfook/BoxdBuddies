# AI Generated: GitHub Copilot - 2025-08-16
param(
    [string]$BaseUrl = "https://boxdbud.pages.dev"
)

Write-Host "🔎 Cloudflare Pages API Smoke Test -> $BaseUrl" -ForegroundColor Cyan

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null
    )
    $uri = "$BaseUrl$Path"
    try {
        if ($Method -eq 'GET') {
            $res = Invoke-RestMethod -Method Get -Uri $uri -ErrorAction Stop
        }
        else {
            $json = if ($Body) { $Body | ConvertTo-Json -Depth 5 } else { '{}' }
            $res = Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json' -Body $json -ErrorAction Stop
        }
        Write-Host "✔ $Method $Path" -ForegroundColor Green
        return $res
    }
    catch {
        Write-Host "✖ $Method $Path -> $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Health
Test-Endpoint -Method 'GET' -Path '/health' | Out-Null

# Search
Test-Endpoint -Method 'GET' -Path '/search?q=alien&page=1' | Out-Null

# Details (Matrix)
Test-Endpoint -Method 'GET' -Path '/movies/603' | Out-Null

# Enhance (batch)
$body = @{ movies = @(@{ title = 'The Matrix'; year = 1999 }, @{ title = 'Alien'; year = 1979 }) }
Test-Endpoint -Method 'POST' -Path '/enhance' -Body $body | Out-Null

Write-Host "✅ Smoke test finished" -ForegroundColor Cyan
