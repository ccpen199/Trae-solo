import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { message } from '@/utils/message';
import {
  TeamOutlined,
  ApartmentOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { userApi, roleApi, moduleApi, organizationApi, storeApi } from '@/services/api';

const Dashboard: React.FC = () => {
  const { user } = useUserStore();
  const [stats, setStats] = useState({
    userCount: 0,
    organizationCount: 0,
    storeCount: 0,
    roleCount: 0,
  });
  const [initializing, setInitializing] = useState(false);

  const loadStats = async () => {
    try {
      const [usersRes, orgsRes, storesRes, rolesRes] = await Promise.all([
        userApi.getList(),
        organizationApi.getList(),
        storeApi.getList(),
        roleApi.getList(),
      ]);
      setStats({
        userCount: (usersRes.data || usersRes)?.length || 0,
        organizationCount: (orgsRes.data || orgsRes)?.length || 0,
        storeCount: (storesRes.data || storesRes)?.length || 0,
        roleCount: (rolesRes.data || rolesRes)?.length || 0,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleInitData = async () => {
    setInitializing(true);
    try {
      await Promise.all([
        userApi.initAdmin(),
        roleApi.initDefaults(),
        moduleApi.initDefaults(),
      ]);
      message.success('初始化数据成功');
      loadStats();
    } catch (error: any) {
      message.error(error.message || '初始化数据失败');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>欢迎，{user?.name || '用户'}</h2>
        <p style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
          这是系统管理平台的首页，您可以在这里查看系统概览和快速操作。
        </p>
      </div>

      <Card title="快速操作" style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={handleInitData}
            loading={initializing}
          >
            初始化系统数据
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="人员数量"
              value={stats.userCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="组织数量"
              value={stats.organizationCount}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="门店数量"
              value={stats.storeCount}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="角色数量"
              value={stats.roleCount}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="系统信息" style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={12}>
            <p><strong>当前用户：</strong>{user?.name || '-'}</p>
            <p><strong>用户名：</strong>{user?.username || '-'}</p>
            <p><strong>人员编号：</strong>{user?.code || '-'}</p>
          </Col>
          <Col span={12}>
            <p><strong>后端端口：</strong>22610</p>
            <p><strong>前端端口：</strong>22611</p>
            <p><strong>技术栈：</strong>NestJS + React + Ant Design + PostgreSQL</p>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
