import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, message, Empty, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { contractAPI } from '../utils/api';

const { Title } = Typography;

function ContractList({ user, role }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadContracts();
  }, [user]);

  const loadContracts = async () => {
    try {
      const res = await contractAPI.list();
      if (res.data.success) {
        setContracts(res.data.contracts);
      }
    } catch (err) {
      message.error('加载合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Title level={2}>我的合同</Title>
      <Card>
        {contracts.length === 0 && !loading ? (
          <Empty description="暂无合同记录">
            <Link to="/contracts/generate">
              <Button type="primary">生成合同</Button>
            </Link>
          </Empty>
        ) : (
          <List
            dataSource={contracts}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                actions={[<Button type="link">查看详情</Button>, <Button type="link">下载</Button>]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <div>
                      <Tag>{item.category}</Tag>
                      <Tag color={item.status === 'generated' ? 'blue' : 'green'}>
                        {item.status === 'generated' ? '已生成' : '已审核'}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                        {item.created_at}
                      </span>
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

export default ContractList;
