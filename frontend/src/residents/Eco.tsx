import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Space,
  Typography,
  Button,
  Tag,
  Tabs,
  Progress,
  Avatar,
  Skeleton,
  Empty,
  Divider,
  Tooltip,
  Statistic,
} from 'antd';
import {
  FireOutlined,
  CalendarOutlined,
  EnvironmentOutlined as LeafOutlined,
  GiftOutlined,
  TrophyOutlined,
  EyeOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  StarOutlined as MedalOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { ecoApi } from '@/api';
import type { Voucher, UserVoucher } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatPrice, formatDateTime, formatRelativeTime, formatDuration } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ResidentEco: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [ecoStatus, setEcoStatus] = useState<any>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<{
    valid: UserVoucher[];
    used: UserVoucher[];
    expired: UserVoucher[];
  }>({ valid: [], used: [], expired: [] });
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [activeVoucherTab, setActiveVoucherTab] = useState('available');
  const [claimLoading, setClaimLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ecoRes, vouchersRes, myVouchersRes, leaderboardRes] = await Promise.all([
        ecoApi.getMyEcoStatus(),
        ecoApi.getAvailableVouchers(),
        ecoApi.getMyVouchers(),
        ecoApi.getEcoLeaderboard({ limit: 10 }),
      ]);

      if (ecoRes.success) {
        setEcoStatus(ecoRes.data);
      }
      if (vouchersRes.success) {
        setAvailableVouchers(vouchersRes.data || []);
      }
      if (myVouchersRes.success) {
        setMyVouchers({
          valid: myVouchersRes.data?.valid || [],
          used: myVouchersRes.data?.used || [],
          expired: myVouchersRes.data?.expired || [],
        });
      }
      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.data);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVoucher = async (voucherId: string) => {
    try {
      setClaimLoading(voucherId);
      const response = await ecoApi.claimVoucher(voucherId);
      if (response.success) {
        showNotification('success', '优惠券领取成功');
        loadData();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '领取失败');
    } finally {
      setClaimLoading(null);
    }
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'top-1';
    if (index === 1) return 'top-2';
    if (index === 2) return 'top-3';
    return 'other';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <CrownOutlined style={{ color: '#ffd700', fontSize: '20px' }} />;
    if (index === 1) return <MedalOutlined style={{ color: '#c0c0c0', fontSize: '20px' }} />;
    if (index === 2) return <StarOutlined style={{ color: '#cd7f32', fontSize: '20px' }} />;
    return null;
  };

  const getVoucherValue = (voucher: Voucher) => {
    if (voucher.voucherType === 'amount' && voucher.discountValue) {
      return formatPrice(voucher.discountValue);
    }
    if (voucher.voucherType === 'percentage' && voucher.discountRate) {
      return `${voucher.discountRate * 10}折`;
    }
    if (voucher.voucherType === 'free') {
      return '免费';
    }
    return '-';
  };

  const calculateCO2Saved = (points: number) => {
    return (points * 0.05).toFixed(2);
  };

  const calculateWaterSaved = (points: number) => {
    return (points * 0.5).toFixed(1);
  };

  return (
    <div className="page-container">
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <Card
            className="card-shadow"
            style={{
              marginBottom: 24,
              background: 'linear-gradient(135deg, #52c41a 0%, #13c2c2 100%)',
              color: '#fff',
            }}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center" size={16}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                    }}
                  >
                    🌿
                  </div>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
                      环保中心
                    </Text>
                    <Title
                      level={3}
                      style={{
                        color: '#fff',
                        margin: '4px 0 0 0',
                        fontWeight: 700,
                      }}
                    >
                      低碳生活，从我做起
                    </Title>
                  </div>
                </Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
                >
                  刷新
                </Button>
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <FireOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>环保积分</Text>
                      </Space>
                    }
                    value={ecoStatus?.ecoPoints || 0}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>分</Text>}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <CalendarOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>连续使用</Text>
                      </Space>
                    }
                    value={ecoStatus?.streakDays || 0}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>天</Text>}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <LeafOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>累计减排</Text>
                      </Space>
                    }
                    value={calculateCO2Saved(ecoStatus?.ecoPoints || 0)}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>kg</Text>}
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card
                className="card-shadow"
                title={
                  <Space align="center">
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    <Title level={5} style={{ margin: 0 }}>连续使用进度</Title>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                {ecoStatus?.streakInfo ? (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space align="center">
                        <Text strong>已连续使用 {ecoStatus.streakInfo.currentStreak} 天</Text>
                        {ecoStatus.streakInfo.currentStreak >= 7 && (
                          <Tag color="gold">🔥 坚持达人</Tag>
                        )}
                      </Space>
                      <Text type="secondary">
                        目标: {ecoStatus.streakInfo.targetDays || 30} 天
                      </Text>
                    </Space>
                    <Progress
                      percent={Math.min(
                        ((ecoStatus.streakInfo.currentStreak || 0) / (ecoStatus.streakInfo.targetDays || 30)) * 100,
                        100
                      )}
                      strokeColor={{
                        '0%': '#52c41a',
                        '100%': '#13c2c2',
                      }}
                      size={[0, 16]}
                    />
                    <Row gutter={[16, 16]}>
                      <Col xs={12}>
                        <StatCard
                          title="本周使用"
                          value={`${ecoStatus.streakInfo.weeklyUsage || 0} 次`}
                          icon={<ThunderboltOutlined />}
                          color="#1890ff"
                        />
                      </Col>
                      <Col xs={12}>
                        <StatCard
                          title="累计节水"
                          value={`${calculateWaterSaved(ecoStatus?.ecoPoints || 0)} L`}
                          icon={<EnvironmentOutlined />}
                          color="#13c2c2"
                        />
                      </Col>
                    </Row>
                  </Space>
                ) : (
                  <Empty description="暂无连续使用记录" />
                )}
              </Card>

              {ecoStatus?.nextReward && (
                <Card
                  className="card-shadow"
                  style={{
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  }}
                >
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space align="center" size={16}>
                      <div
                        style={{
                          fontSize: '48px',
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '12px',
                          padding: '12px',
                        }}
                      >
                        🎁
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0, color: '#8b4513' }}>
                          下一个奖励
                        </Title>
                        <Text style={{ color: '#8b4513' }}>
                          再使用 {ecoStatus.nextReward.remaining} 次即可获得{' '}
                          <Text strong>{ecoStatus.nextReward.rewardName}</Text>
                        </Text>
                      </div>
                    </Space>
                    <Button type="primary" onClick={() => navigate('/resident/devices')}>
                      去使用
                    </Button>
                  </Space>
                  <div className="eco-progress" style={{ marginTop: 16, background: 'rgba(139,69,19,0.2)' }}>
                    <div
                      className="eco-progress-bar"
                      style={{
                        width: `${ecoStatus.nextReward.progress}%`,
                        background: '#8b4513',
                      }}
                    />
                  </div>
                  <Text style={{ color: '#8b4513', fontSize: '12px', marginTop: 8, display: 'block' }}>
                    进度: {ecoStatus.nextReward.current}/{ecoStatus.nextReward.target}
                  </Text>
                </Card>
              )}

              <Card
                className="card-shadow"
                title={
                  <Space align="center">
                    <GiftOutlined style={{ color: '#722ed1' }} />
                    <Title level={5} style={{ margin: 0 }}>优惠券</Title>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                <Tabs
                  activeKey={activeVoucherTab}
                  onChange={setActiveVoucherTab}
                  size="large"
                  items={[
                    {
                      key: 'available',
                      label: `可领取 (${availableVouchers.length})`,
                    },
                    {
                      key: 'valid',
                      label: `我的有效 (${myVouchers.valid.length})`,
                    },
                    {
                      key: 'used',
                      label: `已使用 (${myVouchers.used.length})`,
                    },
                    {
                      key: 'expired',
                      label: `已过期 (${myVouchers.expired.length})`,
                    },
                  ]}
                />

                <div style={{ marginTop: 16 }}>
                  {activeVoucherTab === 'available' && (
                    availableVouchers.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {availableVouchers.map((voucher) => (
                          <Col xs={24} md={12} key={voucher._id}>
                            <div
                              className="voucher-card"
                              style={{
                                background: `linear-gradient(135deg, ${DEVICE_TYPE_COLORS[voucher.deviceType as keyof typeof DEVICE_TYPE_COLORS] || '#722ed1'} 0%, ${DEVICE_TYPE_COLORS[voucher.deviceType as keyof typeof DEVICE_TYPE_COLORS] || '#722ed1'}cc 100%)`,
                              }}
                            >
                              <Space direction="vertical" size="small" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <div>
                                    <div className="amount">{getVoucherValue(voucher)}</div>
                                    <div className="condition">
                                      {voucher.minSpend ? `满${formatPrice(voucher.minSpend)}可用` : '无门槛'}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <Text strong style={{ color: '#fff' }}>
                                      {voucher.name}
                                    </Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Tag color="gold">
                                        {voucher.deviceType === 'all'
                                          ? '全部设备'
                                          : DEVICE_TYPE_MAP[voucher.deviceType as keyof typeof DEVICE_TYPE_MAP]}
                                      </Tag>
                                    </div>
                                  </div>
                                </Space>
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                                    {voucher.validity.type === 'fixed'
                                      ? `${formatDateTime(voucher.validity.startDate)} - ${formatDateTime(voucher.validity.endDate)}`
                                      : `领取后${voucher.validity.daysAfterReceive}天内有效`}
                                  </Text>
                                  <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleClaimVoucher(voucher._id)}
                                    loading={claimLoading === voucher._id}
                                    disabled={!voucher.canClaim}
                                  >
                                    {voucher.canClaim ? '立即领取' : voucher.reason || '已领完'}
                                  </Button>
                                </Space>
                                {voucher.ecoCondition && (
                                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                                    领取条件: {voucher.ecoCondition.streakDays
                                      ? `连续使用${voucher.ecoCondition.streakDays}天`
                                      : voucher.ecoCondition.minPoints
                                      ? `${voucher.ecoCondition.minPoints}积分`
                                      : '无'}
                                  </Text>
                                )}
                              </Space>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty description="暂无可领取的优惠券" style={{ padding: '40px 0' }} />
                    )
                  )}

                  {activeVoucherTab === 'valid' && (
                    myVouchers.valid.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {myVouchers.valid.map((uv) => (
                          <Col xs={24} md={12} key={uv._id}>
                            <div
                              className="voucher-card"
                              style={{
                                background: uv.voucher?.deviceType
                                  ? `linear-gradient(135deg, ${DEVICE_TYPE_COLORS[uv.voucher.deviceType as keyof typeof DEVICE_TYPE_COLORS]} 0%, ${DEVICE_TYPE_COLORS[uv.voucher.deviceType as keyof typeof DEVICE_TYPE_COLORS]}cc 100%)`
                                  : 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                              }}
                            >
                              <Space direction="vertical" size="small" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <div>
                                    <div className="amount">
                                      {uv.voucher?.voucherType === 'amount' && uv.voucher.discountValue
                                        ? formatPrice(uv.voucher.discountValue)
                                        : uv.voucher?.voucherType === 'percentage' && uv.voucher.discountRate
                                        ? `${uv.voucher.discountRate * 10}折`
                                        : '免费'}
                                    </div>
                                    <div className="condition">
                                      {uv.voucher?.minSpend ? `满${formatPrice(uv.voucher.minSpend)}可用` : '无门槛'}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <Text strong style={{ color: '#fff' }}>
                                      {uv.voucher?.name}
                                    </Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Tag color="gold">
                                        {uv.voucher?.deviceType === 'all'
                                          ? '全部设备'
                                          : uv.voucher?.deviceType
                                          ? DEVICE_TYPE_MAP[uv.voucher.deviceType as keyof typeof DEVICE_TYPE_MAP]
                                          : '-'}
                                      </Tag>
                                    </div>
                                  </div>
                                </Space>
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                                    有效期至: {formatDateTime(uv.expiredAt)}
                                  </Text>
                                  <Tag color="success">
                                    {uv.code}
                                  </Tag>
                                </Space>
                              </Space>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty description="暂无有效优惠券" style={{ padding: '40px 0' }} />
                    )
                  )}

                  {activeVoucherTab === 'used' && (
                    myVouchers.used.length > 0 ? (
                      <List
                        dataSource={myVouchers.used}
                        renderItem={(uv) => (
                          <List.Item
                            style={{
                              padding: '12px 0',
                              borderBottom: '1px solid #f0f0f0',
                              opacity: 0.7,
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <div
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '8px',
                                    background: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                  }}
                                >
                                  🎫
                                </div>
                              }
                              title={
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text strong>{uv.voucher?.name}</Text>
                                  <Tag color="default">已使用</Tag>
                                </Space>
                              }
                              description={
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                  <Space>
                                    <Text type="secondary">券码: {uv.code}</Text>
                                    <Text type="secondary">
                                      抵扣: {uv.voucher?.discountValue
                                        ? formatPrice(uv.voucher.discountValue)
                                        : uv.voucher?.discountRate
                                        ? `${uv.voucher.discountRate * 10}折`
                                        : '-'}
                                    </Text>
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    使用时间: {formatDateTime(uv.usedAt)}
                                  </Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="暂无已使用的优惠券" style={{ padding: '40px 0' }} />
                    )
                  )}

                  {activeVoucherTab === 'expired' && (
                    myVouchers.expired.length > 0 ? (
                      <List
                        dataSource={myVouchers.expired}
                        renderItem={(uv) => (
                          <List.Item
                            style={{
                              padding: '12px 0',
                              borderBottom: '1px solid #f0f0f0',
                              opacity: 0.5,
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <div
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '8px',
                                    background: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                  }}
                                >
                                  🎫
                                </div>
                              }
                              title={
                                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text strong>{uv.voucher?.name}</Text>
                                  <Tag color="default">已过期</Tag>
                                </Space>
                              }
                              description={
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                  <Space>
                                    <Text type="secondary">券码: {uv.code}</Text>
                                    <Text type="secondary">
                                      面值: {uv.voucher?.discountValue
                                        ? formatPrice(uv.voucher.discountValue)
                                        : uv.voucher?.discountRate
                                        ? `${uv.voucher.discountRate * 10}折`
                                        : '-'}
                                    </Text>
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    过期时间: {formatDateTime(uv.expiredAt)}
                                  </Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="暂无已过期的优惠券" style={{ padding: '40px 0' }} />
                    )
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="card-shadow"
                title={
                  <Space align="center">
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Title level={5} style={{ margin: 0 }}>环保排行榜</Title>
                  </Space>
                }
                style={{ marginBottom: 24 }}
                extra={
                  <Button type="link" size="small" onClick={loadData}>
                    刷新
                  </Button>
                }
              >
                {leaderboard?.myRank !== undefined && (
                  <Card
                    style={{
                      marginBottom: 16,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      border: 'none',
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space align="center">
                        <div
                          className={`leaderboard-rank ${getRankClass(leaderboard.myRank - 1)}`}
                        >
                          {getRankIcon(leaderboard.myRank - 1) || leaderboard.myRank}
                        </div>
                        <div>
                          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                            我的排名
                          </Text>
                          <Title level={4} style={{ color: '#fff', margin: 0 }}>
                            第 {leaderboard.myRank} 名
                          </Title>
                        </div>
                      </Space>
                      <div style={{ textAlign: 'right' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                          {leaderboard.myEcoPoints} 积分
                        </Text>
                        <div>
                          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                            {leaderboard.myStreakDays} 天连续
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                )}

                {leaderboard?.leaderboard?.length > 0 ? (
                  <List
                    dataSource={leaderboard.leaderboard}
                    renderItem={(item: any, index: number) => (
                      <div className="leaderboard-item" key={item._id || index}>
                        <div className={`leaderboard-rank ${getRankClass(index)}`}>
                          {getRankIcon(index) || (index + 1)}
                        </div>
                        <Avatar
                          src={item.user?.avatar}
                          style={{ marginRight: 12 }}
                        >
                          {item.user?.nickname?.charAt(0) || '用'}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text strong>{item.user?.nickname || '匿名用户'}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.streakDays} 天连续 · {item.ecoPoints} 积分
                            </Text>
                          </div>
                        </div>
                        <Space direction="vertical" align="end" size={0}>
                          <Text strong style={{ color: '#52c41a' }}>
                            {item.totalPoints || item.ecoPoints} 分
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            减排 {calculateCO2Saved(item.totalPoints || item.ecoPoints || 0)} kg
                          </Text>
                        </Space>
                      </div>
                    )}
                  />
                ) : (
                  <Empty description="暂无排行数据" style={{ padding: '20px 0' }} />
                )}
              </Card>

              <Card
                className="card-shadow"
                title={
                  <Space align="center">
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    <Title level={5} style={{ margin: 0 }}>最近环保行为</Title>
                  </Space>
                }
              >
                {ecoStatus?.recentLogs?.length > 0 ? (
                  <List
                    dataSource={ecoStatus.recentLogs}
                    renderItem={(item: any) => (
                      <List.Item
                        style={{
                          padding: '12px 0',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `${DEVICE_TYPE_COLORS[item.deviceType as keyof typeof DEVICE_TYPE_COLORS] || '#1890ff'}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                              }}
                            >
                              {DEVICE_TYPE_ICONS[item.deviceType as keyof typeof DEVICE_TYPE_ICONS] || '🌿'}
                            </div>
                          }
                          title={
                            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Space>
                                <Text strong>
                                  使用{DEVICE_TYPE_MAP[item.deviceType as keyof typeof DEVICE_TYPE_MAP] || '设备'}
                                </Text>
                                {item.points > 0 && (
                                  <Tag color="green">+{item.points} 积分</Tag>
                                )}
                              </Space>
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              {item.duration && (
                                <Text type="secondary">
                                  时长: {formatDuration(item.duration)}
                                </Text>
                              )}
                              {item.co2Saved && (
                                <Text type="success" style={{ fontSize: '12px' }}>
                                  <LeafOutlined /> 减排 {item.co2Saved} kg CO₂
                                </Text>
                              )}
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {item.time || formatRelativeTime(item.timestamp)}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无环保行为记录" style={{ padding: '20px 0' }} />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default ResidentEco;
