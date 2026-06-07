import { Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Card, Result, Button } from 'antd'
import {
  AuditOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useAuth } from '../../store/auth'
import Workflow from './Workflow'
import Certificate from './Certificate'
import Monitor from './Monitor'
import Stats from './Stats'

const menuItems = [
  {
    key: '/admin/workflow',
    icon: <AuditOutlined />,
    label: '审核工作台',
    component: Workflow
  },
  {
    key: '/admin/certificate',
    icon: <SafetyCertificateOutlined />,
    label: '证照签发中心',
    component: Certificate
  },
  {
    key: '/admin/monitor',
    icon: <AlertOutlined />,
    label: '异常预警看板',
    component: Monitor
  },
  {
    key: '/admin/stats',
    icon: <BarChartOutlined />,
    label: '服务效能统计',
    component: Stats
  }
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuditor } = useAuth()

  if (!isAuditor()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Result
          status="403"
          title="无权限访问"
          subTitle="抱歉，您没有访问后台管理系统的权限，请联系管理员开通。"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </div>
    )
  }

  const activeKey = location.pathname === '/admin' ? '/admin/workflow' : location.pathname

  return (
    <div className="flex gap-4">
      <Card className="w-48 flex-shrink-0" styles={{ body: { padding: '12px 0' } }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label
          }))}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </Card>
      <div className="flex-1">
        <Routes>
          {menuItems.map(item => (
            <Route
              key={item.key}
              path={item.key.replace('/admin/', '')}
              element={<item.component />}
            />
          ))}
          <Route path="" element={<Navigate to="workflow" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminLayout
