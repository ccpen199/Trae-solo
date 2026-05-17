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
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 30px;
  color: white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const Avatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  background: white;
`;

const UserText = styled.div`
  flex: 1;
`;

const Username = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const UserMeta = styled.p`
  font-size: 13px;
  opacity: 0.9;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const StatCard = styled.div`
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

const MenuSection = styled.div`
  padding: 20px;
`;

const MenuGroup = styled.div`
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #f9f9f9;
  }
`;

const MenuIcon = styled.div`
  font-size: 20px;
  width: 28px;
  text-align: center;
`;

const MenuText = styled.div`
  flex: 1;
  font-size: 15px;
  color: #333;
`;

const MenuArrow = styled.div`
  color: #ccc;
  font-size: 14px;
`;

const LoginBanner = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 20px;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  color: white;
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
  }
`;

const LoginTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const LoginDesc = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const menuItems = [
  { icon: '❤️', text: '我的心愿单', path: '/wishlist' },
  { icon: '📝', text: '我的笔记', path: '/notes' },
  { icon: '📚', text: '借阅记录', path: '/borrow-history' },
  { icon: '📖', text: '阅读历史', path: '/reading-history' },
  { icon: '⚙️', text: '设置', path: '/settings' }
];

const Profile = () => {
  const [stats, setStats] = useState({ borrow_count: 0, note_count: 0, wishlist_count: 0 });
  const [loading, setLoading] = useState(true);
  const [closedAds, setClosedAds] = useState([]);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const profileAd = useMemo(() => getRandomAd('profile'), []);

  const handleAdClose = (adId) => {
    setClosedAds(prev => [...prev, adId]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/user/stats');
      setStats(response.data.data || { borrow_count: 0, note_count: 0, wishlist_count: 0 });
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'success');
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
        <LoginBanner onClick={() => navigate('/login')}>
          <LoginTitle>👋 欢迎来到藏书馆</LoginTitle>
          <LoginDesc>登录后开启你的阅读之旅</LoginDesc>
        </LoginBanner>
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <UserInfo>
          <Avatar src={user?.avatar} />
          <UserText>
            <Username>{user?.nickname || user?.username}</Username>
            {user?.is_vip && <UserMeta>👑 VIP会员</UserMeta>}
          </UserText>
        </UserInfo>
        
        <StatsRow>
          <StatCard>
            <StatValue>{stats.borrow_count}</StatValue>
            <StatLabel>借阅书籍</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.note_count}</StatValue>
            <StatLabel>读书笔记</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.wishlist_count}</StatValue>
            <StatLabel>心愿单</StatLabel>
          </StatCard>
        </StatsRow>
      </Header>

      {profileAd && !closedAds.includes(profileAd.id) && (
        <AdBanner ad={profileAd} onClose={handleAdClose} />
      )}

      <MenuSection>
        <MenuGroup>
          {menuItems.map((item, index) => (
            <MenuItem key={index} onClick={() => navigate(item.path)}>
              <MenuIcon>{item.icon}</MenuIcon>
              <MenuText>{item.text}</MenuText>
              <MenuArrow>›</MenuArrow>
            </MenuItem>
          ))}
        </MenuGroup>
        
        <MenuGroup>
          <MenuItem onClick={handleLogout}>
            <MenuIcon>🚪</MenuIcon>
            <MenuText style={{ color: '#ef4444' }}>退出登录</MenuText>
          </MenuItem>
        </MenuGroup>
      </MenuSection>

      <BottomNav />
    </PageContainer>
  );
};

export default Profile;
