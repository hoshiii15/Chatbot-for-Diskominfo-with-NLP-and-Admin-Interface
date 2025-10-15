<#
Restart helper for local development on Windows.
Usage:
  powershell -ExecutionPolicy Bypass -File "restart_python_bot.ps1" python-bot

This script will look for a running python process whose command line contains
"app.py" (the Python bot entrypoint) and terminate it, then start a new python
process using the repo's python-bot/app.py.

NOTE: This is intended for local development/testing only. In production, use
supervisor or a proper process manager.
#>
param(
    [string]$Target
)

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    # repo root is two levels up from this script (repo-root/admin-backend/scripts)
    $repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
    $pythonBotPath = Join-Path $repoRoot 'python-bot'
    $entry = 'app.py'

    if (-not $Target) {
        Write-Output "No target provided; exiting"
        exit 1
    }

    if ($Target -ne 'python-bot') {
        Write-Output "Target '$Target' not recognized by this helper. Only 'python-bot' is allowed."
        exit 1
    }

    Write-Output "Restarting python bot (target=$Target)..."

    # Find processes where the command line contains 'app.py'
    $matches = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match [regex]::Escape($entry) }

    if ($matches) {
        foreach ($p in $matches) {
            try {
                Write-Output "Stopping process id=$($p.ProcessId) CommandLine=$($p.CommandLine)"
                Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
            } catch {
                Write-Output "Failed to stop process id=$($p.ProcessId): $_"
            }
        }
    } else {
        Write-Output "No running python bot process found (no commandline match for $entry)"
    }

    # Start the Python bot
    $pythonExe = 'python'
    $startArgs = $entry
    $startInfo = @{ FilePath = $pythonExe; ArgumentList = $startArgs; WorkingDirectory = $pythonBotPath }

    Write-Output "Starting python with: $pythonExe $startArgs (cwd: $pythonBotPath)"
    Start-Process @startInfo | Out-Null
    Write-Output "Python bot restart requested."
    exit 0
} catch {
    Write-Output "Error restarting python bot: $_"
    exit 1
}
