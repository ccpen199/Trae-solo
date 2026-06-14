import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  HeartOutlined,
  SafetyOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import Header from './Header'
import Footer from './Footer'
import { MENU_ITEMS } from '@/utils/constants'

const { Sider, Content } = Layout

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  HeartOutlined: <HeartOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  WarningOutlined: <WarningOutlined />,
}

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = MENU_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    icon: iconMap[item.icon],
  }))

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-md"
      >
        <div className="h-16 flex items-center justify-center bg-gradient-to-r from-[#1677ff] to-[#52c41a]">
          <span className={`text-white font-bold transition-all ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? '健康' : '健康保障'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="h-full border-r-0"
        />
      </Sider>
      <Layout>
        <Header />
        <Content className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
            <Outlet />
          </div>
        </Content>
        <Footer />
      </Layout>
    </Layout>
  )
}

export default MainLayout
