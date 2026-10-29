param(
  [string]$RepoUrl = "",
  [string]$InstallDir = "F:\DeepSeekBot\dsh-whale-companion",
  [string]$Profile = "desktop"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "F:\")) {
  throw "没有 F 盘。便携安装需要 F 盘；可以把 -InstallDir 改成别的盘，或手动 link 到 profile。"
}

if (-not (Test-Path (Join-Path $InstallDir "package.json"))) {
  if (-not $RepoUrl) {
    throw "目标目录没有插件。请先 git clone 到 $InstallDir，或用 -RepoUrl 指定 GitHub 地址。"
  }
  $parent = Split-Path -Parent $InstallDir
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  git clone $RepoUrl $InstallDir
  if ($LASTEXITCODE -ne 0) { throw "git clone 失败" }
}

$profileDir = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile"
$pkgPath = Join-Path $profileDir "package.json"
if (-not (Test-Path $pkgPath)) {
  throw "找不到 DSH profile：$pkgPath。请先在 DSH 里创建/启动一次 desktop profile。"
}

$pkg = Get-Content -LiteralPath $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $pkg.dependencies) {
  $pkg | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{}) -Force
}
$linkSpec = "link:" + ($InstallDir -replace '\\', '/')
$pkg.dependencies | Add-Member -NotePropertyName "dsh-whale-companion" -NotePropertyValue $linkSpec -Force

if (-not $pkg.dsh) {
  $pkg | Add-Member -NotePropertyName dsh -NotePropertyValue ([pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }) -Force
}
if (-not $pkg.dsh.profile) {
  $pkg.dsh | Add-Member -NotePropertyName profile -NotePropertyValue ([pscustomobject]@{ bundles = @() }) -Force
}
$bundles = @($pkg.dsh.profile.bundles)
if ($bundles -notcontains "dsh-whale-companion") {
  $pkg.dsh.profile.bundles = @($bundles + "dsh-whale-companion")
}

$json = $pkg | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($pkgPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))

$nodeModules = Join-Path $profileDir "node_modules"
New-Item -ItemType Directory -Force -Path $nodeModules | Out-Null
$linkPath = Join-Path $nodeModules "dsh-whale-companion"
if (Test-Path $linkPath) {
  $item = Get-Item -LiteralPath $linkPath -Force
  if ($item.LinkType -eq "Junction" -or $item.LinkType -eq "SymbolicLink") {
    cmd /c rmdir "$linkPath" | Out-Null
  } else {
    throw "$linkPath 已存在且不是链接，未删除。请手动处理后重试。"
  }
}
cmd /c mklink /J "$linkPath" "$InstallDir" | Out-Null
if (-not (Test-Path (Join-Path $linkPath "package.json"))) {
  throw "junction 创建失败：$linkPath"
}

Write-Host ""
Write-Host "已便携安装："
Write-Host "  插件：$InstallDir"
Write-Host "  profile 链接：$linkPath"
Write-Host "  C 盘只保留这个 junction 和 DSH 自己的配置，插件代码/数据/Electron 都在 F 盘。"
Write-Host ""
Write-Host "重启 DSH，然后在 设置 -> 小肥鱼 里打开桌宠。"
Write-Host "第一次还需要安装 Electron："
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$InstallDir\tools\install-electron.ps1`""
