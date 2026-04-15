package com.teguio.marketplace;

import android.graphics.Color;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NavigationBar")
public class NavigationBarPlugin extends Plugin {

    @PluginMethod
    public void setColor(PluginCall call) {
        String color = call.getString("color", "#FFFFFF");
        boolean darkButtons = call.getBoolean("darkButtons", true);

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            window.setNavigationBarColor(Color.parseColor(color));
            window.setNavigationBarContrastEnforced(true);

            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());
            controller.setAppearanceLightNavigationBars(darkButtons);
        });

        call.resolve();
    }

    @PluginMethod
    public void setThemeColors(PluginCall call) {
        String statusBarColor = call.getString("statusBarColor", "#312C85");
        String navBarColor = call.getString("navBarColor", "#FFFFFF");
        boolean lightStatusIcons = call.getBoolean("lightStatusIcons", true);
        boolean darkNavButtons = call.getBoolean("darkNavButtons", true);

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            int statusColor = Color.parseColor(statusBarColor);
            int navColor = Color.parseColor(navBarColor);

            // Status bar (scrim on API 35+)
            window.setStatusBarColor(statusColor);
            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());
            // lightStatusIcons=true means light (white) icons → NOT light appearance
            controller.setAppearanceLightStatusBars(!lightStatusIcons);

            // Navigation bar
            window.setNavigationBarColor(navColor);
            window.setNavigationBarContrastEnforced(true);
            controller.setAppearanceLightNavigationBars(darkNavButtons);

            // DecorView background for transparent status bar on API 35+
            window.getDecorView().setBackgroundColor(statusColor);

            // Re-apply insets with new colors
            View contentView = getActivity().findViewById(android.R.id.content);
            MainActivity.applySystemBarInsets(contentView, statusColor, navColor);
            contentView.requestApplyInsets();

            // Re-inject CSS variable with correct bottom inset
            injectNavHeight();
        });

        call.resolve();
    }

    @PluginMethod
    public void getInsets(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = new JSObject();

            // First try: use cached value from the insets listener (most reliable)
            if (MainActivity.sBottomInsetPx > 0) {
                float density = getActivity().getResources().getDisplayMetrics().density;
                int top = 0;
                int bottom = Math.round(MainActivity.sBottomInsetPx / density);

                // Try to get top too from root insets
                View decorView = getActivity().getWindow().getDecorView();
                WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decorView);
                if (rootInsets != null) {
                    Insets bars = rootInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                    top = Math.round(bars.top / density);
                    bottom = Math.round(bars.bottom / density);
                }

                result.put("top", top);
                result.put("bottom", bottom);
                result.put("left", 0);
                result.put("right", 0);
                call.resolve(result);
                return;
            }

            // Second try: getRootWindowInsets
            View decorView = getActivity().getWindow().getDecorView();
            WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decorView);
            if (rootInsets != null) {
                Insets bars = rootInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                float density = getActivity().getResources().getDisplayMetrics().density;
                result.put("top", Math.round(bars.top / density));
                result.put("bottom", Math.round(bars.bottom / density));
                result.put("left", Math.round(bars.left / density));
                result.put("right", Math.round(bars.right / density));
            }
            call.resolve(result);
        });
    }

    private void injectNavHeight() {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        View decorView = getActivity().getWindow().getDecorView();
        decorView.post(() -> {
            int bottomPx = MainActivity.sBottomInsetPx;
            if (bottomPx <= 0) {
                WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decorView);
                if (rootInsets != null) {
                    bottomPx = rootInsets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                }
            }
            if (bottomPx > 0 && getBridge() != null && getBridge().getWebView() != null) {
                float density = getActivity().getResources().getDisplayMetrics().density;
                int dpBottom = Math.round(bottomPx / density);
                String js = "document.documentElement.style.setProperty('--android-nav-h','" + dpBottom + "px')";
                getBridge().getWebView().evaluateJavascript(js, null);
            }
        });
    }
}
