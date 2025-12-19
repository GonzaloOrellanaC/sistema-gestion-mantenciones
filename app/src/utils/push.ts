/*
  Scaffolding for native push integration (FCM / APN) using Capacitor.
  - Install plugins: @capacitor/push-notifications and @capacitor/local-notifications
  - Configure FCM (Android) and APN (iOS) per Capacitor docs and Firebase console.
  - This file gives basic registration and handlers.
*/
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { registerPushToken } from '../api/push';

export async function registerForPush() {
  try {
    await PushNotifications.requestPermissions();
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration token:', token.value);
      try {
        const platform = Capacitor.getPlatform();
        await registerPushToken(token.value, platform);
      } catch (e) {
        console.error('registerPushToken err', e);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Push received', notification);
      // Optionally show local notification when app is foreground
      await LocalNotifications.schedule({ notifications: [{ title: notification.title || 'Notificación', body: notification.body || '', id: Date.now() % 100000 }] });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed', action);
      // navigate to work order detail based on action.notification.data
    });
  } catch (e) {
    console.error('registerForPush err', e);
  }
}

export async function scheduleLocal(title: string, body: string) {
  try {
    await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({ notifications: [{ title, body, id: Date.now() % 100000 }] });
  } catch (e) {
    console.error('scheduleLocal err', e);
  }
}

export default { registerForPush, scheduleLocal };
