import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, message, Modal } from 'antd';
import { LeftOutlined, RightOutlined, BookOutlined } from '@ant-design/icons';
import request from '../utils/request.js';

function Reader({ user }) {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [needPay, setNeedPay] = useState(false);

  useEffect(() => {
    fetchChapter();
    fetchChapters();
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      const res = await request.get(`/chapters/${chapterId}`);
      setChapter(res);
      setNeedPay(false);
      saveProgress(res);
    } catch (e) {
      if (e.response?.status === 402) {
        setNeedPay(true);
        setChapter({ ...e.response.data, title: '需要订阅' });
      } else {
        message.error(e.response?.data?.error || '加载失败');
      }
    }
  };

  const fetchChapters = async () => {
    const res = await request.get(`/chapters/novel/${novelId}`, { params: { pageSize: 1000 } });
    setChapters(res.list);
  };

  const saveProgress = (ch) => {
    request.post('/reader/reading-progress', {
      novel_id: novelId,
      chapter_id: chapterId,
      progress: 0
    }).catch(() => {});
  };

  const handleSubscribe = async () => {
    if (!user) return navigate('/login');
    try {
      await request.post('/reader/subscribe', {
        novel_id: novelId,
        chapter_id: chapterId,
        amount: chapter.price,
        type: 'chapter'
      });
      message.success('订阅成功');
      fetchChapter();
    } catch (e) {
      message.error(e.response?.data?.error || '订阅失败');
    }
  };

  const goChapter = (offset) => {
    const idx = chapters.findIndex(c => c.id === parseInt(chapterId));
    const next = chapters[idx + offset];
    if (next) navigate(`/read/${novelId}/${next.id}`);
  };

  if (!chapter) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={() => navigate(`/novel/${novelId}`)}>返回目录</Button>
        <Space>
          <Button onClick={() => goChapter(-1)} icon={<LeftOutlined />}>上一章</Button>
          <Button onClick={() => goChapter(1)} icon={<RightOutlined />}>下一章</Button>
        </Space>
      </div>

      <div style={{ background: 'white', padding: 40, borderRadius: 8, minHeight: 400 }}>
        <h2 className="chapter-title">{chapter.title}</h2>
        
        {needPay ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <BookOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
            <p style={{ fontSize: 16, marginBottom: 16 }}>本章为付费章节，需要支付 ¥{chapter.price} 才能阅读</p>
            <p style={{ color: '#999', marginBottom: 24 }}>您的余额: {user?.balance || 0} 元</p>
            <Button type="primary" size="large" onClick={handleSubscribe}>立即订阅</Button>
          </div>
        ) : (
          <div className="reader-content">
            {chapter.content?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={() => navigate(`/novel/${novelId}`)}>返回目录</Button>
        <Space>
          <Button onClick={() => goChapter(-1)} icon={<LeftOutlined />}>上一章</Button>
          <Button onClick={() => goChapter(1)} icon={<RightOutlined />}>下一章</Button>
        </Space>
      </div>
    </div>
  );
}

export default Reader;
