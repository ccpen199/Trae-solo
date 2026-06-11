import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Descriptions, Progress, Timeline } from 'antd';
import { PlusOutlined, EnvironmentOutlined, CheckCircleOutlined, ThunderboltOutlined, DashboardOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

function SpecialEquipment() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/special-equipment', { status: 'available' });
      setEquipment(data as any[]);
    } catch (err) {
      message.error('加载设备数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (item: any) => {
    setSelectedEquipment(item);
    setIsDetailModalVisible(true);
  };

  const handleRent = async () => {
    try {
      const values = await form.validateFields();
      await apiService.post('/rental-orders', {
        ...values,
        equipment_id: selectedEquipment.id,
        renter_id: 'demo-renter-1',
        start_date: values.rental_period?.[0]?.toISOString(),
        end_date: values.rental_period?.[1]?.toISOString(),
      });
      message.success('租赁申请已提交');
      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error('提交失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    available: { color: 'green', text: '可租用' },
    rented: { color: 'blue', text: '已租用' },
    maintenance: { color: 'orange', text: '维护中' },
  };

  const equipmentTypes = ['大件运输车', '冷藏车', '危险品运输车', '集装箱叉车', '正面吊', '堆高机'];

  const columns = [
    {
      title: '设备名称',
      key: 'name',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: 15 }}>{record.name}</div>
          <Tag color="geekblue">{record.type}</Tag>
        </div>
      ),
    },
    {
      title: '设备型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '设备参数',
      dataIndex: 'parameters',
      key: 'parameters',
      render: (params: any) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {Object.entries(params || {}).map(([key, value]) => (
            <div key={key}>{key}: {value as string}</div>
          ))}
        </div>
      ),
    },
    {
      title: '日租金',
      dataIndex: 'daily_rate',
      key: 'daily_rate',
      render: (rate: number) => (
        <span style={{ color: '#ff7a45', fontWeight: 'bold', fontSize: 16 }}>¥{rate?.toLocaleString()}/天</span>
      ),
    },
    {
      title: '所在位置',
      dataIndex: 'location',
      key: 'location',
      render: (loc: string) => <Space><EnvironmentOutlined /> {loc}</Space>,
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
      title: '服务商',
      dataIndex: 'owner_company',
      key: 'owner_company',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => {
              setSelectedEquipment(record);
              setIsModalVisible(true);
            }}
          >
            立即租赁
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">特种车船服务</div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <span style={{ color: '#666' }}>设备类型：</span>
          {['全部', ...equipmentTypes].map((type, idx) => (
            <Tag
              key={type}
              color={idx === 0 ? 'blue' : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13 }}
              onClick={() => loadEquipment()}
            >
              {type}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            发布设备
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={equipment}
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="设备详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedEquipment && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div style={{
                width: 200,
                height: 150,
                background: 'linear-gradient(135deg, #f0f5ff, #d6e4ff)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DashboardOutlined style={{ fontSize: 48, color: '#1677ff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: 8 }}>{selectedEquipment.name}</h2>
                <Tag color="geekblue" style={{ marginBottom: 12 }}>{selectedEquipment.type}</Tag>
                <div style={{ fontSize: 24, color: '#ff7a45', fontWeight: 'bold', marginBottom: 8 }}>
                  ¥{selectedEquipment.daily_rate?.toLocaleString()}/天
                </div>
                <Space size="large">
                  <span><EnvironmentOutlined /> {selectedEquipment.location}</span>
                  <span><CheckCircleOutlined /> 资质齐全</span>
                </Space>
              </div>
            </div>

            <Descriptions title="设备参数" bordered size="small" column={2}>
              {Object.entries(selectedEquipment.parameters || {}).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>{value as string}</Descriptions.Item>
              ))}
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>资质证书</h4>
              <div className="tag-list">
                {(selectedEquipment.certificates || []).map((cert: string, idx: number) => (
                  <Tag key={idx} color="green">{cert}</Tag>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>服务商信息</h4>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="公司名称">{selectedEquipment.owner_company}</Descriptions.Item>
                <Descriptions.Item label="联系人">{selectedEquipment.owner_name}</Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button>收藏</Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={() => {
                    setIsDetailModalVisible(false);
                    setIsModalVisible(true);
                  }}
                >
                  立即租赁
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="租赁申请"
        open={isModalVisible}
        onOk={handleRent}
        onCancel={() => setIsModalVisible(false)}
        width={500}
        okText="提交申请"
        cancelText="取消"
      >
        {selectedEquipment && (
          <div>
            <div style={{ padding: 12, background: '#f6ffed', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold' }}>{selectedEquipment.name}</div>
              <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                ¥{selectedEquipment.daily_rate?.toLocaleString()}/天
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item name="rental_period" label="租赁周期" rules={[{ required: true }]}>
                <RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="delivery_address" label="交付地点">
                <Input placeholder="请输入设备交付地址" />
              </Form.Item>
              <Form.Item name="company_name" label="租用公司" rules={[{ required: true }]}>
                <Input placeholder="请输入公司名称" />
              </Form.Item>
              <Form.Item name="contact_person" label="联系人" rules={[{ required: true }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
              <Form.Item name="contact_phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item name="purpose" label="使用用途">
                <Input.TextArea rows={2} placeholder="请简要说明使用用途" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SpecialEquipment;
