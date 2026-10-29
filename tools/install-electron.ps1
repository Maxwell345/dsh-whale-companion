param(
  [string]$Root = ""
)

$ErrorActionPreference = "Stop"
if (-not $Root) {
  if (Test-Path "F:\") {
    $Root = "F:\DeepSeekBot\whale-companion\pet-shell"
  } else {
    $Root = Join-Path $env:USERPROFILE ".dsh\whale-companion\pet-shell"
  }
}
$version = "44.7.0"
$zip = Join-Path $Root "electron-v$version-win32-x64.zip"
$exe = Join-Path $Root "electron\electron.exe"

New-Item -ItemType Directory -Force -Path $Root | Out-Null
if (Test-Path $exe) {
  Write-Host "Electron already installed: $exe"
  exit 0
}

if (-not (Test-Path $zip)) {
  Write-Host "Downloading Electron $version ..."
  Invoke-WebRequest -Uri "https://cdn.npmmirror.com/binaries/electron/$version/electron-v$version-win32-x64.zip" -OutFile $zip -UseBasicParsing -TimeoutSec 600
}

Write-Host "Extracting ..."
Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $Root "electron") -Force
if (-not (Test-Path $exe)) { throw "electron.exe not found after extraction" }
Write-Host "Installed: $exe"
