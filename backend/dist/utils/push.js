"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
// firebase removed per request — no firebase-admin usage
const PushToken_1 = __importDefault(require("../models/PushToken"));
const path_1 = __importDefault(require("path"));
const apn_1 = __importDefault(require("apn"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let apnProvider = null;
let fbInitialized = false;
// init firebase-admin if service account provided
try {
    if (!firebase_admin_1.default.apps || firebase_admin_1.default.apps.length === 0) {
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (saJson) {
            const cred = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
            firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(cred) });
            fbInitialized = true;
        }
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const p = path_1.default.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const svc = require(p);
            firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(svc) });
            fbInitialized = true;
        }
    }
    else {
        fbInitialized = true;
    }
}
catch (e) {
    console.warn('firebase-admin init failed or not configured', e);
}
try {
    const apnKeyPath = process.env.APN_KEY_PATH;
    const apnKeyId = process.env.APN_KEY_ID;
    const apnTeamId = process.env.APN_TEAM_ID;
    const apnBundleId = process.env.APN_BUNDLE_ID;
    if (apnKeyPath && apnKeyId && apnTeamId && apnBundleId) {
        apnProvider = new apn_1.default.Provider({
            token: {
                key: path_1.default.resolve(apnKeyPath),
                keyId: apnKeyId,
                teamId: apnTeamId,
            },
            production: process.env.NODE_ENV === 'production'
        });
    }
}
catch (e) {
    console.warn('APN init failed or not configured', e);
}
async function sendPushToUser(userId, payload) {
    try {
        const tokens = await PushToken_1.default.find({ userId }).lean();
        if (!tokens || tokens.length === 0)
            return;
        // group tokens by platform (assume token docs contain platform)
        const byPlatform = {};
        tokens.forEach((t) => {
            const p = (t.platform || 'fcm').toLowerCase();
            if (!byPlatform[p])
                byPlatform[p] = [];
            byPlatform[p].push(t.token);
        });
        // Send FCM (Android) using firebase-admin if initialized
        const fcmTokens = [...(byPlatform['android'] || []), ...(byPlatform['fcm'] || [])];
        if (fcmTokens.length) {
            if (!fbInitialized) {
                console.warn('FCM tokens present but firebase-admin not initialized; skipping FCM send', { count: fcmTokens.length });
            }
            else {
                try {
                    const message = {
                        notification: { title: payload.title || 'Notificación', body: payload.body },
                        data: Object.keys(payload.data || {}).reduce((acc, k) => ({ ...acc, [k]: String(payload.data[k]) }), {}),
                        tokens: fcmTokens,
                    };
                    const messaging = firebase_admin_1.default.messaging();
                    const res = await messaging.sendMulticast(message);
                    // cleanup invalid tokens
                    const toRemove = [];
                    if (res && res.responses) {
                        res.responses.forEach((r, idx) => {
                            if (!r.success) {
                                const err = r.error;
                                if (err && (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token')) {
                                    toRemove.push(fcmTokens[idx]);
                                }
                            }
                        });
                        if (toRemove.length) {
                            await PushToken_1.default.deleteMany({ token: { $in: toRemove } });
                        }
                    }
                    console.log('fcm send result', { successCount: res.successCount, failureCount: res.failureCount });
                }
                catch (e) {
                    console.error('FCM send error', e);
                }
            }
        }
        // APN (iOS)
        if (apnProvider && byPlatform['ios'] && byPlatform['ios'].length) {
            const note = new apn_1.default.Notification();
            note.alert = { title: payload.title || 'Notificación', body: payload.body };
            note.payload = payload.data || {};
            note.topic = process.env.APN_BUNDLE_ID || '';
            const res = await apnProvider.send(note, byPlatform['ios']);
            console.log('apn send result', res);
        }
        // If APN provider configured but tokens under 'apn'
        if (apnProvider && byPlatform['apn'] && byPlatform['apn'].length) {
            const note = new apn_1.default.Notification();
            note.alert = { title: payload.title || 'Notificación', body: payload.body };
            note.payload = payload.data || {};
            note.topic = process.env.APN_BUNDLE_ID || '';
            const res = await apnProvider.send(note, byPlatform['apn']);
            console.log('apn send result', res);
        }
    }
    catch (e) {
        console.error('sendPushToUser err', e);
    }
}
exports.default = { sendPushToUser };
