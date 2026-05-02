import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Modal, Form, Input, Select, Card, Row, Col, Statistic, InputNumber } from 'antd';
import { CheckOutlined, TruckOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { warehousesAPI } from '../services/api';

interface Order {
  id: number;
  platform_order_id: string;
  platform: string;
  customer_info: any;
  items: any[];
  total_amount: string;
  status: string;
  shipping_status: string;
}

interface Shipment {
  id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  status: string;
  created_at: string;
}

const WarehouseManagement: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPendingOrders();
    loadShipments();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await warehousesAPI.getPending();
      setPendingOrders(response.data.orders);
    } catch (error) {
      message.error('加载待发货订单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadShipments = async () => {
    try {
      const response = await warehousesAPI.getShipments();
      setShipments(response.data.shipments);
    } catch (error) {
      console.error('Failed to load shipments');
    }
  };

  const handleShip = (order: Order) => {
    setSelectedOrder(order);
    form.resetFields();
    setShipModalVisible(true);
  };

  const handleShipSubmit = async () => {
    try {
      const values = await form.validateFields();
      await warehousesAPI.ship(selectedOrder!.id, values);
      message.success('发货成功');
      setShipModalVisible(false);
      loadPendingOrders();
      loadShipments();
    } catch (error) {
      message.error('发货失败');
    }
  };

  const pendingColumns: ColumnsType<Order> = [
    {
      title: '平台订单号',
      dataIndex: 'platform_order_id',
      key: 'platform_order_id'
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => <Tag color={platform === 'amazon' ? '#FF9900' : platform === 'ebay' ? '#E53238' : platform === 'shopify' ? '#96BF48' : '#000'}>{platform.toUpperCase()}</Tag>
    },
    {
      title: '客户',
      dataIndex: 'customer_info',
      key: 'customer_info',
      render: (info: any) => info?.name || '-'
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string) => `$${parseFloat(amount).toFixed(2)}`
    },
    {
      title: '商品数量',
      key: 'item_count',
      render: (_, record) => record.items?.length || 0
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" icon={<TruckOutlined />} onClick={() => handleShip(record)}>
          发货
        </Button>
      )
    }
  ];

  const shipmentColumns: ColumnsType<Shipment> = [
    {
      title: '物流单号',
      dataIndex: 'tracking_number',
      key: 'tracking_number'
    },
    {
      title: '快递公司',
      dataIndex: 'carrier',
      key: 'carrier'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待取件' },
          picked: { color: 'processing', text: '已取件' },
          in_transit: { color: 'blue', text: '运输中' },
          delivered: { color: 'success', text: '已送达' },
          exception: { color: 'error', text: '异常' }
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>仓库工作台</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待发货订单" value={pendingOrders.length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日发货" value={shipments.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="运输中" value={shipments.filter(s => s.status === 'in_transit').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="已送达" value={shipments.filter(s => s.status === 'delivered').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="待发货订单" extra={<Button onClick={loadPendingOrders}>刷新</Button>}>
          <Table
            columns={pendingColumns}
            dataSource={pendingOrders}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card title="物流记录" extra={<Button onClick={loadShipments}>刷新</Button>}>
          <Table
            columns={shipmentColumns}
            dataSource={shipments}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        title="发货"
        open={shipModalVisible}
        onOk={handleShipSubmit}
        onCancel={() => setShipModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="订单号">
            <Input value={selectedOrder?.platform_order_id} disabled />
          </Form.Item>
          <Form.Item name="carrier" label="快递公司" rules={[{ required: true, message: '请选择快递公司' }]}>
            <Select placeholder="请选择快递公司">
              <Select.Option value="DHL">DHL</Select.Option>
              <Select.Option value="FedEx">FedEx</Select.Option>
              <Select.Option value="UPS">UPS</Select.Option>
              <Select.Option value="USPS">USPS</Select.Option>
              <Select.Option value="ChinaPost">中国邮政</Select.Option>
              <Select.Option value="SFExpress">顺丰速运</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="tracking_number" label="物流单号" rules={[{ required: true, message: '请输入物流单号' }]}>
            <Input placeholder="请输入物流单号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarehouseManagement;