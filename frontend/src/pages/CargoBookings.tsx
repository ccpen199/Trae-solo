import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, InputNumber, message } from 'antd';
import { PlusOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function CargoBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedVoyages, setMatchedVoyages] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (params?: any) => {
    setLoading(true);
    try {
      const data = await apiService.get('/cargo-bookings', params);
      setBookings(data as any[]);
    } catch (err) {
      message.error('加载货盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    inquiry: { color: 'blue', text: '询盘中' },
    quoted: { color: 'orange', text: '已报价' },
    confirmed: { color: 'green', text: '已确认' },
    cancelled: { color: 'default', text: '已取消' },
  };

  const handleMatchVoyages = async (booking: any) => {
    setSelectedBooking(booking);
    setMatchModalVisible(true);
    setMatchingLoading(true);
    try {
      const data = await apiService.get(`/cargo-bookings/${booking.id}/match-voyages`);
      setMatchedVoyages(data as any[]);
    } catch (err) {
      message.error('匹配失败');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        cargo_owner_id: 'demo-user-1',
        special_requirements: values.special_requirements || [],
        compliance_docs: values.compliance_docs || [],
      };
      await apiService.post('/cargo-bookings', payload);
      message.success('货盘发布成功');
      setIsModalVisible(false);
      form.resetFields();
      loadBookings();
    } catch (err) {
      message.error('发布失败');
    }
  };

  const columns = [
    {
      title: '货主',
      key: 'owner',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.owner_name}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.owner_company}</div>
        </div>
      ),
    },
    {
      title: '货物类型',
      dataIndex: 'cargo_type',
      key: 'cargo_type',
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_: any, record: any) => (
        <div>
          <div>{record.teu} TEU</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.weight} 吨</div>
        </div>
      ),
    },
    {
      title: '运输路线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>→ {record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '时间窗口',
      key: 'time',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: '12px' }}>最早出发: {dayjs(record.earliest_departure).format('MM-DD')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>最晚到达: {dayjs(record.latest_arrival).format('MM-DD')}</div>
        </div>
      ),
    },
    {
      title: '预算运价',
      dataIndex: 'budget_rate',
      key: 'budget_rate',
      render: (rate: number) => <span style={{ color: '#ff7a45' }}>${rate?.toLocaleString()}/TEU</span>,
    },
    {
      title: '特殊要求',
      dataIndex: 'special_requirements',
      key: 'special_requirements',
      render: (reqs: string[]) => (
        <div className="tag-list">
          {reqs?.map((r, i) => (
            <span key={i} className="tag-item">{r}</span>
          ))}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleMatchVoyages(record)}>
            智能匹配
          </Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">货盘管理</div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={loadBookings}>
          <Form.Item name="cargo_type" label="货物类型">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="origin_port" label="出发港">
            <Input placeholder="出发港" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
              <Option value="inquiry">询盘中</Option>
              <Option value="quoted">已报价</Option>
              <Option value="confirmed">已确认</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => loadBookings()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            发布货盘
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={bookings}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="发布新货盘"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="发布"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
            <Input placeholder="如：电子产品、服装等" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="origin_port" label="出发港" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="出发港口" />
            </Form.Item>
            <Form.Item name="destination_port" label="目的港" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="目的港口" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="teu" label="TEU数量" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="weight" label="总重量(吨)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="budget_rate" label="预算运价(USD/TEU)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="earliest_departure" label="最早出发日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="latest_arrival" label="最晚到达日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="special_requirements" label="特殊要求">
            <Select mode="tags" placeholder="添加特殊要求" style={{ width: '100%' }}>
              <Option value="防潮">防潮</Option>
              <Option value="轻放">轻放</Option>
              <Option value="冷藏">冷藏</Option>
              <Option value="危险品">危险品</Option>
              <Option value="大件">大件运输</Option>
            </Select>
          </Form.Item>
          <Form.Item name="compliance_docs" label="已备单证">
            <Select mode="multiple" placeholder="选择已准备的单证">
              <Option value="商业发票">商业发票</Option>
              <Option value="装箱单">装箱单</Option>
              <Option value="产地证">产地证</Option>
              <Option value="报关单">报关单</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`AI智能匹配航次 - ${selectedBooking?.cargo_type || ''}`}
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={null}
        width={800}
      >
        {matchingLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>AI智能匹配中...</div>
        ) : matchedVoyages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无匹配的航次
          </div>
        ) : (
          <div>
            {matchedVoyages.map((item, index) => (
              <Card key={item.voyage.id} size="small" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className={`match-score ${item.score >= 70 ? 'high' : item.score >= 50 ? 'medium' : 'low'}`}>
                    {item.score}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {item.vessel.name} 
                      <Tag color="blue" style={{ marginLeft: 8 }}>{item.voyage.voyage_number}</Tag>
                    </div>
                    <div style={{ color: '#666', fontSize: '13px', marginBottom: 8 }}>
                      {item.voyage.origin_port} → {item.voyage.destination_port}
                    </div>
                    <div className="tag-list">
                      {item.reasons.map((r: string, i: number) => (
                        <span key={i} className="tag-item">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ff7a45', fontSize: '18px', fontWeight: 'bold' }}>
                      ${item.estimated_rate.toLocaleString()}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      碳排放: {item.carbon_estimate} kg CO₂
                    </div>
                    <Button type="primary" size="small" style={{ marginTop: 8 }}>
                      立即订舱
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CargoBookings;
