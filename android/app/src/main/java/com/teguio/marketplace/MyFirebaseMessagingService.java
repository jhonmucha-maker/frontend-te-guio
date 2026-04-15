package com.teguio.marketplace;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Servicio personalizado de Firebase Messaging para Te Guio.
 * Construye notificaciones con el logo del aplicativo como largeIcon
 * y soporta BigPicture para imagenes de productos.
 * Tambien reenvía mensajes a Capacitor para que los eventos JS funcionen.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "TeguioPush";
    private static final String CHANNEL_ID = "teguio-general";
    private static final String CHANNEL_NAME = "Te Guio";
    private static final int COLOR_PRIMARY = Color.parseColor("#312C85");
    private static final AtomicInteger notificationIdCounter = new AtomicInteger(1000);

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "Nuevo token FCM: " + token.substring(0, 20) + "...");
        // Reenviar nuevo token a Capacitor plugin
        PushNotificationsPlugin.onNewToken(token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "Mensaje recibido de: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");
        String imageUrl = data.get("image");
        String eventType = data.get("event_type");

        // Si no hay title/body en data, intentar desde notification (fallback)
        if (title == null && remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
            if (remoteMessage.getNotification().getImageUrl() != null) {
                imageUrl = remoteMessage.getNotification().getImageUrl().toString();
            }
        }

        if (title == null && body == null) {
            Log.w(TAG, "Mensaje sin titulo ni cuerpo, ignorado");
            // Aun asi reenviar a Capacitor por si tiene datos utiles
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
            return;
        }

        showNotification(title, body, imageUrl, eventType, data);

        // Reenviar a Capacitor plugin para que dispare eventos JS
        // (pushNotificationReceived en foreground, pushNotificationActionPerformed en tap)
        PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
    }

    private void showNotification(String title, String body, String imageUrl, String eventType, Map<String, String> data) {
        createChannelIfNeeded();

        // Logo del aplicativo como large icon (SIEMPRE presente)
        // Intentar cargar desde drawable, luego mipmap como fallback
        Bitmap largeIcon = loadLogoBitmap();

        // Intent para abrir la app al tocar la notificacion
        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (intent == null) {
            intent = new Intent();
        }
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        // Pasar datos del push como extras para que Capacitor los reciba
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }

        int notifId = notificationIdCounter.incrementAndGet();
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, notifId, intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(title != null ? title : "Te Guio")
            .setContentText(body != null ? body : "")
            .setAutoCancel(true)
            .setColor(COLOR_PRIMARY)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE)
            .setContentIntent(pendingIntent);

        // Establecer large icon solo si se cargo correctamente
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }

        // Si hay imagen (producto o logo), descargar y mostrar como BigPicture
        if (imageUrl != null && !imageUrl.isEmpty()) {
            Bitmap imageBitmap = downloadBitmap(imageUrl);
            if (imageBitmap != null) {
                NotificationCompat.BigPictureStyle bigPictureStyle = new NotificationCompat.BigPictureStyle()
                    .bigPicture(imageBitmap)
                    .setSummaryText(body);
                if (largeIcon != null) {
                    bigPictureStyle.bigLargeIcon(largeIcon);
                }
                builder.setStyle(bigPictureStyle);
            } else {
                // Si falla la descarga, al menos mostrar texto expandido
                builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
            }
        } else {
            builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
        }

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(notifId, builder.build());
            Log.d(TAG, "Notificacion mostrada: " + title);
        }
    }

    /**
     * Cargar el logo de Te Guio como Bitmap.
     * Intenta primero drawable, luego mipmap como fallback.
     */
    private Bitmap loadLogoBitmap() {
        try {
            // Logo cuadrado recortado para largeIcon (drawable/ic_teguio_logo.png)
            Bitmap bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.ic_teguio_logo);
            if (bitmap != null) {
                Log.d(TAG, "Logo cargado desde drawable: " + bitmap.getWidth() + "x" + bitmap.getHeight());
                return bitmap;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error cargando logo desde drawable: " + e.getMessage());
        }

        try {
            // Fallback: mipmap/ic_launcher (puede ser adaptativo en API 26+, pero intentar)
            Bitmap bitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
            if (bitmap != null) {
                Log.d(TAG, "Logo cargado desde mipmap: " + bitmap.getWidth() + "x" + bitmap.getHeight());
                return bitmap;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error cargando logo desde mipmap: " + e.getMessage());
        }

        Log.w(TAG, "No se pudo cargar el logo del aplicativo para la notificacion");
        return null;
    }

    private void createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null && manager.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notificaciones generales de Te Guio");
                channel.enableVibration(true);
                channel.setLightColor(COLOR_PRIMARY);
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Bitmap downloadBitmap(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setDoInput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.connect();
            InputStream input = conn.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(input);
            input.close();
            conn.disconnect();
            return bitmap;
        } catch (Exception e) {
            Log.e(TAG, "Error descargando imagen: " + e.getMessage());
            return null;
        }
    }
}
