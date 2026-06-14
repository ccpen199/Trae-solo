import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { placeHandlers } from './handlers/place';
import { alarmHandlers } from './handlers/alarm';
import { verificationHandlers } from './handlers/verification';
import { reservationHandlers } from './handlers/reservation';
import { inspectionHandlers } from './handlers/inspection';
import { analyticsHandlers } from './handlers/analytics';
import { systemHandlers } from './handlers/system';

export const worker = setupWorker(
  ...authHandlers,
  ...placeHandlers,
  ...alarmHandlers,
  ...verificationHandlers,
  ...reservationHandlers,
  ...inspectionHandlers,
  ...analyticsHandlers,
  ...systemHandlers
);

export const enableMocking = async (): Promise<void> => {
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('[MSW] Mock Service Worker started');
    } catch (e) {
      console.warn('[MSW] Failed to start, falling back to direct mock:', e);
    }
  }
};
