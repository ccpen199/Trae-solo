import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Badge, Statistic, Row, Col } from 'antd';
import { ThunderboltOutlined, RiseOutlined, CalendarOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const { Option } = Select;

function ContainerBooking() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [spotContainers, setSpotContainers] = useState<any[]>([]);
  const [bidSlots, setBidSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBookModalVisible, setIsBookModalVisible] = useState(false);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [form] = Form.useForm();
  const [scheduleForm] = Form.useForm();

  useEffect(() => {
    loadSchedules();
    loadSpotContainers();
    loadBidSlots();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await apiService.get('/liner-schedules');
      setSchedules(data as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSpotContainers = async () => {
    try {
      const data = await apiService.get('/spot-containers', { status: 'available' });
      setSpotContainers(data as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBidSlots = async () => {
    const mockBidSlots = [
      {
        id: 'bid-1',
        voyage_number: 'V2024',
        origin_port: '上海港',
        destination_port: '洛杉矶港',
        vessel_name: '中远之星',
        departure_date: new Date(Date.now() + 5 * 86400000).toISOString(),
        slot_count: 50,
        start_price: 1200,
        current_price: 1450,
        bid_start: new Date(Date.now() - 3600000).toISOString(),
        bid_end: new Date(Date.now() + 7200000).toISOString(),
        status: 'active',
        bid_count: 23,
      },
      {
        id: 'bid-2',
        voyage_number: 'V1856',
        origin_port: '宁波港',
        destination_port: '汉堡港',
        vessel_name: '海洋巨人号',
        departure_date: new Date(Date.now() + 8 * 86400000).toISOString(),
        slot_count: 30,
        start_price: 950,
        current_price: 1180,
        bid_start: new Date(Date.now() + 86400000).toISOString(),
        bid_end: new Date(Date.now() + 86400000 * 3).toISOString(),
        status: 'upcoming',
        bid_count: 0,
      },
      {
        id: 'bid-3',
        voyage_number: 'V1567',
        origin_port: '深圳港',
        destination_port: '新加坡港',
        vessel_name: '东方明珠',
        departure_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        slot_count: 20,
        start_price: 500,
        current_price: 680,
        bid_start: new Date(Date.now() - 7200000).toISOString(),
        bid_end: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
        bid_count: 45,
      },
    ];
    setBidSlots(mockBidSlots);
  };

  const handleBookSpot = (container: any) => {
    setSelectedContainer(container);
    setIsBookModalVisible(true);
  };

  const handleBookSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsScheduleModalVisible(true);
    scheduleForm.setFieldsValue({
      route: `${schedule.origin_port} → ${schedule.destination_port}`,
      company_name: '华贸物流集团',
      contact_person: '张明',
    });
  };

  const handleSubmitScheduleBooking = async () => {
    try {
      await scheduleForm.validateFields();
      message.success('订舱申请已提交，商务会在订单中心跟进');
      setIsScheduleModalVisible(false);
      scheduleForm.resetFields();
    } catch (err) {
      message.error('请完善订舱申请信息');
    }
  };

  const handleSubmitBooking = async () => {
    try {
      const values = await form.validateFields();
      await apiService.post(`/spot-containers/${selectedContainer.id}/book`, values);
      message.success('预订成功！');
      setIsBookModalVisible(false);
      form.resetFields();
      loadSpotContainers();
    } catch (err: any) {
      message.error(err.response?.data?.error || '预订失败');
    }
  };

  const scheduleColumns = [
    {
      title: '航线代码',
      dataIndex: 'route_code',
      key: 'route_code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '航线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>→ {record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '班期',
      dataIndex: 'departure_day',
      key: 'departure_day',
      render: (day: string) => <Space><CalendarOutlined /> {day}</Space>,
    },
    {
      title: '航程',
      dataIndex: 'transit_days',
      key: 'transit_days',
      render: (days: number) => `${days}天`,
    },
    {
      title: '标准运价',
      dataIndex: 'standard_rate',
      key: 'standard_rate',
      render: (rate: number) => <span style={{ color: '#ff7a45', fontWeight: 'bold' }}>${rate}/TEU</span>,
    },
    {
      title: '运营商',
      dataIndex: 'operator_company',
      key: 'operator_company',
    },
    {
      title: '操作',
      key: 'action',
    render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small">订阅班期</Button>
          <Button type="primary" size="small" onClick={() => handleBookSchedule(record)}>立即订舱</Button>
        </Space>
      ),
    },
  ];

  const spotColumns = [
    {
      title: '集装箱',
      key: 'container',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.container_size}</div>
          <Tag color="geekblue">{record.container_type}</Tag>
        </div>
      ),
    },
    {
      title: '航线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>→ {record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '出发日期',
      dataIndex: 'departure_date',
      key: 'departure_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '原价',
      dataIndex: 'original_price',
      key: 'original_price',
      render: (price: number) => <span style={{ textDecoration: 'line-through', color: '#999' }}>${price}</span>,
    },
    {
      title: '秒杀价',
      dataIndex: 'flash_price',
      key: 'flash_price',
      render: (price: number) => (
        <div>
          <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>${price}</span>
          <Badge count="限时" style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'available' ? 'green' : 'default'}>
          {status === 'available' ? '可抢' : '已抢'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" size="small" danger icon={<ThunderboltOutlined />} onClick={() => handleBookSpot(record)}>
          立即抢购
        </Button>
      ),
    },
  ];

  const bidColumns = [
    {
      title: '航次',
      key: 'voyage',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.vessel_name}</div>
          <Tag color="blue">{record.voyage_number}</Tag>
        </div>
      ),
    },
    {
      title: '航线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>→ {record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '舱位数',
      dataIndex: 'slot_count',
      key: 'slot_count',
      render: (count: number) => `${count} TEU`,
    },
    {
      title: '起拍价',
      dataIndex: 'start_price',
      key: 'start_price',
      render: (price: number) => <span>${price}/TEU</span>,
    },
    {
      title: '当前价',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (price: number) => (
        <span style={{ color: '#ff7a45', fontWeight: 'bold', fontSize: 16 }}>${price}/TEU</span>
      ),
    },
    {
      title: '竞价状态',
      key: 'status',
      render: (_: any, record: any) => {
        if (record.status === 'active') {
          return (
            <div>
              <Tag color="red">竞价中</Tag>
              <div style={{ fontSize: '12px', color: '#999' }}>{record.bid_count}人已出价</div>
            </div>
          );
        }
        return <Tag color="orange">即将开始</Tag>;
      },
    },
    {
      title: '截止时间',
      dataIndex: 'bid_end',
      key: 'bid_end',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
    render: (_: any, record: any) => (
        <Link to={`/bids/${record.id}`}>
          <Button type="primary" size="small" icon={<RiseOutlined />}>
            出价
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">集装箱订舱</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="可用集装箱" value={1286} suffix="个" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="班轮航线" value={42} suffix="条" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="现舱秒杀" value={15} suffix="个" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="竞价中" value={6} suffix="场" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="liner"
          items={[
            {
              key: 'liner',
              label: (
                <span>
                  <CalendarOutlined /> 班轮计划
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={scheduleColumns}
                  dataSource={schedules}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
            {
              key: 'spot',
              label: (
                <span>
                  <ThunderboltOutlined /> 现舱秒杀
                  <Badge count={spotContainers.length} style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} />
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 6 }}>
                    <Space>
                      <ThunderboltOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      <span style={{ fontWeight: 'bold' }}>限时秒杀</span>
                      <span style={{ color: '#666' }}>优质舱位限时特价，先到先得</span>
                    </Space>
                  </div>
                  <Table
                    rowKey="id"
                    columns={spotColumns}
                    dataSource={spotContainers}
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              ),
            },
            {
              key: 'bidding',
              label: (
                <span>
                  <RiseOutlined /> 竞价舱位
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={bidColumns}
                  dataSource={bidSlots}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="现舱秒杀预订"
        open={isBookModalVisible}
        onOk={handleSubmitBooking}
        onCancel={() => setIsBookModalVisible(false)}
        okText="确认预订"
        cancelText="取消"
        width={500}
      >
        {selectedContainer && (
          <div>
            <div style={{ padding: 16, background: '#fff7e6', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedContainer.container_size} - {selectedContainer.container_type}
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: 4 }}>
                    {selectedContainer.origin_port} → {selectedContainer.destination_port}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ textDecoration: 'line-through', color: '#999' }}>
                    ${selectedContainer.original_price}
                  </div>
                  <div style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                    ${selectedContainer.flash_price}
                  </div>
                </div>
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item name="company_name" label="公司名称" rules={[{ required: true }]}>
                <Input placeholder="请输入公司名称" />
              </Form.Item>
              <Form.Item name="contact_person" label="联系人" rules={[{ required: true }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
              <Form.Item name="contact_phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
                <Input placeholder="请输入货物类型" />
              </Form.Item>
              <Form.Item name="remarks" label="备注">
                <Input.TextArea rows={2} placeholder="其他说明" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="班轮订舱申请"
        open={isScheduleModalVisible}
        onOk={handleSubmitScheduleBooking}
        onCancel={() => setIsScheduleModalVisible(false)}
        okText="提交订舱"
        cancelText="取消"
        width={520}
      >
        {selectedSchedule && (
          <div>
            <div style={{ padding: 16, background: '#f0f5ff', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{selectedSchedule.route_code}</div>
              <div style={{ color: '#666', marginTop: 4 }}>
                {selectedSchedule.origin_port} → {selectedSchedule.destination_port}，{selectedSchedule.departure_day} 发船
              </div>
            </div>
            <Form form={scheduleForm} layout="vertical">
              <Form.Item name="route" label="航线">
                <Input disabled />
              </Form.Item>
              <Form.Item name="company_name" label="公司名称" rules={[{ required: true }]}>
                <Input placeholder="请输入公司名称" />
              </Form.Item>
              <Form.Item name="contact_person" label="联系人" rules={[{ required: true }]}>
                <Input placeholder="请输入联系人" />
              </Form.Item>
              <Form.Item name="teu" label="订舱数量(TEU)" rules={[{ required: true }]}>
                <Input type="number" placeholder="请输入订舱数量" />
              </Form.Item>
              <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
                <Input placeholder="请输入货物类型" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContainerBooking;
