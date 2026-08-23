# Bundles every module into one self-contained heartbound.html.
# Tiiny.host (and a plain double-click) can run a single file; the ES-module
# version under js/ needs a real web server, so this is the file to upload.

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Out = Join-Path $Root "heartbound.html"

# Dependency order: anything a file reads at load time must come before it.
$order = @(
  "js/core/Constants.js",
  "js/systems/AudioManager.js",
  "js/gfx/Palette.js",
  "js/gfx/PixelArt.js",
  "js/gfx/FxTextures.js",
  "js/gfx/PostFX.js",
  "js/gfx/sprites/font.js",
  "js/gfx/PixelText.js",
  "js/systems/Fx.js",
  "js/gfx/sprites/characters.js",
  "js/gfx/sprites/blobs.js",
  "js/gfx/sprites/items.js",
  "js/gfx/sprites/tiles.js",
  "js/gfx/sprites/ui.js",
  "js/gfx/sprites/jory.js",
  "js/data/lookData.js",
  "js/gfx/GirlBuilder.js",
  "js/core/GameState.js",
  "js/core/Timer.js",
  "js/core/InputController.js",
  "js/ui/VirtualJoystick.js",
  "js/ui/TouchButton.js",
  "js/ui/MenuWidgets.js",
  "js/ui/MiniPlayer.js",
  "js/ui/VolumeSlider.js",
  "js/ui/MusicPicker.js",
  "js/ui/SpeechBubble.js",
  "js/data/levelData.js",
  "js/data/joryData.js",
  "js/systems/RoomBuilder.js",
  "js/systems/CutsceneDirector.js",
  "js/entities/Player.js",
  "js/entities/Blob.js",
  "js/entities/BossBlob.js",
  "js/entities/GhostCompanion.js",
  "js/entities/AlliedBlob.js",
  "js/entities/FinalBoss.js",
  "js/entities/PowerUp.js",
  "js/scenes/BootScene.js",
  "js/scenes/MenuScene.js",
  "js/scenes/CustomizeScene.js",
  "js/scenes/NameScene.js",
  "js/scenes/DifficultyScene.js",
  "js/scenes/IntroScene.js",
  "js/scenes/JoryIntroScene.js",
  "js/scenes/HUDScene.js",
  "js/scenes/BaseLevelScene.js",
  "js/scenes/levels.js",
  "js/scenes/JoryLevelScene.js",
  "js/scenes/GardenScene.js",
  "js/scenes/BookScene.js",
  "js/scenes/endings.js",
  "js/main.js"
)

$parts = New-Object System.Collections.Generic.List[string]
foreach ($rel in $order) {
  $path = Join-Path $Root $rel
  if (-not (Test-Path -LiteralPath $path)) { throw "missing $rel" }
  $src = Get-Content -LiteralPath $path -Raw

  # Strip module syntax: everything shares one scope once concatenated.
  $src = [regex]::Replace($src, "(?m)^\s*import[\s\S]*?from\s+'[^']*';\s*$", "")
  $src = [regex]::Replace($src, "(?m)^\s*export\s*\{[^}]*\}\s*;\s*$", "")
  $src = [regex]::Replace($src, "(?m)^export\s+", "")

  $parts.Add("/* ---- $rel ---- */") | Out-Null
  $parts.Add($src.Trim()) | Out-Null
}

$bundle = [string]::Join("`n`n", $parts)

# Every module lands in one shared scope here, so two files each declaring their
# own `const PANEL_BODY` is a SyntaxError that takes the whole game down. The
# module build under js/ gives each file its own scope and never sees it, so
# without this check the bundle can break while the dev build looks fine.
$declared = @{}
$clashes = [System.Collections.Generic.List[string]]::new()
foreach ($line in ($bundle -split "`n")) {
  $m = [regex]::Match($line, '^(?:const|let|class|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)')
  if (-not $m.Success) { continue }
  $name = $m.Groups[1].Value
  if ($declared.ContainsKey($name)) { $clashes.Add($name) | Out-Null }
  else { $declared[$name] = $true }
}
if ($clashes.Count -gt 0) {
  throw "duplicate top-level declaration(s) across modules: $($clashes -join ', ') - rename one (file-scoped constants are prefixed for this reason)"
}

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0d0b14">
<title>Heartbound</title>
<style>
  html, body {
    margin: 0; padding: 0; background: #0d0b14; overflow: hidden;
    height: 100%; width: 100%; touch-action: none;
    -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent; overscroll-behavior: none;
  }
  #game-root { width: 100vw; height: 100vh; }
  #game-root canvas { display: block; touch-action: none; image-rendering: pixelated; }
  #boot-msg {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    color: #d94f70; font-family: monospace; font-size: 14px; letter-spacing: 2px; pointer-events: none;
  }
</style>
</head>
<body>
<div id="game-root"></div>
<div id="boot-msg">LOADING...</div>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script>
(function () {
'use strict';
$bundle
})();
</script>
</body>
</html>
"@

[System.IO.File]::WriteAllText($Out, $html, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "built $Out ($([math]::Round((Get-Item $Out).Length / 1kb, 1)) KB)"
