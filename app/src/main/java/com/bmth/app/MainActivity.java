package com.bmth.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String DEFAULT_URL = "http://YOUR_SERVER_IP_OR_DOMAIN:3000";
    private static final String PREFS_NAME = "bmth_prefs";
    private static final String KEY_URL = "server_url";

    private WebView webView;
    private EditText urlInput;
    private TextView statusText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUrl = prefs.getString(KEY_URL, DEFAULT_URL);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Color.parseColor("#222222"));
        bar.setPadding(12, 12, 12, 12);

        urlInput = new EditText(this);
        urlInput.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        urlInput.setText(savedUrl);
        urlInput.setTextColor(Color.WHITE);
        urlInput.setHintTextColor(Color.LTGRAY);
        urlInput.setHint("http://ip:port");
        urlInput.setSingleLine(true);

        Button goBtn = new Button(this);
        goBtn.setText("Connect");
        goBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadTargetUrl(urlInput.getText().toString().trim());
            }
        });

        bar.addView(urlInput);
        bar.addView(goBtn);

        statusText = new TextView(this);
        statusText.setBackgroundColor(Color.parseColor("#FFF3CD"));
        statusText.setTextColor(Color.parseColor("#664D03"));
        statusText.setPadding(16, 10, 16, 10);
        statusText.setGravity(Gravity.START);
        statusText.setVisibility(View.GONE);

        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                statusText.setVisibility(View.VISIBLE);
                statusText.setText("Connecting to: " + url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                statusText.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    statusText.setVisibility(View.VISIBLE);
                    statusText.setText("Connection error: " + error.getDescription());
                }
            }
        });

        root.addView(bar);
        root.addView(statusText);
        root.addView(webView);
        setContentView(root);

        loadTargetUrl(savedUrl);
    }

    private void loadTargetUrl(String target) {
        if (target == null || target.isEmpty()) {
            return;
        }
        if (!target.startsWith("http://") && !target.startsWith("https://")) {
            target = "http://" + target;
        }
        urlInput.setText(target);
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .edit()
                .putString(KEY_URL, target)
                .apply();
        webView.loadUrl(target);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
