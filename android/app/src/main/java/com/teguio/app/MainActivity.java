package com.teguio.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.InsetDrawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Cached bottom inset in px (physical pixels) for CSS injection */
    static volatile int sBottomInsetPx = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavigationBarPlugin.class);
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Edge-to-edge: on API 35+ this is enforced regardless
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // System bar colors (scrim on API 35+)
        window.setStatusBarColor(Color.parseColor("#312C85"));
        window.setNavigationBarColor(Color.WHITE);
        window.setNavigationBarContrastEnforced(true);

        // Set status bar icons to white (light) from the start
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(true);

        // DecorView background for transparent status bar on API 35+
        window.getDecorView().setBackgroundColor(Color.parseColor("#312C85"));

        View contentView = findViewById(android.R.id.content);
        applySystemBarInsets(contentView, Color.parseColor("#312C85"), Color.WHITE);

        // Force insets dispatch after Bridge setup
        contentView.post(() -> contentView.requestApplyInsets());

        // Inject CSS variable into the WebView after it's loaded
        // Use multiple attempts to ensure it sticks
        for (int delay : new int[]{300, 800, 1500}) {
            contentView.postDelayed(() -> injectCssVariable(contentView), delay);
        }
    }

    /**
     * Fix pantalla en blanco al reentrar desde una notificacion push.
     *
     * El plugin @capacitor/keyboard con resizeOnFullScreen=true fija una altura
     * absoluta en px al contenedor del WebView (content.getChildAt(0)) cuando el
     * teclado aparece, y solo la restaura a MATCH_PARENT durante la animacion de
     * OCULTADO del teclado. Al reentrar por push (singleTask -> onNewIntent/onResume,
     * sin onCreate ni ciclo de teclado) esa altura reducida queda congelada y la
     * mitad inferior de la pantalla se ve en blanco.
     *
     * Aqui restauramos MATCH_PARENT en cada vuelta a foreground, salvo que el teclado
     * este realmente visible (para no interferir con la evitacion de teclado activa).
     */
    @Override
    public void onResume() {
        super.onResume();
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.post(() -> restoreWebViewHeightIfKeyboardHidden(contentView));
        }
    }

    private void restoreWebViewHeightIfKeyboardHidden(View contentView) {
        if (!(contentView instanceof ViewGroup)) return;
        ViewGroup content = (ViewGroup) contentView;
        if (content.getChildCount() == 0) return;

        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(content);
        boolean keyboardVisible = insets != null && insets.isVisible(WindowInsetsCompat.Type.ime());
        if (keyboardVisible) return;

        View child = content.getChildAt(0);
        ViewGroup.LayoutParams lp = child.getLayoutParams();
        if (lp != null && lp.height != ViewGroup.LayoutParams.MATCH_PARENT) {
            lp.height = ViewGroup.LayoutParams.MATCH_PARENT;
            child.setLayoutParams(lp);
            child.requestLayout();
        }
    }

    /**
     * Apply system bar insets via padding on the content FrameLayout + LayerDrawable background.
     */
    static void applySystemBarInsets(View contentView, int statusBarColor, int navBarColor) {
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());

            // Cache the bottom inset
            sBottomInsetPx = insets.bottom;

            // Apply padding on the content FrameLayout.
            // Bottom padding is handled by CSS (--android-nav-h) so we set 0 here
            // to avoid double-padding and let the body::after pseudo-element
            // provide the solid background behind the transparent nav bar.
            view.setPadding(insets.left, insets.top, insets.right, 0);

            // LayerDrawable: status bar color at top, nav bar color below
            LayerDrawable bg = new LayerDrawable(new android.graphics.drawable.Drawable[]{
                new ColorDrawable(statusBarColor),
                new InsetDrawable(new ColorDrawable(navBarColor), 0, insets.top, 0, 0)
            });
            view.setBackground(bg);

            return WindowInsetsCompat.CONSUMED;
        });
    }

    /**
     * Find a WebView in the view hierarchy and inject --android-nav-h CSS variable.
     */
    private void injectCssVariable(View root) {
        WebView webView = findWebView(root);
        if (webView == null && bridge != null) {
            webView = bridge.getWebView();
        }
        if (webView != null && sBottomInsetPx > 0) {
            float density = getResources().getDisplayMetrics().density;
            int dpBottom = Math.round(sBottomInsetPx / density);
            String js = "document.documentElement.style.setProperty('--android-nav-h','" + dpBottom + "px')";
            webView.evaluateJavascript(js, null);
        }
    }

    /** Recursively find a WebView in the view hierarchy */
    private static WebView findWebView(View root) {
        if (root instanceof WebView) return (WebView) root;
        if (root instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) root;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
}
