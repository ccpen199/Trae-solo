import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, Switch, message, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { eventsAPI, seatsAPI, pricingAPI } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [seatModalVisible, setSeatModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();
  const [seatForm] = Form.useForm();
  const [priceForm] = Form.useForm();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.list({ page: 1, limit: 100 });
      setEvents(res.events || []);
    } catch (err) {
      message.error('加载活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await eventsAPI.create({
        ...values,
        start_time: values.start_time.format('YYYY-MM-DD HH:mm:ss')
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadEvents();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleToggleHot = async (id, isHot) => {
    try {
      await eventsAPI.update(id, { is_hot: isHot ? 1 : 0 });
      message.success('更新成功');
      loadEvents();
    } catch (err) {
      message.error('更新失败');
    }
  };

  const handleCreateSeatMap = async (values) => {
    try {
      const seatMapRes = await seatsAPI.createMap({
        eventId: currentEvent.id,
        name: values.name,
        layoutData: {}
      });

      const seats = [];
      for (let r = 1; r <= values.rows; r++) {
        for (let s = 1; s <= values.seatsPerRow; s++) {
          seats.push({
            row: String.fromCharCode(64 + r),
            seat_number: s,
            area: values.area || '主区',
            price_tier: values.priceTier || 'A'
          });
        }
      }

      await seatsAPI.createSeats({
        seatMapId: seatMapRes.id,
        seats
      });

      message.success('座位图创建成功');
      setSeatModalVisible(false);
      seatForm.resetFields();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleCreatePrice = async (values) => {
    try {
      await pricingAPI.create({
        eventId: currentEvent.id,
        ...values,
        startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss')
      });
      message.success('票价策略创建成功');
      setPriceModalVisible(false);
      priceForm.resetFields();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {text}
          {record.is_hot ? <Tag color="red">热门</Tag> : null}
        </Space>
      )
    },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '场馆', dataIndex: 'venue', key: 'venue', width: 150 },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    {
      title: '热门推荐',
      dataIndex: 'is_hot',
      key: 'is_hot',
      render: (v, record) => <Switch checked={!!v} onChange={(checked) => handleToggleHot(record.id, checked)} />
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<SettingOutlined />} onClick={() => { setCurrentEvent(record); setSeatModalVisible(true); }}>
            座位图
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setCurrentEvent(record); setPriceModalVisible(true); }}>
            票价
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>活动管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建活动
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建活动"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="活动名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select>
                  <Option value="concert">演唱会</Option>
                  <Option value="drama">话剧音乐剧</Option>
                  <Option value="sports">体育赛事</Option>
                  <Option value="exhibition">展览</Option>
                  <Option value="movie">电影</Option>
                  <Option value="variety">亲子儿童</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="venue" label="场馆" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="城市" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="organizer" label="主办方">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="活动描述">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建座位图"
        open={seatModalVisible}
        onCancel={() => setSeatModalVisible(false)}
        footer={null}
      >
        <Form form={seatForm} layout="vertical" onFinish={handleCreateSeatMap}>
          <Form.Item name="name" label="座位图名称" initialValue="主会场" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rows" label="排数" initialValue={10} rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="seatsPerRow" label="每排座位数" initialValue={15} rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="area" label="区域" initialValue="主区">
            <Input />
          </Form.Item>
          <Form.Item name="priceTier" label="票价等级" initialValue="A">
            <Select>
              <Option value="A">A区</Option>
              <Option value="B">B区</Option>
              <Option value="C">C区</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建座位</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建票价策略"
        open={priceModalVisible}
        onCancel={() => setPriceModalVisible(false)}
        footer={null}
      >
        <Form form={priceForm} layout="vertical" onFinish={handleCreatePrice}>
          <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
            <Input placeholder="如：早鸟票、正价票" />
          </Form.Item>
          <Form.Item name="type" label="策略类型" initialValue="normal" rules={[{ required: true }]}>
            <Select>
              <Option value="early_bird">早鸟票</Option>
              <Option value="normal">正价票</Option>
              <Option value="fan">粉丝专属</Option>
              <Option value="charity">公益票</Option>
            </Select>
          </Form.Item>
          <Form.Item name="basePrice" label="基础票价" rules={[{ required: true }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discountType" label="折扣类型">
                <Select>
                  <Option value="percentage">百分比折扣</Option>
                  <Option value="fixed">固定金额减</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountValue" label="折扣值">
                <Input type="number" placeholder="如 10 表示 10% 或 10元" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="生效时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="说明">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建策略</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Events;
