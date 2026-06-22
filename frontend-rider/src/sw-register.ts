import { syncQueue } from '@/utils/syncQueue';

let swRegistration: ServiceWorkerRegistration | null = null;
let updateAvailable = false;

export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          updateAvailable = true;
          showUpdateNotification();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        syncQueue.getQueueStatus().then((status) => {
          console.log('Sync status after SW sync:', status);
        });
      }
    });

    if (registration.sync) {
      try {
        await registration.sync.register('sync-offline-queue');
      } catch {}
    }

    setupPeriodicSync(registration);
    setupPushSubscription(registration);

    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
}

function showUpdateNotification() {
  const event = new CustomEvent('sw-update-available');
  window.dispatchEvent(event);
}

async function setupPeriodicSync(registration: ServiceWorkerRegistration) {
  if (!('periodicSync' in registration)) return;

  try {
    const tags = await (registration as any).periodicSync.getTags();
    if (!tags.includes('periodic-sync-queue')) {
      await (registration as any).periodicSync.register('periodic-sync-queue', {
        minInterval: 5 * 60 * 1000,
      });
    }
  } catch {}
}

async function setupPushSubscription(registration: ServiceWorkerRegistration) {
  if (!('PushManager' in window)) return;

  try {
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const applicationServerKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (applicationServerKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
          await sendSubscriptionToServer(subscription);
        }
      }
    }
  } catch {}
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch {}
}

export async function requestSync(): Promise<void> {
  if (!swRegistration) return;

  try {
    if ('SyncManager' in window) {
      await swRegistration.sync.register('sync-offline-queue');
    } else {
      await syncQueue.processQueue();
    }
  } catch {
    await syncQueue.processQueue();
  }
}

export async function unregisterSW(): Promise<boolean> {
  if (!swRegistration) return false;
  return swRegistration.unregister();
}

export function applyUpdate(): void {
  if (!swRegistration?.waiting) return;
  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
}
