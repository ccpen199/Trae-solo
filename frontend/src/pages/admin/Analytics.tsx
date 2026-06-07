import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Statistic } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { ClockCircleOutlined, CloseCircleOutlined, RiseOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const mockSkillTrendData = [
  { month: '1月', Java: 320, Python: 280, JavaScript: 256, React: 220, Vue: 200 },
  { month: '2月', Java: 310, Python: 290, JavaScript: 260, React: 230, Vue: 210 },
  { month: '3月', Java: 330, Python: 300, JavaScript: 270, React: 240, Vue: 195 },
  { month: '4月', Java: 340, Python: 310, JavaScript: 265, React: 250, Vue: 190 },
  { month: '5月', Java: 335, Python: 320, JavaScript: 275, React: 260, Vue: 185 },
  { month: '6月', Java: 345, Python: 330, JavaScript: 280, React: 270, Vue: 180 },
];

const SKILL_LINE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminAnalytics() {
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [skillTrends, setSkillTrends] = useState<any[]>([]);
  const [hrEfficiency, setHrEfficiency] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadSummary();
    loadTopJobs();
    loadSalaryData();
    loadSkillTrends();
    loadHrEfficiency();
  }, []);

  const loadSummary = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/dashboard/summary');
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadTopJobs = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/jobs/top');
      setTopJobs((data || []).slice(0, 10));
    } catch (error) {
      console.error('Failed to load top jobs:', error);
      setTopJobs([
        { title: 'Java开发工程师', count: 156 },
        { title: '前端开发工程师', count: 134 },
        { title: '销售专员', count: 120 },
        { title: '客服专员', count: 98 },
        { title: '普工', count: 87 }
      ]);
    }
  };

  const loadSalaryData = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/salary/median');
      setSalaryData((data || []).slice(0, 10));
    } catch (error) {
      console.error('Failed to load salary data:', error);
      setSalaryData([
        { city: '北京', avg_min: 15, avg_max: 25, job_count: 520 },
        { city: '上海', avg_min: 14, avg_max: 24, job_count: 480 },
        { city: '深圳', avg_min: 13, avg_max: 23, job_count: 420 },
        { city: '杭州', avg_min: 12, avg_max: 20, job_count: 350 },
        { city: '广州', avg_min: 11, avg_max: 19, job_count: 380 }
      ]);
    }
  };

  const loadSkillTrends = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/skills/trends');
      setSkillTrends((data || []).slice(0, 8));
    } catch (error) {
      console.error('Failed to load skill trends:', error);
      setSkillTrends([
        { skill: 'Java', count: 320 },
        { skill: 'Python', count: 280 },
        { skill: 'JavaScript', count: 256 },
        { skill: 'React', count: 220 },
        { skill: 'Vue', count: 200 },
        { skill: '电工', count: 180 },
        { skill: '销售', count: 165 },
        { skill: '客服', count: 150 }
      ]);
    }
  };

  const loadHrEfficiency = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/hr/efficiency');
      setHrEfficiency(data || []);
    } catch (error) {
      console.error('Failed to load HR efficiency:', error);
    }
  };

  const columns = [
    { title: 'HR', dataIndex: 'hr_name', key: 'hr_name' },
    { title: '公司', dataIndex: 'company_name', key: 'company_name' },
    { title: '发布职位数', dataIndex: 'job_count', key: 'job_count' },
    { title: '收到简历数', dataIndex: 'application_count', key: 'application_count' },
    {
      title: '录用率',
      dataIndex: 'hire_rate',
      key: 'hire_rate',
      render: (rate: number) => `${((rate || 0) * 100).toFixed(1)}%`
    },
    {
      title: '平均回复时长',
      dataIndex: 'avg_reply_time',
      key: 'avg_reply_time',
      render: (val: number) => val ? `${val}天` : '-'
    },
    {
      title: '岗位关闭周期',
      dataIndex: 'job_close_cycle',
      key: 'job_close_cycle',
      render: (val: number) => val ? `${val}天` : '-'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>行业人才供需看板</h2>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均回复时长"
              value={summary?.avgReplyTime || '-'}
              suffix="天"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="岗位关闭周期"
              value={summary?.avgJobCloseCycle || '-'}
              suffix="天"
              prefix={<CloseCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="录用转化率"
              value={summary?.hireConversionRate || 0}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="热门职位TOP10">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topJobs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="技能需求分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillTrends}
                  dataKey="count"
                  nameKey="skill"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {skillTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="技能需求变迁趋势">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={mockSkillTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {['Java', 'Python', 'JavaScript', 'React', 'Vue'].map((skill, index) => (
                  <Line
                    key={skill}
                    type="monotone"
                    dataKey={skill}
                    stroke={SKILL_LINE_COLORS[index]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="各城市薪资中位数对比">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_min" name="薪资下限(K)" fill="#1890ff" />
                <Bar dataKey="avg_max" name="薪资上限(K)" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="企业服务效能仪表盘">
        <Table
          columns={columns}
          dataSource={hrEfficiency}
          rowKey="hr_name"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
