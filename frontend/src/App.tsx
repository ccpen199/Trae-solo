import { useRoutes } from 'react-router-dom'
import router from './router'

function App() {
  const element = useRoutes(router.routes)
  return <>{element}</>
}

export default App
