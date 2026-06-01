import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Alert } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import { dashboardApi } from '../api';

function Dashboard() {
  const [stats, setStats] = useState({
    total_cases: 0,
    pending_cases: 0,
    hearing_cases: 0,
    total_claim_amount: 0,
    upcoming_hearings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await dashboardApi.stats();
        setStats(res.data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const hearingColumns = [
    { title: '案件编号', dataIndex: 'case_number', key: 'case_number' },
    { title: '当事人', dataIndex: 'client_name', key: 'client_name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => t === 'hearing' ? '开庭' : '调解' },
    { title: '时间', key: 'time', render: (_, r) => `${r.scheduled_date || ''} ${r.scheduled_time || ''}` },
    { title: '地点', dataIndex: 'location', key: 'location' }
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="案件总数"
              value={stats.total_cases}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={stats.pending_cases}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="审理中"
              value={stats.hearing_cases}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="涉案总金额"
              value={stats.total_claim_amount}
              prefix={<DollarCircleOutlined />}
              precision={2}
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="即将开庭" style={{ marginTop: 24 }} loading={loading}>
        <Table
          dataSource={stats.upcoming_hearings || []}
          columns={hearingColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default Dashboard;
