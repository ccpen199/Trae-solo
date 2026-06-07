import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, message, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { caseAPI } from '../../utils/api';

const { Title } = Typography;

function LawyerCases({ user }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

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

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>案件管理</Title>
      <Card>
        {cases.length === 0 && !loading ? (
          <Empty description="暂无案件" />
        ) : (
          <List
            dataSource={cases}
            loading={loading}
            renderItem={(item) => (
              <List.Item actions={[<Link to={`/cases/${item.id}`}>查看详情</Link>]}>
                <List.Item.Meta
                  title={item.title}
                  description={<div>案号: {item.case_number} · 用户: {item.user_name} · {item.created_at}</div>}
                />
                <Tag>{item.status}</Tag>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

export default LawyerCases;
