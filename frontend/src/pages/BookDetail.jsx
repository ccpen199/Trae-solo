import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { handleApiError } from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
`;

const BookCover = styled.img`
  width: 120px;
  height: 168px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const BookInfo = styled.div`
  flex: 1;
`;

const BookTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const BookAuthor = styled.p`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
`;

const BookMeta = styled.p`
  font-size: 12px;
  opacity: 0.8;
`;

const ContentSection = styled.div`
  padding: 20px;
  background: white;
  margin-top: -10px;
  border-radius: 16px 16px 0 0;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  line-height: 1.8;
`;

const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 20px;
  display: flex;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  
  &.primary {
    background: #3b82f6;
    color: white;
  }
  
  &.secondary {
    background: #f5f5f5;
    color: #333;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      const response = await apiClient.get(`/books/${id}`);
      setBook(response.data.data);
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBorrowing(true);
    try {
      await apiClient.post(`/books/${id}/borrow`);
      showToast('借阅成功！', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setBorrowing(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await apiClient.post('/user/wishlist', { book_id: id });
      showToast('已加入心愿单', 'success');
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading fullPage />
      </PageContainer>
    );
  }

  if (!book) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}>←</BackButton>
          <BookTitle>书籍不存在</BookTitle>
        </Header>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>←</BackButton>
        <BookCover src={book.cover} />
        <BookInfo>
          <BookTitle>{book.title}</BookTitle>
          <BookAuthor>作者：{book.author}</BookAuthor>
          {book.category_name && <BookMeta>分类：{book.category_name}</BookMeta>}
          {book.publisher && <BookMeta>出版社：{book.publisher}</BookMeta>}
        </BookInfo>
      </Header>

      <ContentSection>
        <SectionTitle>简介</SectionTitle>
        <Description>{book.description || '暂无简介'}</Description>
      </ContentSection>

      <BottomBar>
        <ActionButton className="secondary" onClick={handleAddToWishlist}>
          加入心愿单
        </ActionButton>
        <ActionButton 
          className="primary" 
          onClick={handleBorrow}
          disabled={borrowing}
        >
          {borrowing ? '借阅中...' : '免费借阅'}
        </ActionButton>
      </BottomBar>
    </PageContainer>
  );
};

export default BookDetail;
