import React from 'react'
import { Typography, Tabs } from 'antd'
import {
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import DataAssetsOverview from './components/DataAssetsOverview'
import UserProfileManagement from './components/UserProfileManagement'
import RecommendationEngineConfig from './components/RecommendationEngineConfig'
import RecommendationEffectAnalysis from './components/RecommendationEffectAnalysis'

const { Title } = Typography

const CityDataSecretary: React.FC = () => {
  const tabItems = [
    {
      key: 'assets',
      label: (
        <span>
          <DatabaseOutlined />
          数据资产概览
        </span>
      ),
      children: <DataAssetsOverview />
    },
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          用户画像管理
        </span>
      ),
      children: <UserProfileManagement />
    },
    {
      key: 'engine',
      label: (
        <span>
          <SettingOutlined />
          推荐引擎配置
        </span>
      ),
      children: <RecommendationEngineConfig />
    },
    {
      key: 'analysis',
      label: (
        <span>
          <BarChartOutlined />
          推荐效果分析
        </span>
      ),
      children: <RecommendationEffectAnalysis />
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          城市数据秘书管理
        </Title>
        <span style={{ color: '#999', fontSize: 13 }}>
          个人数据资产看板 · 服务推荐引擎管理后台
        </span>
      </div>
      <div style={{ background: '#fff', padding: '0 16px', borderRadius: 8 }}>
        <Tabs
          defaultActiveKey="assets"
          items={tabItems}
          size="large"
        />
      </div>
    </div>
  )
}

export default CityDataSecretary
