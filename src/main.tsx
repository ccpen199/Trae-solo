import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import './index.css'
import { enableMocking } from '@/mocks/browser'

async function bootstrap() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )

  enableMocking().catch((error) => {
    console.warn('MSW mocking failed to initialize:', error)
  })
}

bootstrap()
