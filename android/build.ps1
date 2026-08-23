# Builds heartbound.apk straight from the Android SDK tools — no Gradle, no
# Node, no Android Studio project. The whole app is one WebView around the game
# bundle, so the usual build system would be several hundred megabytes of
# machinery to compile one Java file.
#
#   powershell -ExecutionPolicy Bypass -File android\build.ps1
#
# Needs a JDK (17 or newer) and an Android SDK with build-tools and one
# platform installed. Both are found automatically in their usual places; pass
# -Jdk / -Sdk if yours live somewhere else.

param(
  # The single-file game build. Regenerate it with build.ps1 in the project root
  # before building the apk if you have changed anything under js/.
  [string]$Game = (Join-Path (Split-Path -Parent $PSScriptRoot) 'heartbound.html'),
  # Where the full-quality mp3s live. They are copied flat into assets/.
  [string]$Audio = (Join-Path (Split-Path -Parent $PSScriptRoot) 'audio'),
  [string]$Sdk = "$env:LOCALAPPDATA\Android\Sdk",
  [string]$Jdk = "$env:LOCALAPPDATA\Programs\jdk-17",
  [string]$OutDir = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$build = Join-Path $root 'build'

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Step($msg) { Write-Host "-> $msg" -ForegroundColor Cyan }

# ---- locate the toolchain --------------------------------------------------

if (-not (Test-Path $Game)) { Fail "no game bundle at $Game" }
if (-not (Test-Path $Sdk)) { Fail "no Android SDK at $Sdk" }
if (-not (Test-Path "$Jdk\bin\javac.exe")) { Fail "no JDK at $Jdk (need javac)" }

# Highest installed build-tools and platform, so this keeps working after an
# SDK update instead of pinning a version that gets removed.
$bt = Get-ChildItem "$Sdk\build-tools" -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $bt) { Fail 'no build-tools installed' }
$plat = Get-ChildItem "$Sdk\platforms" -Directory |
  Where-Object { Test-Path "$($_.FullName)\android.jar" } |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $plat) { Fail 'no platform with android.jar installed' }

$aapt2 = "$($bt.FullName)\aapt2.exe"
$d8 = "$($bt.FullName)\d8.bat"
$zipalign = "$($bt.FullName)\zipalign.exe"
$apksigner = "$($bt.FullName)\apksigner.bat"
$androidJar = "$($plat.FullName)\android.jar"
$javac = "$Jdk\bin\javac.exe"
$keytool = "$Jdk\bin\keytool.exe"

Write-Host "build-tools $($bt.Name)   platform $($plat.Name)   jdk $Jdk"

# d8 and apksigner are .bat wrappers that launch whichever java they find first.
# A machine with an old JRE on PATH — which is the normal state of a Windows box
# that has ever installed Java — sends them to Java 8, and they are compiled for
# 11, so they die on a class version error. Point them at the JDK for the life
# of this process only.
$env:JAVA_HOME = $Jdk
$env:PATH = "$Jdk\bin;$env:PATH"

Remove-Item $build -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $build, "$build\classes", "$build\gen" | Out-Null

# ---- stage the game --------------------------------------------------------

# The web build pulls Phaser off a CDN. An installed app has to work with the
# phone in flight mode, so the vendored copy in assets is swapped in here rather
# than the two HTML files being kept in step by hand.
Step 'staging game assets'
$html = Get-Content $Game -Raw
$before = $html
$html = [regex]::Replace($html, '<script src="https://cdn\.jsdelivr\.net/npm/phaser@[^"]+"></script>',
  '<script src="phaser.min.js"></script>')
if ($html -eq $before) { Fail 'could not find the Phaser CDN tag to rewrite — has the bundle template changed?' }
if (-not (Test-Path "$root\assets\phaser.min.js")) { Fail 'assets\phaser.min.js is missing (see README)' }

# The audio sits flat in assets/ rather than in an assets/audio/ folder, and the
# game is told so by rewriting AUDIO_BASE to empty. That is not tidiness: aapt2
# on Windows writes nested asset paths into the apk with backslashes, so the
# files land as "assets/audio\thing.mp3" and AssetManager, which looks them up
# with forward slashes, never finds them. The game then runs in silence with
# nothing else wrong. Keeping assets one level deep sidesteps it completely, and
# avoids having to rebuild the zip afterwards to correct the names — which is
# its own trap, because a rebuilt zip is very easy to get subtly wrong.
$before = $html
$html = $html.Replace("const AUDIO_BASE = 'audio/';", "const AUDIO_BASE = '';")
if ($html -eq $before) { Fail 'could not find the AUDIO_BASE line to rewrite — has AudioManager.js changed?' }

$audioSrc = $Audio
if (-not (Test-Path $audioSrc)) { Fail "no audio/ folder at $audioSrc" }
Get-ChildItem "$audioSrc\*.mp3" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path "$root\assets" $_.Name) -Force
}
# A leftover assets/audio/ from an older build would be packaged as well, so the
# apk would carry the files twice.
Remove-Item "$root\assets\audio" -Recurse -Force -ErrorAction SilentlyContinue

[IO.File]::WriteAllText("$root\assets\heartbound.html", $html, (New-Object Text.UTF8Encoding($false)))
$audioKb = (Get-ChildItem "$root\assets\*.mp3" | Measure-Object -Property Length -Sum).Sum / 1kb
Write-Host ("   heartbound.html {0:N0} KB + phaser.min.js {1:N0} KB + audio {2:N0} KB" -f `
  ((Get-Item "$root\assets\heartbound.html").Length / 1kb), `
  ((Get-Item "$root\assets\phaser.min.js").Length / 1kb), $audioKb)

# ---- icons -----------------------------------------------------------------

if (-not (Test-Path "$root\res\mipmap-mdpi\ic_launcher.png")) {
  Step 'generating launcher icons'
  # Windows PowerShell 5.1 has no null-coalescing operator, so this stays long.
  $py = Get-Command py -ErrorAction SilentlyContinue
  if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
  if (-not $py) { Fail 'launcher icons are missing and python is not available to generate them' }
  & $py.Source "$root\tools\make_icons.py"
  if ($LASTEXITCODE -ne 0) { Fail 'icon generation failed' }
}

# ---- resources -------------------------------------------------------------

Step 'compiling resources'
& $aapt2 compile --dir "$root\res" -o "$build\res.zip"
if ($LASTEXITCODE -ne 0) { Fail 'aapt2 compile failed' }

Step 'linking resources'
& $aapt2 link -o "$build\base.apk" -I $androidJar `
  --manifest "$root\AndroidManifest.xml" `
  -A "$root\assets" `
  --java "$build\gen" `
  --min-sdk-version 24 --target-sdk-version 36 `
  "$build\res.zip"
if ($LASTEXITCODE -ne 0) { Fail 'aapt2 link failed' }

# ---- code ------------------------------------------------------------------

Step 'compiling java'
$sources = @(Get-ChildItem "$root\src" -Recurse -Filter *.java | Select-Object -ExpandProperty FullName)
$sources += @(Get-ChildItem "$build\gen" -Recurse -Filter *.java | Select-Object -ExpandProperty FullName)
# Release 11 keeps the class files inside what d8 accepts without desugaring
# surprises, while still allowing lambdas.
& $javac -nowarn --release 11 -classpath $androidJar -d "$build\classes" $sources
if ($LASTEXITCODE -ne 0) { Fail 'javac failed' }

Step 'dexing'
$classes = @(Get-ChildItem "$build\classes" -Recurse -Filter *.class | Select-Object -ExpandProperty FullName)
& cmd /c "`"$d8`" --lib `"$androidJar`" --min-api 24 --output `"$build`" $($classes -join ' ')"
if ($LASTEXITCODE -ne 0) { Fail 'd8 failed' }

# ---- package ---------------------------------------------------------------

Step 'packaging'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open("$build\base.apk", 'Update')
try {
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$build\classes.dex", 'classes.dex') | Out-Null
} finally { $zip.Dispose() }

# zipalign before signing, never after — apksigner preserves alignment, but
# aligning a signed apk breaks the signature.
& $zipalign -f -p 4 "$build\base.apk" "$build\aligned.apk"
if ($LASTEXITCODE -ne 0) { Fail 'zipalign failed' }

# ---- sign ------------------------------------------------------------------

# Kept next to the project and reused. Android refuses to install an update
# signed with a different key, so throwing this away means uninstalling the app
# from the phone before the next build will go on.
$ks = Join-Path $root 'heartbound.keystore'
if (-not (Test-Path $ks)) {
  Step 'creating signing key'
  & $keytool -genkeypair -v -keystore $ks -alias heartbound -keyalg RSA -keysize 2048 `
    -validity 10950 -storepass heartbound -keypass heartbound -dname 'CN=Heartbound, O=Heartbound' | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail 'keytool failed' }
}

Step 'signing'
$apk = Join-Path $OutDir 'heartbound.apk'
Remove-Item $apk -Force -ErrorAction SilentlyContinue
# v2/v3 alone are enough for Android 7 upward, which is everything this app
# runs on. v1 is switched on as well because sideloading is a scruffier path
# than the Play Store — some file managers and installer flows still look at the
# old JAR signature — and carrying it costs a few kilobytes.
& cmd /c "`"$apksigner`" sign --ks `"$ks`" --ks-pass pass:heartbound --key-pass pass:heartbound --v1-signing-enabled true --out `"$apk`" `"$build\aligned.apk`""
if ($LASTEXITCODE -ne 0) { Fail 'apksigner failed' }

& cmd /c "`"$apksigner`" verify --print-certs `"$apk`"" | Select-Object -First 2

Write-Host ""
Write-Host ("built {0} ({1:N1} MB)" -f $apk, ((Get-Item $apk).Length / 1mb)) -ForegroundColor Green
