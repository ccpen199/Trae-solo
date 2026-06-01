import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Space, Descriptions, List, Input, message, Modal } from 'antd';
import { BookOutlined, StarOutlined, LikeOutlined, CommentOutlined, DollarOutlined, ReadOutlined } from '@ant-design/icons';
import request from '../utils/request.js';

const { TextArea } = Input;

function NovelDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [rewardModal, setRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(10);

  useEffect(() => {
    fetchNovel();
    fetchChapters();
    fetchComments();
  }, [id]);

  const fetchNovel = async () => {
    const res = await request.get(`/novels/${id}`);
    setNovel(res);
  };

  const fetchChapters = async () => {
    const res = await request.get(`/chapters/novel/${id}`, { params: { pageSize: 100 } });
    setChapters(res.list);
  };

  const fetchComments = async () => {
    const res = await request.get(`/reader/comments/novel/${id}`);
    setComments(res);
  };

  const handleBookshelf = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await request.post('/reader/bookshelf', { novel_id: id });
      message.success(res.message);
    } catch (e) {
      message.error(e.response?.data?.error);
    }
  };

  const handleVote = async () => {
    if (!user) return navigate('/login');
    try {
      await request.post('/reader/vote', { novel_id: id });
      message.success('投票成功');
      setNovel(n => ({ ...n, vote_count: n.vote_count + 1 }));
    } catch (e) {
      message.error(e.response?.data?.error || '已经投过票了');
    }
  };

  const handleComment = async () => {
    if (!user) return navigate('/login');
    try {
      await request.post('/reader/comment', { novel_id: id, content: commentText });
      message.success('评论成功');
      setCommentText('');
      fetchComments();
    } catch (e) {
      message.error(e.response?.data?.error);
    }
  };

  const handleReward = async () => {
    if (!user) return navigate('/login');
    try {
      await request.post('/reader/reward', { novel_id: id, amount: rewardAmount });
      message.success('打赏成功');
      setRewardModal(false);
    } catch (e) {
      message.error(e.response?.data?.error);
    }
  };

  if (!novel) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div className="container">
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={4}>
            <div className="novel-cover" style={{ width: '100%', height: 200 }}>
              <BookOutlined style={{ fontSize: 48 }} />
            </div>
          </Col>
          <Col span={20}>
            <h1 style={{ margin: '0 0 12px 0' }}>{novel.title}</h1>
            <Space wrap style={{ marginBottom: 16 }}>
              {novel.category_name && <Tag color="blue">{novel.category_name}</Tag>}
              {novel.sign_status === 'signed' && <Tag color="gold">已签约</Tag>}
              {novel.serialize_status === 'ongoing' && <Tag color="green">连载中</Tag>}
              {novel.tags?.split(',').filter(Boolean).map(t => <Tag key={t}>{t}</Tag>)}
            </Space>
            <Descriptions column={4} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="作者">{novel.author_name}</Descriptions.Item>
              <Descriptions.Item label="编辑">{novel.editor_name || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="字数">{(novel.word_count / 10000).toFixed(1)}万</Descriptions.Item>
              <Descriptions.Item label="章节">{novel.chapter_count}</Descriptions.Item>
              <Descriptions.Item label="点击">{novel.click_count}</Descriptions.Item>
              <Descriptions.Item label="订阅">{novel.subscribe_count}</Descriptions.Item>
              <Descriptions.Item label="投票">{novel.vote_count}</Descriptions.Item>
            </Descriptions>
            <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 16 }}>{novel.description}</p>
            <Space>
              <Button type="primary" size="large" icon={<ReadOutlined />} onClick={() => chapters.length && navigate(`/read/${id}/${chapters[0].id}`)}>
                开始阅读
              </Button>
              <Button size="large" icon={<StarOutlined />} onClick={handleBookshelf}>加入书架</Button>
              <Button size="large" icon={<LikeOutlined />} onClick={handleVote}>投票推荐</Button>
              <Button size="large" icon={<DollarOutlined />} onClick={() => setRewardModal(true)}>打赏</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col span={16}>
          <Card title={`最新章节 (${chapters.length})`} style={{ marginBottom: 24 }}>
            <List
              dataSource={chapters}
              renderItem={chapter => (
                <List.Item
                  actions={[
                    chapter.is_free ? <Tag color="green">免费</Tag> : <Tag color="orange">收费 ¥{chapter.price}</Tag>,
                    <span style={{ color: '#999', fontSize: 12 }}>{chapter.word_count}字</span>
                  ]}
                >
                  <a onClick={() => navigate(`/read/${id}/${chapter.id}`)}>
                    {chapter.chapter_order}. {chapter.title}
                  </a>
                </List.Item>
              )}
            />
          </Card>

          <Card title="评论区">
            {user && (
              <div style={{ marginBottom: 16 }}>
                <TextArea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="发表评论..." />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button type="primary" onClick={handleComment}>发表评论</Button>
                </div>
              </div>
            )}
            <List
              dataSource={comments}
              renderItem={comment => (
                <List.Item>
                  <List.Item.Meta
                    title={<Space><span>{comment.user_name}</span><span style={{ color: '#999', fontSize: 12 }}>{comment.created_at}</span></Space>}
                    description={comment.content}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="相关推荐">
            <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>更多精彩小说敬请期待</p>
          </Card>
        </Col>
      </Row>

      <Modal title="打赏作者" open={rewardModal} onCancel={() => setRewardModal(false)} onOk={handleReward}>
        <Input.Number
          min={1}
          value={rewardAmount}
          onChange={setRewardAmount}
          style={{ width: '100%' }}
          prefix="¥"
          addonAfter="元"
        />
        <p style={{ marginTop: 12, color: '#999' }}>您的余额: {user?.balance || 0} 元</p>
      </Modal>
    </div>
  );
}

export default NovelDetail;
