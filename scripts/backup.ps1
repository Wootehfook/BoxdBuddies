#!/usr/bin/env pwsh
# BoxdBuddies Backup Script
# Creates a backup of important project files

$BackupDir = "backups\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Creating backup in: $BackupDir"

# Create backup directory
New-Item -ItemType Directory -Path "$ProjectRoot\$BackupDir" -Force

# Copy important files (web-only)
Copy-Item "$ProjectRoot\src" "$ProjectRoot\$BackupDir\src" -Recurse
Copy-Item "$ProjectRoot\package.json" "$ProjectRoot\$BackupDir\"
Copy-Item "$ProjectRoot\*.md" "$ProjectRoot\$BackupDir\"

# Create git archive if git is available
if (Get-Command git -ErrorAction SilentlyContinue) {
    git archive --format=zip --output="$ProjectRoot\$BackupDir\git-archive.zip" HEAD
    Write-Host "Git archive created"
}

Write-Host "Backup completed: $BackupDir"
Write-Host "Files backed up:"
Get-ChildItem "$ProjectRoot\$BackupDir" -Recurse | Select-Object Name, Length | Format-Table
