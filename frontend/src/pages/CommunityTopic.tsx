import { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Space, Button, Input, List, Tag, App, Empty } from 'antd';
import { ArrowLeftOutlined, LikeOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function CommunityTopic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [topic, setTopic] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    api.get(`/community/topics/${id}`).then((d: any) => {
      setTopic(d.topic);
      setComments(d.comments || []);
    });
  }, [id]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const data = await api.post(`/community/topics/${id}/comments`, { content: commentText }) as any;
      if (data.blocked) message.warning('评论包含敏感内容，审核通过后展示');
      else message.success('评论成功');
      setCommentText('');
      api.get(`/community/topics/${id}`).then((d: any) => setComments(d.comments || []));
    } catch (e: any) {
      message.error(e.error || '评论失败');
    } finally { setSubmitting(false); }
  };

  const handleLike = async () => {
    await api.post(`/community/topics/${id}/like`);
    if (topic) setTopic({ ...topic, likes: topic.likes + 1 });
  };

  if (!topic) return <Card loading />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{topic.title}</Title>
        <Space wrap>
          {(topic.tags || []).map((t: string) => <Tag key={t}>{t}</Tag>)}
          {topic.status !== 'approved' && <Tag color="orange">待审核</Tag>}
        </Space>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Avatar size={40} src={topic.avatar}>{topic.user_name?.[0]}</Avatar>
          <div>
            <Text strong>{topic.user_name}</Text>
            <div style={{ fontSize: 12, color: '#999' }}>{dayjs(topic.created_at).format('YYYY-MM-DD HH:mm')} · {topic.views} 浏览</div>
          </div>
        </Space>
        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>{topic.content}</Paragraph>
        <Space>
          <Button icon={<LikeOutlined />} onClick={handleLike}>{topic.likes}</Button>
          <Button icon={<MessageOutlined />}>{comments.length}</Button>
        </Space>
      </Card>

      <Card title={`评论 (${comments.length})`}>
        {comments.length === 0 ? <Empty description="暂无评论，快来抢沙发！" /> : (
          <List
            dataSource={comments}
            renderItem={(c: any) => (
              <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space align="start" style={{ width: '100%' }}>
                  <Avatar src={c.avatar}>{c.user_name?.[0]}</Avatar>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <Text strong>{c.user_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(c.created_at).fromNow()}</Text>
                    </div>
                    <div style={{ color: '#333', marginBottom: 4 }}>{c.content}</div>
                    <div style={{ fontSize: 12, color: '#999' }}><LikeOutlined /> {c.likes || 0}</div>
                  </div>
                </Space>
              </List.Item>
            )}
          />
        )}

        {user && (
          <div style={{ marginTop: 24 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>发表评论</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input.TextArea
                rows={3}
                placeholder="分享你的看法..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={submitComment}>发送</Button>
            </Space.Compact>
          </div>
        )}
      </Card>
    </Space>
  );
}
