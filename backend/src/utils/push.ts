// firebase removed per request — no firebase-admin usage
import PushToken from '../models/PushToken';
import path from 'path';
import apn from 'apn';
import admin from 'firebase-admin';

let apnProvider: any = null;
let fbInitialized = false;
// init firebase-admin if service account provided
try {
  if (!admin.apps || admin.apps.length === 0) {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (saJson) {
      const cred = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
      admin.initializeApp({ credential: admin.credential.cert(cred as any) } as any);
      fbInitialized = true;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const svc = require(p);
      admin.initializeApp({ credential: admin.credential.cert(svc) } as any);
      fbInitialized = true;
    }
  } else {
    fbInitialized = true;
  }
} catch (e) {
  console.warn('firebase-admin init failed or not configured', e);
}
try {
  const apnKeyPath = process.env.APN_KEY_PATH;
  const apnKeyId = process.env.APN_KEY_ID;
  const apnTeamId = process.env.APN_TEAM_ID;
  const apnBundleId = process.env.APN_BUNDLE_ID;
  if (apnKeyPath && apnKeyId && apnTeamId && apnBundleId) {
    apnProvider = new apn.Provider({
      token: {
        key: path.resolve(apnKeyPath),
        keyId: apnKeyId,
        teamId: apnTeamId,
      },
      production: process.env.NODE_ENV === 'production'
    });
  }
} catch (e) {
  console.warn('APN init failed or not configured', e);
}

export async function sendPushToUser(userId: string, payload: { title?: string; body: string; data?: any }) {
  try {
    const tokens = await PushToken.find({ userId }).lean();
    if (!tokens || tokens.length === 0) return;

    // group tokens by platform (assume token docs contain platform)
    const byPlatform: Record<string, string[]> = {};
    tokens.forEach((t: any) => {
      const p = (t.platform || 'fcm').toLowerCase();
      if (!byPlatform[p]) byPlatform[p] = [];
      byPlatform[p].push(t.token);
    });

    // Send FCM (Android) using firebase-admin if initialized
    const fcmTokens = [ ...(byPlatform['android'] || []), ...(byPlatform['fcm'] || []) ];
    if (fcmTokens.length) {
      if (!fbInitialized) {
        console.warn('FCM tokens present but firebase-admin not initialized; skipping FCM send', { count: fcmTokens.length });
      } else {
        try {
          const message: any = {
            notification: { title: payload.title || 'Notificación', body: payload.body },
            data: Object.keys(payload.data || {}).reduce((acc: any, k) => ({ ...acc, [k]: String(payload.data[k]) }), {}),
            tokens: fcmTokens,
          };
          const messaging = admin.messaging() as any;
          const res = await messaging.sendMulticast(message);
          // cleanup invalid tokens
          const toRemove: string[] = [];
          if (res && res.responses) {
            res.responses.forEach((r: any, idx: number) => {
              if (!r.success) {
                const err = r.error as any;
                if (err && (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token')) {
                  toRemove.push(fcmTokens[idx]);
                }
              }
            });
            if (toRemove.length) {
              await PushToken.deleteMany({ token: { $in: toRemove } });
            }
          }
          console.log('fcm send result', { successCount: res.successCount, failureCount: res.failureCount });
        } catch (e) {
          console.error('FCM send error', e);
        }
      }
    }

    // APN (iOS)
    if (apnProvider && byPlatform['ios'] && byPlatform['ios'].length) {
      const note = new apn.Notification();
      note.alert = { title: payload.title || 'Notificación', body: payload.body };
      note.payload = payload.data || {};
      note.topic = process.env.APN_BUNDLE_ID || '';
      const res = await apnProvider.send(note, byPlatform['ios']);
      console.log('apn send result', res);
    }
    // If APN provider configured but tokens under 'apn'
    if (apnProvider && byPlatform['apn'] && byPlatform['apn'].length) {
      const note = new apn.Notification();
      note.alert = { title: payload.title || 'Notificación', body: payload.body };
      note.payload = payload.data || {};
      note.topic = process.env.APN_BUNDLE_ID || '';
      const res = await apnProvider.send(note, byPlatform['apn']);
      console.log('apn send result', res);
    }
  } catch (e) {
    console.error('sendPushToUser err', e);
  }
}

export default { sendPushToUser };
