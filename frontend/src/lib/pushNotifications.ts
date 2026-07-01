import { api } from './api';

export async function initPushNotifications(token: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) return;

    const res = await api.get('/push/vapid-key');
    const publicKey = res.data.data.publicKey;
    if (!publicKey) return;

    const converted = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: converted,
    });

    await api.post('/push/subscribe', subscription.toJSON());
  } catch {}
}

export async function destroyPushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const json = sub.toJSON();
      await api.post('/push/unsubscribe', json).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {}
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
