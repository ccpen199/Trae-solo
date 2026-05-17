import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Loading from './components/Loading'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'

const SplashScreen = lazy(() => import('./pages/SplashScreen'))
const AdScreen = lazy(() => import('./pages/AdScreen'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const Player = lazy(() => import('./pages/Player'))
const Comments = lazy(() => import('./pages/Comments'))
const MyLikes = lazy(() => import('./pages/MyLikes'))
const Layout = lazy(() => import('./components/Layout'))

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/ad" element={<AdScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/player/:id" element={<Player />} />
              <Route path="/comments/:songId" element={<Comments />} />
              <Route path="/my-likes" element={<MyLikes />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App