import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  TimePicker,
  Tag,
  Card,
  Row,
  Col,
  Upload,
  message,
  Switch,
  Checkbox,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAppStore } from '@/store/appStore';
import { Waybill, Address, CargoInfo } from '@/types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = TimePicker;

const WaybillsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const waybills = useAppStore((state) => state.waybills);
  const customers = useAppStore((state) => state.customers);
  const addWaybill = useAppStore((state) => state.addWaybill);

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待揽收', color: 'default' },
    picked: { text: '已揽收', color: 'blue' },
    in_transit: { text: '运输中', color: 'processing' },
    arrived: { text: '已到达', color: 'purple' },
    delivered: { text: '已签收', color: 'success' },
    exception: { text: '异常', color: 'error' },
  };

  const timeWindows = [
    '08:00-10:00',
    '09:00-12:00',
    '10:00-12:00',
    '14:00-17:00',
    '15:00-18:00',
    '17:00-20:00',
  ];

  const filteredWaybills = waybills.filter((w) => {
    const matchSearch =
      !searchText ||
      w.waybillNo.toLowerCase().includes(searchText.toLowerCase()) ||
      w.customerName.includes(searchText) ||
      w.receiver.name.includes(searchText);
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      width: 160,
      render: (text: string, record: Waybill) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      ),
    },
    {
      title: '客户名称',
      dataIndex: ['customerName'],
      key: 'customerName',
    },
    {
      title: '发货人',
      key: 'sender',
      render: (_: unknown, record: Waybill) => (
        <div>
          <div>{record.sender.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.sender.phone}</div>
        </div>
      ),
    },
    {
      title: '收货人',
      key: 'receiver',
      render: (_: unknown, record: Waybill) => (
        <div>
          <div>{record.receiver.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.receiver.city} {record.receiver.district}
          </div>
        </div>
      ),
    },
    {
      title: '货物信息',
      key: 'cargo',
      render: (_: unknown, record: Waybill) => (
        <div>
          <div>{record.cargo.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.cargo.weight}kg / {record.cargo.volume}m³
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          normal: 'default',
          high: 'orange',
          urgent: 'red',
        };
        const textMap: Record<string, string> = {
          normal: '普通',
          high: '高优',
          urgent: '加急',
        };
        return <Tag color={colorMap[priority]}>{textMap[priority]}</Tag>;
      },
    },
    {
      title: '运费',
      dataIndex: 'freight',
      key: 'freight',
      width: 100,
      render: (value: number) => `¥${value}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Waybill) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm title="确定删除此运单？" onConfirm={() => {}}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (waybill: Waybill) => {
    setSelectedWaybill(waybill);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    const newWaybill: Waybill = {
      id: Date.now().toString(),
      waybillNo: `KY${dayjs().format('YYYYMMDD')}${String(waybills.length + 1).padStart(5, '0')}`,
      status: 'pending',
      sender: {
        name: values.senderName,
        phone: values.senderPhone,
        company: values.senderCompany,
        province: values.senderProvince,
        city: values.senderCity,
        district: values.senderDistrict,
        address: values.senderAddress,
      },
      receiver: {
        name: values.receiverName,
        phone: values.receiverPhone,
        company: values.receiverCompany,
        province: values.receiverProvince,
        city: values.receiverCity,
        district: values.receiverDistrict,
        address: values.receiverAddress,
      },
      cargo: {
        name: values.cargoName,
        type: values.cargoType,
        weight: values.cargoWeight,
        volume: values.cargoVolume,
        quantity: values.cargoQuantity,
        value: values.cargoValue,
        temperatureControlled: values.temperatureControlled,
        temperatureRange: values.temperatureRange,
        fragile: values.fragile,
        hazardous: values.hazardous,
        remark: values.cargoRemark,
      },
      appointmentTime: {
        date: values.appointmentDate.format('YYYY-MM-DD'),
        timeWindow: values.appointmentTimeWindow,
      },
      freight: Math.round((values.cargoWeight * 5 + values.cargoVolume * 150) * 100) / 100,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      priority: values.priority,
      isGreenChannel: values.isGreenChannel,
      customerId: values.customerId,
      customerName: customers.find((c) => c.id === values.customerId)?.name || '',
      trackingNodes: [],
      photos: [],
    };

    addWaybill(newWaybill);
    setIsModalOpen(false);
    form.resetFields();
    message.success('运单创建成功');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        message.success(`成功导入 ${jsonData.length} 条运单数据`);
      };
      reader.readAsBinaryString(file);
      return false;
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          电子运单管理
        </Title>
        <Space>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>批量导入</Button>
          </Upload>
          <Button icon={<FileExcelOutlined />}>导出Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建运单
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索运单号/客户名称/收货人"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="运单状态"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="pending">待揽收</Option>
              <Option value="picked">已揽收</Option>
              <Option value="in_transit">运输中</Option>
              <Option value="arrived">已到达</Option>
              <Option value="delivered">已签收</Option>
              <Option value="exception">异常</Option>
            </Select>
          </Col>
          <Col span={14}>
            <Space>
              <Tag color="red">加急</Tag>
              <Tag color="orange">高优</Tag>
              <Tag color="default">普通</Tag>
              <span style={{ color: '#999', marginLeft: 8 }}>
                共 {filteredWaybills.length} 条记录
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredWaybills}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title="新建运单"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="所属客户"
                name="customerId"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="优先级"
                name="priority"
                initialValue="normal"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="normal">普通</Option>
                  <Option value="high">高优</Option>
                  <Option value="urgent">加急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="绿色通道" name="isGreenChannel" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>发货人信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="姓名"
                name="senderName"
                rules={[{ required: true, message: '请输入发货人姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="电话"
                name="senderPhone"
                rules={[{ required: true, message: '请输入发货人电话' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="公司" name="senderCompany">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="省份"
                name="senderProvince"
                rules={[{ required: true, message: '请选择省份' }]}
              >
                <Select placeholder="请选择">
                  <Option value="广东省">广东省</Option>
                  <Option value="北京市">北京市</Option>
                  <Option value="上海市">上海市</Option>
                  <Option value="浙江省">浙江省</Option>
                  <Option value="江苏省">江苏省</Option>
                  <Option value="四川省">四川省</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="城市"
                name="senderCity"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select placeholder="请选择">
                  <Option value="深圳市">深圳市</Option>
                  <Option value="广州市">广州市</Option>
                  <Option value="北京市">北京市</Option>
                  <Option value="上海市">上海市</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="区县"
                name="senderDistrict"
                rules={[{ required: true, message: '请输入区县' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="详细地址" name="senderAddress">
            <Input />
          </Form.Item>

          <Title level={5}>收货人信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="姓名"
                name="receiverName"
                rules={[{ required: true, message: '请输入收货人姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="电话"
                name="receiverPhone"
                rules={[{ required: true, message: '请输入收货人电话' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="公司" name="receiverCompany">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="省份"
                name="receiverProvince"
                rules={[{ required: true, message: '请选择省份' }]}
              >
                <Select placeholder="请选择">
                  <Option value="广东省">广东省</Option>
                  <Option value="北京市">北京市</Option>
                  <Option value="上海市">上海市</Option>
                  <Option value="浙江省">浙江省</Option>
                  <Option value="江苏省">江苏省</Option>
                  <Option value="四川省">四川省</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="城市"
                name="receiverCity"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select placeholder="请选择">
                  <Option value="上海市">上海市</Option>
                  <Option value="杭州市">杭州市</Option>
                  <Option value="南京市">南京市</Option>
                  <Option value="成都市">成都市</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="区县"
                name="receiverDistrict"
                rules={[{ required: true, message: '请输入区县' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="详细地址" name="receiverAddress">
            <Input />
          </Form.Item>

          <Title level={5}>货物信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="货物名称"
                name="cargoName"
                rules={[{ required: true, message: '请输入货物名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="货物类型" name="cargoType">
                <Select placeholder="请选择">
                  <Option value="电子产品">电子产品</Option>
                  <Option value="服装">服装</Option>
                  <Option value="食品">食品</Option>
                  <Option value="医疗器械">医疗器械</Option>
                  <Option value="日用品">日用品</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="货物价值(元)"
                name="cargoValue"
                rules={[{ required: true, message: '请输入货物价值' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="重量(kg)"
                name="cargoWeight"
                rules={[{ required: true, message: '请输入重量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="体积(m³)"
                name="cargoVolume"
                rules={[{ required: true, message: '请输入体积' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="件数"
                name="cargoQuantity"
                initialValue={1}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="货物属性" style={{ marginBottom: 0 }}>
                <Space>
                  <Form.Item name="fragile" valuePropName="checked" noStyle>
                    <Checkbox>易碎</Checkbox>
                  </Form.Item>
                  <Form.Item name="hazardous" valuePropName="checked" noStyle>
                    <Checkbox>危险品</Checkbox>
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="温控运输" name="temperatureControlled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="温度范围" name="temperatureRange">
                <Select placeholder="请选择">
                  <Option value="0-4℃">0-4℃（冷藏）</Option>
                  <Option value="2-8℃">2-8℃（冷链）</Option>
                  <Option value="-18℃以下">-18℃以下（冷冻）</Option>
                  <Option value="常温">常温</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="cargoRemark">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Title level={5}>预约上门</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="上门日期"
                name="appointmentDate"
                rules={[{ required: true, message: '请选择上门日期' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="时间窗"
                name="appointmentTimeWindow"
                rules={[{ required: true, message: '请选择时间窗' }]}
              >
                <Select placeholder="请选择上门时间段">
                  {timeWindows.map((tw) => (
                    <Option key={tw} value={tw}>
                      {tw}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="运单详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedWaybill && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{selectedWaybill.waybillNo}</span>
                <Tag color={statusMap[selectedWaybill.status].color} style={{ marginLeft: 12 }}>
                  {statusMap[selectedWaybill.status].text}
                </Tag>
                {selectedWaybill.isGreenChannel && <Tag color="green">绿色通道</Tag>}
              </div>
              <div style={{ color: '#999' }}>{selectedWaybill.createTime}</div>
            </div>

            <Card size="small" title="发货人信息" style={{ marginBottom: 12 }}>
              <Row>
                <Col span={6}>{selectedWaybill.sender.name}</Col>
                <Col span={6}>{selectedWaybill.sender.phone}</Col>
                <Col span={12}>
                  {selectedWaybill.sender.province} {selectedWaybill.sender.city}{' '}
                  {selectedWaybill.sender.district} {selectedWaybill.sender.address}
                </Col>
              </Row>
            </Card>

            <Card size="small" title="收货人信息" style={{ marginBottom: 12 }}>
              <Row>
                <Col span={6}>{selectedWaybill.receiver.name}</Col>
                <Col span={6}>{selectedWaybill.receiver.phone}</Col>
                <Col span={12}>
                  {selectedWaybill.receiver.province} {selectedWaybill.receiver.city}{' '}
                  {selectedWaybill.receiver.district} {selectedWaybill.receiver.address}
                </Col>
              </Row>
            </Card>

            <Card size="small" title="货物信息" style={{ marginBottom: 12 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>货物名称</div>
                  <div>{selectedWaybill.cargo.name}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>货物类型</div>
                  <div>{selectedWaybill.cargo.type}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>重量/体积</div>
                  <div>
                    {selectedWaybill.cargo.weight}kg / {selectedWaybill.cargo.volume}m³
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>件数</div>
                  <div>{selectedWaybill.cargo.quantity}件</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>货物价值</div>
                  <div>¥{selectedWaybill.cargo.value}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>运费</div>
                  <div style={{ color: '#f5222d', fontWeight: 500 }}>¥{selectedWaybill.freight}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>温控</div>
                  <div>{selectedWaybill.cargo.temperatureControlled ? selectedWaybill.cargo.temperatureRange : '常温'}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: '#999', fontSize: 12 }}>属性</div>
                  <div>
                    {selectedWaybill.cargo.fragile && <Tag color="orange">易碎</Tag>}
                    {selectedWaybill.cargo.hazardous && <Tag color="red">危险品</Tag>}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="预约上门">
              <Row>
                <Col span={12}>
                  上门日期：{selectedWaybill.appointmentTime.date}
                </Col>
                <Col span={12}>
                  时间窗：{selectedWaybill.appointmentTime.timeWindow}
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WaybillsPage;
