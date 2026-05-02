import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, Empty, Descriptions } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { rewardApi } from '../utils/api';

const Rewards = () => {
  const [loading, setLoading] = useState(false);
  const [myRewards, setMyRewards] = useState([]);

  useEffect(() => {
    loadMyRewards();
  }, []);

  const loadMyRewards = async () => {
    setLoading(true);
    try {
      const response = await rewardApi.getMyRewards();
      if (response.data.success) {
        setMyRewards(response.data.data || []);
      }
    } catch (error) {
      console.error('加载奖励失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id) => {
    try {
      const response = await rewardApi.claim(id);
      if (response.data.success) {
        message.success('奖励领取成功！');
        loadMyRewards();
      }
    } catch (error) {
      message.error(error.response?.data?.error || '领取失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      eligible: { color: 'green', text: '可领取' },
      claimed: { color: 'blue', text: '已领取' },
      expired: { color: 'default', text: '已过期' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '奖励名称',
      dataIndex: 'reward_name',
      key: 'reward_name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'reward_type',
      key: 'reward_type',
      width: 120,
      render: (type) => {
        const typeMap = {
          item: '道具',
          points: '积分',
          badge: '徽章',
          currency: '货币',
        };
        return <Tag>{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '条件',
      dataIndex: 'condition_type',
      key: 'condition_type',
      width: 150,
      render: (type, record) => {
        const typeMap = {
          rank: '排名',
          wins: '胜场',
          matches_played: '场次',
        };
        return (
          <span>
            {typeMap[type] || type} ≥ {record.condition_value}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '获得时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => {
        if (record.status === 'eligible') {
          return (
            <Button type="primary" size="small" onClick={() => handleClaim(record.id)}>
              领取
            </Button>
          );
        }
        if (record.status === 'claimed') {
          return <Tag color="blue">已领取</Tag>;
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">奖励中心</h1>
        <Button onClick={loadMyRewards}>刷新</Button>
      </div>

      <Card>
        <Table
          dataSource={myRewards}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            showTotal: (total) => `共 ${total} 个奖励`,
            pageSize: 10,
          }}
          locale={{
            emptyText: (
              <Empty 
                description="暂无奖励" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <p>参与比赛获取奖励吧！</p>
              </Empty>
            ),
          }}
        />
      </Card>

      <Card title="奖励规则" style={{ marginTop: 24 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="排名奖励">
            在赛季结束时，根据排名获得对应奖励
          </Descriptions.Item>
          <Descriptions.Item label="胜场奖励">
            达到指定胜场数后，自动获得奖励资格
          </Descriptions.Item>
          <Descriptions.Item label="场次奖励">
            参与指定场次后，自动获得奖励资格
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Rewards;
