import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Avatar, Space, Tag, Descriptions, Button, Input, List, message, Modal, Form, DatePicker } from 'antd';
import { LikeOutlined, MessageOutlined, ShareAltOutlined, EyeOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';
import { postAPI, socialAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  news: { label: '本地资讯', color: 'blue' },
  job: { label: '招聘求职', color: 'cyan' },
  rental: { label: '房屋租售', color: 'geekblue' },
  secondhand: { label: '二手交易', color: 'orange' },
  dating: { label: '相亲交友', color: 'magenta' },
  show: { label: '秀场动态', color: 'purple' },
};

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadPostDetail(parseInt(id));
    }
  }, [id]);

  const loadPostDetail = async (postId: number) => {
    setLoading(true);
    try {
      const res = await postAPI.getPostDetail(postId);
      setPost(res.data.post);
      setComments(res.data.comments);
    } catch (error) {
      message.error('加载帖子详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      await postAPI.likePost(post.id);
      loadPostDetail(post.id);
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  const handleComment = async () => {
    if (!post || !commentText.trim()) return;
    try {
      await postAPI.commentPost(post.id, { content: commentText });
      setCommentText('');
      loadPostDetail(post.id);
      message.success('评论成功');
    } catch (error) {
      message.error('评论失败');
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await postAPI.sharePost(post.id, { share_chain: navigator.userAgent });
      message.success('分享成功');
    } catch (error) {
      console.error('分享失败', error);
    }
  };

  const handleAppointment = async (values: any) => {
    if (!post) return;
    try {
      await socialAPI.createAppointment({
        post_id: post.id,
        appointment_type: post.category,
        appointment_time: values.time.format('YYYY-MM-DD HH:mm:ss'),
        contact_info: values.contact,
      });
      message.success('预约成功');
      setAppointmentModal(false);
      form.resetFields();
    } catch (error) {
      message.error('预约失败');
    }
  };

  const renderExtraInfo = () => {
    if (!post) return null;
    const extra = post.extra;
    if (!extra) return null;

    if (post.category === 'rental' && extra.rental) {
      return (
        <div className="extra-info">
          <Descriptions title="房屋信息" column={2} size="small">
            <Descriptions.Item label="朝向">{extra.rental.orientation}</Descriptions.Item>
            <Descriptions.Item label="楼层">{extra.rental.floor}</Descriptions.Item>
            <Descriptions.Item label="地铁站">{extra.rental.subway_station}</Descriptions.Item>
            <Descriptions.Item label="租金">{extra.rental.price} 元/月</Descriptions.Item>
            <Descriptions.Item label="面积">{extra.rental.area} ㎡</Descriptions.Item>
            <Descriptions.Item label="户型">{extra.rental.rooms} 室</Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    if (post.category === 'job' && extra.job) {
      return (
        <div className="extra-info">
          <Descriptions title="职位信息" column={2} size="small">
            <Descriptions.Item label="工种">{extra.job.job_type}</Descriptions.Item>
            <Descriptions.Item label="公司">{extra.job.company_name}</Descriptions.Item>
            <Descriptions.Item label="薪资">{extra.job.salary_min}k - {extra.job.salary_max}k</Descriptions.Item>
            <Descriptions.Item label="经验要求">{extra.job.experience_required}</Descriptions.Item>
            <Descriptions.Item label="学历要求">{extra.job.education_required}</Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    if (post.category === 'dating' && extra.dating) {
      return (
        <div className="extra-info">
          <Descriptions title="个人信息" column={2} size="small">
            <Descriptions.Item label="性别">{extra.dating.gender}</Descriptions.Item>
            <Descriptions.Item label="年龄">{extra.dating.age} 岁</Descriptions.Item>
            <Descriptions.Item label="身高">{extra.dating.height} cm</Descriptions.Item>
            <Descriptions.Item label="学历">{extra.dating.education}</Descriptions.Item>
            <Descriptions.Item label="职业">{extra.dating.occupation}</Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    if (post.category === 'secondhand' && extra.secondhand) {
      return (
        <div className="extra-info">
          <Descriptions title="物品信息" column={2} size="small">
            <Descriptions.Item label="价格">{extra.secondhand.price} 元</Descriptions.Item>
            <Descriptions.Item label="成色">{extra.secondhand.condition}</Descriptions.Item>
            <Descriptions.Item label="分类">{extra.secondhand.category}</Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <Card loading />;
  }

  if (!post) {
    return <Card><Text type="secondary">帖子不存在或已被删除</Text></Card>;
  }

  const needAppointment = ['rental', 'job', 'dating'].includes(post.category);

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Avatar src={post.author_avatar} size="large" />
            <div>
              <Space>
                <Text strong style={{ fontSize: 16 }}>{post.author_name}</Text>
                {post.author_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
                <Tag color={CATEGORY_MAP[post.category]?.color || 'default'}>
                  {CATEGORY_MAP[post.category]?.label || post.category}
                </Tag>
                <Tag color="gold">可信度 {post.credibility_score?.toFixed(0)}%</Tag>
              </Space>
              <br />
              <Text type="secondary">
                {post.city_name} {post.district} {post.street} · {dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </Space>

          <Title level={2} style={{ marginBottom: 8 }}>{post.title}</Title>

          {post.images && JSON.parse(post.images)?.length > 0 && (
            <img
              src={JSON.parse(post.images)[0]}
              alt={post.title}
              className="detail-image"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          )}

          <div style={{ fontSize: 16, lineHeight: 1.8 }}>{post.content}</div>

          {renderExtraInfo()}

          {needAppointment && (
            <Button type="primary" size="large" icon={<CalendarOutlined />} onClick={() => setAppointmentModal(true)}>
              {post.category === 'rental' ? '预约看房' : post.category === 'job' ? '投递简历' : '预约见面'}
            </Button>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            <Button type="text" icon={<EyeOutlined />}>{post.view_count}</Button>
            <Button type="text" icon={<LikeOutlined />} onClick={handleLike}>{post.like_count}</Button>
            <Button type="text" icon={<MessageOutlined />}>{post.comment_count}</Button>
            <Button type="text" icon={<ShareAltOutlined />} onClick={handleShare}>{post.share_count}</Button>
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={`评论 (${comments.length})`}>
        <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
          <TextArea
            rows={3}
            placeholder="写下你的评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button type="primary" onClick={handleComment}>发表</Button>
        </Space.Compact>

        <List
          dataSource={comments}
          renderItem={(comment) => (
            <List.Item key={comment.id}>
              <Card size="small" style={{ width: '100%' }}>
                <Space>
                  <Avatar src={comment.author_avatar} />
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Text strong>{comment.author_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(comment.created_at).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Text>{comment.content}</Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="预约服务"
        open={appointmentModal}
        onCancel={() => setAppointmentModal(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAppointment} layout="vertical">
          <Form.Item
            name="time"
            label="预约时间"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="contact"
            label="联系方式"
            rules={[{ required: true, message: '请填写联系方式' }]}
          >
            <Input placeholder="手机号或微信号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认预约</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PostDetailPage;
