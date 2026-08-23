# Packages the game for a static host.
#
# Two shapes, depending on whether the audio travels with it:
#
#   # audio hosted elsewhere (GitHub Pages) - tiny upload, full quality
#   powershell -File build-web-zip.ps1 -AudioBase https://you.github.io/heartbound-audio/
#
#   # audio inside the zip, re-encoded small to fit a size cap
#   powershell -File build-web-zip.ps1 -Small
#
#   # audio inside the zip at full quality - only for hosts with no size limit
#   powershell -File build-web-zip.ps1
#
# Run build.ps1 first if anything under js/ changed, and build-web-audio.ps1 if
# you are using -Small and audio/ changed.
#
# Entry names are written by hand with forward slashes. Compress-Archive on
# Windows PowerShell writes backslashes into the zip, and some hosts extract
# those as a file literally called "audio\thing.mp3" instead of a folder, which
# leaves the game running in silence with nothing obviously wrong.

param(
  # Absolute URL the audio is served from, with a trailing slash. When given,
  # no audio goes in the zip at all.
  [string]$AudioBase = '',
  # Pack the re-encoded set from audio-web/ instead of the masters.
  [switch]$Small
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Game = Join-Path $Root 'heartbound.html'
$Zip = Join-Path $Root 'heartbound-web.zip'

if (-not (Test-Path $Game)) { throw "no game bundle at $Game - run build.ps1 first" }
if ($AudioBase -and -not $AudioBase.EndsWith('/')) { $AudioBase = "$AudioBase/" }

$html = [System.IO.File]::ReadAllText($Game)

function Rewrite($text, $find, $replace, $what) {
  if (-not $text.Contains($find)) { throw "could not find the $what line to rewrite - has AudioManager.js changed?" }
  return $text.Replace($find, $replace)
}

$files = @()

if ($AudioBase) {
  # Point the game at the remote copies and ship nothing but the html.
  $html = Rewrite $html "const AUDIO_BASE = 'audio/';" "const AUDIO_BASE = '$AudioBase';" 'AUDIO_BASE'
  Write-Host "   audio from $AudioBase (not bundled)"
} elseif ($Small) {
  $WebAudio = Join-Path $Root 'audio-web'
  if (-not (Test-Path $WebAudio)) { throw "no audio-web/ - run build-web-audio.ps1 first" }
  $html = Rewrite $html "const AUDIO_EXT = 'mp3';" "const AUDIO_EXT = 'm4a';" 'AUDIO_EXT'
  Get-ChildItem (Join-Path $WebAudio '*.m4a') | ForEach-Object {
    $files += @{ src = $_.FullName; name = "audio/$($_.Name)" }
  }
} else {
  Get-ChildItem (Join-Path $Root 'audio\*.mp3') | ForEach-Object {
    $files += @{ src = $_.FullName; name = "audio/$($_.Name)" }
  }
}

$tmpHtml = Join-Path $env:TEMP 'heartbound-web-index.html'
[System.IO.File]::WriteAllText($tmpHtml, $html, (New-Object System.Text.UTF8Encoding($false)))

# index.html so the host serves it as the landing page without being told.
$files = @(@{ src = $tmpHtml; name = 'index.html' }) + $files

Remove-Item $Zip -Force -ErrorAction SilentlyContinue
$out = [System.IO.File]::Create($Zip)
$archive = New-Object System.IO.Compression.ZipArchive($out, [System.IO.Compression.ZipArchiveMode]::Create)
foreach ($f in $files) {
  # Already-compressed audio; storing it keeps the zip quick to build and open.
  $level = if ($f.name -like '*.mp3' -or $f.name -like '*.m4a') {
    [System.IO.Compression.CompressionLevel]::NoCompression
  } else {
    [System.IO.Compression.CompressionLevel]::Optimal
  }
  $entry = $archive.CreateEntry($f.name, $level)
  $in = [System.IO.File]::OpenRead($f.src)
  $es = $entry.Open()
  $in.CopyTo($es)
  $es.Dispose()
  $in.Dispose()
  Write-Host ("   + {0}" -f $f.name)
}
$archive.Dispose()
$out.Dispose()

Write-Host ("built $Zip ({0:N2} MB)" -f ((Get-Item $Zip).Length / 1MB))
