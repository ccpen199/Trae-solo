import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Empty,
} from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_cases: 0,
    today_cases: 0,
    completed_cases: 0,
    satisfaction_rate: 0,
    pending_cases: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      setStats({
        total_cases: 0,
        today_cases: 0,
        completed_cases: 0,
        satisfaction_rate: 0,
        pending_cases: 0,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2 style={{ marginBottom: 24, marginTop: 0 }}>数据看板</h2>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="总办件数"
              value={stats.total_cases}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日办件"
              value={stats.today_cases}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已办结"
              value={stats.completed_cases}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="满意度"
              value={stats.satisfaction_rate}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="系统运行状态">
            <Empty description="系统数据统计功能开发中" />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};
