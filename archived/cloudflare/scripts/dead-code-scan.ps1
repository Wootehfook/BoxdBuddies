# AI Generated: GitHub Copilot - 2025-08-15
# Fast repo-wide dead code scan for Rust crate (and optional unused deps)
param(
    [switch]$Deps
)

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Running Rust dead code scan (clippy -D dead_code)..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\src-tauri"
try {
    cargo clippy --all-targets --all-features -- -D dead_code
    Write-Host "✅ No dead Rust code detected." -ForegroundColor Green
}
catch {
    Write-Host "❌ Dead code found. Review clippy output above." -ForegroundColor Red
    Pop-Location
    exit 1
}

if ($Deps) {
    Write-Host "🔎 Checking for unused dependencies (cargo-udeps)..." -ForegroundColor Cyan
    try {
        cargo udeps --all-targets
    }
    catch {
        Write-Host "ℹ️ cargo-udeps not installed. Install with: cargo install cargo-udeps" -ForegroundColor Yellow
    }
}

Pop-Location
Write-Host "🏁 Scan complete." -ForegroundColor Cyan
