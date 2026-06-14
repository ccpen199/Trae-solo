
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')
rootElement.dataset.page = 'social-security-dashboard'
rootElement.dataset.ready = 'false'

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
