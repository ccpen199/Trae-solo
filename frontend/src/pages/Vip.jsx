import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { handleApiError } from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';
import BottomNav from '../components/layout/BottomNav';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding-bottom: 80px;
`;

const Header = styled.div`
  padding: 40px 20px 20px;
  text-align: center;
  color: #ffd700;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  opacity: 0.9;
`;

const VipCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 20px;
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  position: relative;
  z-index: 5;
`;

const PriceContainer = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const OriginalPrice = styled.span`
  font-size: 14px;
  text-decoration: line-through;
  opacity: 0.7;
  margin-right: 8px;
`;

const CurrentPrice = styled.span`
  font-size: 36px;
  font-weight: 700;
`;

const Duration = styled.span`
  font-size: 14px;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 20px;
  position: relative;
  z-index: 10;
`;

const PlanCard = styled.div`
  background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255,255,255,0.05)'};
  border: 2px solid ${props => props.$selected ? '#667eea' : 'transparent'};
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s;
`;

const PlanName = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const PlanPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const PlanDesc = styled.div`
  font-size: 11px;
  opacity: 0.7;
`;

const BenefitsSection = styled.div`
  padding: 20px;
`;

const BenefitsTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  color: white;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

const BenefitIcon = styled.div`
  font-size: 24px;
`;

const BenefitInfo = styled.div`
  flex: 1;
`;

const BenefitName = styled.div`
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 2px;
`;

const BenefitDesc = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const SubscribeButton = styled.button`
  margin: 20px;
  width: calc(100% - 40px);
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const benefits = [
  { icon: '📚', name: '无限借阅', desc: '全站书籍免费借阅，无数量限制' },
  { icon: '⭐', name: '精选好书', desc: '优先获取精选推荐书籍，新书抢先看' },
  { icon: '🎧', name: '有声读物', desc: '畅听全站有声书籍资源' },
  { icon: '📝', name: '读书笔记', desc: '无限云存储空间，永久保存笔记' },
  { icon: '🎁', name: '专属活动', desc: 'VIP会员专属活动，优先参与' },
  { icon: '💎', name: '专属标识', desc: '尊贵会员标识，彰显独特身份' }
];

const Vip = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/vip/plans');
      const planData = response.data.data || [];
      setPlans(planData);
      if (planData.length > 0) {
        setSelectedPlan(planData[0].id);
      }
    } catch (error) {
      console.error('获取VIP套餐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedPlan) {
      showToast('请选择套餐', 'warning');
      return;
    }

    setSubscribing(true);
    try {
      await apiClient.post('/vip/subscribe', { plan_id: selectedPlan });
      showToast('开通成功！', 'success');
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading fullPage />
        <BottomNav />
      </PageContainer>
    );
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <PageContainer>
      <Header>
        <Title>👑 VIP会员</Title>
        <Subtitle>解锁全站专属特权</Subtitle>
      </Header>

      {selectedPlanData && (
        <VipCard>
          <PriceContainer>
            <CurrentPrice>¥{selectedPlanData.price}</CurrentPrice>
            <Duration>/{selectedPlanData.name}</Duration>
          </PriceContainer>
        </VipCard>
      )}

      <PlanGrid>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            $selected={selectedPlan === plan.id}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <PlanName>{plan.name}</PlanName>
            <PlanPrice>¥{plan.price}</PlanPrice>
            <PlanDesc>{plan.description}</PlanDesc>
          </PlanCard>
        ))}
      </PlanGrid>

      <BenefitsSection>
        <BenefitsTitle>会员权益</BenefitsTitle>
        {benefits.map((benefit, index) => (
          <BenefitItem key={index}>
            <BenefitIcon>{benefit.icon}</BenefitIcon>
            <BenefitInfo>
              <BenefitName>{benefit.name}</BenefitName>
              <BenefitDesc>{benefit.desc}</BenefitDesc>
            </BenefitInfo>
          </BenefitItem>
        ))}
      </BenefitsSection>

      <SubscribeButton onClick={handleSubscribe} disabled={subscribing}>
        {subscribing ? '开通中...' : '立即开通VIP'}
      </SubscribeButton>

      <BottomNav />
    </PageContainer>
  );
};

export default Vip;
