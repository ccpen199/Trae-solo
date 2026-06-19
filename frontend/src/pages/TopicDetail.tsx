import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Button, List, Form, Input, Spin, message, Avatar, Space } from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  EnvironmentOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '../api';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface TopicDetailData {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  geoLabel: string;
  geoLat: number;
  geoLng: number;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  filtered: boolean;
  createdAt: string;
  comments: Comment[];
}

const categoryMap: Record<string, { label: string; color: string }> = {
  discussion: { label: '讨论', color: 'blue' },
  secondhand: { label: '二手', color: 'green' },
  activity: { label: '活动', color: 'orange' },
  complaint: { label: '投诉', color: 'red' },
};

const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<TopicDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const { data } = await api.get(`/topics/${id}`);
        setTopic(data);
      } catch {
        setTopic({
          id: id!,
          title: '小区花园改造建议征集',
          content: '各位邻居好，关于小区花园的改造，物业已经给出了初步方案。方案包括：1. 增加儿童游乐设施 2. 修缮步道 3. 增加座椅。欢迎大家讨论提出建议。',
          author: '张先生',
          category: 'discussion',
          geoLabel: '3号楼花园',
          geoLat: 30.57,
          geoLng: 104.07,
          likeCount: 12,
          liked: false,
          commentCount: 8,
          filtered: false,
          createdAt: '2026-06-19T10:00:00Z',
          comments: [
            { id: '1', author: '李女士', content: '支持增加儿童游乐设施！', createdAt: '2026-06-19T11:00:00Z' },
            { id: '2', author: '王先生', content: '步道修缮很必要，雨天太滑了', createdAt: '2026-06-19T12:00:00Z' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTopic();
  }, [id]);

  const handleLike = async () => {
    setLiking(true);
    try {
      await api.post(`/topics/${id}/like`);
      setTopic((prev) => prev ? { ...prev, liked: !prev.liked, likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1 } : prev);
    } catch {
      message.error('操作失败');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (values: { content: string }) => {
    setSubmitting(true);
    try {
      const { data: newComment } = await api.post(`/topics/${id}/comments`, values);
      setTopic((prev) => prev ? {
        ...prev,
        comments: [...prev.comments, newComment],
        commentCount: prev.commentCount + 1,
      } : prev);
      form.resetFields();
      message.success('评论成功');
    } catch {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!topic) return <div>话题不存在</div>;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color={categoryMap[topic.category]?.color}>
            {categoryMap[topic.category]?.label}
          </Tag>
          {topic.filtered && (
            <Tag color="warning" icon={<WarningOutlined />}>内容经敏感词过滤</Tag>
          )}
        </div>
        <h2>{topic.title}</h2>
        <div style={{ color: '#888', marginBottom: 16 }}>
          {topic.author} · {new Date(topic.createdAt).toLocaleDateString('zh-CN')}
          <span style={{ marginLeft: 16 }}>
            <EnvironmentOutlined /> {topic.geoLabel} ({topic.geoLat}, {topic.geoLng})
          </span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.8 }}>{topic.content}</p>
        <div style={{ marginTop: 16 }}>
          <Button
            type={topic.liked ? 'primary' : 'default'}
            icon={topic.liked ? <LikeFilled /> : <LikeOutlined />}
            onClick={handleLike}
            loading={liking}
          >
            {topic.likeCount}
          </Button>
        </div>
      </Card>

      <Card title={`评论 (${topic.commentCount})`}>
        <List
          dataSource={topic.comments}
          renderItem={(comment) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{comment.author[0]}</Avatar>}
                title={<span>{comment.author} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</span></span>}
                description={comment.content}
              />
            </List.Item>
          )}
        />
        <Form form={form} onFinish={handleComment} style={{ marginTop: 16 }}>
          <Form.Item name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
            <Input.TextArea rows={3} placeholder="说点什么..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={submitting}>发表评论</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TopicDetail;
