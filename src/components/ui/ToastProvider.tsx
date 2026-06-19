import { ReactNode } from 'react';
import { ToastContainer } from './Toast';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
