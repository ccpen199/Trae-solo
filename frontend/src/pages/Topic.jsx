import React, { useState, useEffect } from 'react';
import { 
  Layout, Button, Card, Avatar, Typography, 
  Space, Input, message, Divider, List
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EyeOutlined, SendOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { topicApi } from '../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Topic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTopic = async () => {
    try {
      const result = await topicApi.getTopic(id);
      setTopic(result.data);
    } catch (error) {
      console.error('加载主题失败:', error);
    }
  };

  const loadComments = async () => {
    try {
      const result = await topicApi.getComments(id);
      setComments(result.data || []);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    setSubmitting(true);
    try {
      await topicApi.createComment(id, { content: commentContent });
      message.success('评论成功');
      setCommentContent('');
      loadComments();
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadTopic();
    loadComments();
  }, [id]);

  if (!topic) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Title level={3}>加载中...</Title>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <Title level={4} style={{ marginLeft: 16, marginBottom: 0 }}>
          {topic.title}
        </Title>
      </Header>

      <Content style={{ padding: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Avatar size={48}>{topic.user_name?.charAt(0)}</Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ fontSize: 16 }}>{topic.user_name}</Text>
                {topic.is_question && <span style={{ color: '#fa8c16', background: '#fff7e6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>提问</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, color: '#999', fontSize: 14 }}>
                <span><EyeOutlined /> {topic.view_count || 0} 浏览</span>
                <span>💬 {topic.comment_count || 0} 评论</span>
                <span>{dayjs(topic.created_at).fromNow()}</span>
              </div>
            </div>
          </div>
          
          <Divider />
          
          <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
            {topic.content}
          </Paragraph>
        </Card>

        <Card title={`评论 (${comments.length})`}>
          <div style={{ marginBottom: 24 }}>
            <Input.TextArea 
              rows={4}
              placeholder="写下你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleSubmitComment}
                loading={submitting}
              >
                发表评论
              </Button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>加载评论中...</div>
          ) : comments.length > 0 ? (
            <List
              dataSource={comments}
              renderItem={(item) => (
                <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Avatar>{item.user_name?.charAt(0)}</Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{item.user_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.created_at).fromNow()}
                        </Text>
                      </div>
                      <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                        {item.content}
                      </Paragraph>
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无评论，快来抢沙发吧
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default Topic;
