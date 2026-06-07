import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Descriptions, Tag, Spin, message } from 'antd';
import { TeamOutlined, WalletOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function UnitDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, empRes, payRes] = await Promise.all([
        api.get('/unit/dashboard'),
        api.get('/unit/employees'),
        api.get('/unit/payments')
      ]);
      setDashboardData(dashRes.data);
      setEmployees(empRes.data || []);
      setPayments(payRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const employeeColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '身份证号', dataIndex: 'id_card', key: 'id_card' },
    { title: '缴存基数', dataIndex: 'base_salary', key: 'base_salary', render: (v) => `¥${v?.toFixed(2)}` },
    { title: '月缴存额', dataIndex: 'monthly_pay', key: 'monthly_pay', render: (v) => `¥${v?.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { active: { color: 'green', text: '在缴' }, suspended: { color: 'orange', text: '停缴' }, closed: { color: 'red', text: '封存' } };
      const info = map[s] || { color: 'default', text: s };
      return <Tag color={info.color}>{info.text}</Tag>;
    }}
  ];

  const paymentColumns = [
    { title: '汇缴月份', dataIndex: 'month', key: 'month' },
    { title: '汇缴人数', dataIndex: 'employee_count', key: 'employee_count' },
    { title: '汇缴金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v?.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { paid: { color: 'green', text: '已缴纳' }, pending: { color: 'orange', text: '待缴纳' } };
      const info = map[s] || { color: 'default', text: s };
      return <Tag color={info.color}>{info.text}</Tag>;
    }}
  ];

  return (
    <div>
      <h2>单位数据看板</h2>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={6}>
          <Card><Statistic title="在缴人数" value={dashboardData?.employee_count || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月汇缴额" value={dashboardData?.monthly_total || 0} prefix={<WalletOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待办汇缴" value={dashboardData?.pending_payments || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="单位状态" value={dashboardData?.unit_status === 'active' ? '正常' : '异常'} prefix={<SafetyCertificateOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="单位信息" style={{ marginTop: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="单位名称">{dashboardData?.unit_name}</Descriptions.Item>
          <Descriptions.Item label="统一信用代码">{dashboardData?.credit_code}</Descriptions.Item>
          <Descriptions.Item label="所属中心">{dashboardData?.center_name}</Descriptions.Item>
          <Descriptions.Item label="单位状态">
            <Tag color={dashboardData?.unit_status === 'active' ? 'green' : 'red'}>
              {dashboardData?.unit_status === 'active' ? '正常' : '异常'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="职工列表" style={{ marginTop: 24 }}>
        <Table
          columns={employeeColumns}
          dataSource={employees}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无职工数据' }}
        />
      </Card>

      <Card title="汇缴记录" style={{ marginTop: 24 }}>
        <Table
          columns={paymentColumns}
          dataSource={payments}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无汇缴记录' }}
        />
      </Card>
    </div>
  );
}
