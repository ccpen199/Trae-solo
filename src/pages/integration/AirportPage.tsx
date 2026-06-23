import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Alert,
  Progress,
  List,
  Badge,
} from 'antd';
import {
  RocketOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DashOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';

const { Title } = Typography;

const AirportPage = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const airportData = [
    {
      id: 'FL001',
      flightNo: 'CA1234',
      waybillNos: ['KY2024061900010', 'KY2024061900011'],
      departure: 'SZX',
      destination: 'SHA',
      departureTime: '2024-06-19 14:30',
      arrivalTime: '2024-06-19 16:45',
      status: 'in_flight',
      progress: 65,
      cargoWeight: 2500,
    },
    {
      id: 'FL002',
      flightNo: 'MU5678',
      waybillNos: ['KY2024061900012'],
      departure: 'SZX',
      destination: 'PEK',
      departureTime: '2024-06-19 18:00',
      arrivalTime: '2024-06-19 20:30',
      status: 'loading',
      progress: 0,
      cargoWeight: 1800,
    },
    {
      id: 'FL003',
      flightNo: 'CZ9012',
      waybillNos: ['KY2024061900013', 'KY2024061900014'],
      departure: 'CAN',
      destination: 'SHA',
      departureTime: '2024-06-19 10:00',
      arrivalTime: '2024-06-19 12:15',
      status: 'arrived',
      progress: 100,
      cargoWeight: 3200,
    },
    {
      id: 'FL004',
      flightNo: 'HU3456',
      waybillNos: ['KY2024061900015'],
      departure: 'SZX',
      destination: 'CTU',
      departureTime: '2024-06-19 16:00',
      arrivalTime: '2024-06-19 18:30',
      status: 'delayed',
      progress: 20,
      cargoWeight: 950,
    },
  ];

  const statusMap: Record<string, { text: string; color: string }> = {
    loading: { text: '装机中', color: 'blue' },
    in_flight: { text: '飞行中', color: 'processing' },
    arrived: { text: '已到达', color: 'success' },
    delayed: { text: '延误', color: 'warning' },
    cancelled: { text: '取消', color: 'error' },
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      message.success('机场航班数据同步成功');
    }, 1500);
  };

  const columns = [
    {
      title: '航班号',
      dataIndex: 'flightNo',
      key: 'flightNo',
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>
          <RocketOutlined style={{ marginRight: 6, color: '#1890ff' }} />
          {text}
        </span>
      ),
    },
    {
      title: '航线',
      key: 'route',
      render: (_: unknown, record: any) => (
        <div>
          <div>
            {record.departure} → {record.destination}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.departureTime.split(' ')[1]} - {record.arrivalTime.split(' ')[1]}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '飞行进度',
      key: 'progress',
      render: (_: unknown, record: any) => (
        <Progress
          percent={record.progress}
          size="small"
          status={record.status === 'delayed' ? 'exception' : 'active'}
        />
      ),
    },
    {
      title: '货物重量',
      dataIndex: 'cargoWeight',
      key: 'cargoWeight',
      render: (val: number) => `${val} kg`,
    },
    {
      title: '关联运单',
      key: 'waybills',
      render: (_: unknown, record: any) => (
        <div>
          {record.waybillNos.map((no: string, i: number) => (
            <Tag key={i}>{no}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">详情</Button>
          <Button type="link" size="small">跟踪</Button>
        </Space>
      ),
    },
  ];

  const airportList = [
    { code: 'SZX', name: '深圳宝安国际机场', status: 'connected', type: '国内/国际' },
    { code: 'CAN', name: '广州白云国际机场', status: 'connected', type: '国内/国际' },
    { code: 'SHA', name: '上海虹桥国际机场', status: 'connected', type: '国内' },
    { code: 'PVG', name: '上海浦东国际机场', status: 'connected', type: '国内/国际' },
    { code: 'PEK', name: '北京首都国际机场', status: 'connected', type: '国内/国际' },
    { code: 'PKX', name: '北京大兴国际机场', status: 'connecting', type: '国内/国际' },
    { code: 'CTU', name: '成都双流国际机场', status: 'connected', type: '国内' },
    { code: 'CKG', name: '重庆江北国际机场', status: 'pending', type: '国内' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          机场系统对接
        </Title>
        <Space>
          <Button icon={<SyncOutlined />} loading={isSyncing} onClick={handleSync}>
            同步航班数据
          </Button>
          <Button type="primary">舱位预订</Button>
        </Space>
      </div>

      <Alert
        message="已与国内8大机场货运系统实现数据对接"
        description="支持航班查询、舱位预订、货物跟踪、异常预警等数据实时交互"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日航班"
              value={12}
              suffix="班"
              valueStyle={{ color: '#1890ff' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在飞航班"
              value={5}
              suffix="班"
              valueStyle={{ color: '#1890ff' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日运量"
              value={12580}
              suffix="kg"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="延误航班"
              value={1}
              suffix="班"
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="航班状态">
            <Table
              columns={columns}
              dataSource={airportData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="已对接机场">
            <List
              size="small"
              dataSource={airportList}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Badge
                      status={
                        item.status === 'connected'
                          ? 'success'
                          : item.status === 'connecting'
                          ? 'processing'
                          : 'default'
                      }
                      text={
                        item.status === 'connected'
                          ? '已对接'
                          : item.status === 'connecting'
                          ? '对接中'
                          : '待对接'
                      }
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<EnvironmentOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{item.code}</span>
                        <Tag style={{ fontSize: 12 }}>{item.type}</Tag>
                      </Space>
                    }
                    description={item.name}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="接口状态"
            style={{ marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>航班查询接口</span>
                <Badge status="success" text="正常" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>舱位预订接口</span>
                <Badge status="success" text="正常" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>货物跟踪接口</span>
                <Badge status="success" text="正常" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>运单数据同步</span>
                <Badge status="success" text="正常" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>异常通知推送</span>
                <Badge status="processing" text="同步中" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AirportPage;
