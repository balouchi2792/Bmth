package com.bmth.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MainActivity extends Activity {
    private static final int WEB_PORT = 8080;
    private static final int GPS_TCP_PORT = 5005;

    private WebView webView;
    private ServerSocket webServerSocket;
    private ServerSocket gpsServerSocket;
    private volatile boolean running = true;

    private final Map<String, String> latestPackets = new ConcurrentHashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);

        startGpsTcpServer();
        startWebDashboardServer();
        webView.loadUrl("http://127.0.0.1:" + WEB_PORT + "/");
    }

    private void startGpsTcpServer() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    gpsServerSocket = new ServerSocket(GPS_TCP_PORT);
                    while (running) {
                        final Socket gpsClient = gpsServerSocket.accept();
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                handleGpsClient(gpsClient);
                            }
                        }).start();
                    }
                } catch (IOException ignored) {
                }
            }
        }).start();
    }

    private void handleGpsClient(Socket gpsClient) {
        String remoteKey = gpsClient.getInetAddress().getHostAddress() + ":" + gpsClient.getPort();
        String timeNow = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
        latestPackets.put(remoteKey, "[" + timeNow + "] Connected");

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(gpsClient.getInputStream()))) {
            String line;
            while (running && (line = reader.readLine()) != null) {
                String clean = line.trim().replace("\"", "'");
                String ts = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
                latestPackets.put(remoteKey, "[" + ts + "] " + clean);
            }
        } catch (IOException ignored) {
        } finally {
            try {
                gpsClient.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void startWebDashboardServer() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    webServerSocket = new ServerSocket(WEB_PORT);
                    while (running) {
                        Socket client = webServerSocket.accept();
                        handleWebClient(client);
                    }
                } catch (IOException ignored) {
                }
            }
        }).start();
    }

    private void handleWebClient(Socket client) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream()));
             OutputStream out = client.getOutputStream()) {
            String requestLine = in.readLine();
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
            }

            String ip = getDeviceIp();
            String jsonArray = buildJsonArray();
            String body;
            String contentType = "text/html; charset=utf-8";

            if (requestLine != null && requestLine.contains("/api/devices")) {
                contentType = "application/json; charset=utf-8";
                body = "{\"ip\":\"" + ip + "\",\"gps_port\":" + GPS_TCP_PORT + ",\"devices\":" + jsonArray + "}";
            } else {
                body = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>" +
                       "<meta charset='utf-8'><title>Bmth GPS Server</title>" +
                       "<style>body{font-family:sans-serif;padding:16px;background:#111;color:#eee;margin:0}" +
                       ".box{background:#1d1d1d;padding:14px;border-radius:10px;margin-bottom:12px}" +
                       ".item{background:#262626;padding:10px;border-radius:8px;margin-top:8px;font-size:13px;word-break:break-all}</style>" +
                       "</head><body>" +
                       "<div class='box'><h3>Bmth GPS Receiver Server</h3>" +
                       "<p><b>Device IP:</b> " + ip + "</p>" +
                       "<p><b>GPS TCP Port:</b> " + GPS_TCP_PORT + "</p></div>" +
                       "<div class='box'><b>Connected / Last GPS Data:</b><div id='list'>Loading...</div></div>" +
                       "<script>" +
                       "function refresh(){fetch('/api/devices').then(r=>r.json()).then(d=>{" +
                       "if(!d.devices.length){list.innerHTML='<div class=\"item\">No GPS packets yet</div>';return;}" +
                       "list.innerHTML=d.devices.map(x=>'<div class=\"item\"><b>'+x.client+'</b><br>'+x.data+'</div>').join('');" +
                       "});}refresh();setInterval(refresh,2000);" +
                       "</script></body></html>";
            }

            byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
            String header = "HTTP/1.1 200 OK\r\n" +
                            "Content-Type: " + contentType + "\r\n" +
                            "Content-Length: " + bodyBytes.length + "\r\n" +
                            "Connection: close\r\n\r\n";
            out.write(header.getBytes(StandardCharsets.UTF_8));
            out.write(bodyBytes);
            out.flush();
        } catch (IOException ignored) {
        } finally {
            try {
                client.close();
            } catch (IOException ignored) {
            }
        }
    }

    private String buildJsonArray() {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Map.Entry<String, String> entry : latestPackets.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("{\"client\":\"").append(entry.getKey().replace("\"", "'"))
              .append("\",\"data\":\"").append(entry.getValue().replace("\"", "'")).append("\"}");
        }
        sb.append("]");
        return sb.toString();
    }

    private String getDeviceIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (!addr.isLoopbackAddress() && addr.getHostAddress() != null && !addr.getHostAddress().contains(":")) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }

    @Override
    protected void onDestroy() {
        running = false;
        try {
            if (gpsServerSocket != null) gpsServerSocket.close();
        } catch (IOException ignored) {
        }
        try {
            if (webServerSocket != null) webServerSocket.close();
        } catch (IOException ignored) {
        }
        super.onDestroy();
    }
}
