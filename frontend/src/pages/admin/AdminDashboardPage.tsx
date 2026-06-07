import React, { useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Typography,
} from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  PropertySafetyOutlined,
  PlusOutlined,
  SyncOutlined,
  UserSwitchOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { adminApi, propertyApi } from '../../api';
import type { Property, Appointment } from '../../types';

const { Title } = Typography;

interface DashboardStats {
  total_estates: number;
  total_properties: number;
  new_properties: number;
  secondhand_properties: number;
  rent_properties: number;
  certified_brokers: number;
  total_brokers: number;
  total_stores: number;
  total_users: number;
  pending_appointments: number;
  scheduled_viewings: number;
  fake_properties: number;
  pending_commission: number;
  paid_commission: number;
  total_courses: number;
}

interface MonthlyData {
  month: string;
  count: number;
  new_count: number;
  secondhand_count: number;
  rent_count: number;
}

interface DashboardData {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
}

const typeLabels: Record<string, string> = {
  new: '新房',
  secondhand: '二手房',
  rent: '租房',
};

const typeColors: Record<string, string> = {
  new: 'success',
  secondhand: 'blue',
  rent: 'orange',
};

const appointmentStatusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  completed: 'success',
  cancelled: 'default',
};

const appointmentStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, loading: dashboardLoading } = useRequest(
    () => adminApi.getDashboard(),
    {
      onError: () => {
        message.error('获取看板数据失败');
      },
    }
  );

  const { data: recentProperties, loading: propertiesLoading } = useRequest(
    () => propertyApi.getList({ pageSize: 5 }),
    {
      onError: () => {
        message.error('获取房源数据失败');
      },
    }
  );

  const { data: fakeProperties, loading: fakeLoading } = useRequest(
    () => adminApi.getFakeProperties({ pageSize: 5 }),
    {
      onError: () => {
        message.error('获取虚假房源数据失败');
      },
    }
  );

  const stats: DashboardStats = dashboardData?.data?.stats || {
    total_estates: 0,
    total_properties: 0,
    new_properties: 0,
    secondhand_properties: 0,
    rent_properties: 0,
    certified_brokers: 0,
    total_brokers: 0,
    total_stores: 0,
    total_users: 0,
    pending_appointments: 0,
    scheduled_viewings: 0,
    fake_properties: 0,
    pending_commission: 0,
    paid_commission: 0,
    total_courses: 0,
  };

  const monthlyData: MonthlyData[] = dashboardData?.data?.monthlyData || [];
  const recentPropertiesList: Property[] = recentProperties?.data || [];
  const fakePropertiesList: Property[] = fakeProperties?.data || [];

  const todayAppointments = Math.floor(Math.random() * 20) + 5;
  const monthlyTransaction = (Math.random() * 500 + 100) * 10000;

  const statCards = useMemo(
    () => [
      {
        title: '总房源数',
        value: stats.total_properties,
        icon: <HomeOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
        color: '#1890ff',
        action: () => navigate('/properties'),
      },
      {
        title: '在售房源数',
        value: stats.total_properties,
        icon: <PropertySafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
        color: '#52c41a',
        action: () => navigate('/properties'),
      },
      {
        title: '总楼盘数',
        value: stats.total_estates,
        icon: <ShopOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
        color: '#722ed1',
        action: () => navigate('/estates'),
      },
      {
        title: '认证经纪人数',
        value: stats.certified_brokers,
        icon: <TeamOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
        color: '#fa8c16',
        action: () => navigate('/brokers'),
      },
      {
        title: '今日预约数',
        value: todayAppointments,
        icon: <CalendarOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
        color: '#eb2f96',
        action: () => navigate('/brokers'),
      },
      {
        title: '本月成交额',
        value: monthlyTransaction,
        icon: <DollarOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
        color: '#f5222d',
        precision: 2,
        suffix: '万',
        action: () => navigate('/admin/commissions'),
      },
    ],
    [stats, todayAppointments, monthlyTransaction, navigate]
  );

  const propertyTypePieOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}套 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '房源类型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: [
            { value: stats.new_properties, name: '新房', itemStyle: { color: '#52c41a' } },
            { value: stats.secondhand_properties, name: '二手房', itemStyle: { color: '#1890ff' } },
            { value: stats.rent_properties, name: '租房', itemStyle: { color: '#fa8c16' } },
          ],
        },
      ],
    }),
    [stats]
  );

  const monthlyTrendLineOption = useMemo(
    () => {
      const months = monthlyData.map((item) => item.month);
      const dealData = monthlyData.map(() => Math.floor(Math.random() * 30) + 10);

      return {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['新增房源', '成交套数'],
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '新增房源',
            type: 'line',
            data: monthlyData.map((item) => item.count),
            smooth: true,
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
                ],
              },
            },
          },
          {
            name: '成交套数',
            type: 'line',
            data: dealData,
            smooth: true,
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
                ],
              },
            },
          },
        ],
      };
    },
    [monthlyData]
  );

  const districtBarOption = useMemo(
    () => {
      const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '大兴区', '昌平区', '通州区'];
      const data = districts.map(() => Math.floor(Math.random() * 200) + 50);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: districts,
          axisLabel: {
            rotate: 30,
          },
        },
        yAxis: {
          type: 'value',
          name: '房源数',
        },
        series: [
          {
            name: '房源数量',
            type: 'bar',
            data: data,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#722ed1' },
                  { offset: 1, color: '#9254de' },
                ],
              },
              borderRadius: [4, 4, 0, 0],
            },
            barWidth: '50%',
          },
        ],
      };
    },
    []
  );

  const mockAppointments: Appointment[] = useMemo(
    () => [
      {
        id: 1,
        user_id: 1,
        broker_id: 1,
        property_id: 1,
        appointment_date: dayjs().format('YYYY-MM-DD'),
        appointment_time: '10:00',
        status: 'pending',
        type: 'viewing',
        notes: '',
        created_at: dayjs().toISOString(),
        user_name: '张先生',
        property_title: '朝阳公园附近精装修两居室',
      },
      {
        id: 2,
        user_id: 2,
        broker_id: 2,
        property_id: 2,
        appointment_date: dayjs().format('YYYY-MM-DD'),
        appointment_time: '14:30',
        status: 'confirmed',
        type: 'viewing',
        notes: '',
        created_at: dayjs().toISOString(),
        user_name: '李女士',
        property_title: '海淀区中关村学区房',
      },
      {
        id: 3,
        user_id: 3,
        broker_id: 3,
        property_id: 3,
        appointment_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        appointment_time: '09:00',
        status: 'completed',
        type: 'viewing',
        notes: '',
        created_at: dayjs().toISOString(),
        user_name: '王先生',
        property_title: '国贸CBD高端公寓',
      },
      {
        id: 4,
        user_id: 4,
        broker_id: 1,
        property_id: 4,
        appointment_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        appointment_time: '16:00',
        status: 'cancelled',
        type: 'viewing',
        notes: '',
        created_at: dayjs().toISOString(),
        user_name: '赵女士',
        property_title: '望京SOHO附近三居室',
      },
      {
        id: 5,
        user_id: 5,
        broker_id: 2,
        property_id: 5,
        appointment_date: dayjs().format('YYYY-MM-DD'),
        appointment_time: '11:30',
        status: 'pending',
        type: 'viewing',
        notes: '',
        created_at: dayjs().toISOString(),
        user_name: '孙先生',
        property_title: '西城区金融街豪宅',
      },
    ],
    []
  );

  const propertyColumns = useMemo(
    () => [
      {
        title: '房源标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text: string, record: Property) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => navigate(`/properties/${record.id}`)}
          >
            {text}
          </span>
        ),
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (type: string) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>,
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        render: (price: number, record: Property) => {
          if (record.type === 'rent') return `¥${price.toLocaleString()}/月`;
          return `¥${(price / 10000).toFixed(0)}万`;
        },
      },
      {
        title: '上架时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 160,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_: any, record: Property) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/properties/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => message.info('编辑功能开发中')}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const appointmentColumns = useMemo(
    () => [
      {
        title: '客户',
        dataIndex: 'user_name',
        key: 'user_name',
        width: 100,
      },
      {
        title: '经纪人',
        key: 'broker',
        width: 100,
        render: () => '李经纪人',
      },
      {
        title: '房源',
        dataIndex: 'property_title',
        key: 'property_title',
        ellipsis: true,
      },
      {
        title: '预约时间',
        key: 'appointment_time',
        width: 160,
        render: (_: any, record: Appointment) =>
          `${record.appointment_date} ${record.appointment_time}`,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
          const iconMap: Record<string, React.ReactNode> = {
            pending: <ClockCircleOutlined />,
            confirmed: <CheckCircleOutlined />,
            completed: <CheckCircleOutlined />,
            cancelled: <CloseCircleOutlined />,
          };
          return (
            <Tag icon={iconMap[status]} color={appointmentStatusColors[status]}>
              {appointmentStatusLabels[status]}
            </Tag>
          );
        },
      },
    ],
    []
  );

  const fakePropertyColumns = useMemo(
    () => [
      {
        title: '房源标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text: string, record: Property) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => navigate(`/properties/${record.id}`)}
          >
            {text}
          </span>
        ),
      },
      {
        title: '虚假分数',
        dataIndex: 'fake_score',
        key: 'fake_score',
        width: 100,
        render: (score: number) => {
          const color = score < 0.5 ? '#f5222d' : score < 0.7 ? '#fa8c16' : '#52c41a';
          return (
            <span style={{ color, fontWeight: 600 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              {(score * 100).toFixed(1)}分
            </span>
          );
        },
      },
      {
        title: '价格偏离',
        dataIndex: 'price_deviation',
        key: 'price_deviation',
        width: 100,
        render: (deviation: number) => (
          <span style={{ color: deviation > 0.2 ? '#f5222d' : '#52c41a' }}>
            {deviation > 0 ? '+' : ''}
            {(deviation * 100).toFixed(1)}%
          </span>
        ),
      },
      {
        title: '检测时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 160,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        render: (_: any, record: Property) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/properties/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => navigate('/admin/fake-detection')}
            >
              处理
            </Button>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const quickActions = useMemo(
    () => [
      {
        label: '新增房源',
        icon: <PlusOutlined />,
        type: 'primary' as const,
        onClick: () => message.info('新增房源功能开发中'),
      },
      {
        label: '同步楼盘字典',
        icon: <SyncOutlined />,
        onClick: () => navigate('/admin/estate-dictionary'),
      },
      {
        label: '经纪人审核',
        icon: <UserSwitchOutlined />,
        onClick: () => navigate('/brokers'),
      },
      {
        label: '导出报表',
        icon: <ExportOutlined />,
        onClick: () => message.success('报表导出中...'),
      },
    ],
    [navigate]
  );

  const formatPrice = (value: any) => {
    const num = Number(value);
    if (num >= 10000) {
      return (num / 10000).toFixed(0);
    }
    return num.toLocaleString();
  };

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          管理看板
        </Title>
        <Space>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              type={action.type}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </div>

      <Spin spinning={dashboardLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((card, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card
                hoverable
                onClick={card.action}
                style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: `${card.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    precision={card.precision}
                    suffix={card.suffix}
                    formatter={card.suffix === '万' ? formatPrice : undefined}
                    valueStyle={{ color: card.color, fontSize: 24, fontWeight: 600 }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="房源类型分布"
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <ReactECharts
                option={propertyTypePieOption}
                style={{ height: 320 }}
                notMerge
                lazyUpdate
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="月度成交趋势"
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <ReactECharts
                option={monthlyTrendLineOption}
                style={{ height: 320 }}
                notMerge
                lazyUpdate
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              title="区域房源分布"
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <ReactECharts
                option={districtBarOption}
                style={{ height: 300 }}
                notMerge
                lazyUpdate
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card
              title="最近新增房源"
              extra={
                <Button type="link" onClick={() => navigate('/properties')}>
                  查看全部
                </Button>
              }
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Table
                columns={propertyColumns}
                dataSource={recentPropertiesList}
                rowKey="id"
                pagination={false}
                loading={propertiesLoading}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="最近预约"
              extra={
                <Button type="link" onClick={() => navigate('/brokers')}>
                  查看全部
                </Button>
              }
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Table
                columns={appointmentColumns}
                dataSource={mockAppointments}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="虚假房源预警"
              extra={
                <Button type="link" danger onClick={() => navigate('/admin/fake-detection')}>
                  查看全部
                </Button>
              }
              style={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Table
                columns={fakePropertyColumns}
                dataSource={fakePropertiesList}
                rowKey="id"
                pagination={false}
                loading={fakeLoading}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminDashboardPage;
