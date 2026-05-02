import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Empty } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  HistoryOutlined,
  GiftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { leaderboardApi, matchApi, rewardApi, authApi } from '../utils/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rankResponse, profileResponse] = await Promise.all([
        leaderboardApi.getMyRank(),
        authApi.getProfile()
      ]);

      if (rankResponse.data.success) {
        setMyRank(rankResponse.data.data);
      }

      if (profileResponse.data.success) {
        setProfile(profileResponse.data.data);
      }

      const matchesResponse = await matchApi.getList({ limit: 10, user_id: profileResponse.data.data.user.id });
      if (matchesResponse.data.success) {
        setRecentMatches(matchesResponse.data.data.matches || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
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

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '等待开始' },
      in_progress: { color: 'processing', text: '进行中' },
      completed: { color: 'success', text: '已完成' },
      report_pending: { color: 'warning', text: '等待上报' },
      report_received: { color: 'warning', text: '报告已收到' },
      verified: { color: 'processing', text: '已验证' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '比赛ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '比赛类型',
      dataIndex: 'match_type',
      key: 'match_type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'ranked' ? 'blue' : 'green'}>
          {type === 'ranked' ? '排位赛' : '普通赛'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: '玩家数',
      dataIndex: 'player_count',
      key: 'player_count',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-value">
            {profile?.seasonPoints?.total_points || 0}
          </div>
          <div className="stat-card-label">赛季积分</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-value">
            {myRank?.ranked ? `第${myRank.currentRank}名` : '未上榜'}
          </div>
          <div className="stat-card-label">当前排名</div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-value">
            {profile?.seasonPoints?.wins || 0}胜 / {profile?.seasonPoints?.losses || 0}负
          </div>
          <div className="stat-card-label">战绩</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-value">
            {profile?.seasonPoints?.rank || '青铜'}
          </div>
          <div className="stat-card-label">段位</div>
        </div>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="最近比赛" style={{ marginBottom: 24 }}>
            {recentMatches.length > 0 ? (
              <Table
                dataSource={recentMatches}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无比赛记录" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="我的排名信息">
            {myRank?.ranked ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 24 }}>
                  <div
                    className={`rank-badge ${getRankBadgeClass(myRank.currentRank)}`}
                    style={{ width: 80, height: 80, fontSize: 32, margin: '0 auto 16px' }}
                  >
                    {myRank.currentRank}
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    当前排名 / 共 {myRank.totalPlayers} 人
                  </div>
                </div>

                <div style={{ textAlign: 'left', marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="总积分" value={myRank.points} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="胜率" value={myRank.winRate?.toFixed(1)} suffix="%" />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Statistic title="场次" value={myRank.losses + myRank.wins} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="段位" value={myRank.rankName} />
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <Empty description="您还没有参加任何比赛" />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="系统说明" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 2 }}>
          <h4 style={{ marginBottom: 12 }}>工作流程说明</h4>
          <ol>
            <li><strong>比赛结束</strong>: 比赛进行完毕，等待战绩上报</li>
            <li><strong>战绩上报</strong>: 提交比赛结果和玩家数据</li>
            <li><strong>积分计算</strong>: 根据规则引擎计算每位玩家的积分变动</li>
            <li><strong>排行榜刷新</strong>: 更新各排行榜数据</li>
            <li><strong>奖励发放</strong>: 检查奖励条件，发放符合条件的奖励</li>
          </ol>
          
          <h4 style={{ margin: '24px 0 12px' }}>积分规则</h4>
          <ul>
            <li>排位赛胜利: +25 基础分</li>
            <li>排位赛失败: +5 基础分</li>
            <li>每击杀一人: +2 分</li>
            <li>每助攻一人: +1 分</li>
            <li>3连胜及以上: 积分加成 20%</li>
            <li>MVP: 额外 +10 分</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
