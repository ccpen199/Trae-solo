import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, message, Space, Statistic, Row, Col } from 'antd';
import { TruckOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SendOutlined, MailOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { STATUS_MAP, SIGN_TYPE_MAP } from '../../utils/constants';
import type { TableProps } from 'antd';

interface Package {
  id: string;
  trackingNumber: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: string;
  pickupCode?: string;
  courierName?: string;
  areaName?: string;
  createdAt: string;
}

export default function DeliveryPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/packages/search');
      setPackages(response.data);
    } catch (error) {
      message.error('获取包裹列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleGeneratePickupCode = async (packageId: string) => {
    try {
      await api.post('/packages/generate-pickup-code', { packageId });
      message.success('取件码已生成，通知已发送');
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成取件码失败');
    }
  };

  const handleStartDelivery = async (packageId: string) => {
    try {
      await api.post('/packages/start-delivery', { packageId });
      message.success('已开始派送');
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '开始派送失败');
    }
  };

  const handleSign = async (values: { signType: string; pickupCode?: string; signCode?: string }) => {
    if (!selectedPackage) return;
    
    try {
      await api.post('/packages/sign', {
        packageId: selectedPackage.id,
        signType: values.signType,
        pickupCode: values.pickupCode,
        signCode: values.signCode
      });
      message.success('签收成功');
      setSignModalVisible(false);
      form.resetFields();
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '签收失败');
    }
  };

  const handleMarkException = async (values: { type: string; reason: string }) => {
    if (!selectedPackage) return;
    
    try {
      await api.post('/packages/exception', {
        packageId: selectedPackage.id,
        type: values.type,
        reason: values.reason
      });
      message.success('异常已记录');
      setExceptionModalVisible(false);
      form.resetFields();
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '记录异常失败');
    }
  };

  const statusCounts = {
    in_station: packages.filter(p => p.status === 'in_station').length,
    sorted: packages.filter(p => p.status === 'sorted').length,
    notified: packages.filter(p => p.status === 'notified').length,
    delivering: packages.filter(p => p.status === 'delivering').length,
    signed: packages.filter(p => p.status === 'signed').length,
    exception: packages.filter(p => p.status === 'exception').length,
  };

  const columns: TableProps<Package>['columns'] = [
    {
      title: '运单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 160,
    },
    {
      title: '收件人',
      key: 'receiver',
      render: (_, record) => (
        <div>
          <div>{record.receiverName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.receiverPhone}</div>
        </div>
      ),
    },
    {
      title: '收件地址',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      ellipsis: true,
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color as any}>{info.label}</Tag>;
      },
    },
    {
      title: '取件码',
      dataIndex: 'pickupCode',
      key: 'pickupCode',
      width: 100,
      render: (code) => code || <Tag color="default">未生成</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => {
        const actions = [];
        
        if (['in_station', 'sorted'].includes(record.status)) {
          actions.push(
            <Button 
              type="link" 
              size="small"
              icon={<MailOutlined />}
              onClick={() => handleGeneratePickupCode(record.id)}
            >
              生成取件码
            </Button>
          );
        }
        
        if (['notified'].includes(record.status)) {
          actions.push(
            <Button 
              type="link" 
              size="small"
              icon={<TruckOutlined />}
              onClick={() => handleStartDelivery(record.id)}
            >
              开始派送
            </Button>
          );
        }
        
        if (['notified', 'delivering'].includes(record.status)) {
          actions.push(
            <Button 
              type="link" 
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedPackage(record);
                setSignModalVisible(true);
              }}
            >
              签收
            </Button>
          );
        }
        
        if (!['signed', 'exception'].includes(record.status)) {
          actions.push(
            <Button 
              type="link" 
              size="small"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setSelectedPackage(record);
                setExceptionModalVisible(true);
              }}
            >
              异常
            </Button>
          );
        }
        
        return <Space>{actions}</Space>;
      },
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic 
              title="待分拣/入库" 
              value={statusCounts.in_station} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="已分拣" 
              value={statusCounts.sorted} 
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="已通知" 
              value={statusCounts.notified} 
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="派送中" 
              value={statusCounts.delivering} 
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="已签收" 
              value={statusCounts.signed} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="异常件" 
              value={statusCounts.exception} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="签收包裹"
        open={signModalVisible}
        onCancel={() => setSignModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSign}>
          <Form.Item
            name="signType"
            label="签收方式"
            rules={[{ required: true, message: '请选择签收方式' }]}
          >
            <Select>
              <Select.Option value="station">驿站自提</Select.Option>
              <Select.Option value="home">上门派送</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const signType = getFieldValue('signType');
              if (signType === 'station') {
                return (
                  <Form.Item
                    name="pickupCode"
                    label="取件码"
                    rules={[{ required: true, message: '请输入取件码' }]}
                  >
                    <Input placeholder="请输入取件码" />
                  </Form.Item>
                );
              }
              if (signType === 'home') {
                return (
                  <Form.Item
                    name="signCode"
                    label="签收码（可选）"
                  >
                    <Input placeholder="请输入签收码" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认签收
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记异常"
        open={exceptionModalVisible}
        onCancel={() => setExceptionModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleMarkException}>
          <Form.Item
            name="type"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select>
              <Select.Option value="damaged">破损</Select.Option>
              <Select.Option value="rejected">拒收</Select.Option>
              <Select.Option value="unreachable">无法联系</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="异常原因"
            rules={[{ required: true, message: '请输入异常原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细描述异常原因" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" danger htmlType="submit" block>
              确认标记
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
