import { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import {
  AuditOutlined,
  ShopOutlined,
  CarryOutOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';
import WelcomeHeader from './components/WelcomeHeader';
import OverviewCards from './components/OverviewCards';
import RegulatorWorkspace from './components/RegulatorWorkspace';
import VenueWorkspace from './components/VenueWorkspace';
import InspectorWorkspace from './components/InspectorWorkspace';
import QuickEntries from './components/QuickEntries';
import './index.css';

const roleToTabKey: Record<string, string> = {
  '超级管理员': 'regulator',
  '系统管理员': 'regulator',
  '审核员': 'regulator',
  '数据分析员': 'regulator',
  '巡检员': 'inspector',
};

const Dashboard: React.FC = () => {
  const { userInfo } = useUserStore();

  const defaultTab = useMemo(() => {
    return roleToTabKey[userInfo?.role || ''] || 'regulator';
  }, [userInfo?.role]);

  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabItems = [
    {
      key: 'regulator',
      label: (
        <span className="flex items-center gap-1.5">
          <AuditOutlined />
          监管端工作台
        </span>
      ),
      children: <RegulatorWorkspace />,
    },
    {
      key: 'venue',
      label: (
        <span className="flex items-center gap-1.5">
          <ShopOutlined />
          场所端工作台
        </span>
      ),
      children: <VenueWorkspace />,
    },
    {
      key: 'inspector',
      label: (
        <span className="flex items-center gap-1.5">
          <CarryOutOutlined />
          巡检员工作台
        </span>
      ),
      children: <InspectorWorkspace />,
    },
  ];

  return (
    <div className="workspace-dashboard">
      <WelcomeHeader />

      <div className="mb-6">
        <OverviewCards />
      </div>

      <div className="workspace-tabs-wrapper">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          className="workspace-tabs"
        />
      </div>

      <QuickEntries />
    </div>
  );
};

export default Dashboard;
