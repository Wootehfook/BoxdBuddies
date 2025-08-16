# AI Generated: GitHub Copilot - 2025-08-16
# Windows wrapper: restarts MCP servers using Bash if available, else soft-success.

param(
    [switch]$Verbose
)

$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
    if ($Verbose) { Write-Host "Using Bash implementation: scripts/mcp-restart.sh" }
    & bash "scripts/mcp-restart.sh"
    exit $LASTEXITCODE
}

if ($Verbose) {
    Write-Host "Bash not found on PATH. Skipping MCP restart (non-fatal)."
    Write-Host "Tip: Use Git Bash or WSL to enable full MCP scripts."
}
exit 0
