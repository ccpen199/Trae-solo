import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Pagination, Avatar, Space } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, EnvironmentOutlined, CarryOutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { MovingOrder } from '../types';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

function MovingOrders() {
  const [orders, setOrders] = useState<MovingOrder[]>([]);
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
      if (status) params.status = status;
      const data: any = await api.get('/moving-orders', { params });
      let filtered = data.orders;
      if (keyword) {
        filtered = filtered.filter((o: MovingOrder) => 
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
      pending: { text: '待指派', color: 'orange' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '搬家中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }} wrap>
          <Input
            placeholder="搜索搬家需求"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchOrders}
            allowClear
          />
          <Select
            placeholder="订单状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Option value="pending">待指派</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">搬家中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {user?.role === 'employer' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/publish/moving')}>
                发布搬家需求
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
              onClick={() => navigate(`/moving/${order.id}`)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<CarryOutOutlined />} style={{ background: '#fa8c16' }} size={48} />}
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{order.title}</span>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    <Tag>{order.vehicle_type}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#595959' }}>{order.description}</div>
                    <Space direction="vertical" size={0} style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <span><EnvironmentOutlined /> 从: {order.from_address} ({order.from_floor}楼 {order.from_elevator ? '有电梯' : '无电梯'})</span>
                      <span><EnvironmentOutlined /> 到: {order.to_address} ({order.to_floor}楼 {order.to_elevator ? '有电梯' : '无电梯'})</span>
                    </Space>
                    <Space size="large" style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <span>距离: {order.distance}km</span>
                      <span>服务包: {order.service_packages?.length || 0}个</span>
                      <span>物品: {order.package_list?.length || 0}项</span>
                    </Space>
                    <div style={{ color: '#fa8c16', fontSize: 18, fontWeight: 600 }}>
                      ¥{order.total_price}
                    </div>
                  </Space>
                }
              />
              <Space direction="vertical" align="end">
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {order.employer_name}
                </span>
                <Button type="primary" size="small">查看详情</Button>
              </Space>
            </List.Item>
          );
        }}
        locale={{ emptyText: '暂无搬家需求' }}
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

export default MovingOrders;
