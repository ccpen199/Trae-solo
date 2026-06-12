import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { petHandlers } from './handlers/pets';
import { appointmentHandlers } from './handlers/appointment';
import { inventoryHandlers } from './handlers/inventory';
import { memberHandlers } from './handlers/member';

export const worker = setupWorker(
  ...authHandlers,
  ...petHandlers,
  ...appointmentHandlers,
  ...inventoryHandlers,
  ...memberHandlers
);

export async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('MSW mocking enabled');
  } catch (error) {
    console.error('Failed to enable MSW:', error);
  }
}
