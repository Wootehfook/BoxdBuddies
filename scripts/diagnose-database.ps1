#!/usr/bin/env pwsh
# Database diagnostic script for BoxdBuddies

Write-Host "🔍 BoxdBuddies Database Diagnostic" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$userDataDir = "$env:APPDATA\BoxdBuddies"
$dbPath = "$userDataDir\friends.db"
$logPath = "$userDataDir\debug.log"

Write-Host "📁 Checking file locations..." -ForegroundColor Yellow
Write-Host "  User data dir: $userDataDir"
Write-Host "  Database:      $dbPath"
Write-Host "  Debug log:     $logPath"
Write-Host ""

# Check if files exist
Write-Host "📊 File Status:" -ForegroundColor Yellow
if (Test-Path $userDataDir) {
    Write-Host "  ✅ User data directory exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ User data directory missing" -ForegroundColor Red
}

if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "  ✅ Database exists (${dbSize} bytes = $($dbSize/1KB) KB)" -ForegroundColor Green
    
    if ($dbSize -lt 10KB) {
        Write-Host "     ⚠️  Database is very small - likely no movie data cached" -ForegroundColor Yellow
    } elseif ($dbSize -lt 100KB) {
        Write-Host "     ⚠️  Database is small - limited movie data" -ForegroundColor Yellow
    } else {
        Write-Host "     ✅ Database size suggests movie data is cached" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ Database does not exist" -ForegroundColor Red
}

if (Test-Path $logPath) {
    $logSize = (Get-Item $logPath).Length
    Write-Host "  ✅ Debug log exists ($($logSize/1KB) KB)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No debug log yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Diagnostic Steps:" -ForegroundColor Cyan
Write-Host "  1. Run the new BoxdBuddies.exe"
Write-Host "  2. Check if debug.log appears in: $userDataDir"
Write-Host "  3. Look for startup messages showing data directory paths"
Write-Host "  4. If movie data is still missing, re-run comparison to populate cache"
Write-Host ""

# Show recent log entries if available
if (Test-Path $logPath) {
    Write-Host "📋 Recent log entries (last 10 lines):" -ForegroundColor Yellow
    Get-Content $logPath -Tail 10 | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "💡 Expected behavior:" -ForegroundColor Cyan
Write-Host "  • App data stored in: $userDataDir"
Write-Host "  • No files created next to .exe"
Write-Host "  • All movie posters/data preserved between runs"
Write-Host "  • Debug log shows data directory on startup"
