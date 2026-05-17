import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, List, Spin, Empty, Typography, Button, Avatar,
  Space, Tag, Input, Modal, Form, Select, message
} from 'antd';
import {
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { postsAPI } from '../services/api';
import { Post } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Community: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await postsAPI.getList({ limit: 50 });
      setPosts(data.posts || []);
    } catch (err) {
      console.error('获取帖子列表失败:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = async (post: Post) => {
    try {
      await postsAPI.likePost(post.id);
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p
        )
      );
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleCreatePost = async (values: { title: string; content: string; category: string }) => {
    try {
      await postsAPI.createPost(values);
      message.success('发布成功！');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      console.error('发布失败:', err);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tip: 'green',
      question: 'orange',
      experience: 'blue',
      knowledge: 'purple'
    };
    return colors[category] || 'default';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      tip: '睡眠技巧',
      question: '求助问答',
      experience: '经验分享',
      knowledge: '知识科普'
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="加载失败" />
        <div style={{ marginTop: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchData} type="primary">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>动态广场</Title>
          <Text type="secondary">分享睡眠经验，互相帮助，共同改善睡眠质量</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          发布动态
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <List
              dataSource={posts}
              locale={{ emptyText: <Empty description="暂无动态" /> }}
              renderItem={(post) => (
                <List.Item
                  key={post.id}
                  actions={[
                    <Button type="text" icon={<LikeOutlined />} onClick={() => handleLike(post)}>
                      {post.likes_count}
                    </Button>,
                    <Button type="text" icon={<MessageOutlined />}>
                      {post.comments_count}
                    </Button>,
                    <Button type="text" icon={<EyeOutlined />}>
                      {post.views_count}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{post.title}</Text>
                        <Tag color={getCategoryColor(post.category)}>
                          {getCategoryName(post.category)}
                        </Tag>
                        {post.is_official ? <Tag color="red">官方</Tag> : null}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                          {post.content}
                        </Paragraph>
                        <Space size="middle">
                          <Text type="secondary">{post.author_name || '匿名用户'}</Text>
                          <Text type="secondary">{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="发布动态"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleCreatePost}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="tip">睡眠技巧</Option>
              <Option value="question">求助问答</Option>
              <Option value="experience">经验分享</Option>
              <Option value="knowledge">知识科普</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="请输入内容" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">发布</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Community;
