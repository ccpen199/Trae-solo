import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Pagination, Avatar, Space } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, EnvironmentOutlined, CarryOutOutlined, ReloadOutlined } from '@ant-design/icons';
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
  const [status, setStatus] = useState<string | undefined>();
  const [vehicleType, setVehicleType] = useState<string | undefined>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [page, status, keyword, vehicleType]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (status) params.status = status;
      if (vehicleType) params.vehicle_type = vehicleType;
      if (keyword.trim()) params.keyword = keyword.trim();
      const data: any = await api.get('/moving-orders', { params });
      setOrders(data.orders || []);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = ['厢式货车', '平板货车', '高栏货车', '冷藏车', '自卸车', '其他'];

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
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 4 }}>搬家服务搜索结果</h2>
        <span style={{ color: '#8c8c8c' }}>支持按搬家标题、描述、起终点地址、车型和订单状态筛选。</span>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }} wrap>
          <Input
            placeholder="搜索搬家需求"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            onPressEnter={fetchOrders}
            allowClear
          />
          <Select
            placeholder="车型"
            style={{ width: 150 }}
            allowClear
            value={vehicleType}
            onChange={(value) => { setVehicleType(value); setPage(1); }}
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
            onChange={(value) => { setStatus(value); setPage(1); }}
          >
            <Option value={undefined as any}>全部</Option>
            <Option value="pending">待指派</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">搬家中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchOrders}>刷新</Button>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {user?.role === 'employer' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/publish/moving')}>
                发布搬家需求
              </Button>
            )}
          </div>
        </Space>
        <Space style={{ marginTop: 16 }} wrap>
          <Tag color="orange">查询结果 {total} 条</Tag>
          {keyword.trim() && <Tag color="cyan">关键词：{keyword.trim()}</Tag>}
          {vehicleType && <Tag color="blue">车型：{vehicleType}</Tag>}
          {status && <Tag color="gold">状态：{getStatusText(status).text}</Tag>}
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
        locale={{ emptyText: (() => {
          const filters: string[] = [];
          if (keyword.trim()) filters.push(`"${keyword.trim()}"`);
          if (vehicleType) filters.push(`车型"${vehicleType}"`);
          if (status) filters.push(`状态"${getStatusText(status).text}"`);
          if (filters.length > 0) {
            return `暂无匹配${filters.join('、')}的搬家需求`;
          }
          return '暂无搬家需求';
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

export default MovingOrders;
