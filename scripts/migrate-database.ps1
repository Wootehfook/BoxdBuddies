#!/usr/bin/env pwsh
# Copy development database to user app data directory

Write-Host "🔄 BoxdBuddies Database Migration Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$projectDir = "C:\Projects\BoxdBuddies"
$userDataDir = "$env:APPDATA\BoxdBuddies"
$devDbPath = "$projectDir\friends.db"
$userDbPath = "$userDataDir\friends.db"

Write-Host "📁 Paths:" -ForegroundColor Yellow
Write-Host "  Development DB: $devDbPath"
Write-Host "  User Data Dir:  $userDataDir"
Write-Host "  User DB:        $userDbPath"
Write-Host ""

# Check if development database exists
if (-not (Test-Path $devDbPath)) {
    Write-Host "❌ No development database found at: $devDbPath" -ForegroundColor Red
    Write-Host "   This means your app data is already in the correct location!" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path $userDbPath) {
        $size = (Get-Item $userDbPath).Length / 1KB
        Write-Host "✅ User database exists: ${size:N1} KB" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No user database yet - will be created on first run" -ForegroundColor Cyan
    }
    
    exit 0
}

# Check development database size
$devSize = (Get-Item $devDbPath).Length / 1KB
Write-Host "📊 Development database size: ${devSize:N1} KB" -ForegroundColor Cyan

# Create user data directory if it doesn't exist
if (-not (Test-Path $userDataDir)) {
    Write-Host "📁 Creating user data directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $userDataDir -Force | Out-Null
    Write-Host "✅ Created: $userDataDir" -ForegroundColor Green
} else {
    Write-Host "✅ User data directory already exists" -ForegroundColor Green
}

# Check if user database already exists
if (Test-Path $userDbPath) {
    $userSize = (Get-Item $userDbPath).Length / 1KB
    Write-Host ""
    Write-Host "⚠️  User database already exists (${userSize:N1} KB)" -ForegroundColor Yellow
    
    $choice = Read-Host "Do you want to overwrite it with development data? (y/N)"
    if ($choice -ne "y" -and $choice -ne "Y") {
        Write-Host "❌ Migration cancelled" -ForegroundColor Red
        exit 1
    }
    
    # Backup existing user database
    $backupPath = "$userDataDir\friends.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "📋 Creating backup: $backupPath" -ForegroundColor Cyan
    Copy-Item $userDbPath $backupPath
    Write-Host "✅ Backup created" -ForegroundColor Green
}

# Copy development database to user location
Write-Host ""
Write-Host "🔄 Copying development database to user location..." -ForegroundColor Yellow
try {
    Copy-Item $devDbPath $userDbPath -Force
    $newSize = (Get-Item $userDbPath).Length / 1KB
    Write-Host "✅ Database copied successfully (${newSize:N1} KB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Migration completed!" -ForegroundColor Green
    Write-Host "   Your standalone app will now have all your movie data." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the standalone .exe again"
    Write-Host "  2. You should now see all your cached movie data"
    Write-Host "  3. The debug.log will be in: $userDataDir\debug.log"
    
} catch {
    Write-Host "❌ Failed to copy database: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Final status:" -ForegroundColor Cyan
Write-Host "  User data directory: $userDataDir"
if (Test-Path "$userDataDir\friends.db") {
    $finalSize = (Get-Item "$userDataDir\friends.db").Length / 1KB
    Write-Host "  Database: ${finalSize:N1} KB ✅"
}
if (Test-Path "$userDataDir\preferences.json") {
    Write-Host "  Preferences: ✅"
}
Write-Host "  Debug log location: $userDataDir\debug.log"
