import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { FileTextOutlined, MessageOutlined } from '@ant-design/icons';
import { dashboardAPI } from '../../utils/api';

const { Title } = Typography;

function LawyerDashboard({ user }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>律师工作台 - {user?.name}</Title>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="我的案件"
              value={stats.my_cases || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="待处理咨询"
              value={stats.pending_consultations || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default LawyerDashboard;
