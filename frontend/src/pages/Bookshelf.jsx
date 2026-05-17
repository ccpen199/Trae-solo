import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { handleApiError } from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';
import AdBanner from '../components/common/AdBanner';
import BottomNav from '../components/layout/BottomNav';
import { getRandomAd } from '../data/ads';

const PageContainer = styled.div`
  padding-bottom: 80px;
  min-height: 100vh;
  background: #f5f5f5;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 20px 30px;
  color: white;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  opacity: 0.9;
`;

const BookshelfContainer = styled.div`
  padding: 20px;
  margin-top: -20px;
`;

const BookshelfGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

const BookCard = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
`;

const BookCover = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  background: #e0e0e0;
`;

const BookInfo = styled.div`
  padding: 10px 8px;
`;

const BookTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
`;

const BookAuthor = styled.div`
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #999;
`;

const EmptyIcon = styled.div`
  font-size: 60px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
`;

const ActionSheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  z-index: 1000;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const ActionSheetOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
`;

const ActionSheetTitle = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #333;
`;

const ActionSheetItem = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: ${props => props.$danger ? '#ef4444' : '#333'};
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #f5f5f5;
  }
`;

const ActionSheetCancel = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
`;

const Bookshelf = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [closedAds, setClosedAds] = useState([]);
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const bookshelfAd = useMemo(() => getRandomAd('bookshelf'), []);

  const handleAdClose = (adId) => {
    setClosedAds(prev => [...prev, adId]);
  };

  const fetchBorrowedBooks = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/books/borrowed/my');
      setBorrowedBooks(response.data.data || []);
    } catch (error) {
      console.error('获取借阅书籍失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedBooks();
  }, [isAuthenticated]);

  const handleBookClick = (book) => {
    navigate(`/reader/${book.book_id}`, { state: { book } });
  };

  const handleBookLongPress = (e, book) => {
    e.preventDefault();
    setSelectedBook(book);
  };

  const handleReturnBook = async () => {
    if (!selectedBook) return;

    try {
      await apiClient.post(`/books/${selectedBook.book_id}/return`);
      showToast('归还成功', 'success');
      setSelectedBook(null);
      fetchBorrowedBooks();
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  const handleShare = () => {
    showToast('分享功能开发中', 'info');
    setSelectedBook(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading fullPage />
        <BottomNav />
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Header>
          <Title>我的书架</Title>
          <Subtitle>登录后查看您的借阅</Subtitle>
        </Header>
        <EmptyState>
          <EmptyIcon>🔒</EmptyIcon>
          <EmptyText>请登录后查看您的书架</EmptyText>
          <ActionButton onClick={() => navigate('/login')}>去登录</ActionButton>
        </EmptyState>
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <Title>我的书架</Title>
        <Subtitle>共 {borrowedBooks.length} 本正在借阅</Subtitle>
      </Header>

      {bookshelfAd && !closedAds.includes(bookshelfAd.id) && (
        <AdBanner ad={bookshelfAd} onClose={handleAdClose} />
      )}

      <BookshelfContainer>
        {borrowedBooks.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📚</EmptyIcon>
            <EmptyText>书架空空如也</EmptyText>
            <ActionButton onClick={() => navigate('/explore')}>去找书</ActionButton>
          </EmptyState>
        ) : (
          <BookshelfGrid>
            {borrowedBooks.map((book) => (
              <BookCard
                key={book.id}
                onClick={() => handleBookClick(book)}
                onContextMenu={(e) => handleBookLongPress(e, book)}
              >
                <BookCover src={book.cover} alt={book.title} />
                <BookInfo>
                  <BookTitle>{book.title}</BookTitle>
                  <BookAuthor>{book.author}</BookAuthor>
                </BookInfo>
              </BookCard>
            ))}
          </BookshelfGrid>
        )}
      </BookshelfContainer>

      {selectedBook && (
        <>
          <ActionSheetOverlay onClick={() => setSelectedBook(null)} />
          <ActionSheet>
            <ActionSheetTitle>{selectedBook.title}</ActionSheetTitle>
            <ActionSheetItem onClick={handleShare}>分享给好友</ActionSheetItem>
            <ActionSheetItem $danger onClick={handleReturnBook}>归还书籍</ActionSheetItem>
            <ActionSheetCancel onClick={() => setSelectedBook(null)}>取消</ActionSheetCancel>
          </ActionSheet>
        </>
      )}

      <BottomNav />
    </PageContainer>
  );
};

export default Bookshelf;
