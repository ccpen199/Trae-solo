import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Tabs,
  Input,
  Select,
  Modal,
  Form,
  Switch,
  message,
  Avatar,
  Pagination,
  Empty,
  Alert,
  Spin,
  Tooltip,
} from 'antd';
import {
  FireOutlined,
  PlusOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  UserOutlined,
  LockOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  HomeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { communityApi } from '../../api';
import {
  CommunityPost,
  User,
} from '../../types';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Search } = Input;

const RoleMap: Record<string, { text: string; color: string; icon: string }> = {
  admin: { text: '管理员', color: 'red', icon: '👑' },
  worker: { text: '家政阿姨', color: 'green', icon: '👩‍🍳' },
  employer: { text: '雇主', color: 'blue', icon: '🏠' },
  expert: { text: '专家顾问', color: 'purple', icon: '🎓' },
};

interface HotTag {
  id: string;
  name: string;
  count: number;
}

export default function CommunityList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchRole, setSearchRole] = useState<string | undefined>(undefined);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [hotTags, setHotTags] = useState<HotTag[]>([]);
  const [hotTagsLoading, setHotTagsLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
    fetchHotTags();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [page, pageSize, activeTab, selectedTag, searchRole, searchKeyword]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (activeTab === 'answered') {
        params.is_answered = true;
      }
      if (activeTab === 'mine' && currentUser) {
        params.user_id = currentUser.id;
      }
      if (selectedTag) {
        params.tag = selectedTag;
      }
      if (searchRole) {
        params.role = searchRole;
      }
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      const result = await communityApi.posts(params);
      setPosts(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotTags = async () => {
    setHotTagsLoading(true);
    try {
      const result = await communityApi.hotTags();
      setHotTags(result.tags || []);
    } catch (error) {
      console.error(error);
    } finally {
      setHotTagsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      const data: any = {
        title: values.title,
        content: values.content,
        tags: (values.tags || []).join(','),
        is_private: values.is_private || false,
      };
      if (currentUser) {
        data.user_id = currentUser.id;
        data.user_role = currentUser.role;
      }
      await communityApi.createPost(data);
      message.success('发帖成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      setPage(1);
      setTimeout(() => fetchPosts(), 0);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setCreateLoading(false);
    }
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

  const renderHotTags = () => (
    <Card
      className="card-hover"
      bodyStyle={{ padding: 20 }}
      title={
        <Space>
          <FireOutlined style={{ color: '#fa8c16' }} />
          <span>热门标签</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchHotTags}
          loading={hotTagsLoading}
        >
          刷新
        </Button>
      }
    >
      <Spin spinning={hotTagsLoading}>
        {hotTags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
            暂无热门标签
          </div>
        ) : (
          <Space size={[8, 10]} wrap>
            <Tag
              color={selectedTag === null ? 'blue' : 'default'}
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: 13,
              }}
              onClick={() => {
                setSelectedTag(null);
                setPage(1);
              }}
            >
              全部
            </Tag>
            {hotTags.map((tag, idx) => (
              <Tag
                key={tag.id}
                color={selectedTag === tag.name ? getTagColor(idx) : 'default'}
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: selectedTag === tag.name ? 600 : 400,
                }}
                onClick={() => {
                  setSelectedTag(selectedTag === tag.name ? null : tag.name);
                  setPage(1);
                }}
              >
                <FireOutlined style={{ color: '#fa8c16', marginRight: 2 }} />
                {tag.name}
                <span style={{ marginLeft: 4, opacity: 0.7 }}>({tag.count})</span>
              </Tag>
            ))}
          </Space>
        )}
      </Spin>
    </Card>
  );

  const renderPostItem = (post: CommunityPost, idx: number) => {
    const roleInfo = RoleMap[post.user_role] || {
      text: post.user_role,
      color: 'default',
      icon: '👤',
    };
    const postTags = formatTags(post.tags);

    return (
      <Card
        key={post.id}
        hoverable
        className="card-hover post-card"
        bodyStyle={{ padding: 20 }}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          borderColor: post.is_answered ? '#b7eb8f' : '#f0f0f0',
          background: post.is_answered ? '#fafff3' : 'white',
        }}
        onClick={() => navigate(`/community/${post.id}`)}
      >
        <Row gutter={16} align="top">
          <Col xs={24} sm={2}>
            <Avatar
              size={44}
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
          </Col>
          <Col xs={24} sm={22}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Space wrap size={[8, 6]} style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#262626',
                      lineHeight: 1.4,
                    }}
                  >
                    {post.title}
                  </span>
                  {post.is_private && (
                    <Tooltip title="私密帖子，仅作者可见">
                      <LockOutlined style={{ color: '#fa8c16' }} />
                    </Tooltip>
                  )}
                  {post.is_answered && (
                    <Tag
                      color="green"
                      icon={<CheckCircleOutlined />}
                      style={{ margin: 0 }}
                    >
                      已回答
                    </Tag>
                  )}
                </Space>
                {postTags.length > 0 && (
                  <Space size={[6, 6]} wrap style={{ marginBottom: 8 }}>
                    {postTags.map((tag, tagIdx) => (
                      <Tag
                        key={tagIdx}
                        color={getTagColor(idx + tagIdx)}
                        style={{ margin: 0, fontSize: 12 }}
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </Space>
                )}
              </div>
            </div>

            <div
              style={{
                color: '#595959',
                lineHeight: 1.7,
                marginBottom: 14,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 14,
              }}
            >
              {post.content}
            </div>

            {post.is_answered && post.expert_answer && (
              <Alert
                type="success"
                showIcon
                icon={<MessageOutlined />}
                message="专家解答"
                description={
                  <div
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.expert_answer}
                  </div>
                }
                style={{ marginBottom: 14 }}
              />
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 12,
                borderTop: '1px dashed #f0f0f0',
              }}
            >
              <Space size={[12, 6]} wrap>
                <Space size={4}>
                  <span style={{ fontSize: 18 }}>{roleInfo.icon}</span>
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {post.username || '匿名用户'}
                  </span>
                  <Tag color={roleInfo.color} style={{ margin: 0, fontSize: 11 }}>
                    {roleInfo.text}
                  </Tag>
                </Space>
                <Space size={[4, 4]} style={{ color: '#999', fontSize: 12 }}>
                  <ClockCircleOutlined />
                  {post.created_at}
                </Space>
              </Space>
              <Space size={[16, 6]} style={{ color: '#8c8c8c', fontSize: 13 }}>
                <Space size={4}>
                  <EyeOutlined style={{ color: '#1677ff' }} />
                  <span>{post.view_count}</span>
                </Space>
                <Space size={4}>
                  <LikeOutlined style={{ color: '#f5222d' }} />
                  <span>{post.like_count}</span>
                </Space>
                <Space size={4}>
                  <CommentOutlined style={{ color: '#52c41a' }} />
                  <span>{post.comment_count || 0}</span>
                </Space>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderPostsPanel = () => (
    <div>
      <Card
        className="card-hover"
        bodyStyle={{ padding: 16 }}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setPage(1);
              }}
              size="small"
              style={{ marginBottom: 0 }}
            >
              <TabPane
                tab={
                  <span>
                    <HomeOutlined /> 全部
                  </span>
                }
                key="all"
              />
              <TabPane
                tab={
                  <span>
                    <CheckCircleOutlined /> 已回答
                  </span>
                }
                key="answered"
              />
              {currentUser && (
                <TabPane
                  tab={
                    <span>
                      <TeamOutlined /> 我的提问
                    </span>
                  }
                  key="mine"
                />
              )}
            </Tabs>
          </Col>
          <Col xs={24} md={14}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
              <Select
                placeholder="按角色筛选"
                allowClear
                style={{ width: 160 }}
                size="small"
                value={searchRole}
                onChange={(val) => {
                  setSearchRole(val);
                  setPage(1);
                }}
              >
                <Option value="worker">家政阿姨</Option>
                <Option value="employer">雇主</Option>
                <Option value="expert">专家顾问</Option>
                <Option value="admin">管理员</Option>
              </Select>
              <Search
                placeholder="搜索帖子标题/内容"
                allowClear
                enterButton
                size="small"
                style={{ width: 280 }}
                onSearch={(val) => {
                  setSearchKeyword(val);
                  setPage(1);
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {posts.length === 0 ? (
          <Card className="card-hover" bodyStyle={{ padding: 40 }}>
            <Empty description="暂无帖子，快来发布第一个话题吧！" />
          </Card>
        ) : (
          <div>
            {posts.map((post, idx) => renderPostItem(post, idx))}
            {total > pageSize && (
              <Card className="card-hover" bodyStyle={{ padding: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(t) => `共 ${t} 条`}
                    onChange={(p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    }}
                  />
                </div>
              </Card>
            )}
          </div>
        )}
      </Spin>
    </div>
  );

  return (
    <div className="page-container">
      <Card
        bodyStyle={{ padding: 0 }}
        className="card-hover"
        title={
          <Space>
            <MessageOutlined style={{ color: '#13c2c2' }} />
            <span>圈子社区</span>
            {selectedTag && (
              <Tag color="blue" closable onClose={() => {
                setSelectedTag(null);
                setPage(1);
              }}>
                <FireOutlined /> {selectedTag}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            发帖
          </Button>
        }
      >
        <div style={{ padding: 20 }}>
          <Row gutter={16}>
            <Col xs={24} lg={6}>
              {renderHotTags()}
            </Col>
            <Col xs={24} lg={18}>
              {renderPostsPanel()}
            </Col>
          </Row>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#1677ff' }} />
            <span>发布新话题</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreatePost}
        confirmLoading={createLoading}
        okText="发布"
        cancelText="取消"
        width={640}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            tags: [],
            is_private: false,
          }}
        >
          <Form.Item
            name="title"
            label="帖子标题"
            rules={[
              { required: true, message: '请输入帖子标题' },
              { min: 5, max: 100, message: '标题长度应在 5-100 字符之间' },
            ]}
          >
            <Input
              placeholder="请输入帖子标题，简洁明了地描述您的问题或话题"
              maxLength={100}
              showCount
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="帖子内容"
            rules={[
              { required: true, message: '请输入帖子内容' },
              { min: 10, max: 2000, message: '内容长度应在 10-2000 字符之间' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述您的问题、经验分享或话题讨论内容..."
              maxLength={2000}
              showCount
            />
          </Form.Item>
          <Form.Item name="tags" label="话题标签">
            <Select
              mode="tags"
              placeholder="输入标签后回车添加，最多添加5个标签"
              style={{ width: '100%' }}
              maxTagCount={5}
              tokenSeparators={[',', '，', ' ']}
            >
              {hotTags.map((tag) => (
                <Option key={tag.id} value={tag.name}>
                  {tag.name} ({tag.count})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="is_private"
            label={
              <Space>
                <span>私密帖子</span>
                <Tooltip title="开启后仅您自己可见此帖子">
                  <LockOutlined style={{ color: '#fa8c16' }} />
                </Tooltip>
              </Space>
            }
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="发帖须知"
            description="请遵守社区规范，禁止发布违规、广告或恶意内容。优质帖子将获得更多曝光和专家回答。"
          />
        </Form>
      </Modal>
    </div>
  );
}
