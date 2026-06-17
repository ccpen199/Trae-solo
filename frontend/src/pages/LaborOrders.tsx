import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Pagination, Avatar, Space, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, EnvironmentOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { LaborOrder } from '../types';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { Text } = Typography;

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
  }, [page, category, status, keyword]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (category) params.category = category;
      if (status) params.status = status;
      const data: any = await api.get('/labor-orders', { params });
      setOrders(data.orders || []);
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
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 4 }}>搜索结果</h2>
        <Text type="secondary">
          搜索框支持按标题、描述、工种、城市和地址查询用工需求，筛选条件会实时同步到后端查询结果。
        </Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }} wrap>
          <Input
            placeholder="搜索用工需求"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
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
            <Option value={undefined as any}>全部</Option>
            <Option value="pending">待接单</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchOrders}>刷新</Button>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {user?.role === 'employer' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/publish/labor')}>
                发布用工需求
              </Button>
            )}
          </div>
        </Space>
        <Space style={{ marginTop: 16 }} wrap>
          <Tag color="blue">查询结果 {total} 条</Tag>
          {keyword.trim() && <Tag color="cyan">关键词：{keyword.trim()}</Tag>}
          {category && <Tag color="green">工种：{category}</Tag>}
          {status && <Tag color="orange">状态：{getStatusText(status).text}</Tag>}
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
        locale={{ emptyText: (() => {
          const filters: string[] = [];
          if (keyword.trim()) filters.push(`"${keyword.trim()}"`);
          if (category) filters.push(`工种"${category}"`);
          if (status) filters.push(`状态"${getStatusText(status).text}"`);
          if (filters.length > 0) {
            return `暂无匹配${filters.join('、')}的用工需求`;
          }
          return '暂无用工需求';
        })() }}
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
