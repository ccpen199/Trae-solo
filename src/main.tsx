import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.message, e.filename, e.lineno);
  const el = document.getElementById('error-display');
  if (el) {
    el.textContent = `[JS错误] ${e.message} (${e.filename}:${e.lineno})`;
    el.style.display = 'block';
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
  const el = document.getElementById('error-display');
  if (el) {
    el.textContent = `[异步错误] ${e.reason}`;
    el.style.display = 'block';
  }
});

try {
  const root = document.getElementById('root')!;
  ReactDOM.createRoot(root).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
  console.log('[App] React 渲染完成');
} catch (err) {
  console.error('[App] 渲染失败:', err);
  document.getElementById('root')!.innerHTML = `
    <div style="padding:40px;color:#dc2626;font-size:18px;">
      <h2>应用启动失败</h2>
      <pre>${err}</pre>
    </div>
  `;
}
