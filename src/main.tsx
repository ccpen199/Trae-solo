import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { enableMocking } from './mock/browser';

async function bootstrap() {
  try {
    await enableMocking();
  } catch (err) {
    console.warn('MSW mocking failed to initialize:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
