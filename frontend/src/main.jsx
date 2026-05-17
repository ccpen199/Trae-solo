import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
  event.preventDefault();
});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('渲染错误:', error);
  }
}
