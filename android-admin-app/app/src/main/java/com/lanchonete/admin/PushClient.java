package com.lanchonete.admin;

import android.content.Context;
import android.util.Log;
import android.webkit.CookieManager;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class PushClient {
    private static final String TAG = "LanchonetePush";
    private static final String BASE_URL = "https://lanchonete-site.kuadmff2.workers.dev";
    private static final String REGISTER_URL = BASE_URL + "/api/push/register";
    private static final String APP_USER_AGENT = "LanchoneteAdminApp/1.3";

    private PushClient() {}

    public static boolean initialize(Context context) {
        try {
            if (!FirebaseApp.getApps(context).isEmpty()) return true;

            String apiKey = context.getString(R.string.firebase_api_key).trim();
            String appId = context.getString(R.string.firebase_app_id).trim();
            String projectId = context.getString(R.string.firebase_project_id).trim();
            String senderId = context.getString(R.string.firebase_messaging_sender_id).trim();

            if (apiKey.isEmpty() || appId.isEmpty() || projectId.isEmpty() || senderId.isEmpty()) {
                Log.i(TAG, "Firebase ainda não configurado para este APK.");
                return false;
            }

            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApiKey(apiKey)
                    .setApplicationId(appId)
                    .setProjectId(projectId)
                    .setGcmSenderId(senderId)
                    .build();

            FirebaseApp.initializeApp(context.getApplicationContext(), options);
            return true;
        } catch (Exception error) {
            Log.e(TAG, "Falha ao iniciar Firebase", error);
            return false;
        }
    }

    public static void registerCurrentToken(Context context) {
        if (!initialize(context)) return;

        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult() == null) return;
            registerToken(context, task.getResult());
        });
    }

    public static void registerToken(Context context, String token) {
        if (token == null || token.trim().isEmpty()) return;

        String cookies = CookieManager.getInstance().getCookie(BASE_URL);
        if (cookies == null || !cookies.contains("lanchonete_admin_session=")) {
            return;
        }

        String cleanToken = token.trim();
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(REGISTER_URL).openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                connection.setRequestProperty("Cookie", cookies);
                connection.setRequestProperty("User-Agent", APP_USER_AGENT);

                String escaped = cleanToken.replace("\\", "\\\\").replace("\"", "\\\"");
                byte[] body = ("{\"token\":\"" + escaped + "\"}").getBytes(StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(body.length);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body);
                }

                int code = connection.getResponseCode();
                if (code >= 200 && code < 300) {
                    context.getSharedPreferences("push", Context.MODE_PRIVATE)
                            .edit()
                            .putString("registered_token", cleanToken)
                            .apply();
                    Log.i(TAG, "Aparelho registrado para notificações.");
                } else {
                    Log.w(TAG, "Servidor recusou registro de push: " + code);
                }
            } catch (Exception error) {
                Log.w(TAG, "Não foi possível registrar o token agora.", error);
            } finally {
                if (connection != null) connection.disconnect();
            }
        }, "push-register").start();
    }
}
