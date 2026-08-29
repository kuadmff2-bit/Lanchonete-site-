package com.lanchonete.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class AdminFirebaseMessagingService extends FirebaseMessagingService {
    public static final String CHANNEL_ID = "new_orders";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        PushClient.registerToken(this, token);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);

        String title = "Novo pedido!";
        String body = "Confirme o novo pedido.";

        if (message.getNotification() != null) {
            if (message.getNotification().getTitle() != null && !message.getNotification().getTitle().isEmpty()) {
                title = message.getNotification().getTitle();
            }
            if (message.getNotification().getBody() != null && !message.getNotification().getBody().isEmpty()) {
                body = message.getNotification().getBody();
            }
        }

        String orderId = message.getData().get("orderId");
        showNotification(title, body, orderId);
    }

    public static void ensureChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Novos pedidos",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Avisos imediatos quando entrar um novo pedido");
        channel.enableVibration(true);
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        channel.setSound(sound, null);
        manager.createNotificationChannel(channel);
    }

    private void showNotification(String title, String body, String orderId) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        ensureChannel(manager);

        Intent intent = new Intent(this, PushLauncherActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("open_orders", true);
        if (orderId != null) intent.putExtra("order_id", orderId);

        int requestCode = orderId == null ? (int) System.currentTimeMillis() : orderId.hashCode();
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.app_icon)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 250, 120, 250})
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setContentIntent(pendingIntent);

        manager.notify(requestCode, builder.build());
    }
}
