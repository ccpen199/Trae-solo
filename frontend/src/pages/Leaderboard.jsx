import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Spin, Tag, Button, message, Tabs } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { leaderboardApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const [loading, setLoading] = useState(false);
  const [leaderboards, setLeaderboards] = useState([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState(null);
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const response = await leaderboardApi.getList();
      if (response.data.success) {
        const list = response.data.data || [];
        setLeaderboards(list);
        if (list.length > 0) {
          setSelectedLeaderboard(list[0].id);
          loadLeaderboardData(list[0].id);
        }
      }
    } catch (error) {
      console.error('加载排行榜失败:', error);
    }
  };

  const loadLeaderboardData = async (id) => {
    setLoading(true);
    try {
      const response = await leaderboardApi.getById(id, {
        include_user: user?.id,
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('加载排行榜数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await leaderboardApi.refreshAll();
      message.success('排行榜已刷新');
      if (selectedLeaderboard) {
        await loadLeaderboardData(selectedLeaderboard);
      }
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'normal';
  };

  const getRankChange = (current, previous) => {
    if (!previous || previous === current) {
      return <Tag color="default">未变</Tag>;
    }
    if (current < previous) {
      return <Tag color="green"><ReloadOutlined spin={false} /> 上升{previous - current}名</Tag>;
    }
    return <Tag color="red">下降{current - previous}名</Tag>;
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => (
        <div
          className={`rank-badge ${getRankBadgeClass(rank)}`}
          style={{ width: 36, height: 36, fontSize: 16 }}
        >
          {rank}
        </div>
      ),
    },
    {
      title: '玩家',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
      render: (nickname, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{nickname || record.username}</div>
          <div style={{ fontSize: 12, color: '#999' }}>@{record.username}</div>
        </div>
      ),
    },
    {
      title: '积分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score) => (
        <span style={{ fontWeight: 600, color: '#764ba2', fontSize: 16 }}>
          {score.toLocaleString()}
        </span>
      ),
    },
    {
      title: '战绩',
      dataIndex: 'metadata',
      key: 'stats',
      width: 150,
      render: (metadata) => {
        if (!metadata) return '-';
        return (
          <div>
            <div>{metadata.wins}胜 / {metadata.losses}负</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              胜率: {metadata.win_rate?.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      title: '段位',
      dataIndex: ['metadata', 'rank_name'],
      key: 'rank_name',
      width: 100,
      render: (rankName) => rankName || '-',
    },
    {
      title: '排名变动',
      key: 'change',
      width: 120,
      render: (_, record) => getRankChange(record.rank, record.previous_rank),
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">排行榜</h1>
        <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
          刷新排行榜
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={String(selectedLeaderboard)}
          onChange={(key) => {
            setSelectedLeaderboard(parseInt(key));
            loadLeaderboardData(parseInt(key));
          }}
          items={leaderboards.map((lb) => ({
            key: String(lb.id),
            label: lb.name,
          }))}
        />

        {data?.userEntry && (
          <div
            style={{
              padding: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              marginBottom: 24,
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>我的排名</div>
                <div style={{ fontSize: 36, fontWeight: 700 }}>
                  第{data.userEntry.rank}名
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>当前积分</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  {data.userEntry.score.toLocaleString()} 分
                </div>
              </div>
              {data.userEntry.previous_rank && (
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>排名变动</div>
                  <div style={{ fontSize: 18 }}>
                    {data.userEntry.previous_rank > data.userEntry.rank
                      ? `↑ ${data.userEntry.previous_rank - data.userEntry.rank} 名`
                      : data.userEntry.previous_rank < data.userEntry.rank
                      ? `↓ ${data.userEntry.rank - data.userEntry.previous_rank} 名`
                      : '未变'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Table
          dataSource={data?.entries || []}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 人`,
            pageSize: 20,
          }}
          rowClassName={(record) => {
            if (record.user_id === user?.id) {
              return 'current-user-row';
            }
            return '';
          }}
          onRow={(record) => ({
            style: record.user_id === user?.id ? { background: 'rgba(102, 126, 234, 0.08)' } : {},
          })}
          className="leaderboard-table"
        />
      </Card>

      <Card title="段位说明" style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {[
            { name: '青铜', min: 0, color: '#cd7f32' },
            { name: '白银', min: 1000, color: '#c0c0c0' },
            { name: '黄金', min: 2000, color: '#ffd700' },
            { name: '铂金', min: 3500, color: '#e5e4e2' },
            { name: '钻石', min: 5000, color: '#b9f2ff' },
            { name: '大师', min: 7500, color: '#9966cc' },
            { name: '王者', min: 10000, color: '#ff6b6b' },
          ].map((rank) => (
            <div
              key={rank.name}
              style={{
                padding: 16,
                border: `2px solid ${rank.color}`,
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, color: rank.color }}>
                {rank.name}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {rank.min.toLocaleString()} 分 起
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;
