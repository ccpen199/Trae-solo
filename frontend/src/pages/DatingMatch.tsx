import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Button, Typography, Tag, message, Space, Descriptions } from 'antd';
import { HeartOutlined, UserOutlined, SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { socialAPI } from '../api';

const { Title, Text } = Typography;

const DatingMatchPage: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getDatingMatches();
      setMatches(res.data.matches);
    } catch (error) {
      message.error('加载匹配失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (currentIndex < matches.length) {
      message.success('已喜欢');
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePass = () => {
    if (currentIndex < matches.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  if (currentIndex >= matches.length) {
    return (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <Title level={3}>暂时没有更多匹配</Title>
        <Text type="secondary">请稍后再来看看吧～</Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" onClick={loadMatches}>重新加载</Button>
        </div>
      </Card>
    );
  }

  const current = matches[currentIndex];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card
        hoverable
        cover={<div style={{ height: 400, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar size={120} icon={<UserOutlined />} src={current.avatar} style={{ backgroundColor: 'white' }} />
        </div>}
        actions={[
          <Button type="text" danger size="large" icon={<CloseCircleOutlined />} onClick={handlePass}>跳过</Button>,
          <Button type="primary" size="large" icon={<HeartOutlined />} onClick={handleLike}>喜欢</Button>,
        ]}
      >
        <Card.Meta
          title={
            <Space>
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>{current.nickname}</span>
              {current.is_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
            </Space>
          }
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="magenta">{current.gender}</Tag>
                <Tag>{current.age}岁</Tag>
                <Tag>{current.height}cm</Tag>
              </div>
              <Text type="secondary">{current.title}</Text>
            </div>
          }
        />
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 16, lineHeight: 1.8 }}>{current.content}</p>
        </div>
        <div className="extra-info">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="学历">{current.education}</Descriptions.Item>
            <Descriptions.Item label="职业">{current.occupation}</Descriptions.Item>
          </Descriptions>
        </div>
        <Button type="link" block onClick={() => navigate(`/posts/${current.post_id}`)}>查看详情</Button>
      </Card>
    </div>
  );
};

export default DatingMatchPage;
