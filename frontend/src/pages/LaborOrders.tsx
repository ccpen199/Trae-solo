import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Pagination, Avatar, Rate, Space } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { LaborOrder } from '../types';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

function LaborOrders() {
  const [orders, setOrders] = useState<LaborOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [page, category, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (category) params.category = category;
      if (status) params.status = status;
      const data: any = await api.get('/labor-orders', { params });
      let filteredOrders = data.orders;
      if (keyword) {
        filteredOrders = filteredOrders.filter((o: LaborOrder) => 
          o.title.includes(keyword) || (o.description && o.description.includes(keyword))
        );
      }
      setOrders(filteredOrders);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待接单', color: 'orange' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
      split: { text: '已拆单', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const categories = [
    '水电工', '木工', '瓦工', '油漆工', '搬运工', '家政保洁', '家电维修', '其他'
  ];

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }} wrap>
          <Input
            placeholder="搜索用工需求"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchOrders}
            allowClear
          />
          <Select
            placeholder="选择工种"
            style={{ width: 150 }}
            allowClear
            value={category}
            onChange={setCategory}
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
          <Select
            placeholder="订单状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Option value="pending">待接单</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {user?.role === 'employer' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/publish/labor')}>
                发布用工需求
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
              onClick={() => navigate(`/labor/${order.id}`)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} src={order.employer_avatar} size={48} />}
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{order.title}</span>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    {order.category && <Tag>{order.category}</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#595959' }}>{order.description}</div>
                    <Space size="large" style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <span><EnvironmentOutlined /> {order.city} {order.address}</span>
                      <span>
                        {order.pricing_type === 'hourly' 
                          ? `¥${order.price_per_hour}/小时 × ${order.estimated_hours}小时`
                          : `¥${order.task_price}/任务`
                        }
                      </span>
                      {order.worker_count > 1 && <span>需{order.worker_count}人</span>}
                    </Space>
                    <div style={{ color: '#fa8c16', fontSize: 18, fontWeight: 600 }}>
                      ¥{order.total_price}
                      {order.pricing_type === 'hourly' && <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>预估</span>}
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
        locale={{ emptyText: '暂无用工需求' }}
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

export default LaborOrders;
