import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Tabs, message, InputNumber, Select, Space, Row, Col, Statistic, List, Tag, Badge } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, ClockCircleOutlined, CarOutlined, CarryOutOutlined, AlertOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import type { User } from '../types';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [biddingOrders, setBiddingOrders] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'employer') {
      loadDashboardData();
    }
    if (user) {
      loadCompletedOrdersCount();
    }
  }, [user]);

  const loadCompletedOrdersCount = async () => {
    try {
      if (user?.worker_profile?.completed_orders !== undefined) {
        setCompletedOrders(user.worker_profile.completed_orders);
        return;
      }
      if (user?.driver_profile?.completed_orders !== undefined) {
        setCompletedOrders(user.driver_profile.completed_orders);
        return;
      }
      if (user?.role === 'employer') {
        const [laborRes, deliveryRes, movingRes] = await Promise.all([
          api.get('/labor-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
          api.get('/delivery-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
          api.get('/moving-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
        ]);
        const total = (laborRes as any).total + (deliveryRes as any).total + (movingRes as any).total;
        setCompletedOrders(total);
      }
    } catch (error) {
      console.error('Failed to load completed orders:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    setDashboardLoading(true);
    try {
      const [laborPending, laborInProgress, laborCompleted, laborDispute,
             deliveryBidding, deliveryInProgress, deliveryCompleted,
             movingPending, movingInProgress, movingCompleted,
             deliveryBiddingList, disputes, claims, notifications] = await Promise.all([
        api.get('/labor-orders', { params: { employer_id: user.id, status: 'pending', limit: 1 } }),
        api.get('/labor-orders', { params: { employer_id: user.id, status: 'in_progress', limit: 1 } }),
        api.get('/labor-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
        api.get('/disputes', { params: { complainant_id: user.id, status: 'pending', limit: 1 } }),
        api.get('/delivery-orders', { params: { employer_id: user.id, status: 'bidding', limit: 1 } }),
        api.get('/delivery-orders', { params: { employer_id: user.id, status: 'in_progress', limit: 1 } }),
        api.get('/delivery-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
        api.get('/moving-orders', { params: { employer_id: user.id, status: 'pending', limit: 1 } }),
        api.get('/moving-orders', { params: { employer_id: user.id, status: 'accepted', limit: 1 } }),
        api.get('/moving-orders', { params: { employer_id: user.id, status: 'completed', limit: 1 } }),
        api.get('/delivery-orders', { params: { employer_id: user.id, status: 'bidding', limit: 5 } }),
        api.get('/disputes', { params: { complainant_id: user.id, status: 'pending', limit: 5 } }),
        api.get('/insurance-claims', { params: { claimant_id: user.id, status: 'pending', limit: 5 } }),
        api.get('/notifications', { params: { limit: 10 } }),
      ]);

      const laborCompletedTotal = (laborCompleted as any).total || 0;
      const deliveryCompletedTotal = (deliveryCompleted as any).total || 0;
      const movingCompletedTotal = (movingCompleted as any).total || 0;
      const totalCompleted = laborCompletedTotal + deliveryCompletedTotal + movingCompletedTotal;

      if (user.role === 'employer') {
        setCompletedOrders(totalCompleted);
      }

      setStats({
        labor: {
          pending: (laborPending as any).total || 0,
          in_progress: (laborInProgress as any).total || 0,
          completed: laborCompletedTotal,
          dispute: (laborDispute as any).total || 0,
        },
        delivery: {
          bidding: (deliveryBidding as any).total || 0,
          in_progress: (deliveryInProgress as any).total || 0,
          completed: deliveryCompletedTotal,
        },
        moving: {
          pending: (movingPending as any).total || 0,
          in_progress: (movingInProgress as any).total || 0,
          completed: movingCompletedTotal,
        },
      });

      const biddingOrdersWithBids = await Promise.all(
        ((deliveryBiddingList as any).orders || []).map(async (order: any) => {
          const detail = await api.get('/delivery/' + order.id);
          const bids = (detail as any).bids || [];
          const maxBid = bids.length > 0 ? Math.max(...bids.map((b: any) => b.bid_price)) : 0;
          const remainingTime = order.pickup_time 
            ? Math.max(0, Math.ceil((new Date(order.pickup_time).getTime() - Date.now()) / (1000 * 60 * 60)))
            : 24;
          return { ...order, maxBid, bidCount: bids.length, remainingTime };
        })
      );
      setBiddingOrders(biddingOrdersWithBids);

      const todoList: any[] = [];
      ((laborInProgress as any).orders || []).forEach((order: any) => {
        todoList.push({
          id: order.id,
          type: 'labor',
          title: '待确认完工：' + order.title,
          priority: 'high',
        });
      });
      ((claims as any).claims || []).forEach((claim: any) => {
        todoList.push({
          id: claim.id,
          type: 'claim',
          title: '待处理理赔：' + claim.claim_reason,
          priority: 'high',
        });
      });
      ((disputes as any).disputes || []).forEach((dispute: any) => {
        todoList.push({
          id: dispute.id,
          type: 'dispute',
          title: '待处理纠纷：' + dispute.reason,
          priority: 'high',
        });
      });
      biddingOrdersWithBids.forEach((order: any) => {
        if (order.bidCount > 0) {
          todoList.push({
            id: order.id,
            type: 'bidding',
            title: '待确认竞价结果：' + order.title,
            priority: 'medium',
          });
        }
      });
      setTodos(todoList.slice(0, 8));

      const notifList = ((notifications as any).notifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        time: n.created_at,
        read: n.read,
      }));
      setActivities(notifList.slice(0, 6));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  if (!user) return null;

  const handleEdit = () => {
    form.setFieldsValue({
      real_name: user.real_name,
      phone: user.phone,
      city: user.city,
      address: user.address,
    });
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('资料更新成功');
      setEditing(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkerProfile = async (values: any) => {
    try {
      await api.put('/auth/worker-profile', values);
      message.success('工人资料更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const handleUpdateDriverProfile = async (values: any) => {
    try {
      await api.put('/auth/driver-profile', values);
      message.success('司机资料更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const basicInfoTab = (
    <Card style={{ marginTop: 16 }}>
      {editing ? (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="真实姓名" name="real_name">
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="所在城市" name="city">
            <Input />
          </Form.Item>
          <Form.Item label="详细地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存
              </Button>
              <Button onClick={() => setEditing(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar size={64} icon={<UserOutlined />} src={user.avatar} />
              <div style={{ marginLeft: 16 }}>
                <h3 style={{ marginBottom: 4 }}>{user.real_name || user.username}</h3>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                  用户名: {user.username}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                    {user.role === 'employer' ? '雇主' : user.role === 'worker' ? '工人' : user.role === 'driver' ? '司机' : '管理员'}
                  </span>
                </div>
              </div>
            </div>
            <Button type="text" icon={<EditOutlined />} onClick={handleEdit}>
              编辑资料
            </Button>
          </div>
          
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>信用分</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{user.credit_score}</div>
            </Card>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>账户余额</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>¥{user.balance}</div>
            </Card>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>所在城市</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{user.city || '未填写'}</div>
            </Card>
          </div>
        </>
      )}
    </Card>
  );

  const workerProfileTab = user.worker_profile && (
    <Card title="工人资料" style={{ marginTop: 16 }} extra={<span>认证状态: {user.worker_profile.id_card_verified ? '已认证' : '未认证'}</span>}>
      <Form
        layout="vertical"
        initialValues={{
          skills: user.worker_profile.skills,
          service_radius: user.worker_profile.service_radius,
          hourly_rate: user.worker_profile.hourly_rate,
          task_rate: user.worker_profile.task_rate,
          bio: user.worker_profile.bio,
        }}
        onFinish={handleUpdateWorkerProfile}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="服务半径 (公里)" name="service_radius">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="每小时价格 (元)" name="hourly_rate">
            <InputNumber min={10} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="任务起价 (元)" name="task_rate">
            <InputNumber min={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="完成订单数">
            <InputNumber value={user.role === 'worker' ? (user.worker_profile?.completed_orders ?? completedOrders) : completedOrders} disabled style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item label="评分">
          <div>⭐ {user.worker_profile.rating} 分</div>
        </Form.Item>
        <Form.Item label="个人简介" name="bio">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const driverProfileTab = user.driver_profile && (
    <Card title="司机资料" style={{ marginTop: 16 }} extra={<span>保险状态: {user.driver_profile.insurance_verified ? '已验证' : '未验证'}</span>}>
      <Form
        layout="vertical"
        initialValues={{
          vehicle_type: user.driver_profile.vehicle_type,
          vehicle_brand: user.driver_profile.vehicle_brand,
          plate_number: user.driver_profile.plate_number,
          load_capacity: user.driver_profile.load_capacity,
          vehicle_length: user.driver_profile.vehicle_length,
          bio: user.driver_profile.bio,
        }}
        onFinish={handleUpdateDriverProfile}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车型" name="vehicle_type">
            <Select>
              <Option value="厢式货车">厢式货车</Option>
              <Option value="平板货车">平板货车</Option>
              <Option value="高栏货车">高栏货车</Option>
              <Option value="冷藏车">冷藏车</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item label="车辆品牌" name="vehicle_brand">
            <Input />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车牌号" name="plate_number">
            <Input />
          </Form.Item>
          <Form.Item label="载重 (吨)" name="load_capacity">
            <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车长 (米)" name="vehicle_length">
            <InputNumber min={2} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="完成订单数">
            <InputNumber value={user.role === 'driver' ? (user.driver_profile?.completed_orders ?? completedOrders) : completedOrders} disabled style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item label="评分">
          <div>⭐ {user.driver_profile.rating} 分</div>
        </Form.Item>
        <Form.Item label="个人简介" name="bio">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#faad14',
      bidding: '#faad14',
      accepted: '#1890ff',
      in_progress: '#1890ff',
      completed: '#52c41a',
      dispute: '#f5222d',
    };
    return colors[status] || '#8c8c8c';
  };

  const getStatusText = (type: string, status: string) => {
    const texts: Record<string, Record<string, string>> = {
      labor: { pending: '待接单', in_progress: '进行中', completed: '已完成', dispute: '有纠纷' },
      delivery: { bidding: '竞价中', in_progress: '运输中', completed: '已完成' },
      moving: { pending: '待派单', accepted: '服务中', completed: '已完成' },
    };
    return texts[type]?.[status] || status;
  };

  const handleOrderClick = (type: string, status?: string) => {
    const routes: Record<string, string> = {
      labor: '/labor',
      delivery: '/delivery',
      moving: '/moving',
    };
    const route = routes[type] || '/my-orders';
    const params = status ? `?status=${status}` : '';
    navigate(route + params);
  };

  const handleOrderDetail = (type: string, id: string) => {
    const routes: Record<string, string> = {
      labor: '/labor/',
      delivery: '/delivery/',
      moving: '/moving/',
    };
    navigate(routes[type] + id);
  };

  const dashboardTab = (
    <div style={{ marginTop: 16 }}>
      <Card title="订单状态流转" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" title="用工订单" hoverable>
              <Row gutter={[8, 8]}>
                {['pending', 'in_progress', 'completed', 'dispute'].map(status => (
                  <Col span={12} key={status}>
                    <div 
                      onClick={() => handleOrderClick('labor', status)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{getStatusText('labor', status)}</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: getStatusColor(status) }}>
                        {stats?.labor?.[status] || 0}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="找车订单" hoverable>
              <Row gutter={[8, 8]}>
                {['bidding', 'in_progress', 'completed'].map(status => (
                  <Col span={8} key={status}>
                    <div 
                      onClick={() => handleOrderClick('delivery', status)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{getStatusText('delivery', status)}</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: getStatusColor(status) }}>
                        {stats?.delivery?.[status] || 0}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="搬家订单" hoverable>
              <Row gutter={[8, 8]}>
                {['pending', 'accepted', 'completed'].map(status => (
                  <Col span={8} key={status}>
                    <div 
                      onClick={() => handleOrderClick('moving', status === 'accepted' ? 'in_progress' : status)}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{getStatusText('moving', status)}</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: getStatusColor(status === 'accepted' ? 'in_progress' : status) }}>
                        {stats?.moving?.[status] || 0}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><CarOutlined /> 竞价进展</span>} 
            style={{ marginBottom: 16 }}
            extra={<Button type="link" onClick={() => navigate('/delivery?status=bidding')}>查看全部</Button>}
          >
            {biddingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
                暂无竞价中的订单
              </div>
            ) : (
              <List
                dataSource={biddingOrders}
                renderItem={(order) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => handleOrderDetail('delivery', order.id)}
                      >
                        去查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={order.title}
                      description={
                        <div>
                          <Space size={[16, 8]} wrap>
                            <span style={{ color: '#f5222d', fontWeight: 600 }}>
                              当前最高价: ¥{order.maxBid}
                            </span>
                            <span>出价次数: {order.bidCount}</span>
                            <span>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              剩余 {order.remainingTime} 小时
                            </span>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={<span><AlertOutlined /> 待办事项</span>} 
            style={{ marginBottom: 16 }}
            extra={<Button type="link" onClick={() => navigate('/my-orders')}>查看全部</Button>}
          >
            {todos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
                暂无待办事项
              </div>
            ) : (
              <List
                dataSource={todos}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge status={item.priority === 'high' ? 'error' : 'warning'} />
                      }
                      title={
                        <span 
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (item.type === 'labor') navigate('/labor/' + item.id);
                            else if (item.type === 'bidding') navigate('/delivery/' + item.id);
                            else if (item.type === 'dispute') navigate('/disputes');
                            else if (item.type === 'claim') navigate('/insurance');
                          }}
                        >
                          {item.title}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title={<span><HistoryOutlined /> 最近动态</span>}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
            暂无动态
          </div>
        ) : (
          <List
            dataSource={activities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span style={{ fontWeight: item.read ? 400 : 600 }}>{item.title}</span>
                      {!item.read && <Tag color="red">新</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div>{item.content}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        {item.time}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );

  const tabItems: any[] = [
    { key: 'basic', label: '基本信息', children: basicInfoTab },
  ];

  if (user.role === 'employer') {
    tabItems.unshift({ key: 'dashboard', label: '工作台', children: dashboardTab });
  }
  if (user.role === 'worker') {
    tabItems.push({ key: 'worker', label: '工人资料', children: workerProfileTab });
  }
  if (user.role === 'driver') {
    tabItems.push({ key: 'driver', label: '司机资料', children: driverProfileTab });
  }

  return (
    <div className="page-container">
      <Card title="个人中心" style={{ marginBottom: 16 }} />
      <Tabs items={tabItems} />
    </div>
  );
}

export default Profile;
