import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Avatar,
  List,
  Badge,
  Modal,
  Form,
  Select,
  Input,
} from 'antd';
import {
  TruckOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store/appStore';
import { Driver } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const DispatchPage = () => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [form] = Form.useForm();

  const drivers = useAppStore((state) => state.drivers);
  const waybills = useAppStore((state) => state.waybills);

  const idleDrivers = drivers.filter((d) => d.status === 'idle').length;
  const inTransitDrivers = drivers.filter((d) => d.status === 'in_transit').length;
  const loadingDrivers = drivers.filter(
    (d) => d.status === 'loading' || d.status === 'unloading'
  ).length;

  const totalCapacity = drivers.reduce((sum, d) => sum + d.capacity, 0);
  const usedCapacity = drivers.reduce((sum, d) => sum + d.totalLoad, 0);

  const statusMap: Record<string, { text: string; color: string }> = {
    idle: { text: '空闲', color: 'default' },
    loading: { text: '装货中', color: 'blue' },
    in_transit: { text: '运输中', color: 'processing' },
    unloading: { text: '卸货中', color: 'purple' },
    rest: { text: '休息中', color: 'default' },
  };

  const capacityChartOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'gauge',
        progress: { show: true, width: 18 },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, '70%'], fontSize: 14, color: '#999' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          offsetCenter: [0, '30%'],
          formatter: '{value}%',
          color: '#1890ff',
        },
        data: [{ value: Math.round((usedCapacity / totalCapacity) * 100), name: '运力利用率' }],
      },
    ],
  };

  const distributionOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '司机状态分布',
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: idleDrivers, name: '空闲', itemStyle: { color: '#d9d9d9' } },
          { value: inTransitDrivers, name: '运输中', itemStyle: { color: '#1890ff' } },
          { value: loadingDrivers, name: '装卸货', itemStyle: { color: '#52c41a' } },
        ],
      },
    ],
  };

  const mapOption = {
    backgroundColor: '#f5f5f5',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data.name}<br/>状态：${statusMap[params.data.status]?.text || ''}<br/>载重：${params.data.load}kg`;
      },
    },
    xAxis: { type: 'value', min: 113, max: 114.5, show: false },
    yAxis: { type: 'value', min: 22.4, max: 23.3, show: false },
    series: [
      {
        type: 'scatter',
        symbolSize: 20,
        data: drivers.map((d) => ({
          value: [d.currentLocation.lng, d.currentLocation.lat],
          name: d.name,
          status: d.status,
          load: d.totalLoad,
        })),
        itemStyle: {
          color: (params: any) => {
            const status = params.data.status;
            if (status === 'idle') return '#52c41a';
            if (status === 'in_transit') return '#1890ff';
            if (status === 'loading' || status === 'unloading') return '#faad14';
            return '#d9d9d9';
          },
        },
      },
    ],
  };

  const driverTableColumns = [
    {
      title: '司机',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Driver) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: '车牌号',
      dataIndex: 'vehicleNo',
      key: 'vehicleNo',
    },
    {
      title: '车型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
    },
    {
      title: '载重',
      key: 'load',
      render: (_: unknown, record: Driver) => (
        <div>
          <div>{record.totalLoad} / {record.capacity} kg</div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginTop: 4 }}>
            <div
              style={{
                width: `${(record.totalLoad / record.capacity) * 100}%`,
                height: '100%',
                background:
                  record.totalLoad / record.capacity > 0.9 ? '#ff4d4f' : '#52c41a',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: '当前位置',
      dataIndex: ['currentLocation', 'address'],
      key: 'location',
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
      title: '在途订单',
      dataIndex: 'currentOrders',
      key: 'currentOrders',
      render: (val: number) => `${val} 单`,
    },
    {
      title: '今日完成',
      dataIndex: 'todayCompleted',
      key: 'todayCompleted',
      render: (val: number) => `${val} 单`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Driver) => (
        <Space>
          <Button type="link" size="small" onClick={() => setSelectedDriver(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleAssign(record)}>
            派单
          </Button>
        </Space>
      ),
    },
  ];

  const handleAssign = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsAssignModalOpen(true);
  };

  const pendingOrders = waybills.filter((w) => w.status === 'pending' || w.status === 'picked');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          运力调度看板
        </Title>
        <Space>
          <Button icon={<PlusOutlined />}>添加车辆</Button>
          <Button type="primary">智能调度</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总运力"
              value={drivers.length}
              suffix="辆"
              prefix={<TruckOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="运输中"
              value={inTransitDrivers}
              suffix="辆"
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="空闲车辆"
              value={idleDrivers}
              suffix="辆"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="装卸货"
              value={loadingDrivers}
              suffix="辆"
              valueStyle={{ color: '#faad14' }}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待派单"
              value={pendingOrders.length}
              suffix="单"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div style={{ height: 100 }}>
              <ReactECharts option={capacityChartOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card
            title="车辆实时分布"
            extra={
              <Space>
                <Tag color="green">空闲</Tag>
                <Tag color="blue">运输中</Tag>
                <Tag color="orange">装卸货</Tag>
              </Space>
            }
          >
            <ReactECharts option={mapOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="状态分布">
            <ReactECharts option={distributionOption} style={{ height: 200 }} />
          </Card>
          <Card title="待派单列表" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={pendingOrders.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      派单
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status="processing" />}
                    title={item.waybillNo}
                    description={`${item.cargo.weight}kg · ${item.sender.city} → ${item.receiver.city}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="司机列表">
        <Table
          columns={driverTableColumns}
          dataSource={drivers}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="订单指派"
        open={isAssignModalOpen}
        onOk={() => {
          form.submit();
          setIsAssignModalOpen(false);
        }}
        onCancel={() => setIsAssignModalOpen(false)}
        okText="确认派单"
        cancelText="取消"
      >
        {selectedDriver && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>指派给：{selectedDriver.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {selectedDriver.vehicleNo} · {selectedDriver.vehicleType}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                当前载重：{selectedDriver.totalLoad} / {selectedDriver.capacity} kg
              </div>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                label="选择运单"
                name="waybillId"
                rules={[{ required: true, message: '请选择运单' }]}
              >
                <Select placeholder="请选择要指派的运单">
                  {pendingOrders.map((o) => (
                    <Option key={o.id} value={o.id}>
                      {o.waybillNo} - {o.cargo.name} ({o.cargo.weight}kg)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="派单备注..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DispatchPage;
