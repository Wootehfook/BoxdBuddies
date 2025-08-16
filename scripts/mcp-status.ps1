# AI Generated: GitHub Copilot - 2025-08-16
# Cross-platform wrapper for MCP status. Tries Bash script if available, else
# performs a minimal no-op status to avoid breaking local Windows runs.

param(
    [switch]$Verbose
)

$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
    if ($Verbose) { Write-Host "Using Bash implementation: scripts/mcp-status.sh" }
    & bash "scripts/mcp-status.sh"
    exit $LASTEXITCODE
}

# Fallback: VS Code CLI may not be on PATH; do a soft success with guidance.
if ($Verbose) {
    Write-Host "VS Code CLI or Bash not found on PATH. Skipping MCP checks (non-fatal)."
    Write-Host "Tip: Install Git for Windows or WSL to enable Bash scripts."
}
exit 0
