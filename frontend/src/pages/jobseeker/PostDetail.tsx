import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Avatar,
  List,
  Image,
  Divider,
  Breadcrumb,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  LikeOutlined,
  MessageOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { CommunityPost, PostComment } from '../../types';
import { community } from '../../api/endpoints';
import { highlightSensitiveWords } from '../../utils/sensitive.tsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostDetail(parseInt(id));
    }
  }, [id]);

  const fetchPostDetail = async (postId: number) => {
    setLoading(true);
    try {
      const data = await community.postDetail(postId);
      setPost(data);
    } catch (error) {
      console.error('Failed to fetch post detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || liked) return;
    try {
      const result = await community.like(post.id);
      setPost(prev => prev ? { ...prev, likes: result.likes } : null);
      setLiked(true);
      message.success('点赞成功');
    } catch (error) {
      message.error('点赞失败');
    }
  };

  const handleComment = async () => {
    if (!post || !comment.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    setSubmitting(true);
    try {
      await community.comment(post.id, comment);
      message.success('评论成功');
      setComment('');
      fetchPostDetail(post.id);
    } catch (error) {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  if (!post) {
    return <Empty description="帖子不存在或已被删除" />;
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item onClick={() => navigate('/jobseeker/community')}>
          <a>行业社群</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>帖子详情</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={24}>
        <Col span={18}>
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Title level={3} style={{ margin: 0, marginBottom: '12px' }}>
                    {post.title}
                  </Title>
                  <Space>
                    <Avatar icon={<UserOutlined />} src={post.user?.avatar} />
                    <div>
                      <Text strong>{post.user?.name || '匿名用户'}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                  返回列表
                </Button>
              </Space>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Space wrap size={[4, 4]}>
                  {post.tags.map((tag, idx) => (
                    <Tag key={idx} color="blue">#{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <div style={{ marginBottom: '24px', lineHeight: '1.8', fontSize: '15px' }}>
              {highlightSensitiveWords(post.content)}
            </div>

            {post.images && post.images.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Row gutter={[8, 8]}>
                  {post.images.map((img, idx) => (
                    <Col xs={12} sm={8} md={6} key={idx}>
                      <Image
                        src={img}
                        alt={`图片 ${idx + 1}`}
                        width="100%"
                        style={{ borderRadius: '4px' }}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Space size={24}>
              <span
                style={{
                  cursor: 'pointer',
                  color: liked ? '#1890ff' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={handleLike}
              >
                <LikeOutlined /> {post.likes}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageOutlined /> {post.commentsCount}
              </span>
            </Space>
          </Card>

          <Card
            title={`评论 (${post.comments?.length || 0})`}
            style={{ marginBottom: '16px' }}
          >
            <Space.Compact style={{ width: '100%', marginBottom: '24px' }}>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="发表您的评论..."
                rows={3}
                maxLength={500}
                showCount
                style={{ borderBottomLeftRadius: '4px' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleComment}
                loading={submitting}
                style={{
                  height: 'auto',
                  borderTopRightRadius: '4px',
                  borderBottomRightRadius: '4px',
                }}
              >
                发表
              </Button>
            </Space.Compact>

            {post.comments && post.comments.length > 0 ? (
              <List
                dataSource={post.comments}
                renderItem={(comment: PostComment) => (
                  <List.Item key={comment.id}>
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={<UserOutlined />} src={comment.user?.avatar} />
                      }
                      title={
                        <Space>
                          <Text strong>{comment.user?.name || '匿名用户'}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                      description={
                        <div style={{ color: '#333' }}>
                          {highlightSensitiveWords(comment.content)}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无评论，快来发表第一条评论吧" />
            )}
          </Card>
        </Col>

        <Col span={6}>
          <Card
            title="相关推荐"
            style={{ position: 'sticky', top: '24px' }}
          >
            <List
              size="small"
              dataSource={[
                { title: '海德堡SM102常见故障及解决方法', likes: 156, comments: 32 },
                { title: '水性油墨干燥速度影响因素分析', likes: 89, comments: 18 },
                { title: '胶印过程中墨杠问题的排查', likes: 234, comments: 45 },
                { title: 'CTP制版工艺参数优化实践', likes: 67, comments: 12 },
                { title: 'UV印刷固化问题探讨', likes: 145, comments: 28 },
              ]}
              renderItem={(item) => (
                <List.Item style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={
                      <Text ellipsis style={{ fontSize: '13px' }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Space size={12} style={{ fontSize: '11px' }}>
                        <Text type="secondary"><LikeOutlined /> {item.likes}</Text>
                        <Text type="secondary"><MessageOutlined /> {item.comments}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PostDetail;
