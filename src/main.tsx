import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

try {
  const oldKeys = ['global-store'];
  oldKeys.forEach((k) => {
    if (typeof window !== 'undefined' && localStorage.getItem(k)) {
      localStorage.removeItem(k);
    }
  });
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
