import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  List, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Empty, 
  message,
  Tabs,
  Badge,
  Image
} from 'antd';
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  StopOutlined,
  PlusOutlined,
  EyeOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store';
import { liveApi, inventoryApi } from '../api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;

function LiveList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('live');
  const [liveStreams, setLiveStreams] = useState([]);
  const [myLives, setMyLives] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadLiveStreams();
    if (user?.role === 'streamer') {
      loadMyLives();
      loadProducts();
    }
  }, []);

  const loadLiveStreams = async () => {
    setLoading(true);
    try {
      const result = await liveApi.getList('live', 50, 0);
      if (result.success) {
        setLiveStreams(result.data.list || []);
      }
    } catch (error) {
      message.error('加载直播列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMyLives = async () => {
    try {
      const result = await liveApi.getMyLives(50, 0);
      if (result.success) {
        setMyLives(result.data.list || []);
      }
    } catch (error) {
      console.error('加载我的直播失败:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await inventoryApi.getList(100, 0);
      if (result.success) {
        setProducts(result.data.list || []);
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
    }
  };

  const handleCreateLive = async (values) => {
    try {
      const result = await liveApi.create(values.title, values.productIds || []);
      if (result.success) {
        message.success('直播间创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        loadMyLives();
      }
    } catch (error) {
      message.error('创建直播间失败');
    }
  };

  const handleStartLive = async (liveId) => {
    try {
      const result = await liveApi.start(liveId);
      if (result.success) {
        message.success('直播已开始');
        loadMyLives();
        loadLiveStreams();
      }
    } catch (error) {
      message.error('开始直播失败');
    }
  };

  const handleEndLive = async (liveId) => {
    try {
      const result = await liveApi.end(liveId);
      if (result.success) {
        message.success('直播已结束');
        loadMyLives();
        loadLiveStreams();
      }
    } catch (error) {
      message.error('结束直播失败');
    }
  };

  const handleEnterLive = (liveId) => {
    navigate(`/lives/${liveId}`);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待开始' },
      live: { color: 'red', text: '直播中' },
      ended: { color: 'default', text: '已结束' }
    };
    const mapped = statusMap[status] || { color: 'default', text: status };
    return <Tag color={mapped.color}>{mapped.text}</Tag>;
  };

  const myLiveColumns = [
    {
      title: '直播标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '观众数',
      dataIndex: 'viewer_count',
      key: 'viewer_count',
      render: (count) => (
        <span>
          <EyeOutlined style={{ marginRight: 4 }} />
          {count || 0}
        </span>
      ),
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count',
      render: (count) => (
        <span>
          <LikeOutlined style={{ marginRight: 4 }} />
          {count || 0}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartLive(record.id)}
            >
              开始直播
            </Button>
          )}
          {record.status === 'live' && (
            <>
              <Button
                type="primary"
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => handleEnterLive(record.id)}
              >
                进入直播间
              </Button>
              <Button
                type="default"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleEndLive(record.id)}
              >
                结束直播
              </Button>
            </>
          )}
          {record.status === 'ended' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleEnterLive(record.id)}
            >
              查看回放
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>直播间</h2>
        {user?.role === 'streamer' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建直播间
          </Button>
        )}
      </div>

      {user?.role === 'streamer' ? (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="热门直播" key="live">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={liveStreams}
              loading={loading}
              locale={{ emptyText: <Empty description="暂无直播" /> }}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <div style={{ 
                        height: 180, 
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <VideoCameraOutlined style={{ fontSize: 48, color: '#fff' }} />
                        {item.status === 'live' && (
                          <Badge
                            status="processing"
                            text="直播中"
                            style={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              color: '#fff',
                              background: 'rgba(255, 77, 79, 0.9)',
                              padding: '4px 12px',
                              borderRadius: 4
                            }}
                          />
                        )}
                      </div>
                    }
                    onClick={() => handleEnterLive(item.id)}
                  >
                    <Card.Meta
                      title={item.title}
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.streamer_name || '主播'}</span>
                          <span>
                            <EyeOutlined style={{ marginRight: 4 }} />
                            {item.viewer_count || 0}
                          </span>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="我的直播" key="my">
            <Table
              columns={myLiveColumns}
              dataSource={myLives}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
        </Tabs>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={liveStreams}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无直播" /> }}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                cover={
                  <div style={{ 
                    height: 180, 
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <VideoCameraOutlined style={{ fontSize: 48, color: '#fff' }} />
                    {item.status === 'live' && (
                      <Badge
                        status="processing"
                        text="直播中"
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          color: '#fff',
                          background: 'rgba(255, 77, 79, 0.9)',
                          padding: '4px 12px',
                          borderRadius: 4
                        }}
                      />
                    )}
                  </div>
                }
                onClick={() => handleEnterLive(item.id)}
              >
                <Card.Meta
                  title={item.title}
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.streamer_name || '主播'}</span>
                      <span>
                        <EyeOutlined style={{ marginRight: 4 }} />
                        {item.viewer_count || 0}
                      </span>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="创建直播间"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLive}
        >
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input placeholder="请输入吸引人的直播标题" />
          </Form.Item>
          <Form.Item
            name="productIds"
            label="选择商品（可选）"
          >
            <Select
              mode="multiple"
              placeholder="选择要在直播间展示的商品"
              options={products.map(p => ({
                label: `${p.name} - ¥${p.price}`,
                value: p.id
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LiveList;
