import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// #region debug-point H1H4:global-errors
(() => {
  const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
  const _dbg = (hypothesisId: string, msg: string, data: any = {}) => {
    try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/main.tsx', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {}
  };
  window.addEventListener('error', (e) => _dbg('H1', 'uncaught_error', { message: e.error?.message || e.message, stack: e.error?.stack, filename: e.filename, lineno: e.lineno }));
  window.addEventListener('unhandledrejection', (e) => _dbg('H1', 'unhandled_promise_reject', { reason: String(e.reason) }));
  _dbg('H1', 'app_start_before_render', { readyState: document.readyState });
})();
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// #region debug-point H1:root-mount
(() => {
  const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
  try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId: 'H1', location: 'src/main.tsx:22', msg: '[DEBUG] root_render_executed', data: { rootEl: !!document.getElementById('root') }, ts: Date.now() }) }).catch(() => {}); } catch {}
})();
// #endregion
