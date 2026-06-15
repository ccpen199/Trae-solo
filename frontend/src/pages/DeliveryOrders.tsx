import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Pagination, Avatar, Space } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { DeliveryOrder } from '../types';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

function DeliveryOrders() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [vehicleType, setVehicleType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [page, vehicleType, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (vehicleType) params.vehicle_type = vehicleType;
      if (status) params.status = status;
      const data: any = await api.get('/delivery-orders', { params });
      let filtered = data.orders;
      if (keyword) {
        filtered = filtered.filter((o: DeliveryOrder) => 
          o.title.includes(keyword) || (o.description && o.description.includes(keyword))
        );
      }
      setOrders(filtered);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      bidding: { text: '竞价中', color: 'magenta' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '运输中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const vehicleTypes = ['厢式货车', '平板货车', '高栏货车', '冷藏车', '自卸车', '其他'];

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }} wrap>
          <Input
            placeholder="搜索找车需求"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchOrders}
            allowClear
          />
          <Select
            placeholder="车型"
            style={{ width: 150 }}
            allowClear
            value={vehicleType}
            onChange={setVehicleType}
          >
            {vehicleTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Select
            placeholder="订单状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Option value="bidding">竞价中</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">运输中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {user?.role === 'employer' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/publish/delivery')}>
                发布找车需求
              </Button>
            )}
          </div>
        </Space>
      </Card>

      <List
        loading={loading}
        dataSource={orders}
        renderItem={(order) => {
          const statusInfo = getStatusText(order.status);
          return (
            <List.Item
              style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
              onClick={() => navigate(`/delivery/${order.id}`)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<CarOutlined />} style={{ background: '#52c41a' }} size={48} />}
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{order.title}</span>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    <Tag color="blue">{order.vehicle_type_required}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#595959' }}>{order.description}</div>
                    <Space direction="vertical" size={0} style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <span><EnvironmentOutlined /> 起点: {order.pickup_address}</span>
                      <span><EnvironmentOutlined /> 终点: {order.delivery_address}</span>
                    </Space>
                    <Space size="large" style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <span>货物: {order.weight}吨 / {order.volume}m³</span>
                      <span>运单号: {order.waybill_no}</span>
                    </Space>
                    <div style={{ color: '#fa8c16', fontSize: 18, fontWeight: 600 }}>
                      {order.status === 'bidding' 
                        ? `起拍价 ¥${order.bid_start_price}`
                        : `¥${order.final_price}`
                      }
                    </div>
                  </Space>
                }
              />
              <Space direction="vertical" align="end">
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  发货人: {order.employer_name}
                </span>
                <Button type="primary" size="small">查看详情</Button>
              </Space>
            </List.Item>
          );
        }}
        locale={{ emptyText: '暂无找车需求' }}
      />

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

export default DeliveryOrders;
