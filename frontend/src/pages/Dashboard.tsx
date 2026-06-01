import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Space } from 'antd';
import {
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../api/client';
import { getExpiringCertificates } from '../api/certificates';
import { getTodos } from '../api/todos';

interface Stats {
  products: number;
  customers: number;
  applications: number;
  certificates: number;
  pendingTodos: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    customers: 0,
    applications: 0,
    certificates: 0,
    pendingTodos: 0
  });
  const [expiringCount, setExpiringCount] = useState(0);
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, expiringRes, todosRes] = await Promise.all([
        api.get('/stats'),
        getExpiringCertificates(30),
        getTodos('PENDING')
      ]);
      setStats(statsRes.data);
      setExpiringCount(expiringRes.total);
      setTodos(todosRes.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="资质产品"
              value={stats.products}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户数量"
              value={stats.customers}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="办理中申请"
              value={stats.applications}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发证书"
              value={stats.certificates}
              prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="待办事项" extra={<Tag icon={<CalendarOutlined />} color="orange">{stats.pendingTodos}项待办</Tag>}>
            <List
              dataSource={todos}
              renderItem={(item: any) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.title}</span>
                      <Tag color={item.priority === 'HIGH' ? 'red' : 'blue'}>
                        {item.priority === 'HIGH' ? '高优先级' : '普通'}
                      </Tag>
                    </div>
                    {item.application && (
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {item.application.customer.name} - {item.application.product.name}
                      </div>
                    )}
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: '暂无待办事项' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="证书到期提醒" extra={<Tag icon={<WarningOutlined />} color="red">{expiringCount}份即将到期</Tag>}>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <WarningOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
              <p>有 {expiringCount} 份证书将在30天内到期，请及时处理</p>
              <p style={{ color: '#999', fontSize: 12 }}>包括企业资质证书和人员证书</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
