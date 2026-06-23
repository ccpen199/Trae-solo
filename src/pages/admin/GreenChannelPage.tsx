import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Switch,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  RocketOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { Waybill } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const GreenChannelPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [form] = Form.useForm();

  const waybills = useAppStore((state) => state.waybills);

  const greenChannelOrders = waybills.filter((w) => w.isGreenChannel);
  const inTransitGreen = greenChannelOrders.filter((w) => w.status === 'in_transit').length;
  const completedGreen = greenChannelOrders.filter((w) => w.status === 'delivered').length;

  const priorityMap: Record<string, { text: string; color: string }> = {
    normal: { text: '普通', color: 'default' },
    high: { text: '高优', color: 'orange' },
    urgent: { text: '加急', color: 'red' },
  };

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待揽收', color: 'default' },
    picked: { text: '已揽收', color: 'blue' },
    in_transit: { text: '运输中', color: 'processing' },
    arrived: { text: '已到达', color: 'purple' },
    delivered: { text: '已签收', color: 'success' },
    exception: { text: '异常', color: 'error' },
  };

  const filteredWaybills = waybills.filter((w) => {
    const matchSearch =
      !searchText ||
      w.waybillNo.includes(searchText) ||
      w.customerName.includes(searchText);
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus && w.isGreenChannel;
  });

  const columns = [
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const info = priorityMap[priority];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
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
      title: '货物信息',
      key: 'cargo',
      render: (_: unknown, record: Waybill) => (
        <div>
          <div>{record.cargo.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.cargo.weight}kg · ¥{record.cargo.value}
          </div>
        </div>
      ),
    },
    {
      title: '路线',
      key: 'route',
      render: (_: unknown, record: Waybill) => (
        <span>
          {record.sender.city} → {record.receiver.city}
        </span>
      ),
    },
    {
      title: '时效要求',
      key: 'timing',
      render: () => '当日达',
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      render: (text: string) => text || '-',
    },
    {
      title: '预计到达',
      dataIndex: 'estimatedArrival',
      key: 'estimatedArrival',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">详情</Button>
          <Button type="link" size="small">调度</Button>
        </Space>
      ),
    },
  ];

  const handleAddGreenChannel = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    message.success('绿色通道订单创建成功');
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RocketOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          绿色通道管理
        </Title>
        <Button type="primary" danger icon={<PlusOutlined />} onClick={handleAddGreenChannel}>
          开通绿色通道
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="绿色通道订单"
              value={greenChannelOrders.length}
              suffix="单"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运输中"
              value={inTransitGreen}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={completedGreen}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="准时率"
              value={98.5}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            绿色通道说明
          </Space>
        }
        type="inner"
      >
        <div style={{ color: '#666', lineHeight: 1.8 }}>
          <p>• 绿色通道订单享有优先揽收、优先运输、优先派送的特权</p>
          <p>• 钻石客户和黄金客户可开通绿色通道服务</p>
          <p>• 加急订单（urgent）自动进入绿色通道</p>
          <p>• 高价值货物（单票价值超过50万）自动进入绿色通道</p>
          <p>• 绿色通道订单全程GPS实时追踪，超时自动预警</p>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索运单号/客户名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="订单状态"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="pending">待揽收</Option>
              <Option value="in_transit">运输中</Option>
              <Option value="delivered">已签收</Option>
              <Option value="exception">异常</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Tag color="red">加急</Tag>
              <Tag color="orange">高优</Tag>
              <span style={{ color: '#999' }}>
                共 {filteredWaybills.length} 条绿色通道订单
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredWaybills}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="开通绿色通道"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="确认开通"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="选择运单"
            name="waybillId"
            rules={[{ required: true, message: '请选择运单' }]}
          >
            <Select placeholder="请选择需要开通绿色通道的运单" showSearch>
              {waybills
                .filter((w) => !w.isGreenChannel)
                .map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.waybillNo} - {w.customerName}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            initialValue="high"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Option value="high">高优</Option>
              <Option value="urgent">加急</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="时效要求"
                name="timing"
                rules={[{ required: true, message: '请选择时效' }]}
              >
                <Select>
                  <Option value="same_day">当日达</Option>
                  <Option value="next_day">次日达</Option>
                  <Option value="two_day">两日内</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="超时赔付" name="compensation" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="绿色通道费用"
            name="greenFee"
            initialValue={200}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              min={0}
              step={50}
            />
          </Form.Item>

          <Form.Item label="备注说明" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GreenChannelPage;
