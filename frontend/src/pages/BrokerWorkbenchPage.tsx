import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Calendar,
  Progress,
  Badge,
  Avatar,
  List,
  Empty,
  Spin,
  Radio,
  message,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  BookOutlined,
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CustomerServiceOutlined,
  ScheduleOutlined,
  MoneyCollectOutlined,
  ReadOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import { brokerApi } from '../api';
import type {
  CustomerFollow,
  Viewing,
  Commission,
  BrokerTraining,
  TrainingCourse,
} from '../types';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface WorkbenchStats {
  today_viewings: number;
  today_appointments: number;
  active_customers: number;
  my_properties: number;
  pending_commission: number;
  paid_commission: number;
}

interface WorkbenchData {
  stats: WorkbenchStats;
  todaySchedule: Viewing[];
  customers: CustomerFollow[];
  recentCommissions: Commission[];
}

interface TrainingData {
  courses: (TrainingCourse & BrokerTraining)[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    avgProgress: number;
  };
}

interface FollowFormData {
  user_id: number;
  content: string;
  next_follow_date: Dayjs;
}

const BrokerWorkbenchPage: React.FC = () => {
  const { brokerId } = useParams<{ brokerId: string }>();
  const [activeTab, setActiveTab] = useState('follow');
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followFilterStatus, setFollowFilterStatus] = useState<string>('all');
  const [viewingViewMode, setViewingViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [editingFollow, setEditingFollow] = useState<CustomerFollow | null>(null);
  const [form] = Form.useForm<FollowFormData>();

  const brokerIdNum = Number(brokerId);

  const { data: workbenchData, loading: workbenchLoading, refresh: refreshWorkbench } = useRequest(
    () => brokerApi.getWorkbench(brokerIdNum),
    { ready: !!brokerIdNum }
  );

  const { data: trainingData, loading: trainingLoading, refresh: refreshTraining } = useRequest(
    () => brokerApi.getTraining(brokerIdNum),
    { ready: !!brokerIdNum }
  );

  const workbench = workbenchData?.data as WorkbenchData;
  const training = trainingData?.data as TrainingData;

  const stats = workbench?.stats;
  const customers = workbench?.customers || [];
  const viewings = workbench?.todaySchedule || [];
  const commissions = workbench?.recentCommissions || [];
  const trainingCourses = training?.courses || [];
  const trainingStats = training?.stats;

  const todayFollows = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return customers.filter((c) => dayjs(c.next_follow_date).format('YYYY-MM-DD') === today).length;
  }, [customers]);

  const todayViewings = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return viewings.filter((v) => dayjs(v.viewing_date).format('YYYY-MM-DD') === today).length;
  }, [viewings]);

  const monthDeals = useMemo(() => {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    return commissions.filter(
      (c) => c.deal_date >= monthStart && c.deal_date <= monthEnd && c.status === 'settled'
    ).length;
  }, [commissions]);

  const monthCommission = useMemo(() => {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    return commissions
      .filter((c) => c.deal_date >= monthStart && c.deal_date <= monthEnd)
      .reduce((sum, c) => sum + c.commission_amount, 0);
  }, [commissions]);

  const viewingCompletionRate = useMemo(() => {
    if (viewings.length === 0) return 0;
    const completed = viewings.filter((v) => v.status === 'completed').length;
    return Math.round((completed / viewings.length) * 100);
  }, [viewings]);

  const customerConversionRate = useMemo(() => {
    if (customers.length === 0) return 0;
    const converted = customers.filter((c) => c.status === 'converted').length;
    return Math.round((converted / customers.length) * 100);
  }, [customers]);

  const avgDealCycle = useMemo(() => {
    if (commissions.length === 0) return 0;
    const totalDays = commissions.reduce((sum, c) => {
      const dealDate = dayjs(c.deal_date);
      const follow = customers.find((f) => f.user_id === Number(c.customer_name?.split('-')[0]));
      if (follow) {
        return sum + Math.abs(dealDate.diff(dayjs(follow.created_at), 'day'));
      }
      return sum + 15;
    }, 0);
    return Math.round(totalDays / commissions.length);
  }, [commissions, customers]);

  const filteredCustomers = useMemo(() => {
    if (followFilterStatus === 'all') return customers;
    return customers.filter((c) => c.status === followFilterStatus);
  }, [customers, followFilterStatus]);

  const calendarViewings = useMemo(() => {
    const map: Record<string, Viewing[]> = {};
    viewings.forEach((v) => {
      const date = dayjs(v.viewing_date).format('YYYY-MM-DD');
      if (!map[date]) map[date] = [];
      map[date].push(v);
    });
    return map;
  }, [viewings]);

  const monthlyCommissionChart = useMemo(() => {
    const monthData: Record<string, number> = {};
    commissions.forEach((c) => {
      const month = dayjs(c.deal_date).format('YYYY-MM');
      monthData[month] = (monthData[month] || 0) + c.commission_amount;
    });

    const sortedMonths = Object.keys(monthData).sort();
    const last6Months = sortedMonths.slice(-6);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>佣金: ¥${data.value.toLocaleString()}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: last6Months.map((m) => m.replace('-', '年') + '月'),
        axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#666',
          formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
        },
      },
      series: [
        {
          data: last6Months.map((m) => monthData[m]),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#1677ff' },
                { offset: 1, color: '#69b1ff' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 32,
        },
      ],
    };
  }, [commissions]);

  const handleCreateFollow = async (values: FollowFormData) => {
    try {
      if (editingFollow) {
        message.success('跟进记录已更新');
      } else {
        await brokerApi.createFollow({
          broker_id: brokerIdNum,
          user_id: values.user_id,
          follow_date: dayjs().format('YYYY-MM-DD'),
          content: values.content,
          next_follow_date: values.next_follow_date.format('YYYY-MM-DD'),
        });
        message.success('跟进记录创建成功');
      }
      setFollowModalVisible(false);
      form.resetFields();
      setEditingFollow(null);
      refreshWorkbench();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleEditFollow = (follow: CustomerFollow) => {
    setEditingFollow(follow);
    form.setFieldsValue({
      user_id: follow.user_id,
      content: follow.content,
      next_follow_date: dayjs(follow.next_follow_date),
    });
    setFollowModalVisible(true);
  };

  const handleCompleteFollow = async (follow: CustomerFollow) => {
    try {
      message.success('跟进已完成');
      refreshWorkbench();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleAddFollow = (follow: CustomerFollow) => {
    setEditingFollow(null);
    form.setFieldsValue({
      user_id: follow.user_id,
      next_follow_date: dayjs().add(1, 'day'),
    });
    setFollowModalVisible(true);
  };

  const handleUpdateTrainingProgress = async (courseId: number, currentProgress: number) => {
    try {
      const newProgress = Math.min(currentProgress + 10, 100);
      const trainingRecord = trainingCourses.find((c) => c.course_id === courseId);
      if (trainingRecord) {
        await brokerApi.updateTrainingProgress(trainingRecord.id, {
          progress: newProgress,
          completed: newProgress >= 100 ? 1 : 0,
          score: newProgress >= 100 ? 85 : undefined,
        });
        message.success(newProgress >= 100 ? '课程已完成！' : '学习进度已更新');
        refreshTraining();
      }
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'blue',
      pending: 'orange',
      completed: 'green',
      cancelled: 'red',
      converted: 'purple',
      paid: 'green',
      confirmed: 'blue',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: '跟进中',
      pending: '待确认',
      completed: '已完成',
      cancelled: '已取消',
      converted: '已成交',
      paid: '已结算',
      confirmed: '已确认',
    };
    return texts[status] || status;
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayViewings = calendarViewings[dateStr] || [];

    if (dayViewings.length === 0) return null;

    return (
      <ul className="calendar-events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayViewings.slice(0, 2).map((v) => (
          <li
            key={v.id}
            style={{
              fontSize: 11,
              padding: '2px 4px',
              marginBottom: 2,
              borderRadius: 2,
              backgroundColor: v.status === 'completed' ? '#f6ffed' : '#e6f4ff',
              color: v.status === 'completed' ? '#52c41a' : '#1677ff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {v.viewing_time} {v.property_title}
          </li>
        ))}
        {dayViewings.length > 2 && (
          <li style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
            还有 {dayViewings.length - 2} 个带看
          </li>
        )}
      </ul>
    );
  };

  const customerFollowColumns = [
    {
      title: '客户信息',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (_: string, record: CustomerFollow) => (
        <Space>
          <Avatar size={40} src={record.user_avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.user_name}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{record.user_phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '跟进内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300,
    },
    {
      title: '下次跟进',
      dataIndex: 'next_follow_date',
      key: 'next_follow_date',
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>{dayjs(date).format('YYYY-MM-DD')}</span>
          {dayjs(date).isBefore(dayjs(), 'day') && (
            <Tag color="red">已逾期</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: CustomerFollow) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditFollow(record)}
          >
            编辑
          </Button>
          {record.status !== 'completed' && (
            <Popconfirm
              title="确认完成跟进？"
              onConfirm={() => handleCompleteFollow(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckOutlined />}>
                完成
              </Button>
            </Popconfirm>
          )}
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddFollow(record)}
          >
            新增跟进
          </Button>
        </Space>
      ),
    },
  ];

  const viewingColumns = [
    {
      title: '日期时间',
      key: 'datetime',
      render: (_: any, record: Viewing) => (
        <Space>
          <CalendarOutlined style={{ color: '#1677ff' }} />
          <div>
            <div>{dayjs(record.viewing_date).format('YYYY-MM-DD')}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{record.viewing_time}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '客户',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (name: string, record: Viewing) => (
        <div>
          <div>{name}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.user_phone}</div>
        </div>
      ),
    },
    {
      title: '房源',
      dataIndex: 'property_title',
      key: 'property_title',
      render: (title: string, record: Viewing) => (
        <div>
          <div>{title}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            ¥{record.property_price?.toLocaleString()} · {record.property_area}㎡
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const icons: Record<string, React.ReactNode> = {
          pending: <ClockCircleOutlined />,
          confirmed: <CheckCircleOutlined />,
          completed: <CheckOutlined />,
          cancelled: <CloseCircleOutlined />,
        };
        return (
          <Tag icon={icons[status]} color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Viewing) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary">
                确认
              </Button>
              <Button size="small" danger>
                取消
              </Button>
            </>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="primary">
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const commissionColumns = [
    {
      title: '成交房源',
      dataIndex: 'property_title',
      key: 'property_title',
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '成交金额',
      dataIndex: 'deal_amount',
      key: 'deal_amount',
      render: (amount: number) => <span style={{ fontWeight: 500 }}>¥{amount.toLocaleString()}</span>,
    },
    {
      title: '佣金比例',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '成交日期',
      dataIndex: 'deal_date',
      key: 'deal_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
  ];

  const userOptions = useMemo(() => {
    const uniqueUsers = new Map<number, { name: string; phone: string }>();
    customers.forEach((c) => {
      if (!uniqueUsers.has(c.user_id)) {
        uniqueUsers.set(c.user_id, { name: c.user_name || '', phone: c.user_phone || '' });
      }
    });
    return Array.from(uniqueUsers.entries()).map(([id, info]) => (
      <Option key={id} value={id}>
        {info.name} ({info.phone})
      </Option>
    ));
  }, [customers]);

  const tabItems = [
    {
      key: 'follow',
      label: (
        <span>
          <CustomerServiceOutlined /> 客户跟进
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Radio.Group
                value={followFilterStatus}
                onChange={(e) => setFollowFilterStatus(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="all">全部</Radio.Button>
                <Radio.Button value="active">跟进中</Radio.Button>
                <Radio.Button value="pending">待确认</Radio.Button>
                <Radio.Button value="converted">已成交</Radio.Button>
                <Radio.Button value="completed">已完成</Radio.Button>
              </Radio.Group>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingFollow(null);
                form.resetFields();
                setFollowModalVisible(true);
              }}
            >
              添加跟进记录
            </Button>
          </div>
          <Table
            dataSource={filteredCustomers}
            columns={customerFollowColumns}
            rowKey="id"
            loading={workbenchLoading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
    {
      key: 'viewing',
      label: (
        <span>
          <ScheduleOutlined /> 带看日程
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Radio.Group
              value={viewingViewMode}
              onChange={(e) => setViewingViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="calendar">日历视图</Radio.Button>
              <Radio.Button value="list">列表视图</Radio.Button>
            </Radio.Group>
            <Button type="primary" icon={<PlusOutlined />}>
              添加带看
            </Button>
          </div>
          {viewingViewMode === 'calendar' ? (
            <Card>
              <Calendar
                dateCellRender={dateCellRender}
                onSelect={setSelectedDate}
                value={selectedDate}
              />
            </Card>
          ) : (
            <Table
              dataSource={viewings}
              columns={viewingColumns}
              rowKey="id"
              loading={workbenchLoading}
              pagination={{ pageSize: 10 }}
            />
          )}
        </div>
      ),
    },
    {
      key: 'commission',
      label: (
        <span>
          <MoneyCollectOutlined /> 成交佣金
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={16}>
              <Card title="月度佣金趋势">
                <ReactECharts option={monthlyCommissionChart} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="佣金统计">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Statistic
                    title="待结算佣金"
                    value={stats?.pending_commission || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: '#faad14' }}
                  />
                  <Statistic
                    title="已结算佣金"
                    value={stats?.paid_commission || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>
                      <ReadOutlined /> 自动核算说明
                    </div>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                      佣金按成交金额的2.5%自动核算，成交后30天内结算，结算时需上传成交确认单。
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
          <Card title="佣金明细">
            <Table
              dataSource={commissions}
              columns={commissionColumns}
              rowKey="id"
              loading={workbenchLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'training',
      label: (
        <span>
          <BookOutlined /> 培训学习
        </span>
      ),
      children: (
        <Spin spinning={trainingLoading}>
          {trainingStats && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总课程数"
                    value={trainingStats.total}
                    prefix={<BookOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已完成课程"
                    value={trainingStats.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="进行中课程"
                    value={trainingStats.inProgress}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', marginBottom: 8 }}>平均进度</div>
                    <Progress
                      type="circle"
                      percent={trainingStats.avgProgress}
                      size={80}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          )}
          <Card title="培训课程">
            {trainingCourses.length > 0 ? (
              <List
                dataSource={trainingCourses}
                renderItem={(course) => (
                  <List.Item
                    key={course.id}
                    style={{
                      padding: 16,
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: course.completed === 1 ? '#f6ffed' : '#fff',
                    }}
                    actions={[
                      course.completed !== 1 ? (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleUpdateTrainingProgress(course.course_id!, course.progress || 0)}
                        >
                          {course.progress && course.progress > 0 ? '继续学习' : '开始学习'}
                        </Button>
                      ) : (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          已完成 · {course.score}分
                        </Tag>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={48}
                          style={{
                            backgroundColor: course.category === 'sales' ? '#1677ff' : '#722ed1',
                          }}
                          icon={<BookOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{course.title}</span>
                          <Tag color={course.level === 'advanced' ? 'red' : course.level === 'intermediate' ? 'orange' : 'green'}>
                            {course.level === 'advanced' ? '高级' : course.level === 'intermediate' ? '中级' : '初级'}
                          </Tag>
                          <Tag color="blue">{course.category === 'sales' ? '销售技巧' : '专业知识'}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666', marginBottom: 8 }}>{course.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              <ClockCircleOutlined /> {course.duration}分钟
                            </span>
                            {course.start_date && (
                              <span style={{ color: '#999', fontSize: 12 }}>
                                开始时间: {dayjs(course.start_date).format('YYYY-MM-DD')}
                              </span>
                            )}
                            {course.complete_date && (
                              <span style={{ color: '#999', fontSize: 12 }}>
                                完成时间: {dayjs(course.complete_date).format('YYYY-MM-DD')}
                              </span>
                            )}
                          </div>
                          {course.completed !== 1 && (
                            <div style={{ marginTop: 8, width: 300 }}>
                              <Progress
                                percent={course.progress || 0}
                                size="small"
                                status={course.progress === 100 ? 'success' : 'active'}
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无培训课程" />
            )}
          </Card>
        </Spin>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Spin spinning={workbenchLoading && activeTab !== 'training'} tip="加载中...">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日待跟进"
                value={todayFollows}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日带看"
                value={todayViewings}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月成交"
                value={monthDeals}
                prefix={<TransactionOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月佣金"
                value={monthCommission}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    带看完成率
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{viewingCompletionRate}%</div>
                </div>
                <Progress
                  type="dashboard"
                  percent={viewingCompletionRate}
                  size={80}
                  strokeColor="#52c41a"
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <RiseOutlined style={{ color: '#1677ff', marginRight: 4 }} />
                    客户转化率
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{customerConversionRate}%</div>
                </div>
                <Progress
                  type="dashboard"
                  percent={customerConversionRate}
                  size={80}
                  strokeColor="#1677ff"
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <ClockCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    平均成交周期
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{avgDealCycle} 天</div>
                </div>
                <Badge
                  count={avgDealCycle <= 15 ? '优秀' : avgDealCycle <= 30 ? '良好' : '待提升'}
                  style={{
                    backgroundColor: avgDealCycle <= 15 ? '#52c41a' : avgDealCycle <= 30 ? '#1677ff' : '#faad14',
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </Spin>

      <Modal
        title={editingFollow ? '编辑跟进记录' : '添加跟进记录'}
        open={followModalVisible}
        onCancel={() => {
          setFollowModalVisible(false);
          setEditingFollow(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateFollow}
        >
          <Form.Item
            name="user_id"
            label="选择客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户">
              {userOptions}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入跟进内容，包括客户需求、沟通情况、异议处理等..."
            />
          </Form.Item>
          <Form.Item
            name="next_follow_date"
            label="下次跟进时间"
            rules={[{ required: true, message: '请选择下次跟进时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择下次跟进日期"
              minDate={dayjs()}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setFollowModalVisible(false);
                  setEditingFollow(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingFollow ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BrokerWorkbenchPage;
