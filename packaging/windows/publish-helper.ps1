param(
  [string]$Output = "artifacts\windows",
  [string]$Configuration = "Release",
  [string]$HidMaestroSdkRoot = $env:HIDMAESTRO_SDK_ROOT
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$helperProject = Join-Path $repo "bridge\virtual-controller\hidmaestro-helper\HidMaestro.Helper.csproj"
$publishDir = Join-Path $repo "$Output\hidmaestro-helper"

if ([string]::IsNullOrWhiteSpace($HidMaestroSdkRoot)) {
  $HidMaestroSdkRoot = Join-Path $env:USERPROFILE "Downloads\HIDMaestro-v1.9.0\HIDMaestroTest"
}

$sdkDll = Join-Path $HidMaestroSdkRoot "HIDMaestro.Core.dll"
if (-not (Test-Path $sdkDll)) {
  throw "Verified HIDMaestro.Core.dll was not found at '$sdkDll'. Set HIDMAESTRO_SDK_ROOT; this script never downloads SDKs or drivers."
}

New-Item -ItemType Directory -Force -Path $publishDir | Out-Null

& dotnet publish $helperProject `
  --configuration $Configuration `
  --framework net10.0-windows10.0.26100.0 `
  --runtime win-x64 `
  --self-contained true `
  --output $publishDir `
  -p:HidMaestroSdkRoot=$HidMaestroSdkRoot

if ($LASTEXITCODE -ne 0) { throw "HIDMaestro helper publish failed with exit code $LASTEXITCODE." }

Write-Host "Published helper: $publishDir"
Write-Host "The DrivePad bridge host is not installed by this script; run the packaged host with the documented runtime prerequisites."
