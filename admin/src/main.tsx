import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useAppStore } from '@/store'

function Bootstrap({ children }: { children: React.ReactNode }) {
  const hydrate = useAppStore((state) => state.hydrateFromStorage);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap>
      <App />
    </Bootstrap>
  </StrictMode>,
)
