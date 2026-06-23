import { useState, useEffect, useCallback } from 'react';
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
  Pagination,
  Empty,
  Modal,
  Form,
  Upload,
  Image,
  Avatar,
  List,
  Divider,
  Select,
} from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
  LikeOutlined,
  PlusOutlined,
  UserOutlined,
  FireOutlined,
  SendOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CommunityPost, PostComment } from '../../types';
import { community } from '../../api/endpoints';
import { highlightSensitiveWords } from '../../utils/sensitive.tsx';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const hotTags = [
  { name: '胶印故障', count: 128 },
  { name: '水性油墨', count: 96 },
  { name: '海德堡', count: 85 },
  { name: '小森机', count: 72 },
  { name: '色彩管理', count: 68 },
  { name: 'CTP制版', count: 56 },
  { name: 'UV印刷', count: 48 },
  { name: '覆膜工艺', count: 42 },
  { name: '模切技术', count: 38 },
  { name: '烫金工艺', count: 35 },
];

const Community = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [page, pageSize, selectedTag]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
        keyword,
        tag: selectedTag,
      };
      const response = await community.posts(params);
      const list = response.data?.list || response.data?.data || response.data || [];
      const total = response.data?.total ?? 0;
      setData(list);
      setTotal(total);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setPage(1);
  };

  const handleCreatePost = () => {
    form.resetFields();
    setImageList([]);
    setModalVisible(true);
  };

  const extractTags = (content: string): string[] => {
    const regex = /#([^\s#]+)/g;
    const matches = content.match(regex);
    if (matches) {
      return matches.map(match => match.slice(1));
    }
    return [];
  };

  const handleSubmitPost = async () => {
    try {
      const values = await form.validateFields();
      const tags = extractTags(values.content);
      const postData = {
        title: values.title,
        content: values.content,
        tags,
        images: imageList.filter(f => f.status === 'done').map(f => f.url || ''),
      };
      await community.createPost(postData);
      message.success('发布成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('发布失败，请检查内容');
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await community.like(postId);
      setData(prev => prev.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const toggleComments = useCallback(async (postId: number) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!expandedComments[postId]) {
      try {
        const detail = await community.postDetail(postId);
        const detailData = detail.data?.data || detail.data;
        setData(prev => prev.map(post =>
          post.id === postId ? { ...post, comments: detailData.comments } : post
        ));
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    }
  }, [expandedComments]);

  const handleSubmitComment = async (postId: number) => {
    const text = commentText[postId]?.trim();
    if (!text) {
      message.warning('请输入评论内容');
      return;
    }
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      await community.comment(postId, text);
      message.success('评论成功');
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      const detail = await community.postDetail(postId);
      const detailData = detail.data?.data || detail.data;
      setData(prev => prev.map(post =>
        post.id === postId
          ? { ...post, comments: detailData.comments, commentsCount: (post.commentsCount || 0) + 1 }
          : post
      ));
    } catch (error) {
      message.error('评论失败，请稍后重试');
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const imageUploadProps: UploadProps = {
    listType: 'picture-card',
    fileList: imageList,
    onChange: ({ fileList: newFileList }) => setImageList(newFileList),
    beforeUpload: () => false,
    accept: 'image/*',
    maxCount: 9,
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <MessageOutlined /> 行业社群
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePost}>
            发布帖子
          </Button>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={18}>
          <Card style={{ marginBottom: '16px' }}>
            <Space style={{ width: '100%' }} wrap>
              <Search
                placeholder="搜索帖子标题、内容、标签"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 400 }}
                onSearch={handleSearch}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Select
                placeholder="按标签筛选"
                allowClear
                style={{ width: 200 }}
                value={selectedTag}
                onChange={(value) => {
                  setSelectedTag(value);
                  setPage(1);
                }}
              >
                {hotTags.map(tag => (
                  <Option key={tag.name} value={tag.name}>
                    #{tag.name} ({tag.count})
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>

          {loading ? (
            <Card loading />
          ) : data.length === 0 ? (
            <Empty description="暂无帖子，快来发布第一条吧" />
          ) : (
            <List
              dataSource={data}
              renderItem={(post) => (
                <Card
                  key={post.id}
                  hoverable
                  onClick={() => navigate(`/jobseeker/community/${post.id}`)}
                  style={{ marginBottom: '16px' }}
                >
                  <List.Item
                    actions={[
                      <span onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>
                        <LikeOutlined /> {post.likes}
                      </span>,
                      <span onClick={(e) => { e.stopPropagation(); toggleComments(post.id); }} style={{ cursor: 'pointer' }}>
                        <CommentOutlined /> {post.commentsCount}
                      </span>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar size="large" icon={<UserOutlined />} src={post.user?.avatar} />
                      }
                      title={
                        <Space align="start" style={{ width: '100%' }}>
                          <div>
                            <Text strong style={{ fontSize: '16px' }}>{post.title}</Text>
                            <div style={{ marginTop: '4px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {post.user?.name || '匿名用户'} · {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                              </Text>
                            </div>
                          </div>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: '8px', color: '#333' }}>
                            {highlightSensitiveWords(post.content.substring(0, 150))}
                            {post.content.length > 150 && '...'}
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <Space wrap size={[4, 4]} style={{ marginBottom: '8px' }}>
                              {post.tags.map((tag, idx) => (
                                <Tag key={idx} color="blue">#{tag}</Tag>
                              ))}
                            </Space>
                          )}
                          {post.images && post.images.length > 0 && (
                            <Row gutter={[8, 8]}>
                              {post.images.slice(0, 3).map((img, idx) => (
                                <Col span={8} key={idx}>
                                  <Image
                                    src={img}
                                    alt=""
                                    height={100}
                                    width="100%"
                                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                                    preview={false}
                                  />
                                </Col>
                              ))}
                              {post.images.length > 3 && (
                                <Col span={8}>
                                  <div
                                    style={{
                                      height: 100,
                                      background: '#f0f0f0',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                      color: '#999',
                                    }}
                                  >
                                    +{post.images.length - 3}
                                  </div>
                                </Col>
                              )}
                            </Row>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                  {expandedComments[post.id] && (
                    <div style={{ marginTop: '12px', paddingLeft: '48px' }} onClick={(e) => e.stopPropagation()}>
                      <Divider style={{ margin: '8px 0' }} />
                      <Space.Compact style={{ width: '100%', marginBottom: '12px' }}>
                        <Input
                          placeholder="写下你的评论..."
                          value={commentText[post.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onPressEnter={() => handleSubmitComment(post.id)}
                          style={{ borderRadius: '4px 0 0 4px' }}
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={() => handleSubmitComment(post.id)}
                          loading={commentSubmitting[post.id]}
                          style={{ borderRadius: '0 4px 4px 0' }}
                        />
                      </Space.Compact>
                      {post.comments && post.comments.length > 0 ? (
                        <List
                          size="small"
                          dataSource={post.comments.slice(0, 5)}
                          renderItem={(c: PostComment) => (
                            <List.Item style={{ padding: '4px 0', border: 'none' }}>
                              <List.Item.Meta
                                avatar={<Avatar size="small" icon={<UserOutlined />} src={c.user?.avatar} />}
                                title={
                                  <Text style={{ fontSize: '12px' }}>
                                    {c.user?.name || '匿名用户'}
                                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                      {dayjs(c.createdAt).format('MM-DD HH:mm')}
                                    </Text>
                                  </Text>
                                }
                                description={<Text style={{ fontSize: '13px', color: '#333' }}>{c.content}</Text>}
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Text type="secondary" style={{ fontSize: '12px' }}>暂无评论，快来发表第一条评论吧</Text>
                      )}
                      {(post.commentsCount || 0) > 5 && (
                        <Button type="link" size="small" onClick={() => navigate(`/jobseeker/community/${post.id}`)}>
                          查看全部 {post.commentsCount} 条评论
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )}
            />
          )}

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
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
        </Col>

        <Col span={6}>
          <Card title={<><FireOutlined /> 热门标签</>} style={{ position: 'sticky', top: '24px' }}>
            <Space wrap size={[6, 6]}>
              {hotTags.map(tag => (
                <Tag
                  key={tag.name}
                  color={selectedTag === tag.name ? 'blue' : 'default'}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: '16px',
                  }}
                  onClick={() => handleTagClick(tag.name)}
                >
                  #{tag.name}
                  <Text type="secondary" style={{ marginLeft: '4px', fontSize: '11px' }}>
                    {tag.count}
                  </Text>
                </Tag>
              ))}
            </Space>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePost} block>
                发布新帖子
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="发布新帖子"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmitPost}
        okText="发布"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="帖子标题"
            rules={[
              { required: true, message: '请输入帖子标题' },
              { max: 100, message: '标题不能超过100字' },
            ]}
          >
            <Input placeholder="请输入一个吸引人的标题" maxLength={100} showCount />
          </Form.Item>
          <Form.Item
            name="content"
            label="帖子内容"
            rules={[
              { required: true, message: '请输入帖子内容' },
              { max: 2000, message: '内容不能超过2000字' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="分享您的印刷行业经验、问题或见解...&#10;使用 #标签 可以自动提取标签，例如 #胶印故障 #水性油墨"
              maxLength={2000}
              showCount
            />
          </Form.Item>
          <Form.Item label="上传图片（可选，最多9张）">
            <Upload {...imageUploadProps}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: '8px' }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const content = form.getFieldValue('content') || '';
              const extractedTags = extractTags(content);
              if (extractedTags.length === 0) return null;
              return (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    已识别标签：
                  </Text>
                  <Space size={[4, 4]} wrap style={{ marginLeft: '8px' }}>
                    {extractedTags.map((tag, idx) => (
                      <Tag key={idx} color="blue">#{tag}</Tag>
                    ))}
                  </Space>
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Community;
