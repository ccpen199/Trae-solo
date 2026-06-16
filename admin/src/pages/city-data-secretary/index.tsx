import React, { useMemo } from 'react'
import { Typography, Tabs } from 'antd'
import {
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useUserStore } from '@/store/user'
import DataAssetsOverview from './components/DataAssetsOverview'
import UserProfileManagement from './components/UserProfileManagement'
import RecommendationEngineConfig from './components/RecommendationEngineConfig'
import RecommendationEffectAnalysis from './components/RecommendationEffectAnalysis'

const { Title } = Typography

const CityDataSecretary: React.FC = () => {
  const { userInfo } = useUserStore()
  const currentRole = useMemo(() => {
    const roles = userInfo?.roles || []
    if (roles.includes('超级管理员')) return 'admin'
    if (roles.includes('委办局管理员')) return 'dept_admin'
    if (roles.includes('审计员')) return 'auditor'
    return 'default'
  }, [userInfo?.roles])
  const isAdminRole = currentRole === 'admin' || currentRole === 'dept_admin' || currentRole === 'auditor'

  const tabItems = isAdminRole ? [
    { key: 'assets', label: (<span><DatabaseOutlined />数据资产概览</span>), children: <DataAssetsOverview /> },
    { key: 'profile', label: (<span><UserOutlined />用户画像管理</span>), children: <UserProfileManagement /> },
    { key: 'engine', label: (<span><SettingOutlined />推荐引擎配置</span>), children: <RecommendationEngineConfig /> },
    { key: 'analysis', label: (<span><BarChartOutlined />推荐效果分析</span>), children: <RecommendationEffectAnalysis /> }
  ] : [
    { key: 'my-assets', label: (<span><DatabaseOutlined />我的数据资产</span>), children: <DataAssetsOverview userView="default" /> },
    { key: 'my-auth', label: (<span><SettingOutlined />我的授权管理</span>), children: <DataAssetsOverview userView="auth" /> },
    { key: 'my-recommend', label: (<span><BarChartOutlined />服务推荐</span>), children: <DataAssetsOverview userView="recommend" /> },
    { key: 'my-trace', label: (<span><UserOutlined />数据足迹</span>), children: <DataAssetsOverview userView="trace" /> }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {isAdminRole ? '城市数据秘书管理' : '我的数据秘书'}
        </Title>
        <span style={{ color: '#999', fontSize: 13 }}>
          {isAdminRole ? '个人数据资产看板 · 服务推荐引擎管理后台' : '个人数据资产授权 · 智能服务推荐 · 数据共享追溯'}
        </span>
      </div>
      <div style={{ background: '#fff', padding: '0 16px', borderRadius: 8 }}>
        <Tabs
          defaultActiveKey={isAdminRole ? 'assets' : 'my-assets'}
          items={tabItems}
          size="large"
        />
      </div>
    </div>
  )
}

export default CityDataSecretary
