import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Row, Col, Progress, Space } from 'antd';

export default function Statistics() {
  const [infectionRates, setInfectionRates] = useState([]);
  const [casesByDept, setCasesByDept] = useState([]);
  const [falsePositive, setFalsePositive] = useState(null);
  const [pathogens, setPathogens] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  useEffect(() => {
    fetch('/api/stats/infection-rate')
      .then(res => res.json())
      .then(data => setInfectionRates(data));

    fetch('/api/stats/cases-by-department')
      .then(res => res.json())
      .then(data => setCasesByDept(data));

    fetch('/api/stats/false-positive-rate')
      .then(res => res.json())
      .then(data => setFalsePositive(data));

    fetch('/api/stats/pathogens')
      .then(res => res.json())
      .then(data => setPathogens(data));

    fetch('/api/stats/tasks-overdue')
      .then(res => res.json())
      .then(data => setOverdueTasks(data));
  }, []);

  const rateColumns = [
    { title: '科室', dataIndex: 'name', key: 'name' },
    { title: '床位数', dataIndex: 'bed_count', key: 'bed_count' },
    { title: '感染病例数', dataIndex: 'confirmed_count', key: 'confirmed_count' },
    {
      title: '感染率(%)',
      dataIndex: 'infection_rate',
      key: 'infection_rate',
      render: (rate) => (
        <Space>
          <span>{rate || 0}</span>
          <Progress percent={rate || 0} size="small" style={{ width: 100 }} />
        </Space>
      ),
    },
  ];

  const casesColumns = [
    { title: '科室', dataIndex: 'name', key: 'name' },
    { title: '待确认', dataIndex: 'pending', key: 'pending' },
    { title: '已确认', dataIndex: 'confirmed', key: 'confirmed' },
    { title: '已排除', dataIndex: 'rejected', key: 'rejected' },
    { title: '总计', dataIndex: 'total', key: 'total' },
  ];

  const pathogenColumns = [
    { title: '病原体', dataIndex: 'pathogen', key: 'pathogen' },
    { title: '病例数', dataIndex: 'count', key: 'count' },
  ];

  const overdueColumns = [
    { title: '科室', dataIndex: 'name', key: 'name' },
    { title: '超期任务', dataIndex: 'overdue', key: 'overdue' },
    { title: '进行中任务', dataIndex: 'total', key: 'total' },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>统计报表</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="已处理病例总数"
              value={falsePositive?.total_cases || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="确认感染"
              value={falsePositive?.confirmed || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="误报率"
              value={falsePositive?.false_positive_rate || 0}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="各科室感染率" style={{ marginBottom: 16 }}>
        <Table columns={rateColumns} dataSource={infectionRates} rowKey="id" pagination={false} />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="病例按科室分布" style={{ marginBottom: 16 }}>
            <Table columns={casesColumns} dataSource={casesByDept} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="病原体分布" style={{ marginBottom: 16 }}>
            <Table columns={pathogenColumns} dataSource={pathogens} rowKey="pathogen" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Card title="超期整改任务">
        {overdueTasks.length > 0 ? (
          <Table columns={overdueColumns} dataSource={overdueTasks} rowKey="id" pagination={false} />
        ) : (
          <p style={{ textAlign: 'center', color: '#999' }}>暂无超期任务</p>
        )}
      </Card>
    </div>
  );
}
