import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import App from './App';
import './styles.css';

// 移除首屏骨架屏（index.html 中的加载占位）
function removeSkeleton() {
  const skel = document.getElementById('boot-skeleton');
  if (skel) {
    skel.style.opacity = '0';
    skel.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { if (skel.parentNode) skel.parentNode.removeChild(skel); }, 300);
  }
}

const rootEl = document.getElementById('root') as HTMLElement;

// 全局错误兜底：React 渲染失败时显示
function renderFallback(msg: string) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5;padding:24px;">
      <div style="max-width:480px;width:100%;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h2 style="margin:0 0 8px;color:#cf1322;">页面加载异常</h2>
          <p style="color:#8c8c8c;font-size:13px;margin:0;">${msg}</p>
        </div>
        <div style="padding:12px;background:#fff2f0;border-radius:8px;margin-bottom:20px;font-size:12px;color:#cf1322;font-family:monospace;word-break:break-all;display:none;" id="fallback-err"></div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="/login" style="padding:8px 20px;background:#1677ff;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;">🔐 去登录页</a>
          <button onclick="location.reload()" style="padding:8px 20px;background:#fff;color:#1677ff;border:1px solid #1677ff;border-radius:6px;cursor:pointer;">🔄 刷新重试</button>
          <button onclick="localStorage.clear();location.href='/login';" style="padding:8px 20px;background:#fff;color:#8c8c8c;border:1px solid #d9d9d9;border-radius:6px;cursor:pointer;">🧹 清理缓存后重试</button>
        </div>
        <p style="text-align:center;font-size:11px;color:#bfbfbf;margin-top:20px;margin-bottom:0;">快递全链路协同开放平台 · 错误兜底页面</p>
      </div>
    </div>
  `;
}

// 捕获全局未处理的 Promise 错误
window.addEventListener('unhandledrejection', function(e) {
  console.error('[全局未处理异常]', e.reason);
});

try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
        <AntdApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </React.StrictMode>
  );

  // React 挂载后移除骨架屏
  setTimeout(removeSkeleton, 200);
} catch (err: any) {
  console.error('React 根渲染失败:', err);
  renderFallback('应用初始化失败，请刷新重试');
  const errEl = document.getElementById('fallback-err');
  if (errEl) { errEl.style.display = 'block'; errEl.textContent = err?.message || String(err); }
}
