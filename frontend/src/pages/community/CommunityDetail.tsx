import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Form,
  message,
  Avatar,
  Spin,
  Divider,
  List,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { communityApi } from '../../api';
import {
  CommunityPost,
  CommunityComment,
  User,
} from '../../types';

const { TextArea } = Input;

const RoleMap: Record<string, { text: string; color: string; icon: string }> = {
  admin: { text: '管理员', color: 'red', icon: '👑' },
  worker: { text: '家政阿姨', color: 'green', icon: '👩‍🍳' },
  employer: { text: '雇主', color: 'blue', icon: '🏠' },
  expert: { text: '专家顾问', color: 'purple', icon: '🎓' },
};

const getTagColor = (index: number) => {
  const colors = [
    'magenta', 'red', 'volcano', 'orange', 'gold',
    'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple',
  ];
  return colors[index % colors.length];
};

const formatTags = (tagsStr: string): string[] => {
  if (!tagsStr) return [];
  return tagsStr.split(',').filter((t) => t.trim());
};

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [answerForm] = Form.useForm();
  const [answerLoading, setAnswerLoading] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setCurrentUser(user);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await communityApi.postDetail(id!);
      setPost(result.post);
      setComments(result.comments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canAnswer = () => {
    if (!currentUser || !post) return false;
    if (post.is_answered) return false;
    return currentUser.role === 'expert' || currentUser.role === 'admin';
  };

  const handleAnswer = async () => {
    try {
      const values = await answerForm.validateFields();
      setAnswerLoading(true);
      await communityApi.answerPost(id!, values.expert_answer);
      message.success('回答提交成功');
      answerForm.resetFields();
      setShowAnswerForm(false);
      fetchDetail();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    setCommentLoading(true);
    try {
      await communityApi.commentPost(id!, commentContent.trim());
      message.success('评论发表成功');
      setCommentContent('');
      fetchDetail();
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLike = async () => {
    setLikeLoading(true);
    try {
      const result = await communityApi.likePost(id!);
      if (post) {
        setPost({ ...post, like_count: (post.like_count || 0) + 1 });
      }
      message.success(result.message || '点赞成功');
    } catch (error) {
      console.error(error);
    } finally {
      setLikeLoading(false);
    }
  };

  const postTags = post ? formatTags(post.tags) : [];
  const roleInfo = post ? (RoleMap[post.user_role] || {
    text: post.user_role,
    color: 'default',
    icon: '👤',
  }) : null;

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
          title={
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')}>
                返回列表
              </Button>
              <span style={{ fontSize: 18, fontWeight: 600 }}>
                <MessageOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
                帖子详情
              </span>
            </Space>
          }
        />

        {post && (
          <>
            <Card
              className="card-hover"
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ marginBottom: 20 }}>
                <Space wrap size={[12, 8]} style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#262626' }}>
                    {post.title}
                  </span>
                  {post.is_answered && (
                    <Tag
                      color="green"
                      icon={<CheckCircleOutlined />}
                      style={{ margin: 0, fontSize: 13, padding: '2px 10px' }}
                    >
                      已回答
                    </Tag>
                  )}
                </Space>

                {postTags.length > 0 && (
                  <Space size={[6, 6]} wrap style={{ marginBottom: 16 }}>
                    {postTags.map((tag, idx) => (
                      <Tag key={idx} color={getTagColor(idx)} style={{ margin: 0 }}>
                        #{tag}
                      </Tag>
                    ))}
                  </Space>
                )}

                <Row gutter={16} align="middle" wrap>
                  <Col>
                    <Space>
                      <Avatar
                        size={40}
                        icon={<UserOutlined />}
                        style={{
                          background: post.user_role === 'worker'
                            ? '#52c41a'
                            : post.user_role === 'employer'
                              ? '#1677ff'
                              : post.user_role === 'expert'
                                ? '#722ed1'
                                : '#fa8c16',
                        }}
                        src={post.avatar}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#262626' }}>
                            {post.username || '匿名用户'}
                          </span>
                          {roleInfo && (
                            <Tag color={roleInfo.color} style={{ margin: 0, fontSize: 11 }}>
                              <span style={{ marginRight: 2 }}>{roleInfo.icon}</span>
                              {roleInfo.text}
                            </Tag>
                          )}
                        </div>
                        <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {post.created_at}
                        </div>
                      </div>
                    </Space>
                  </Col>
                  <Col flex="auto">
                    <Space size={[24, 8]} style={{ justifyContent: 'flex-end', width: '100%' }} wrap>
                      <Space size={4} style={{ color: '#595959' }}>
                        <Tooltip title="浏览次数">
                          <EyeOutlined style={{ color: '#1677ff' }} />
                        </Tooltip>
                        <span style={{ fontWeight: 500 }}>{post.view_count}</span>
                      </Space>
                      <Space size={4} style={{ color: '#595959' }}>
                        <Tooltip title="点赞数">
                          <LikeOutlined style={{ color: '#f5222d' }} />
                        </Tooltip>
                        <span style={{ fontWeight: 500 }}>{post.like_count}</span>
                      </Space>
                      <Space size={4} style={{ color: '#595959' }}>
                        <Tooltip title="评论数">
                          <CommentOutlined style={{ color: '#52c41a' }} />
                        </Tooltip>
                        <span style={{ fontWeight: 500 }}>{comments.length}</span>
                      </Space>
                    </Space>
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <div
                style={{
                  lineHeight: 1.9,
                  fontSize: 15,
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  padding: '8px 0',
                }}
              >
                {post.content}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #f0f0f0' }}>
                <Space>
                  <Button
                    type="primary"
                    danger
                    icon={<LikeOutlined />}
                    onClick={handleLike}
                    loading={likeLoading}
                  >
                    点赞 ({post.like_count})
                  </Button>
                </Space>
              </div>
            </Card>

            {post.is_answered && post.expert_answer && (
              <Card
                className="card-hover"
                style={{
                  marginBottom: 16,
                  borderColor: '#b7eb8f',
                  background: '#fafff3',
                }}
                bodyStyle={{ padding: 20 }}
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#389e0d' }}>
                      专家解答
                    </span>
                  </Space>
                }
              >
                <div
                  style={{
                    lineHeight: 1.9,
                    fontSize: 15,
                    color: '#262626',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {post.expert_answer}
                </div>
              </Card>
            )}

            {canAnswer() && !showAnswerForm && (
              <Card
                className="card-hover"
                style={{ marginBottom: 16 }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={() => setShowAnswerForm(true)}
                  >
                    撰写专家回答
                  </Button>
                </div>
              </Card>
            )}

            {canAnswer() && showAnswerForm && (
              <Card
                className="card-hover"
                style={{
                  marginBottom: 16,
                  borderColor: '#91caff',
                }}
                bodyStyle={{ padding: 20 }}
                title={
                  <Space>
                    <MessageOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>撰写专家回答</span>
                  </Space>
                }
                extra={
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setShowAnswerForm(false);
                      answerForm.resetFields();
                    }}
                  >
                    取消
                  </Button>
                }
              >
                <Form
                  form={answerForm}
                  layout="vertical"
                  onFinish={handleAnswer}
                >
                  <Form.Item
                    name="expert_answer"
                    label="回答内容"
                    rules={[
                      { required: true, message: '请输入回答内容' },
                      { min: 10, message: '回答内容至少10个字符' },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="请输入专业、详细的解答内容，帮助用户解决问题..."
                      maxLength={2000}
                      showCount
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={answerLoading}
                      >
                        提交回答
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAnswerForm(false);
                          answerForm.resetFields();
                        }}
                      >
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}

            <Card
              className="card-hover"
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: 0 }}
              title={
                <Space>
                  <CommentOutlined style={{ color: '#52c41a' }} />
                  <span>评论区 ({comments.length})</span>
                </Space>
              }
            >
              <div style={{ padding: 20 }}>
                {comments.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#999',
                    }}
                  >
                    <CommentOutlined style={{ fontSize: 40, color: '#e8e8e8' }} />
                    <div style={{ marginTop: 12 }}>暂无评论，快来发表第一条评论吧！</div>
                  </div>
                ) : (
                  <List
                    dataSource={comments}
                    renderItem={(comment, idx) => {
                      const cRoleInfo = RoleMap[comment.role] || {
                        text: comment.role,
                        color: 'default',
                        icon: '👤',
                      };
                      return (
                        <List.Item
                          key={comment.id}
                          style={{
                            padding: idx !== comments.length - 1 ? '16px 0' : '16px 0 0 0',
                            borderBottom:
                              idx !== comments.length - 1
                                ? '1px dashed #f0f0f0'
                                : 'none',
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                icon={<UserOutlined />}
                                style={{
                                  background: comment.role === 'worker'
                                    ? '#52c41a'
                                    : comment.role === 'employer'
                                      ? '#1677ff'
                                      : comment.role === 'expert'
                                        ? '#722ed1'
                                        : comment.role === 'admin'
                                          ? '#fa8c16'
                                          : '#8c8c8c',
                                }}
                              />
                            }
                            title={
                              <Space>
                                <span style={{ fontWeight: 500 }}>{comment.username}</span>
                                <Tag color={cRoleInfo.color} style={{ margin: 0, fontSize: 11 }}>
                                  {cRoleInfo.text}
                                </Tag>
                              </Space>
                            }
                            description={
                              <div style={{ color: '#999', fontSize: 12 }}>
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
                                {comment.created_at}
                              </div>
                            }
                          />
                          <div
                            style={{
                              marginLeft: 52,
                              lineHeight: 1.7,
                              color: '#333',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {comment.content}
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                )}

                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  <Row gutter={12} align="top">
                    <Col xs={24} sm={4} md={3}>
                      <Avatar
                        icon={<UserOutlined />}
                        size={40}
                        style={{
                          background: currentUser?.role === 'worker'
                            ? '#52c41a'
                            : currentUser?.role === 'employer'
                              ? '#1677ff'
                              : currentUser?.role === 'expert'
                                ? '#722ed1'
                                : '#8c8c8c',
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={20} md={21}>
                      <TextArea
                        rows={3}
                        placeholder="发表您的评论..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        maxLength={500}
                        showCount
                        style={{ marginBottom: 12 }}
                      />
                      <div style={{ textAlign: 'right' }}>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleComment}
                          loading={commentLoading}
                          disabled={!commentContent.trim()}
                        >
                          发表评论
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
}
