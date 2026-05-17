import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { handleApiError } from '../api/client';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';
import AdBanner from '../components/common/AdBanner';
import BottomNav from '../components/layout/BottomNav';
import { getRandomAd, getAdsByPosition } from '../data/ads';

const PageContainer = styled.div`
  padding-bottom: 80px;
  min-height: 100vh;
  background: #f5f5f5;
`;

const SearchContainer = styled.div`
  padding: 16px 20px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    background: #eee;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  overflow-x: auto;
  background: white;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTab = styled.div`
  padding: 8px 16px;
  background: ${props => props.$active ? '#3b82f6' : '#f5f5f5'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
`;

const Section = styled.div`
  margin-top: 16px;
  background: white;
  padding: 16px 20px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const BookCard = styled.div`
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
`;

const BookCover = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  background: #e0e0e0;
`;

const BookTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BookAuthor = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TopicBanner = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
  }
`;

const TopicTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TopicDesc = styled.div`
  font-size: 13px;
  opacity: 0.9;
`;

const SquareItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const ShareContent = styled.div`
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
`;

const SharedBook = styled.div`
  display: flex;
  gap: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
`;

const SharedBookCover = styled.img`
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
`;

const SharedBookInfo = styled.div`
  flex: 1;
`;

const SharedBookTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const SharedBookAuthor = styled.div`
  font-size: 12px;
  color: #999;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 24px;
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${props => props.$liked ? '#ef4444' : '#666'};
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closedAds, setClosedAds] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const exploreAds = useMemo(() => getAdsByPosition('explore'), []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        apiClient.get('/books/categories'),
        apiClient.get('/books/featured'),
        apiClient.get('/square/posts', { params: { limit: 10 } })
      ]);

      if (results[0].status === 'fulfilled') {
        setCategories(results[0].value.data.data || []);
      }
      if (results[1].status === 'fulfilled') {
        setFeaturedBooks(results[1].value.data.data || []);
        setAllBooks(results[1].value.data.data || []);
      }
      if (results[2].status === 'fulfilled') {
        setPosts(results[2].value.data.data || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setAllBooks(featuredBooks);
      return;
    }

    try {
      const response = await apiClient.get('/books', { params: { search: searchQuery } });
      setAllBooks(response.data.data?.books || []);
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category.id === selectedCategory ? null : category.id);
    
    try {
      const response = await apiClient.get('/books', { 
        params: { category_id: category.id === selectedCategory ? null : category.id } 
      });
      setAllBooks(response.data.data?.books || []);
    } catch (error) {
      console.error('获取分类书籍失败:', error);
    }
  };

  const handleLike = async (post) => {
    try {
      await apiClient.post(`/square/posts/${post.id}/like`);
      setPosts(posts.map(p => 
        p.id === post.id 
          ? { ...p, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1), liked: !p.liked }
          : p
      ));
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  const handleAdClose = (adId) => {
    setClosedAds(prev => [...prev, adId]);
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading fullPage />
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SearchContainer>
        <SearchInput
          placeholder="搜索书籍、作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </SearchContainer>

      <CategoryTabs>
        {categories.map((cat) => (
          <CategoryTab
            key={cat.id}
            $active={selectedCategory === cat.id}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat.icon} {cat.name}
          </CategoryTab>
        ))}
      </CategoryTabs>

      {exploreAds[0] && !closedAds.includes(exploreAds[0].id) && (
        <AdBanner ad={exploreAds[0]} onClose={handleAdClose} />
      )}

      <Section>
        <SectionTitle>🔥 热门话题</SectionTitle>
        <TopicBanner onClick={() => navigate('/square')}>
          <TopicTitle>夏日阅读清单</TopicTitle>
          <TopicDesc>分享你最爱的夏日读物，赢取VIP会员</TopicDesc>
        </TopicBanner>
      </Section>

      <Section>
        <SectionTitle>⭐ 精选推荐</SectionTitle>
        <BookGrid>
          {allBooks.slice(0, 6).map((book) => (
            <BookCard key={book.id} onClick={() => navigate(`/book/${book.id}`)}>
              <BookCover src={book.cover} alt={book.title} />
              <BookTitle>{book.title}</BookTitle>
              <BookAuthor>{book.author}</BookAuthor>
            </BookCard>
          ))}
        </BookGrid>
      </Section>

      {exploreAds[1] && !closedAds.includes(exploreAds[1].id) && (
        <div style={{ marginTop: '16px' }}>
          <AdBanner ad={exploreAds[1]} onClose={handleAdClose} />
        </div>
      )}

      <Section>
        <SectionTitle>💬 广场动态</SectionTitle>
        {posts.map((post) => (
          <SquareItem key={post.id}>
            <UserInfo>
              <UserAvatar src={post.user_avatar} />
              <UserName>{post.nickname || '书友'}</UserName>
            </UserInfo>
            {post.content && <ShareContent>{post.content}</ShareContent>}
            {post.book_id && (
              <SharedBook onClick={() => navigate(`/book/${post.book_id}`)}>
                <SharedBookCover src={post.book_cover} />
                <SharedBookInfo>
                  <SharedBookTitle>{post.book_title}</SharedBookTitle>
                  <SharedBookAuthor>{post.share_reason || '推荐阅读'}</SharedBookAuthor>
                </SharedBookInfo>
              </SharedBook>
            )}
            <ActionRow>
              <ActionButton $liked={post.liked} onClick={() => handleLike(post)}>
                ❤️ {post.likes_count || 0}
              </ActionButton>
              <ActionButton onClick={() => navigate(`/post/${post.id}`)}>
                💬 {post.comments_count || 0}
              </ActionButton>
              <ActionButton>
                📤 分享
              </ActionButton>
            </ActionRow>
          </SquareItem>
        ))}
      </Section>

      <BottomNav />
    </PageContainer>
  );
};

export default Explore;
