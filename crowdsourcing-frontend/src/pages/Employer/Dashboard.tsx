import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, List, Tag, Space, Empty, Spin } from 'antd';
import {
  DashboardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { Task } from '@/types';
import { taskApi, analyticsApi } from '@/api';
import dayjs from 'dayjs';

const formatCurrency = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    inProgress: 0,
    pendingReview: 0,
    completed: 0,
    totalExpense: 0,
    thisMonthExpense: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myStats, tasksResult, categoryStats, revenueTrend] = await Promise.all([
        analyticsApi.getMyStats(),
        taskApi.getMyTasks({ page: 1, pageSize: 5 }),
        analyticsApi.getCategoryStats(),
        analyticsApi.getRevenueTrend(30)
      ]);
      
      setStats({
        inProgress: myStats.inProgress || 0,
        pendingReview: myStats.pendingReview || 0,
        completed: myStats.completed || 0,
        totalExpense: myStats.totalAmount || 0,
        thisMonthExpense: myStats.thisMonthEarnings || 0
      });
      setRecentTasks(tasksResult.list || []);
      setStatusData(categoryStats || []);
      setTrendData(revenueTrend || []);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusPieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: statusData.map(item => ({
          value: item.taskCount,
          name: item.categoryName,
          itemStyle: {
            color: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'][statusData.indexOf(item) % 6]
          }
        }))
      }
    ]
  };

  const trendLineOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>支出: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map(item => dayjs(item.date).format('MM-DD'))
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '支出',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#1E40AF',
          width: 2
        },
        itemStyle: {
          color: '#1E40AF'
        },
        data: trendData.map(item => item.amount)
      }
    ]
  };

  const quickActions = [
    { icon: <PlusOutlined />, title: '发布任务', onClick: () => navigate('/employer/tasks/publish') },
    { icon: <DashboardOutlined />, title: '查看任务', onClick: () => navigate('/employer/tasks') },
    { icon: <ClockCircleOutlined />, title: '待评审', onClick: () => navigate('/employer/tasks?status=submitted') },
    { icon: <DollarOutlined />, title: '财务中心', onClick: () => navigate('/employer/finance') }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">工作台</h2>
          <p className="text-gray-500 mt-1">欢迎回来，查看您的任务进度</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employer/tasks/publish')}>
          发布新任务
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover">
            <Statistic
              title="进行中任务"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1E40AF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover">
            <Statistic
              title="待评审"
              value={stats.pendingReview}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#FAAD14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover">
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover">
            <Statistic
              title="总支出"
              value={stats.totalExpense}
              prefix="¥"
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#722ED1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="任务分类分布" className="card-hover">
            {statusData.length > 0 ? (
              <ReactECharts option={statusPieOption} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" style={{ height: 280 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近30天支出趋势" className="card-hover">
            {trendData.length > 0 ? (
              <ReactECharts option={trendLineOption} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" style={{ height: 280 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="快捷入口" 
            className="card-hover"
            extra={<Button type="link" onClick={() => navigate('/employer/tasks')}>查看全部 <RightOutlined /></Button>}
          >
            <Row gutter={[12, 12]}>
              {quickActions.map((action, index) => (
                <Col span={12} key={index}>
                  <Card 
                    hoverable
                    className="text-center cursor-pointer !bg-gray-50 !border-0"
                    onClick={action.onClick}
                  >
                    <div className="text-3xl text-primary-700 mb-2">{action.icon}</div>
                    <div className="font-medium text-gray-800">{action.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="最新任务" 
            className="card-hover"
            extra={<Button type="link" onClick={() => navigate('/employer/tasks')}>查看全部 <RightOutlined /></Button>}
          >
            {recentTasks.length > 0 ? (
              <List
                dataSource={recentTasks}
                renderItem={(task) => (
                  <List.Item 
                    key={task.id}
                    className="cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                    onClick={() => navigate(`/employer/tasks/${task.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate max-w-[200px]">{task.title}</span>
                          <Tag color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'processing' : 'blue'}>
                            {task.statusName}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>¥{formatCurrency(task.budgetMin)} - ¥{formatCurrency(task.budgetMax)}</span>
                          <span>{dayjs(task.createdAt).format('MM-DD HH:mm')}</span>
                        </div>
                      }
                    />
                    <RightOutlined className="text-gray-400" />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无任务" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployerDashboard;
