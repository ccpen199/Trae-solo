import React, { useState, useEffect } from 'react';
import {
  Card,
  Statistic,
  Row,
  Col,
  List,
  Tag,
  Button,
  Rate,
  Avatar,
  Progress,
  message,
  Spin,
  Empty
} from 'antd';
import {
  FolderOpenOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MoneyCollectOutlined,
  ArrowRightOutlined,
  UserOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { Task, MatchResult } from '@/types';
import { taskApi, analyticsApi, matchApi } from '@/api';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [matchedTasks, setMatchedTasks] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      const [tasksData, statsData, matchedData] = await Promise.all([
        taskApi.getMyTasks({ page: 1, pageSize: 5 }),
        analyticsApi.getMyStats(),
        matchApi.getMatchedTasks({ limit: 5 })
      ]);
      setTasks(tasksData.list || []);
      setStats(statsData);
      setMatchedTasks(matchedData || []);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN')}`;
  };

  const getEarningsTrendOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666', formatter: '¥{value}' }
      },
      series: [{
        data: [8000, 12000, 15000, 18000, 22000, 25000],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#1E40AF', width: 3 },
        itemStyle: { color: '#1E40AF' }
      }]
    };
  };

  const getTaskStatusOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 5, name: '进行中', itemStyle: { color: '#1890FF' } },
          { value: 3, name: '待提交', itemStyle: { color: '#FAAD14' } },
          { value: 12, name: '已完成', itemStyle: { color: '#52C41A' } },
          { value: 1, name: '已取消', itemStyle: { color: '#FF4D4F' } }
        ]
      }]
    };
  };

  const statusColors: Record<string, string> = {
    bidding: 'processing',
    selected: 'cyan',
    in_progress: 'processing',
    submitted: 'blue',
    reviewing: 'gold',
    revising: 'orange',
    completed: 'success',
    cancelled: 'error'
  };

  const statusNames: Record<string, string> = {
    bidding: '投标中',
    selected: '已中标',
    in_progress: '进行中',
    submitted: '已提交',
    reviewing: '评审中',
    revising: '修改中',
    completed: '已完成',
    cancelled: '已取消'
  };

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">服务商工作台</h2>
            <p className="text-gray-500">欢迎回来，查看您的工作进度和收入统计</p>
          </div>
          <div className="flex gap-3">
            <Button type="primary" onClick={() => navigate('/provider/tasks')}>
              查看全部任务
            </Button>
            <Button onClick={() => navigate('/provider/submission')}>
              提交稿件
            </Button>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card className="relative overflow-hidden">
              <Statistic
                title={<span className="text-gray-500">进行中项目</span>}
                value={stats?.inProgress || 0}
                prefix={<FolderOpenOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890FF' }}
                loading={statsLoading}
              />
              <div className="absolute right-4 top-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center opacity-50">
                <FolderOpenOutlined className="text-3xl text-blue-500" />
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="relative overflow-hidden">
              <Statistic
                title={<span className="text-gray-500">待提交</span>}
                value={stats?.pendingReview || 0}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: '#FAAD14' }}
                loading={statsLoading}
              />
              <div className="absolute right-4 top-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center opacity-50">
                <ClockCircleOutlined className="text-3xl text-orange-500" />
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="relative overflow-hidden">
              <Statistic
                title={<span className="text-gray-500">已完成</span>}
                value={stats?.completed || 0}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ color: '#52C41A' }}
                loading={statsLoading}
              />
              <div className="absolute right-4 top-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center opacity-50">
                <CheckCircleOutlined className="text-3xl text-green-500" />
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="relative overflow-hidden">
              <Statistic
                title={<span className="text-gray-500">总收入</span>}
                value={stats?.totalAmount || 0}
                prefix="¥"
                formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                valueStyle={{ color: '#1E40AF' }}
                loading={statsLoading}
              />
              <div className="absolute right-4 top-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center opacity-50">
                <MoneyCollectOutlined className="text-3xl text-blue-500" />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="收入趋势" extra={<Tag color="blue">本月收入: {formatCurrency(stats?.thisMonthEarnings || 0)}</Tag>}>
            <ReactECharts option={getEarningsTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="任务状态分布">
            <ReactECharts option={getTaskStatusOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="我的任务"
            extra={<Button type="link" onClick={() => navigate('/provider/tasks')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            {loading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : tasks.length > 0 ? (
              <List
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item
                    className="p-4 bg-gray-50 rounded-lg mb-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => navigate(`/provider/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-800">{task.title}</h4>
                          <Tag color={statusColors[task.status]}>{statusNames[task.status]}</Tag>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserOutlined /> {task.employerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MoneyCollectOutlined /> {formatCurrency(task.budgetMax)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockCircleOutlined /> {dayjs(task.deadline).format('YYYY-MM-DD')}
                          </span>
                        </div>
                      </div>
                      <Button type="text" icon={<ArrowRightOutlined />} />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无任务" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="智能匹配推荐"
            extra={<Button type="link" onClick={fetchData}>刷新</Button>}
          >
            {loading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : matchedTasks.length > 0 ? (
              <List
                dataSource={matchedTasks}
                renderItem={(item) => (
                  <List.Item
                    className="flex-col items-start p-3 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => navigate(`/provider/tasks/${(item as any).task?.id}`)}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="font-medium text-sm">{(item as any).task?.title}</span>
                      <Tag color="cyan">匹配度 {item.matchScore}%</Tag>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.matchReasons?.slice(0, 2).map((r, i) => (
                        <Tag key={i} color="blue">{r}</Tag>
                      ))}
                    </div>
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-primary-700 font-medium">
                        {formatCurrency((item as any).task?.budgetMax || 0)}
                      </span>
                      <Button type="link">立即投标</Button>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无匹配任务" />
            )}
          </Card>

          <Card title="我的评分" className="mt-6">
            <div className="text-center mb-4">
              <Rate disabled allowHalf defaultValue={4.8} style={{ fontSize: 32 }} />
              <div className="text-3xl font-bold text-yellow-500 mt-2">4.8</div>
              <div className="text-sm text-gray-500">基于 128 条评价</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm w-16 text-gray-500">5星</span>
                <Progress percent={75} strokeColor="#52C41A" />
                <span className="text-sm text-gray-500 w-12">75%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16 text-gray-500">4星</span>
                <Progress percent={20} strokeColor="#1890FF" />
                <span className="text-sm text-gray-500 w-12">20%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16 text-gray-500">3星</span>
                <Progress percent={4} strokeColor="#FAAD14" />
                <span className="text-sm text-gray-500 w-12">4%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16 text-gray-500">2星</span>
                <Progress percent={1} strokeColor="#FF7A45" />
                <span className="text-sm text-gray-500 w-12">1%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-16 text-gray-500">1星</span>
                <Progress percent={0} strokeColor="#FF4D4F" />
                <span className="text-sm text-gray-500 w-12">0%</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
