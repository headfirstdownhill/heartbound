# Re-encodes audio/ into audio-web/ small enough for a free static host.
#
#   powershell -ExecutionPolicy Bypass -File build-web-audio.ps1
#
# Only needed when the contents of audio/ change. build-web-zip.ps1 packs
# whatever this leaves in audio-web/.
#
# AAC rather than mp3: at these bitrates it sounds considerably better for the
# same bytes. AAC rather than Opus, which is better still, because Opus does not
# play on older Safari and this link gets opened on phones.
#
# Songs are mono at 32 kHz. Stereo would spend half the budget on a width nobody
# hears through a phone speaker, and at ~52 kbps the encoder does better across a
# narrower band than smeared over 44.1 kHz.

param(
  [int]$SongKbps = 52,
  [int]$SfxKbps = 96
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Src = Join-Path $Root 'audio'
$Out = Join-Path $Root 'audio-web'

$ff = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ff) {
  $ffmpeg = $ff.Source
} else {
  $guess = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"
  if (-not (Test-Path $guess)) { throw "ffmpeg not found - install it with: winget install Gyan.FFmpeg" }
  $ffmpeg = $guess
}

Remove-Item $Out -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Out | Out-Null

# Writes into this folder occasionally fail on the first go - something on this
# machine holds files under Downloads for a moment. Retrying is enough.
function Encode($inFile, $outFile, $kbps, $rate) {
  for ($i = 0; $i -lt 4; $i++) {
    & $ffmpeg -hide_banner -loglevel error -y -i $inFile `
      -vn -map_metadata -1 -c:a aac -b:a "${kbps}k" -ac 1 -ar $rate `
      -movflags +faststart $outFile 2>&1 | Out-Null
    if (Test-Path $outFile) { return }
    Start-Sleep -Milliseconds 500
  }
  throw "could not write $outFile"
}

$total = 0
Get-ChildItem (Join-Path $Src '*.mp3') | ForEach-Object {
  $dest = Join-Path $Out ($_.BaseName + '.m4a')
  # The page turn is under a second, so it can afford a high rate for nothing.
  $isSfx = $_.BaseName -like '*effect*'
  if ($isSfx) { Encode $_.FullName $dest $SfxKbps 44100 } else { Encode $_.FullName $dest $SongKbps 32000 }
  $total += (Get-Item $dest).Length
  Write-Host ("   {0,-42} {1,7:N2} MB -> {2,6:N2} MB" -f $_.Name, ($_.Length / 1MB), ((Get-Item $dest).Length / 1MB))
}

Write-Host ("audio-web total: {0:N2} MB" -f ($total / 1MB))
