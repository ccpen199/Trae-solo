import { Suspense } from 'react'
import Layout from './components/Layout'
import PageLoader from './components/PageState'

import Splash from './pages/Splash'
import Guide from './pages/Guide'
import Advertisement from './pages/Advertisement'
import Login from './pages/Login'
import Home from './pages/Home'
import Search from './pages/Search'
import BookDetail from './pages/BookDetail'
import Reader from './pages/Reader'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import CloudLibrary from './pages/CloudLibrary'
import Notes from './pages/Notes'
import Messages from './pages/Messages'
import VIP from './pages/VIP'

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const routes = [
  {
    path: '/',
    element: <Splash />
  },
  {
    path: '/guide',
    element: <Guide />
  },
  {
    path: '/ad',
    element: <Advertisement />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    element: <Layout />,
    children: [
      {
        path: '/home',
        element: <Home />
      },
      {
        path: '/search',
        element: <Search />
      },
      {
        path: '/book/:id',
        element: <BookDetail />
      },
      {
        path: '/reader/:bookId/:chapterId',
        element: <Reader />
      },
      {
        path: '/profile',
        element: <Profile />
      },
      {
        path: '/wishlist',
        element: <Wishlist />
      },
      {
        path: '/cloud-library',
        element: <CloudLibrary />
      },
      {
        path: '/notes',
        element: <Notes />
      },
      {
        path: '/messages',
        element: <Messages />
      },
      {
        path: '/vip',
        element: <VIP />
      }
    ]
  }
]

export default routes
