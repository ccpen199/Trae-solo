import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Tag,
  Space,
  Divider,
  Button,
  Avatar,
  Input,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { apiService } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { News, NewsComment, NewsType } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useUserStore();

  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNewsDetail(id!);
      setNews(response.data);
    } catch (error) {
      console.error('获取新闻详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.addNewsComment(id!, commentText.trim());
      message.success('评论发表成功');
      setCommentText('');
      fetchNewsDetail();
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: NewsType) => {
    switch (type) {
      case NewsType.IMAGE:
        return '图片新闻';
      case NewsType.VIDEO:
        return '视频新闻';
      default:
        return '文字新闻';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ padding: '100px' }}>
        <Empty description="新闻不存在或已删除" />
      </div>
    );
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/news')}
        style={{ marginBottom: '16px' }}
      >
        返回新闻列表
      </Button>

      <Card>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '16px' }}>
            {news.title}
          </Title>
          {news.subtitle && (
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {news.subtitle}
            </Text>
          )}
          <Divider />
          <Space wrap>
            {news.category && <Tag color="blue">{news.category.name}</Tag>}
            <Tag color="green">{getTypeLabel(news.type)}</Tag>
            {news.isTop && <Tag color="red">置顶</Tag>}
            {news.isHot && <Tag color="orange">热门</Tag>}
            <Space>
              <EyeOutlined style={{ color: '#999' }} />
              <Text type="secondary">{news.views}</Text>
            </Space>
            <Space>
              <LikeOutlined style={{ color: '#999' }} />
              <Text type="secondary">{news.likes}</Text>
            </Space>
            <Space>
              <CalendarOutlined style={{ color: '#999' }} />
              <Text type="secondary">
                {new Date(news.createdAt).toLocaleString()}
              </Text>
            </Space>
          </Space>
          {news.author && (
            <div style={{ marginTop: '16px' }}>
              <Space>
                <Avatar src={news.author.avatar} icon={<UserOutlined />} />
                <Text>{news.author.nickname || news.author.username}</Text>
              </Space>
            </div>
          )}
        </div>

        {news.coverImage && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src={news.coverImage}
              alt={news.title}
              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
            />
          </div>
        )}

        <div
          style={{
            fontSize: '16px',
            lineHeight: '2',
            color: '#333',
          }}
          dangerouslySetInnerHTML={{ __html: news.content }}
        />

        {news.videoUrl && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>相关视频</Title>
            <video
              src={news.videoUrl}
              controls
              style={{ width: '100%', maxWidth: '800px' }}
            />
          </div>
        )}
      </Card>

      <Card
        title={
          <Space>
            <CommentOutlined />
            评论区
            <Tag color="blue">{news.comments?.length || 0}</Tag>
          </Space>
        }
        style={{ marginTop: '24px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <TextArea
            rows={4}
            placeholder={
              isAuthenticated ? '发表您的评论...' : '请先登录后发表评论'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!isAuthenticated}
          />
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleSubmitComment}
              loading={submitting}
              disabled={!isAuthenticated || !commentText.trim()}
            >
              发表评论
            </Button>
          </div>
        </div>

        {news.comments && news.comments.length > 0 ? (
          <div>
            {news.comments.map((comment) => (
              <div key={comment.id} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Avatar src={comment.user.avatar} icon={<UserOutlined />} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Space>
                        <Text strong>{comment.user.nickname || comment.user.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Text>
                      </Space>
                    </div>
                    <Paragraph style={{ marginBottom: '8px' }}>
                      {comment.content}
                    </Paragraph>
                    {comment.replies && comment.replies.length > 0 && (
                      <div style={{ marginLeft: '20px', paddingLeft: '12px', borderLeft: '2px solid #f0f0f0' }}>
                        {comment.replies.map((reply) => (
                          <div key={reply.id} style={{ marginBottom: '12px' }}>
                            <Space>
                              <Avatar size="small" src={reply.user.avatar} icon={<UserOutlined />} />
                              <Text strong>{reply.user.nickname || reply.user.username}</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(reply.createdAt).toLocaleString()}
                              </Text>
                            </Space>
                            <Paragraph style={{ marginTop: '4px', marginBottom: '0', marginLeft: '28px' }}>
                              {reply.content}
                            </Paragraph>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {comments.indexOf(comment) < comments.length - 1 && (
                  <Divider style={{ margin: '16px 0' }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无评论，快来抢沙发吧！" />
        )}
      </Card>
    </div>
  );
};

export default NewsDetailPage;
