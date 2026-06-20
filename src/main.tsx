import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function bootstrap() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true') {
    import('./mock/browser')
      .then(({ enableMock }) => enableMock())
      .catch((error) => {
        console.error('Failed to start mock worker', error)
      })
  }
}

bootstrap()
