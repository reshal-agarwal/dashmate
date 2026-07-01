import webpush from 'web-push';
import { PushSubscription } from '../models/pushSubscriptionModel';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:dashmate@example.com';

export function initVapidKeys() {
  if (!publicVapidKey || !privateVapidKey) {
    const keys = webpush.generateVAPIDKeys();
    console.log('Generated VAPID keys for development:');
    console.log(`  VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.log(`  VAPID_PRIVATE_KEY=${keys.privateKey}`);
    webpush.setVapidDetails(vapidEmail, keys.publicKey, keys.privateKey);
    return keys;
  }
  webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
  return { publicKey: publicVapidKey, privateKey: privateVapidKey };
}

export function getVapidPublicKey(): string {
  return publicVapidKey || webpush.generateVAPIDKeys().publicKey;
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
  const subs = await PushSubscription.find({ user: userId }).lean();
  const payload = JSON.stringify({ title, body, data, icon: '/icon-192.svg', badge: '/icon-192.svg' });
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
}
