import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Statistic, Spin, message, Tag } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { analytics, interviews } from '../api';

function Dashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todayInterviews, setTodayInterviews] = useState([]);
  const [channelROI, setChannelROI] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [hotJobs, setHotJobs] = useState([]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, interviewsRes, funnelRes, roiRes, jobsRes] = await Promise.all([
        analytics.getDashboard(),
        interviews.getList({ date_from: dayjs().format('YYYY-MM-DD'), date_to: dayjs().format('YYYY-MM-DD') }),
        analytics.getFunnel(),
        analytics.getChannelROI(),
        analytics.getJobPerformance({ pageSize: 5 }),
      ]);

      if (dashboardRes.code === 0) {
        setStats(dashboardRes.data.stats);
      }
      if (interviewsRes.code === 0) {
        setTodayInterviews(interviewsRes.data.list || []);
      }
      if (funnelRes.code === 0) {
        setFunnelData(funnelRes.data.funnel || []);
      }
      if (roiRes.code === 0) {
        setChannelROI(roiRes.data.channelSummary || []);
      }
      if (jobsRes.code === 0) {
        setHotJobs(jobsRes.data.list || []);
      }
    } catch (err) {
      message.error('加载数据失败');
      console.error('加载仪表盘数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '岗位总数',
      value: stats?.published_jobs || 0,
      icon: <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: '投递总数',
      value: stats?.total_applications || 0,
      icon: <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '面试总数',
      value: stats?.interview_count || 0,
      icon: <CalendarOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '入职总数',
      value: stats?.hired_count || 0,
      icon: <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      color: '#722ed1',
    },
  ];

  const interviewColumns = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '面试岗位',
      dataIndex: 'title',
      key: 'title',
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '时间',
      dataIndex: 'schedule_time',
      key: 'schedule_time',
      render: (text) => dayjs(text).format('HH:mm'),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          scheduled: { color: 'blue', text: '待开始' },
          in_progress: { color: 'orange', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
  ];

  const hotJobColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => {
        const colors = ['#f5222d', '#fa8c16', '#faad14', '#d9d9d9', '#d9d9d9'];
        return (
          <span style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            lineHeight: '24px',
            textAlign: 'center',
            borderRadius: '50%',
            background: colors[index] || '#d9d9d9',
            color: index < 3 ? '#fff' : '#666',
            fontWeight: 'bold',
            fontSize: '12px',
          }}>
            {index + 1}
          </span>
        );
      },
    },
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '投递数',
      dataIndex: 'application_count',
      key: 'application_count',
      width: 80,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '面试率',
      dataIndex: 'interview_rate',
      key: 'interview_rate',
      width: 80,
      render: (rate) => `${rate || 0}%`,
      responsive: ['md', 'lg', 'xl'],
    },
  ];

  const getChannelROIOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: channelROI.map((c) => c.channel_name || c.channel),
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '入职人数',
    },
    series: [
      {
        name: '投递数',
        type: 'bar',
        data: channelROI.map((c) => c.total_applications || 0),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '面试数',
        type: 'bar',
        data: channelROI.map((c) => c.total_interviews || 0),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '入职数',
        type: 'bar',
        data: channelROI.map((c) => c.total_hires || 0),
        itemStyle: { color: '#722ed1' },
      },
    ],
    legend: {
      data: ['投递数', '面试数', '入职数'],
      bottom: 0,
    },
  });

  const getFunnelOption = () => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        name: '招聘漏斗',
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: Math.max(...funnelData.map((f) => f.count), 1),
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          fontSize: 12,
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: funnelData.map((f, index) => ({
          value: f.count,
          name: f.label,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'][index],
          },
        })),
      },
    ],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic title={card.title} value={card.value} />
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="今日面试安排" extra={<Tag color="blue">{todayInterviews.length} 场</Tag>}>
            <Table
              dataSource={todayInterviews}
              columns={interviewColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 400 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="渠道ROI分析">
            <ReactECharts option={getChannelROIOption()} style={{ height: '350px' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="招聘转化漏斗">
            <ReactECharts option={getFunnelOption()} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="热门岗位排名">
            <Table
              dataSource={hotJobs}
              columns={hotJobColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
