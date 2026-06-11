import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, DatePicker, InputNumber, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

function Voyages() {
  const [voyages, setVoyages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [vessels, setVessels] = useState<any[]>([]);

  useEffect(() => {
    loadVoyages();
    loadVessels();
  }, []);

  const loadVoyages = async (params?: any) => {
    setLoading(true);
    try {
      const data = await apiService.get('/voyages', params);
      setVoyages(data as any[]);
    } catch (err) {
      message.error('加载航次数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadVessels = async () => {
    try {
      const data = await apiService.get('/vessels');
      setVessels(data as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    published: { color: 'blue', text: '已发布' },
    loading: { color: 'orange', text: '装货中' },
    in_transit: { color: 'green', text: '运输中' },
    discharging: { color: 'purple', text: '卸货中' },
    completed: { color: 'default', text: '已完成' },
  };

  const columns = [
    {
      title: '船舶名称',
      dataIndex: 'vessel_name',
      key: 'vessel_name',
      render: (text: string, record: any) => (
        <Space>
          <span style={{ fontWeight: '500' }}>{text}</span>
          <Tag color="geekblue">{record.vessel_type}</Tag>
        </Space>
      ),
    },
    {
      title: '航次号',
      dataIndex: 'voyage_number',
      key: 'voyage_number',
    },
    {
      title: '航线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>↓</div>
          <div>{record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '出发时间',
      dataIndex: 'etd',
      key: 'etd',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '到达时间',
      dataIndex: 'eta',
      key: 'eta',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '可用舱位',
      key: 'capacity',
      render: (_: any, record: any) => (
        <div>
          <div>{record.available_teu} TEU</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.available_weight} 吨</div>
        </div>
      ),
    },
    {
      title: '基础运价',
      dataIndex: 'base_rate',
      key: 'base_rate',
      render: (rate: number) => <span style={{ color: '#ff7a45', fontWeight: 'bold' }}>${rate?.toLocaleString()}/TEU</span>,
    },
    {
      title: '碳排放估算',
      dataIndex: 'carbon_estimate',
      key: 'carbon_estimate',
      render: (val: number) => <span>{val} kg CO₂/TEU</span>,
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
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
          <Button type="link" size="small">
            匹配货盘
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = (values: any) => {
    loadVoyages(values);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        etd: values.etd.toISOString(),
        eta: values.eta.toISOString(),
        container_types: values.container_types || [],
        compliance_certificates: values.compliance_certificates || [],
      };
      await apiService.post('/voyages', payload);
      message.success('航次发布成功');
      setIsModalVisible(false);
      form.resetFields();
      loadVoyages();
    } catch (err) {
      message.error('发布失败');
    }
  };

  return (
    <div>
      <div className="page-title">航次动态</div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="origin_port" label="出发港">
            <Input placeholder="请输入出发港" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="destination_port" label="目的港">
            <Input placeholder="请输入目的港" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
              <Option value="published">已发布</Option>
              <Option value="loading">装货中</Option>
              <Option value="in_transit">运输中</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => loadVoyages()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            发布航次
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={voyages}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="发布新航次"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="发布"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vessel_id" label="选择船舶" rules={[{ required: true, message: '请选择船舶' }]}>
            <Select placeholder="请选择船舶" onChange={setSelectedVessel}>
              {vessels.map(v => (
                <Option key={v.id} value={v.id}>{v.name} - {v.type}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="voyage_number" label="航次号" rules={[{ required: true }]}>
            <Input placeholder="如 V1234" />
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
            <Form.Item name="etd" label="预计出发时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="eta" label="预计到达时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="available_teu" label="可用TEU" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="available_weight" label="可用载重(吨)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="base_rate" label="基础运价(USD/TEU)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="container_types" label="集装箱类型">
            <Select mode="multiple" placeholder="选择可装载的箱型">
              <Option value="20GP">20GP</Option>
              <Option value="40GP">40GP</Option>
              <Option value="40HQ">40HQ</Option>
              <Option value="45HQ">45HQ</Option>
              <Option value="20RF">20RF冷藏箱</Option>
              <Option value="40RF">40RF冷藏箱</Option>
            </Select>
          </Form.Item>
          <Form.Item name="compliance_certificates" label="合规资质">
            <Select mode="multiple" placeholder="选择合规证书">
              <Option value="SOLAS">SOLAS</Option>
              <Option value="MARPOL">MARPOL</Option>
              <Option value="ISPS">ISPS</Option>
              <Option value="ISO9001">ISO9001</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Voyages;
