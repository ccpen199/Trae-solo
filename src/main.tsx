import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import ToastContainer from './components/ToastContainer'
import BusinessModals from './components/BusinessModals'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastContainer />
    <BusinessModals />
  </StrictMode>,
)
