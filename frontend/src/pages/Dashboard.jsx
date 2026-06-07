import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Statistic, Button, Space, Spin, Tag, Typography, Descriptions, Divider } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AuditOutlined,
  SettingOutlined,
  WarningOutlined,
  BarChartOutlined,
  SafetyOutlined,
  WalletOutlined,
  TagOutlined,
  OrderedListOutlined,
  CarOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  BankOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { userApi, providerApi, orderApi, reportApi } from '../services/api';

const { Text } = Typography;

const adminEntrances = [
  { label: '服务商审核', path: '/providers/audit', icon: <AuditOutlined />, color: '#1677ff', desc: '商户入驻资质审核' },
  { label: '费率配置', path: '/fee-config', icon: <SettingOutlined />, color: '#722ed1', desc: '分润费率参数配置' },
  { label: '仲裁工单', path: '/arbitrations', icon: <WarningOutlined />, color: '#faad14', desc: '异常订单纠纷仲裁' },
  { label: '数据报表', path: '/reports', icon: <BarChartOutlined />, color: '#13c2c2', desc: '城市GMV/复购率/投诉率' },
  { label: '风控事件', path: '/risk-events', icon: <SafetyOutlined />, color: '#f5222d', desc: '风险事件记录与复查' },
  { label: '服务商管理', path: '/providers', icon: <ShopOutlined />, color: '#52c41a', desc: '服务商全生命周期管理' },
  { label: '商品管理', path: '/products', icon: <ShoppingCartOutlined />, color: '#13c2c2', desc: '服务商品上下架' },
  { label: '订单管理', path: '/orders', icon: <OrderedListOutlined />, color: '#2f54eb', desc: '全量订单跟踪查询' },
];

const merchantEntrances = [
  { label: '商品上架', path: '/products', icon: <ShoppingCartOutlined />, color: '#52c41a', desc: '套餐/计价规则/账单模板' },
  { label: '订单履约', path: '/orders', icon: <OrderedListOutlined />, color: '#1677ff', desc: '订单处理与配送跟踪' },
  { label: '服务商入驻', path: '/providers', icon: <ShopOutlined />, color: '#722ed1', desc: '服务商信息维护' },
];

const userEntrances = [
  { label: '外卖下单', path: '/products', icon: <ShoppingCartOutlined />, color: '#fa8c16', desc: '餐饮外卖套餐' },
  { label: '打车出行', path: '/products', icon: <CarOutlined />, color: '#1677ff', desc: '出行叫车服务' },
  { label: '政务缴费', path: '/products', icon: <FileTextOutlined />, color: '#52c41a', desc: '水电燃气/罚单缴费' },
  { label: '商超零售', path: '/products', icon: <ShopOutlined />, color: '#722ed1', desc: '超市生鲜零售' },
  { label: '订单查询', path: '/orders', icon: <OrderedListOutlined />, color: '#13c2c2', desc: '历史订单/资金流水' },
  { label: '钱包充值', path: '/orders', icon: <WalletOutlined />, color: '#2f54eb', desc: '钱包余额/充值' },
  { label: '优惠券', path: '/orders', icon: <TagOutlined />, color: '#eb2f96', desc: '优惠券池管理' },
];

function parseUserInfo() {
  const stored = localStorage.getItem('userInfo');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalProviders: 0, todayOrders: 0, todayGmv: 0 });
  const navigate = useNavigate();
  const userInfo = useMemo(() => parseUserInfo(), []);
  const role = userInfo?.role || 'user';

  const roleMap = { admin: '审核运营', merchant: '商户', user: '普通用户' };
  const roleLabel = roleMap[role] || '用户';

  const entrances = useMemo(() => {
    if (role === 'admin') return adminEntrances;
    if (role === 'merchant') return merchantEntrances;
    return userEntrances;
  }, [role]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, providersRes, ordersRes, gmvRes] = await Promise.allSettled([
          userApi.getList({ page: 1, pageSize: 1 }),
          providerApi.getList({ page: 1, pageSize: 1 }),
          orderApi.getList({ page: 1, pageSize: 1 }),
          reportApi.gmv({ startDate: '2026-06-01', endDate: '2026-06-02' }),
        ]);

        const getVal = (res, key1, key2) => {
          if (res.status !== 'fulfilled') return 0;
          const d = res.value.data;
          return d[key1] ?? d[key2] ?? d.data?.[key1] ?? d.data?.[key2] ?? 0;
        };

        setStats({
          totalUsers: getVal(usersRes, 'total', 'count'),
          totalProviders: getVal(providersRes, 'total', 'count'),
          todayOrders: getVal(ordersRes, 'total', 'count'),
          todayGmv: getVal(gmvRes, 'totalGmv', 'total'),
        });
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin tip="加载工作台数据..." />
      </div>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: role === 'admin' ? '#1677ff' : role === 'merchant' ? '#52c41a' : '#faad14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                {role === 'admin' ? <AuditOutlined /> : role === 'merchant' ? <ShopOutlined /> : <UserOutlined />}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  欢迎，{userInfo?.realName || roleLabel}
                </div>
                <div>
                  <Tag color={role === 'admin' ? 'blue' : role === 'merchant' ? 'green' : 'orange'}>
                    {roleLabel}
                  </Tag>
                  {userInfo?.hasBankCard === false && (
                    <Tag color="gold" icon={<BankOutlined />}>
                      免绑卡用户
                    </Tag>
                  )}
                  {userInfo?.idCardVerified && (
                    <Tag color="green" icon={<IdcardOutlined />}>
                      已实名
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={18}>
            <Descriptions size="small" column={4}>
              <Descriptions.Item label="手机号">{userInfo?.phone}</Descriptions.Item>
              <Descriptions.Item label="钱包余额">
                <Tag color="blue" icon={<WalletOutlined />}>
                  ¥{Number(userInfo?.walletBalance || 0).toFixed(2)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优惠券">
                <Tag color="orange" icon={<TagOutlined />}>查看</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资金流水">
                <Tag color="cyan">可复查</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {role === 'admin' && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="总用户数" value={stats.totalUsers} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="服务商数量" value={stats.totalProviders} prefix={<ShopOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日订单" value={stats.todayOrders} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日GMV" value={stats.todayGmv} prefix={<DollarOutlined />} precision={2} />
            </Card>
          </Col>
        </Row>
      )}

      {role === 'merchant' && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="我的商品" value={stats.totalProviders} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="今日订单" value={stats.todayOrders} prefix={<OrderedListOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="今日流水" value={stats.todayGmv} prefix={<DollarOutlined />} precision={2} />
            </Card>
          </Col>
        </Row>
      )}

      {role === 'user' && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="钱包余额" value={Number(userInfo?.walletBalance || 0)} prefix={<WalletOutlined />} precision={2} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="优惠券" value={0} prefix={<TagOutlined />} suffix="张" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="我的订单" value={stats.todayOrders} prefix={<OrderedListOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="资金流水" value={stats.todayGmv} prefix={<DollarOutlined />} precision={2} />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title={
          <Space>
            {role === 'admin' ? <AuditOutlined style={{ color: '#1677ff' }} /> : role === 'merchant' ? <ShopOutlined style={{ color: '#52c41a' }} /> : <ShoppingCartOutlined style={{ color: '#faad14' }} />}
            <span>{roleLabel}工作台入口</span>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            银保监穿透式监管 · 资金流水可复查
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          {entrances.map((e) => (
            <Col xs={24} sm={12} md={8} lg={role === 'admin' ? 6 : 8} key={e.path}>
              <Card
                hoverable
                style={{ cursor: 'pointer', borderLeft: `4px solid ${e.color}` }}
                onClick={() => navigate(e.path)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${e.color}15`,
                      color: e.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {e.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                      {e.label}
                      <ArrowRightOutlined style={{ color: e.color, marginLeft: 6, fontSize: 12 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.4 }}>
                      {e.desc}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {role === 'admin' && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left">监管合规入口</Divider>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/reports')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChartOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>城市GMV报表</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>各城市GMV/复购率/投诉率</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/risk-events')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafetyOutlined style={{ color: '#f5222d', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>风控事件记录</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>异常交易/频率/身份告警</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/orders')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>资金流水复查</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>所有交易穿透式可追溯</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {role === 'user' && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left">个人中心</Divider>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/orders')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OrderedListOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>订单查询</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>历史订单明细</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/orders')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <WalletOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>钱包充值</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>余额管理/充值</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" onClick={() => navigate('/orders')} hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TagOutlined style={{ color: '#eb2f96', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>优惠券池</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>可用/已用/过期</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
}
