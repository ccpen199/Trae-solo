'use client';

import { SWRConfig } from 'swr';
import { Toaster } from 'react-hot-toast';
import type { SWRConfiguration } from 'swr';

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: (error) => {
    if (error.message === 'Unauthorized') return false;
    return true;
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#FF6B35',
              secondary: '#fff',
            },
          },
        }}
      />
    </SWRConfig>
  );
}
