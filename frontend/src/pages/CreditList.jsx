import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Tag, Spin, Button, Empty, Badge } from 'antd';
import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import { creditAPI } from '../services/api';
import AppLayout from '../components/Layout';

const CreditList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState([]);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await creditAPI.getList();
      setCredits(res.data || []);
    } catch (err) {
      console.error('Fetch credits error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'blue', text: '待提交' },
      reviewing: { color: 'orange', text: '审核中' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '未通过' },
    };
    return configs[status] || { color: 'default', text: status };
  };

  const handleItemClick = (id) => {
    navigate(`/credit/${id}`);
  };

  if (loading) {
    return (
      <AppLayout title="我的申请">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!credits?.length) {
    return (
      <AppLayout title="我的申请">
        <div className="page-container">
          <div className="empty-container">
            <Empty description="暂无申请记录">
              <Button type="primary" onClick={() => navigate('/products')}>
                去申请
              </Button>
            </Empty>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="我的申请">
      <div className="page-container">
        <List
          itemLayout="vertical"
          dataSource={credits}
          renderItem={(item) => {
            const statusConfig = getStatusConfig(item.status);
            return (
              <Card
                key={item.id}
                style={{ marginBottom: 16, cursor: 'pointer' }}
                onClick={() => handleItemClick(item.id)}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{item.product_name}</h3>
                      <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                        申请时间：{new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {item.status === 'approved' && (
                      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                        {(item.approved_amount / 10000).toFixed(2)}万
                      </span>
                    )}
                    <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    {item.status === 'pending' && (
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/credit/apply/${item.id}`);
                        }}
                      >
                        继续申请
                      </Button>
                    )}
                    <RightOutlined style={{ color: '#999' }} />
                  </div>
                </div>
              </Card>
            );
          }}
        />
      </div>
    </AppLayout>
  );
};

export default CreditList;
