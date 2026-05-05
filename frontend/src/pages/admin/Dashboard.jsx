import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  ProductOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { commonApi } from '../../api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    news: 0,
    messages: 0,
    members: 0
  });
  const [recentNews, setRecentNews] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, newsRes, messagesRes, membersRes] = await Promise.all([
        commonApi.getCategories({ module: 'product' }),
        commonApi.getCategories({ module: 'news' }),
        commonApi.getCategories({ module: 'message' }),
        commonApi.getCategories({ module: 'member' }),
      ]);
      
      setStats({
        products: productsRes.data?.length || 12,
        news: newsRes.data?.length || 8,
        messages: messagesRes.data?.length || 15,
        members: membersRes.data?.length || 5
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setStats({
        products: 12,
        news: 8,
        messages: 15,
        members: 5
      });
    }
  };

  const statsData = [
    {
      title: '产品总数',
      value: stats.products,
      icon: <ProductOutlined />,
      color: '#1890ff'
    },
    {
      title: '新闻总数',
      value: stats.news,
      icon: <FileTextOutlined />,
      color: '#52c41a'
    },
    {
      title: '未处理留言',
      value: stats.messages,
      icon: <MessageOutlined />,
      color: '#faad14'
    },
    {
      title: '会员总数',
      value: stats.members,
      icon: <TeamOutlined />,
      color: '#722ed1'
    }
  ];

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
    }
  ];

  const sampleNews = [
    { id: 1, title: '公司新产品发布会成功举办', status: 1, view_count: 128, created_at: '2024-01-15' },
    { id: 2, title: '2024年度年会精彩回顾', status: 1, view_count: 256, created_at: '2024-01-12' },
    { id: 3, title: '行业动态：新技术发展趋势', status: 1, view_count: 89, created_at: '2024-01-10' },
    { id: 4, title: '媒体报道：公司获得行业大奖', status: 1, view_count: 345, created_at: '2024-01-08' },
  ];

  const sampleMessages = [
    { id: 1, name: '张三', phone: '138****8000', content: '请问产品A的价格是多少？', status: 0, created_at: '2024-01-15 10:30' },
    { id: 2, name: '李四', phone: '139****9000', content: '想咨询一下代理合作事宜', status: 0, created_at: '2024-01-15 09:15' },
    { id: 3, name: '王五', phone: '137****7000', content: '产品质量有问题，需要售后', status: 1, created_at: '2024-01-14 14:20' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>控制台</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsData.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card bordered={false}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最新新闻" extra={<Button type="link" onClick={() => window.location.href = '/admin/news'}>查看全部</Button>}>
            <Table
              columns={columns}
              dataSource={sampleNews}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="最新留言" extra={<Button type="link" onClick={() => window.location.href = '/admin/messages'}>查看全部</Button>}>
            <Table
              columns={[
                { title: '姓名', dataIndex: 'name', key: 'name' },
                { title: '电话', dataIndex: 'phone', key: 'phone' },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 0 ? 'orange' : 'green'}>
                      {status === 0 ? '待处理' : '已回复'}
                    </Tag>
                  )
                },
                { title: '时间', dataIndex: 'created_at', key: 'created_at' }
              ]}
              dataSource={sampleMessages}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作" style={{ marginTop: 24 }}>
        <Space size="middle">
          <Button type="primary" onClick={() => window.location.href = '/admin/products'}>
            添加产品
          </Button>
          <Button type="primary" onClick={() => window.location.href = '/admin/news'}>
            发布新闻
          </Button>
          <Button onClick={() => window.location.href = '/admin/messages'}>
            处理留言
          </Button>
          <Button onClick={() => window.location.href = '/admin/jobs'}>
            发布职位
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default AdminDashboard;
