import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout, Spin } from 'antd'
import { useUserStore } from './store'
import Navbar from './components/Navbar'
import MiniPlayer from './components/MiniPlayer'
import ProtectedRoute from './components/ProtectedRoute'

const Home = lazy(() => import('./pages/Home'))
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'))
const Player = lazy(() => import('./pages/Player'))
const Live = lazy(() => import('./pages/Live'))
const LiveRoom = lazy(() => import('./pages/LiveRoom'))
const MyListen = lazy(() => import('./pages/MyListen'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Search = lazy(() => import('./pages/Search'))

const { Content } = Layout

function App() {
  const init = useUserStore(state => state.init)
  const currentEpisode = useUserStore(state => state.currentEpisode)

  useEffect(() => {
    init()
  }, [init])

  return (
    <Layout className="app-layout">
      <Navbar />
      <Content className="app-content">
        <Suspense fallback={
          <div className="loading-container">
            <Spin size="large" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/album/:id" element={<AlbumDetail />} />
            <Route path="/player/:id" element={<Player />} />
            <Route path="/live" element={<Live />} />
            <Route path="/live/:id" element={<LiveRoom />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my" element={
              <ProtectedRoute>
                <MyListen />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </Content>
      {currentEpisode && <MiniPlayer />}
    </Layout>
  )
}

export default App
