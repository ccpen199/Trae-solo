import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

function Root() {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
      setErrorMsg(event.message);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: 40, background: '#fff1f0', minHeight: '100vh' }}>
        <h2 style={{ color: '#ff4d4f' }}>页面渲染出错</h2>
        <p style={{ color: '#666' }}>{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: 20, padding: '8px 16px' }}
        >
          刷新重试
        </button>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
