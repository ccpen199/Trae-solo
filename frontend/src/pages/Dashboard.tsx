import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import { DatabaseOutlined, FileTextOutlined, ApiOutlined, AlertOutlined } from '@ant-design/icons';
import { catalogsAPI, applicationsAPI, apiCallsAPI, qualityAPI } from '../api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    catalogs: 0,
    applications: 0,
    apiCalls: 0,
    alerts: 0
  });
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [qualityIssues, setQualityIssues] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catalogsRes, applicationsRes, callsRes, qualityRes, alertsRes] = await Promise.all([
        catalogsAPI.getAll(),
        applicationsAPI.getAll(),
        apiCallsAPI.getAll({ pageSize: 5 }),
        qualityAPI.getAll(),
        apiCallsAPI.getAlerts()
      ]);

      setStats({
        catalogs: catalogsRes.data.length,
        applications: applicationsRes.data.length,
        apiCalls: (callsRes.data as any).total,
        alerts: (alertsRes.data as any[]).filter(a => a.status === 'open').length
      });

      setRecentCalls((callsRes.data as any).data);
      setQualityIssues((qualityRes.data as any[]).filter(q => q.status !== 'normal').slice(0, 5));
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const callColumns = [
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    { title: '调用部门', dataIndex: 'caller_department_name', key: 'caller_department_name' },
    { title: '调用时间', dataIndex: 'call_time', key: 'call_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>{status === 'success' ? '成功' : '失败'}</Tag>
      )
    }
  ];

  const qualityColumns = [
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    { title: '缺失率', dataIndex: 'missing_rate', key: 'missing_rate', render: (v: number) => `${(v * 100).toFixed(2)}%` },
    { title: '失败次数', dataIndex: 'failure_count', key: 'failure_count' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { normal: 'green', warning: 'orange', processing: 'blue', issue: 'red' };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>数据概览</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据目录数"
              value={stats.catalogs}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申请数量"
              value={stats.applications}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="接口调用次数"
              value={stats.apiCalls}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={stats.alerts}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="最近接口调用">
            <Table
              columns={callColumns}
              dataSource={recentCalls}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="数据质量问题">
            <Table
              columns={qualityColumns}
              dataSource={qualityIssues}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
