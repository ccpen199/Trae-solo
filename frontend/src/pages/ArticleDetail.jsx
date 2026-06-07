import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Divider, List, Avatar, Input, Tag, message, Typography } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { discoverAPI } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArticle();
    loadComments();
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const res = await discoverAPI.article(id);
      setArticle(res.article);
    } catch (err) {
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await discoverAPI.comments(id);
      setComments(res.comments || []);
    } catch (err) {
      console.error('加载评论失败', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await discoverAPI.addComment(id, newComment.trim());
      message.success('评论成功');
      setNewComment('');
      loadComments();
    } catch (err) {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  }

  if (!article) {
    return <div style={{ padding: 60, textAlign: 'center' }}>文章不存在</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/discover')}>
          返回
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 16 }}>{article.title}</h1>
            <Space wrap>
              {article.tags?.split(',').map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Space>
            <Divider />
            <Space size="large" style={{ color: '#666' }}>
              <span>作者：{article.author || '官方'}</span>
              <span><EyeOutlined /> {article.view_count || 0}</span>
              <span><LikeOutlined /> {article.like_count || 0}</span>
              <span>{dayjs(article.created_at).format('YYYY-MM-DD HH:mm')}</span>
            </Space>
          </div>

          <div style={{ lineHeight: 2, fontSize: 16 }}>
            {article.content}
          </div>

          <Divider />

          <div>
            <h3 style={{ marginBottom: 16 }}>
              <MessageOutlined /> 评论 ({comments.length})
            </h3>
            <div style={{ marginBottom: 24 }}>
              <TextArea
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="发表你的评论..."
                style={{ marginBottom: 12 }}
              />
              <Button type="primary" onClick={handleSubmitComment} loading={submitting}>
                发表评论
              </Button>
            </div>
            <List
              dataSource={comments}
              renderItem={(comment) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space style={{ width: '100%', alignItems: 'flex-start' }}>
                    <Avatar>{comment.username?.[0]?.toUpperCase()}</Avatar>
                    <div style={{ flex: 1 }}>
                      <Space style={{ marginBottom: 4 }}>
                        <Text strong>{comment.username}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(comment.created_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Space>
                      <div>{comment.content}</div>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default ArticleDetail;
