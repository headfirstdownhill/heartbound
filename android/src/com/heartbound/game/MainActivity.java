package com.heartbound.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * The whole app: one full screen WebView holding the same game that runs in a
 * browser. Nothing is fetched at runtime — the bundle and Phaser both ship in
 * assets/ — so the app asks for no permissions at all and works on a phone that
 * has never been online.
 */
public class MainActivity extends Activity {

    /** Matches the page background, so there is no white flash before it paints. */
    private static final int BACKDROP = 0xFF0D0B14;

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        // An eight minute run should not be interrupted by the screen dimming.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(BACKDROP));

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        // The inventory is saved to localStorage. WebView keeps DOM storage off
        // by default, and without this the unlock silently fails to persist —
        // the book would have to be won again after every close.
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // The canvas scales itself; letting the WebView zoom as well fights it.
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);

        web.setBackgroundColor(BACKDROP);
        // A game that fills the screen has nothing to scroll, and the glow at
        // the edge of an overscroll looks like a bug.
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setLongClickable(false);
        web.setHapticFeedbackEnabled(false);
        // Otherwise a held thumb on the joystick raises the text selection menu.
        web.setOnLongClickListener(v -> true);

        web.loadUrl("file:///android_asset/heartbound.html");
        setContentView(web);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-applied on focus because swiping the bars back in is only transient
        // and the game should return to full screen on its own.
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            web.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
