import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Records from './pages/Records'
import Dimensions from './pages/Dimensions'
import Appeals from './pages/Appeals'
import Archives from './pages/Archives'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'students',
        element: <Students />,
      },
      {
        path: 'records',
        element: <Records />,
      },
      {
        path: 'dimensions',
        element: <Dimensions />,
      },
      {
        path: 'appeals',
        element: <Appeals />,
      },
      {
        path: 'archives',
        element: <Archives />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
])

export default router
