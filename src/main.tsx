import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from '@/store/useStore'

function AppInitializer() {
  const elderlyMode = useStore((s) => s.elderlyMode)
  const fontSize = useStore((s) => s.fontSize)

  useEffect(() => {
    const html = document.documentElement
    if (elderlyMode) {
      html.classList.add('elderly-mode')
    } else {
      html.classList.remove('elderly-mode')
    }
  }, [elderlyMode])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
  }, [fontSize])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>,
)
