import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Menu, Card, Table, Statistic, Row, Col, Tag, Button, Select, Modal,
  Descriptions, message, Space, Tabs
} from 'antd';
import {
  DashboardOutlined, UserOutlined, ShopOutlined, ShoppingCartOutlined,
  BellOutlined, EyeOutlined
} from '@ant-design/icons';
import { adminApi, announcementApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Content, Sider } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeKey, setActiveKey] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      message.error('没有管理员权限');
      navigate('/');
      return;
    }
    fetchStatistics();
  }, [isAuthenticated, user]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据概览' },
    { key: 'users', icon: <UserOutlined />, label: '用户管理' },
    { key: 'products', icon: <ShopOutlined />, label: '商品管理' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: '订单管理' }
  ];

  const DashboardPanel = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="用户总数"
              value={statistics?.statistics?.userCount || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="在售商品"
              value={statistics?.statistics?.productCount || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="订单总数"
              value={statistics?.statistics?.orderCount || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日订单"
              value={statistics?.statistics?.todayOrders || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最新订单" loading={loading}>
            <Table
              dataSource={statistics?.recentOrders || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
                { title: '商品', dataIndex: 'product_title', key: 'product_title' },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status) => {
                    const colorMap = {
                      'pending': 'orange',
                      'processing': 'blue',
                      'completed': 'green',
                      'cancelled': 'red'
                    };
                    return <Tag color={colorMap[status]}>{status}</Tag>;
                  }
                },
                { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v}` }
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="热门商品" loading={loading}>
            <Table
              dataSource={statistics?.hotProducts || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '商品名称', dataIndex: 'title', key: 'title' },
                { title: '分类', dataIndex: 'category_name', key: 'category_name' },
                { title: '价格', dataIndex: 'price', key: 'price', render: (v) => `¥${v}` },
                { title: '浏览量', dataIndex: 'view_count', key: 'view_count' }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const UsersPanel = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [fetching, setFetching] = useState(false);

    const fetchUsers = async () => {
      setFetching(true);
      try {
        const data = await adminApi.getUsers({
          page: pagination.current,
          limit: pagination.pageSize
        });
        setUsers(data.users || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } catch (error) {
        console.error('获取用户列表失败:', error);
      } finally {
        setFetching(false);
      }
    };

    useEffect(() => {
      fetchUsers();
    }, [pagination.current, pagination.pageSize]);

    const handleUpdateStatus = async (id, status) => {
      try {
        await adminApi.updateUserStatus(id, { status });
        message.success('用户状态更新成功');
        fetchUsers();
      } catch (error) {
        console.error('更新用户状态失败:', error);
      }
    };

    const handleUpdateRole = async (id, role) => {
      try {
        await adminApi.updateUserRole(id, { role });
        message.success('用户角色更新成功');
        fetchUsers();
      } catch (error) {
        console.error('更新用户角色失败:', error);
      }
    };

    const columns = [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: '用户名', dataIndex: 'username', key: 'username' },
      { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
      { title: '邮箱', dataIndex: 'email', key: 'email' },
      { 
        title: '角色', 
        dataIndex: 'role', 
        key: 'role',
        render: (role, record) => (
          <Select
            value={role}
            style={{ width: 100 }}
            onChange={(v) => handleUpdateRole(record.id, v)}
          >
            <Option value="user">普通用户</Option>
            <Option value="admin">管理员</Option>
          </Select>
        )
      },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        render: (status, record) => (
          <Select
            value={status}
            style={{ width: 100 }}
            onChange={(v) => handleUpdateStatus(record.id, v)}
          >
            <Option value="active">正常</Option>
            <Option value="inactive">禁用</Option>
          </Select>
        )
      },
      {
        title: '注册时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
      }
    ];

    return (
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={fetching}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
        }}
      />
    );
  };

  const ProductsPanel = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [fetching, setFetching] = useState(false);

    const fetchProducts = async () => {
      setFetching(true);
      try {
        const data = await adminApi.getProducts({
          page: pagination.current,
          limit: pagination.pageSize
        });
        setProducts(data.products || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } catch (error) {
        console.error('获取商品列表失败:', error);
      } finally {
        setFetching(false);
      }
    };

    useEffect(() => {
      fetchProducts();
    }, [pagination.current, pagination.pageSize]);

    const handleUpdateStatus = async (id, status) => {
      try {
        await adminApi.updateProductStatus(id, { status });
        message.success('商品状态更新成功');
        fetchProducts();
      } catch (error) {
        console.error('更新商品状态失败:', error);
      }
    };

    const columns = [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: '商品名称', dataIndex: 'title', key: 'title' },
      { title: '分类', dataIndex: 'category_name', key: 'category_name' },
      { title: '卖家', dataIndex: 'seller_name', key: 'seller_name' },
      { title: '价格', dataIndex: 'price', key: 'price', render: (v) => `¥${v}` },
      { title: '浏览/收藏', key: 'stats', render: (_, r) => `${r.view_count}/${r.favorite_count}` },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        render: (status, record) => (
          <Select
            value={status}
            style={{ width: 100 }}
            onChange={(v) => handleUpdateStatus(record.id, v)}
          >
            <Option value="active">上架中</Option>
            <Option value="inactive">已下架</Option>
            <Option value="deleted">已删除</Option>
          </Select>
        )
      },
      {
        title: '发布时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
      }
    ];

    return (
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={fetching}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
        }}
      />
    );
  };

  const OrdersPanel = () => {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [fetching, setFetching] = useState(false);

    const fetchOrders = async () => {
      setFetching(true);
      try {
        const data = await adminApi.getOrders({
          page: pagination.current,
          limit: pagination.pageSize
        });
        setOrders(data.orders || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } catch (error) {
        console.error('获取订单列表失败:', error);
      } finally {
        setFetching(false);
      }
    };

    useEffect(() => {
      fetchOrders();
    }, [pagination.current, pagination.pageSize]);

    const columns = [
      { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
      { title: '商品', dataIndex: 'product_title', key: 'product_title' },
      { title: '卖家', dataIndex: 'seller_username', key: 'seller_username' },
      { title: '买家', dataIndex: 'buyer_username', key: 'buyer_username' },
      { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v}` },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        render: (status) => {
          const colorMap = {
            'pending': 'orange',
            'processing': 'blue',
            'completed': 'green',
            'cancelled': 'red'
          };
          const labelMap = {
            'pending': '待处理',
            'processing': '交易中',
            'completed': '已完成',
            'cancelled': '已取消'
          };
          return <Tag color={colorMap[status]}>{labelMap[status] || status}</Tag>;
        }
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
      }
    ];

    return (
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={fetching}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
        }}
      />
    );
  };

  const renderContent = () => {
    switch (activeKey) {
      case 'dashboard': return <DashboardPanel />;
      case 'users': return <UsersPanel />;
      case 'products': return <ProductsPanel />;
      case 'orders': return <OrdersPanel />;
      default: return <DashboardPanel />;
    }
  };

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Sider
        width={200}
        theme="light"
        style={{ position: 'sticky', top: 64, height: 'calc(100vh - 64px)' }}
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => setActiveKey(key)}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ padding: 24 }}>
        <Card>
          {renderContent()}
        </Card>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
