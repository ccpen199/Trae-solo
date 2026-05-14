import { Layout, Menu, Dropdown, Button, Avatar } from 'antd'
import { 
  DashboardOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  ToolOutlined,
  LogoutOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/user'

const { Header, Sider, Content } = Layout

const AdminLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, adminLogout } = useUserStore()

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '数据概览',
      onClick: () => navigate('/admin')
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      onClick: () => navigate('/admin/users')
    },
    {
      key: '/admin/rentals',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      onClick: () => navigate('/admin/rentals')
    },
    {
      key: '/admin/appliances',
      icon: <ToolOutlined />,
      label: '商品管理',
      onClick: () => navigate('/admin/appliances')
    }
  ]

  const getSelectedKey = () => {
    if (location.pathname === '/admin') return '/admin'
    if (location.pathname.startsWith('/admin/users')) return '/admin/users'
    if (location.pathname.startsWith('/admin/rentals')) return '/admin/rentals'
    if (location.pathname.startsWith('/admin/appliances')) return '/admin/appliances'
    return '/admin'
  }

  const dropdownItems = [
    {
      key: 'back',
      icon: <ArrowLeftOutlined />,
      label: '返回前台',
      onClick: () => navigate('/')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        adminLogout()
        navigate('/admin/login')
      }
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#001529' }}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🛠️ 管理后台
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>家电租借平台管理系统</span>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>{admin?.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff', minHeight: 360 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
