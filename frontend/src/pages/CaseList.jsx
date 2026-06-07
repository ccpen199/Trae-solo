import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, message, Empty, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { caseAPI } from '../utils/api';

const { Title } = Typography;

function CaseList({ user, role }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCases();
  }, [user]);

  const loadCases = async () => {
    try {
      const res = await caseAPI.list();
      if (res.data.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      message.error('加载案件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    filing: 'orange',
    fee_paid: 'blue',
    hearing: 'purple',
    judgment: 'green',
    execution: 'cyan',
    closed: 'default',
  };

  const statusLabels = {
    filing: '立案中',
    fee_paid: '已缴费',
    hearing: '开庭中',
    judgment: '已判决',
    execution: '执行中',
    closed: '已结案',
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Title level={2}>我的案件</Title>
      <Card>
        {cases.length === 0 && !loading ? (
          <Empty description="暂无案件记录" />
        ) : (
          <List
            dataSource={cases}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                actions={[<Link to={`/cases/${item.id}`}>查看进度</Link>]}
              >
                <List.Item.Meta
                  title={
                    <div>
                      {item.title}
                      <Tag color={statusColors[item.status]} style={{ marginLeft: 8 }}>
                        {statusLabels[item.status]}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div>案号: {item.case_number}</div>
                      <div>{role === 'user' ? `律师: ${item.lawyer_name}` : `用户: ${item.user_name}`}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{item.created_at}</div>
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

export default CaseList;
