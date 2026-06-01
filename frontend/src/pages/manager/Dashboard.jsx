import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, DatePicker } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { RangePicker } = DatePicker;

function Dashboard({ user }) {
  const [stats, setStats] = useState({});
  const [byArea, setByArea] = useState([]);
  const [byUser, setByUser] = useState([]);
  const [byAbnormal, setByAbnormal] = useState([]);
  const [byWorkorder, setByWorkorder] = useState([]);
  const [dailyPatrols, setDailyPatrols] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [overview, area, user, abnormal, workorder, daily] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/stats/by-area'),
        api.get('/stats/by-user'),
        api.get('/stats/by-abnormal-type'),
        api.get('/stats/by-workorder-type'),
        api.get('/stats/daily-patrols')
      ]);
      setStats(overview.data);
      setByArea(area.data);
      setByUser(user.data.filter(u => u.total_patrols > 0).slice(0, 10));
      setByAbnormal(abnormal.data);
      setByWorkorder(workorder.data);
      setDailyPatrols(daily.data.reverse());
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const userColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role) => {
      const roleMap = { manager: '项目经理', patrol: '巡更员', repair: '维修员', customer_service: '客服' };
      return roleMap[role] || role;
    }},
    { title: '巡更次数', dataIndex: 'total_patrols', key: 'total_patrols' },
    { title: '漏巡/迟巡', dataIndex: 'missed_patrols', key: 'missed', 
      render: (text, record) => `${record.missed_patrols + record.late_patrols}` },
    { title: '漏巡率', dataIndex: 'miss_rate', key: 'miss_rate', render: (rate) => `${rate}%` }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>数据看板</h2>
        <RangePicker 
          defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
          onChange={fetchStats}
        />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4.8}>
          <Card>
            <Statistic
              title="总巡更次数"
              value={stats.total_patrols || 0}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card>
            <Statistic
              title="漏巡次数"
              value={stats.missed_patrols || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card>
            <Statistic
              title="迟巡次数"
              value={stats.late_patrols || 0}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card>
            <Statistic
              title="异常数量"
              value={stats.abnormal_results || 0}
              prefix={<WarningOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card>
            <Statistic
              title="待处理工单"
              value={stats.pending_work_orders || 0}
              prefix={<ToolOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="巡更趋势">
            <BarChart width={500} height={300} data={dailyPatrols}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="normal" name="正常" fill="#52c41a" />
              <Bar dataKey="late" name="迟巡" fill="#fa8c16" />
              <Bar dataKey="missed" name="漏巡" fill="#ff4d4f" />
            </BarChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="工单类型分布">
            <PieChart width={500} height={300}>
              <Pie
                data={byWorkorder}
                cx={250}
                cy={150}
                dataKey="count"
                nameKey="type"
                outerRadius={100}
                label={({ type, count }) => {
                  const typeMap = { repair: '维修', cleaning: '保洁', security: '安保' };
                  return `${typeMap[type] || type}: ${count}`;
                }}
              >
                {byWorkorder.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="异常类型Top10">
            <BarChart width={500} height={300} data={byAbnormal} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="check_item" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#1890ff" />
            </BarChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="人员巡更统计">
            <Table
              columns={userColumns}
              dataSource={byUser}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="按区域统计">
        <Table
          columns={[
            { title: '区域', dataIndex: 'area', key: 'area' },
            { title: '总巡更次数', dataIndex: 'total_patrols', key: 'total_patrols' },
            { title: '漏巡', dataIndex: 'missed_patrols', key: 'missed' },
            { title: '迟巡', dataIndex: 'late_patrols', key: 'late' },
            { title: '异常数', dataIndex: 'abnormal_count', key: 'abnormal' },
            { title: '漏迟巡率', dataIndex: 'miss_rate', key: 'rate', render: (rate) => `${rate}%` }
          ]}
          dataSource={byArea}
          rowKey="area"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default Dashboard;
