import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, message } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { contractApi, signingApi } from '../utils/api';
import dayjs from 'dayjs';

const Home = () => {
  const navigate = useNavigate();
  const { user, isLegalExpert } = useAuth();
  const [stats, setStats] = useState({
    totalContracts: 0,
    pendingSignatures: 0,
    completedContracts: 0,
    pendingToday: 0
  });
  const [recentContracts, setRecentContracts] = useState([]);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [contractsRes, pendingRes] = await Promise.all([
        contractApi.list(),
        signingApi.getPending()
      ]);
      
      const contracts = contractsRes.data.data?.contracts || [];
      const pending = pendingRes.data.data?.pendingSignatures || [];
      
      const totalContracts = contracts.length;
      const completedContracts = contracts.filter(c => c.status === 'completed').length;
      const pendingSignaturesCount = pending.length;
      
      const today = dayjs().format('YYYY-MM-DD');
      const pendingToday = pending.filter(p => 
        dayjs(p.initialTimestamp).format('YYYY-MM-DD') === today
      ).length;
      
      setStats({
        totalContracts,
        pendingSignatures: pendingSignaturesCount,
        completedContracts,
        pendingToday
      });
      
      setRecentContracts(contracts.slice(0, 5));
      setPendingSignatures(pending.slice(0, 5));
      
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { text: '草稿', color: 'default' },
      'pending_signature': { text: '待签署', color: 'orange' },
      'signing': { text: '签署中', color: 'processing' },
      'completed': { text: '已完成', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' }
    };
    
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const statsCards = [
    {
      title: '合同总数',
      value: stats.totalContracts,
      icon: <FileTextOutlined />,
      color: '#667eea'
    },
    {
      title: '待我签署',
      value: stats.pendingSignatures,
      icon: <EditOutlined />,
      color: '#fa8c16'
    },
    {
      title: '已完成',
      value: stats.completedContracts,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: '今日新增',
      value: stats.pendingToday,
      icon: <ClockCircleOutlined />,
      color: '#1890ff'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          欢迎回来，{user?.realName || user?.username}
          {isLegalExpert && <Tag color="purple" style={{ marginLeft: 12 }}>法务专家</Tag>}
        </h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          {dayjs().format('YYYY年MM月DD日')} | 今日待签署 {stats.pendingToday} 份合同
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              loading={loading}
              style={{
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#666', fontSize: 14 }}>{card.title}</span>
                }
                value={card.value}
                prefix={
                  <span style={{ color: card.color, marginRight: 8 }}>{card.icon}</span>
                }
                valueStyle={{ color: '#333' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="最近合同"
            loading={loading}
            extra={
              <Button type="link" onClick={() => navigate('/contracts')}>
                查看全部
              </Button>
            }
            style={{ borderRadius: 8 }}
          >
            {recentContracts.length > 0 ? (
              <List
                dataSource={recentContracts}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/contracts/${item.id}`)}
                      >
                        查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {item.title}
                          <span style={{ marginLeft: 8 }}>{getStatusTag(item.status)}</span>
                        </span>
                      }
                      description={
                        <span style={{ color: '#999' }}>
                          {item.signedCount}/{item.totalSigners} 人已签署 | 
                          创建于 {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>暂无合同</p>
                <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate('/contracts')}>
                  创建合同
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="待我签署"
            loading={loading}
            extra={
              <Button type="link" onClick={() => navigate('/signing')}>
                查看全部
              </Button>
            }
            style={{ borderRadius: 8 }}
          >
            {pendingSignatures.length > 0 ? (
              <List
                dataSource={pendingSignatures}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/signing/${item.contractId}?signerId=${item.signerId}`)}
                      >
                        签署
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={
                        <span style={{ color: '#999' }}>
                          状态: {item.signStatus === 'pending' ? '待签署' : item.signStatus}
                          {item.initialTimestamp && 
                            ` | 发起于 ${dayjs(item.initialTimestamp).format('YYYY-MM-DD HH:mm')}`
                          }
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>暂无待签署合同</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
