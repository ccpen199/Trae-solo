import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { handleApiError } from '../api/client';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';
import AdBanner from '../components/common/AdBanner';
import { getRandomAd } from '../data/ads';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #fdf6e3;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(253, 246, 227, 0.95);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  z-index: 100;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  color: #333;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
  text-align: center;
  margin: 0 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContentContainer = styled.div`
  padding: 80px 20px 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const BookContent = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: #333;
  text-align: justify;
  
  p {
    margin-bottom: 1.5em;
    text-indent: 2em;
  }
`;

const ProgressBar = styled.div`
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  height: 3px;
  background: #eee;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #667eea;
  width: ${props => props.$progress}%;
  transition: width 0.3s;
`;

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [closedAds, setClosedAds] = useState([]);
  const { showToast } = useToast();

  const readerAd = useMemo(() => getRandomAd('reader'), []);

  const handleAdClose = (adId) => {
    setClosedAds(prev => [...prev, adId]);
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await apiClient.get(`/books/${id}`);
      setBook(response.data.data);
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, progressPercent)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Loading fullPage />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>←</BackButton>
        <Title>{book?.title || '阅读'}</Title>
        <BackButton onClick={() => showToast('设置功能开发中', 'info')}>⋮</BackButton>
      </Header>
      
      <ProgressBar>
        <ProgressFill $progress={progress} />
      </ProgressBar>

      <ContentContainer>
        <BookContent>
          <p>这是《{book?.title}》的内容。</p>
          <p>在一个遥远的小镇上，有一座古老的图书馆。这座图书馆里收藏着无数珍贵的书籍，每一本书都承载着独特的故事和智慧。</p>
          <p>村民们经常来到这里，沉浸在书的海洋中。他们在这里寻找知识，寻找灵感，寻找心灵的慰藉。图书馆的管理员是一位和蔼的老人，他总是热情地接待每一位读者，为他们推荐合适的书籍。</p>
        </BookContent>

        {readerAd && !closedAds.includes(readerAd.id) && (
          <div style={{ margin: '20px -20px' }}>
            <AdBanner ad={readerAd} onClose={handleAdClose} />
          </div>
        )}

        <BookContent>
          <p>随着时间的流逝，这座图书馆成为了小镇的精神家园。无论外面的世界如何变化，这里始终保持着那份宁静和温暖。每一本书都在等待着有缘人的翻阅，每一个故事都在等待着被重新发现。</p>
          <p>这就是阅读的力量——它能够穿越时空，连接不同的心灵，传递永恒的智慧。</p>
          <p>（完）</p>
        </BookContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default Reader;
