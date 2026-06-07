import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Descriptions, Tag, Spin, message } from 'antd';
import { ProjectOutlined, BuildOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function DeveloperDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, projRes] = await Promise.all([
        api.get('/developer/dashboard'),
        api.get('/developer/projects')
      ]);
      setDashboardData(dashRes.data);
      setProjects(projRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const projectColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '项目地址', dataIndex: 'project_address', key: 'project_address' },
    { title: '预售许可证', dataIndex: 'permit_no', key: 'permit_no' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = {
        on_sale: { color: 'green', text: '在售' },
        filed: { color: 'blue', text: '已备案' },
        completed: { color: 'default', text: '已完工' },
        pending: { color: 'orange', text: '待审核' }
      };
      const info = map[s] || { color: 'default', text: s };
      return <Tag color={info.color}>{info.text}</Tag>;
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <h2>开发商项目管理</h2>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={8}>
          <Card><Statistic title="项目总数" value={dashboardData?.total_projects || 0} prefix={<ProjectOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="在售项目" value={dashboardData?.on_sale_projects || 0} prefix={<BuildOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="已备案项目" value={dashboardData?.filed_projects || 0} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="开发商信息" style={{ marginTop: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="开发商名称">{dashboardData?.developer_name}</Descriptions.Item>
          <Descriptions.Item label="统一信用代码">{dashboardData?.developer_credit_code}</Descriptions.Item>
          <Descriptions.Item label="联系人">{dashboardData?.contact_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{dashboardData?.contact_phone}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="项目列表" style={{ marginTop: 24 }}>
        <Table
          columns={projectColumns}
          dataSource={projects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无项目数据' }}
        />
      </Card>
    </div>
  );
}
