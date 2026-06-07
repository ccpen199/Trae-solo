import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const LEGACY_TOKEN = 'local-demo-admin-token';
const currentToken = localStorage.getItem('token');
if (currentToken === LEGACY_TOKEN) {
  localStorage.removeItem('token');
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.token === LEGACY_TOKEN) {
        parsed.state.token = null;
        parsed.state.user = null;
        parsed.state.isAuthenticated = false;
        localStorage.setItem('auth-storage', JSON.stringify(parsed));
      }
    } catch {}
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
