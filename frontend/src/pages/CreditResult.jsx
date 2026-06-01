import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Result, Descriptions, Tag, Divider, message } from 'antd';
import { creditAPI } from '../services/api';
import AppLayout from '../components/Layout';

const CreditResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credit, setCredit] = useState(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchCredit();
    let timer;
    if (polling) {
      timer = setInterval(fetchCredit, 2000);
    }
    return () => clearInterval(timer);
  }, [id, polling]);

  const fetchCredit = async () => {
    try {
      const res = await creditAPI.getDetail(id);
      setCredit(res.data);
      if (res.data?.status !== 'pending' && res.data?.status !== 'reviewing') {
        setPolling(false);
      }
    } catch (err) {
      console.error('Fetch credit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLoan = () => {
    navigate(`/loan/apply/${id}`);
  };

  if (loading || !credit) {
    return (
      <AppLayout title="授信结果">
        <div className="loading-container">
          <Spin size="large" tip="正在获取结果..." />
        </div>
      </AppLayout>
    );
  }

  const getStatusInfo = () => {
    switch (credit.status) {
      case 'pending':
      case 'reviewing':
        return {
          status: 'info',
          title: '审核中',
          subTitle: '我们正在对您的申请进行审核，请耐心等待',
        };
      case 'approved':
        return {
          status: 'success',
          title: '授信通过',
          subTitle: '恭喜您的授信申请已通过，您可以申请借款了',
        };
      case 'rejected':
        return {
          status: 'error',
          title: '授信未通过',
          subTitle: credit.reject_reason || '综合评分不足，暂时无法为您提供授信',
        };
      default:
        return { status: 'info', title: '未知状态' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <AppLayout title="授信结果">
      <div className="page-container">
        <Card>
          <Result
            status={statusInfo.status}
            title={statusInfo.title}
            subTitle={statusInfo.subTitle}
          />

          {credit.status === 'approved' && (
            <>
              <Divider />
              <Descriptions column={1} bordered title="授信信息">
                <Descriptions.Item label="产品名称">{credit.product_name}</Descriptions.Item>
                <Descriptions.Item label="授信额度">
                  <span style={{ color: '#1890ff', fontSize: 20, fontWeight: 'bold' }}>
                    {(credit.approved_amount / 10000).toFixed(2)} 万元
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="授信期限">{credit.approved_term} 个月</Descriptions.Item>
                <Descriptions.Item label="日利率">{(credit.interest_rate * 100).toFixed(3)}%</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color="green">已通过</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <Button type="primary" size="large" onClick={handleApplyLoan} style={{ marginRight: 16 }}>
                  立即借款
                </Button>
                <Button size="large" onClick={() => navigate('/products')}>
                  查看其他产品
                </Button>
              </div>
            </>
          )}

          {(credit.status === 'pending' || credit.status === 'reviewing') && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ color: '#666', marginBottom: 16 }}>预计1-3分钟内出结果，请稍候...</p>
            </div>
          )}

          {credit.status === 'rejected' && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button type="primary" onClick={() => navigate('/products')}>
                查看其他产品
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreditResult;
