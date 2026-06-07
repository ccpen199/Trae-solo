import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, message, Empty, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';

const { Title } = Typography;

function ConsultationList({ user, role }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadConsultations();
  }, [user]);

  const loadConsultations = async () => {
    try {
      const res = await consultationAPI.list();
      if (res.data.success) {
        setConsultations(res.data.consultations);
      }
    } catch (err) {
      message.error('加载咨询列表失败');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: 'orange',
    ai_answered: 'blue',
    lawyer_assigned: 'green',
    closed: 'default',
  };

  const statusLabels = {
    pending: '待处理',
    ai_answered: 'AI已回复',
    lawyer_assigned: '律师已回复',
    closed: '已关闭',
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Title level={2}>我的咨询</Title>
      <Card>
        {consultations.length === 0 && !loading ? (
          <Empty description="暂无咨询记录">
            <Link to="/consultation">
              <Button type="primary">发起咨询</Button>
            </Link>
          </Empty>
        ) : (
          <List
            dataSource={consultations}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                actions={[<Link to={`/consultations/${item.id}`}>查看详情</Link>]}
              >
                <List.Item.Meta
                  title={
                    <div>
                      {item.title}
                      <Tag color={statusColors[item.status]} style={{ marginLeft: 8 }}>
                        {statusLabels[item.status]}
                      </Tag>
                      <Tag>Lv.{item.level}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#666', marginBottom: 8 }}>
                        {item.description.substring(0, 100)}...
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {role === 'user' ? `律师: ${item.lawyer_name || '未分配'}` : `用户: ${item.user_name}`}
                        {' · '}
                        {item.created_at}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

export default ConsultationList;
