import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spin, Empty, Tag, Divider } from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { commissionApi } from '../services/api';
import { useApp } from '../store/appContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [loading, setLoading] = useState(true);
  const [commissionData, setCommissionData] = useState(null);

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      const result = await commissionApi.getList();
      setCommissionData(result.data);
    } catch (error) {
      console.error('加载佣金数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      1: { text: '待结佣金', className: 'warning' },
      2: { text: '部分垫付', className: 'processing' },
      3: { text: '已结清', className: 'success' }
    };
    const info = statusMap[status] || { text: '未知', className: 'error' };
    return <span className={`status-tag ${info.className}`}>{info.text}</span>;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>我的佣金</h1>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>我的佣金</h1>
      </div>
      <div className="page-content">
        <div className="user-info">
          <div className="info">
            <div className="name">{user?.merchantName}</div>
            <div className="phone">{user?.phone}</div>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              logout();
              navigate('/');
            }}
          />
        </div>

        <div className="stat-grid">
          <div className="stat-item">
            <div className="label">待结佣金</div>
            <div className="value">
              ¥{(commissionData?.totalPending || 0).toLocaleString()}
            </div>
          </div>
          <div className="stat-item">
            <div className="label">已垫付金额</div>
            <div className="value">
              ¥{(commissionData?.totalAdvanced || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <Divider orientation="left">佣金批次</Divider>

        {commissionData?.list?.length > 0 ? (
          commissionData.list.map((item) => (
            <Card
              key={item.id}
              bordered={false}
              style={{ marginBottom: 12 }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{item.project_name}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#8c8c8c' }}>{item.house_address}</p>
                </div>
                {getStatusTag(item.status)}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>批次金额</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>¥{item.total_amount.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>待结金额</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fa8c16' }}>¥{item.pending_amount.toLocaleString()}</div>
                </div>
              </div>

              {item.status !== 3 && item.has_invoice && (
                <Button
                  type="primary"
                  block
                  onClick={() => navigate(`/advance/apply/${item.id}`)}
                >
                  申请垫付 <ArrowRightOutlined />
                </Button>
              )}
            </Card>
          ))
        ) : (
          <Empty description="暂无佣金数据" />
        )}

        <div className="nav-grid">
          <div className="nav-item" onClick={() => navigate('/credit')}>
            <SafetyCertificateOutlined className="icon" />
            <div className="text">授信管理</div>
          </div>
          <div className="nav-item" onClick={() => navigate('/bankcard')}>
            <CreditCardOutlined className="icon" />
            <div className="text">银行卡管理</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
