import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Space } from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/stats/overview')
      .then(res => res.json())
      .then(data => setOverview(data));

    fetch('/api/cases?status=pending')
      .then(res => res.json())
      .then(data => setRecentCases(data.slice(0, 5)));

    fetch('/api/alerts?status=pending')
      .then(res => res.json())
      .then(data => setRecentAlerts(data.slice(0, 5)));
  }, []);

  const statusColors = {
    pending: 'orange',
    confirmed: 'green',
    rejected: 'red',
    handled: 'blue',
  };

  const statusText = {
    pending: '待处理',
    confirmed: '已确认',
    rejected: '已排除',
    handled: '已处理',
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>首页概览</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="待确认病例"
              value={overview?.pendingCases || 0}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="已确认感染"
              value={overview?.confirmedCases || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="待处理预警"
              value={overview?.pendingAlerts || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="进行中任务"
              value={overview?.pendingTasks || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="超期任务"
              value={overview?.overdueTasks || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title="待确认病例"
            extra={<a onClick={() => navigate('/cases')}>查看全部</a>}
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={recentCases}
              renderItem={(item) => (
                <List.Item onClick={() => navigate(`/cases/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={item.patient_name}
                    description={
                      <Space>
                        <span>{item.mrn}</span>
                        <span>{item.department_name}</span>
                        <span>{item.bed_no}</span>
                      </Space>
                    }
                  />
                  <Tag color={statusColors[item.status]}>{statusText[item.status]}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="待处理暴发预警"
            extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={recentAlerts}
              renderItem={(item) => (
                <List.Item onClick={() => navigate(`/alerts/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={item.alert_code}
                    description={
                      <Space>
                        <span>{item.department_name}</span>
                        <span>{item.pathogen || '多病原体'}</span>
                        <span>{item.case_count} 例</span>
                      </Space>
                    }
                  />
                  <Tag color={statusColors[item.status]}>{statusText[item.status]}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
