import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { AppOutline, SetOutline, LocationOutline, UserOutline } from 'antd-mobile-icons'
import Home from './pages/Home'
import Charging from './pages/Charging'
import RoutePage from './pages/Route'
import V2G from './pages/V2G'
import Profile from './pages/Profile'
import Community from './pages/Community'
import Login from './pages/Login'
import StationDetail from './pages/StationDetail'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    {
      key: '/',
      title: '首页',
      icon: <AppOutline />
    },
    {
      key: '/charging',
      title: '充电',
      icon: <SetOutline />
    },
    {
      key: '/route',
      title: '路线',
      icon: <LocationOutline />
    },
    {
      key: '/v2g',
      title: 'V2G',
      icon: <SetOutline />
    },
    {
      key: '/profile',
      title: '我的',
      icon: <UserOutline />
    }
  ]

  const hideTabBarPages = ['/login', '/community']
  const showTabBar = !hideTabBarPages.includes(location.pathname) && !location.pathname.startsWith('/station')

  return (
    <div className="app-container">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/charging" element={<Charging />} />
          <Route path="/route" element={<RoutePage />} />
          <Route path="/v2g" element={<V2G />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/login" element={<Login />} />
          <Route path="/station/:id" element={<StationDetail />} />
        </Routes>
      </div>
      {showTabBar && (
        <div className="tab-bar-wrapper">
          <TabBar
            activeKey={location.pathname}
            onChange={(key) => navigate(key)}
          >
            {tabs.map((item) => (
              <TabBar.Item key={item.key} title={item.title} icon={item.icon} />
            ))}
          </TabBar>
        </div>
      )}
    </div>
  )
}

export default App
