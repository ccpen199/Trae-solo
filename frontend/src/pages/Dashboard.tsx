import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, message } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dormitoryData, setDormitoryData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, dormitoryRes, genderRes] = await Promise.all([
        reportApi.getOverview(),
        reportApi.getDormitoryOccupancy(),
        reportApi.getGenderDistribution(),
      ]);

      setStats(overviewRes.data.data);
      setDormitoryData(dormitoryRes.data.data);
      setGenderData(genderRes.data.data.map((item: any) => ({
        name: item.gender === 'male' ? '男' : item.gender === 'female' ? '女' : '其他',
        value: item.count,
      })));
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '晚上好';
    if (hour >= 6 && hour < 12) greeting = '早上好';
    else if (hour >= 12 && hour < 18) greeting = '下午好';

    const roleMap: Record<string, string> = {
      admin: '系统管理员',
      dormitory_admin: '宿舍管理员',
      student: '同学',
    };

    return `${greeting}，${user?.name}${roleMap[user?.role || '']}！`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>{getRoleGreeting()}</h2>
        <p style={{ color: '#666' }}>欢迎使用学生宿舍管理系统</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="宿舍楼数量"
              value={stats?.dormitories?.total_dormitories || 0}
              prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="床位总数"
              value={stats?.beds?.total_beds || 0}
              prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已入住床位"
              value={stats?.beds?.occupied_beds || 0}
              prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理维修"
              value={(stats?.maintenance?.pending_tickets || 0) + (stats?.maintenance?.processing_tickets || 0)}
              prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="各楼栋入住情况" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dormitoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="building_code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupied_beds" name="已入住" fill="#1677ff" />
                <Bar dataKey="available_beds" name="空床位" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="学生性别分布" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="房间统计" bordered={false}>
            <Statistic
              title="可用房间"
              value={stats?.rooms?.available_rooms || 0}
              suffix={`/ ${stats?.rooms?.total_rooms || 0}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Statistic
              title="已占用房间"
              value={stats?.rooms?.occupied_rooms || 0}
              suffix={`/ ${stats?.rooms?.total_rooms || 0}`}
              valueStyle={{ color: '#faad14' }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="学生统计" bordered={false}>
            <Statistic
              title="已入住学生"
              value={stats?.students?.checked_in_students || 0}
              suffix={`/ ${stats?.students?.total_students || 0}`}
              valueStyle={{ color: '#1677ff' }}
            />
            <Statistic
              title="未入住学生"
              value={stats?.students?.not_checked_in_students || 0}
              suffix={`/ ${stats?.students?.total_students || 0}`}
              valueStyle={{ color: '#999' }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="维修统计" bordered={false}>
            <Statistic
              title="待处理维修"
              value={(stats?.maintenance?.pending_tickets || 0) + (stats?.maintenance?.processing_tickets || 0)}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Statistic
              title="已完成维修"
              value={stats?.maintenance?.completed_tickets || 0}
              valueStyle={{ color: '#52c41a' }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;