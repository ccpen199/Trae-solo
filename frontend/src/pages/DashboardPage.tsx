import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, message } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { employeeApi, departmentApi } from '../services/api';

interface Stats {
  total: number;
  byStatus: { status: string; count: number }[];
  byDepartment: { departmentId: string; departmentName?: string; count: number }[];
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchDepartments();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await employeeApi.getStats();
      setStats(data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getList();
      setDepartments(data);
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  const getStatusCount = (status: string) => {
    return stats?.byStatus.find((s) => s.status === status)?.count || 0;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表板</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="员工总数"
              value={stats?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="在职员工"
              value={getStatusCount('ACTIVE')}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="部门数量"
              value={departments.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="试用员工"
              value={getStatusCount('PROBATION')}
              prefix={<MoneyCollectOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="员工状态分布" loading={loading}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {stats?.byStatus.map((item) => (
                <div key={item.status} style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                    {getStatusLabel(item.status)}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{item.count}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="部门员工分布" loading={loading}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats?.byDepartment?.map((item) => (
                <div key={item.departmentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.departmentName || '未分配部门'}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.count} 人</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: '在职',
    RESIGNED: '辞职',
    RETIRED: '退休',
    DISMISSED: '开除',
    ON_LEAVE: '休假',
    PROBATION: '试用',
  };
  return labels[status] || status;
}

export default DashboardPage;
