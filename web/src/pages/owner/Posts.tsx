import { useEffect, useState } from 'react';
import { Card, List, Avatar, Button, Input, Comment, Form, message, Empty, Modal } from 'antd';
import { LikeOutlined, MessageOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuthStore } from '../store/auth';
import dayjs from 'dayjs';

export default function Posts() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [publishModal, setPublishModal] = useState(false);
  const [form] = Form.useForm();

  const loadPosts = () => {
    api.get('/posts').then((res) => setPosts(res.data));
  };

  useEffect(() => { loadPosts(); }, []);

  const handlePublish = async (values: any) => {
    try {
      await api.post('/posts', values);
      message.success('发布成功');
      setPublishModal(false);
      form.resetFields();
      loadPosts();
    } catch (err: any) {
      message.error(err.response?.data?.message || '发布失败');
    }
  };

  const handleLike = async (id: string) => {
    await api.post(`/posts/${id}/like`);
    loadPosts();
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await api.post(`/posts/${postId}/comments`, { content });
      loadPosts();
    } catch (err) {
      message.error('评论失败');
    }
  };

  return (
    <div>
      <Card
        title="邻里圈"
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishModal(true)}>发布动态</Button>}
      >
        {posts.length === 0 ? (
          <Empty description="还没有动态，快来发布第一条吧" />
        ) : (
          <List
            dataSource={posts}
            renderItem={(post) => (
              <Card key={post.id} style={{ marginBottom: 16, borderRadius: 8 }}>
                <Comment
                  author={<span style={{ fontWeight: 500 }}>{post.user?.name}</span>}
                  avatar={<Avatar icon={<UserOutlined />} src={post.user?.avatar} />}
                  content={<div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6 }}>{post.content}</div>}
                  datetime={dayjs(post.createdAt).fromNow()}
                  actions={[
                    <span key="like" onClick={() => handleLike(post.id)} style={{ cursor: 'pointer' }}>
                      <LikeOutlined /> <span style={{ marginLeft: 4 }}>{post.likeCount}</span>
                    </span>,
                    <span key="comment">
                      <MessageOutlined /> <span style={{ marginLeft: 4 }}>{post.comments?.length || 0}</span>
                    </span>,
                  ]}
                />
                {post.comments && post.comments.length > 0 && (
                  <div style={{ marginLeft: 48, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    {post.comments.map((c: any) => (
                      <Comment
                        key={c.id}
                        author={c.user?.name}
                        avatar={<Avatar size="small" icon={<UserOutlined />} src={c.user?.avatar} />}
                        content={c.content}
                        datetime={dayjs(c.createdAt).fromNow()}
                        style={{ padding: '8px 0' }}
                      />
                    ))}
                  </div>
                )}
                <div style={{ marginLeft: 48, marginTop: 8 }}>
                  <Input.Search
                    placeholder="写评论..."
                    enterButton="发送"
                    onSearch={(v) => v && handleComment(post.id, v)}
                    allowClear
                  />
                </div>
              </Card>
            )}
          />
        )}
      </Card>

      <Modal title="发布动态" open={publishModal} onCancel={() => setPublishModal(false)} footer={null}>
        <Form form={form} onFinish={handlePublish}>
          <Form.Item name="content" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} placeholder="分享你身边的新鲜事..." maxLength={500} showCount />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>发布</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
