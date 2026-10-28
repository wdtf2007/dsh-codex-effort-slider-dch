[CmdletBinding()]
param([string]$OutDir = "")
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $root "dist" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$manifest = Get-Content -LiteralPath (Join-Path $root "package.json") -Raw -Encoding utf8 | ConvertFrom-Json
$sources = @("package.json") + @($manifest.files)
$paths = @($sources | ForEach-Object { Join-Path $root $_ } | Select-Object -Unique)
foreach ($entry in $paths) { if (-not (Test-Path -LiteralPath $entry)) { throw "Missing package file: $entry" } }
$zip = Join-Path $OutDir ($manifest.name + "-" + $manifest.version + ".zip")
Compress-Archive -LiteralPath $paths -DestinationPath $zip -CompressionLevel Optimal -Force
Write-Output $zip
