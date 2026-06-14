import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tag, Button, List, Avatar, Modal, message, Spin, Statistic, Progress, Empty, Table } from 'antd';
import { GiftOutlined, StarOutlined, CrownOutlined, ShoppingCartOutlined, CheckCircleOutlined, TrophyOutlined, HistoryOutlined, LoginOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { getMyPoints, getPointHistory, getPointProducts, exchangeProduct, getPointOrders, getLevelBenefits } from '../api/points';

const { TabPane } = Tabs;
const { Meta } = Card;

const levelConfig = [
  { level: 1, name: '普通会员', min: 0, max: 1000, color: '#8c8c8c', icon: <StarOutlined /> },
  { level: 2, name: '银卡会员', min: 1000, max: 5000, color: '#c0c0c0', icon: <CrownOutlined /> },
  { level: 3, name: '金卡会员', min: 5000, max: 20000, color: '#faad14', icon: <CrownOutlined /> },
  { level: 4, name: '铂金会员', min: 20000, max: 50000, color: '#d3af37', icon: <CrownOutlined /> },
  { level: 5, name: '钻石会员', min: 50000, max: 100000, color: '#1890ff', icon: <TrophyOutlined /> },
  { level: 6, name: '至尊会员', min: 100000, max: 9999999, color: '#722ed1', icon: <TrophyOutlined /> },
];

const PointsMall = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(null);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [exchangeQuantity, setExchangeQuantity] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('tft_user'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tft_token');
      const user = localStorage.getItem('tft_user');
      const hasUserSession = !!(token && user);
      setIsLoggedIn(hasUserSession);

      const productsData = await getPointProducts({}).catch(() => ({ list: [] }));
      const benefitsData = await getLevelBenefits().catch(() => ({ list: [] }));

      let pointsData = null;
      let historyData = { list: [] };
      let ordersData = { list: [] };

      if (hasUserSession) {
        pointsData = await getMyPoints().catch(() => null);
        historyData = await getPointHistory({ page: 1, page_size: 20 }).catch(() => ({ list: [] }));
        ordersData = await getPointOrders().catch(() => ({ list: [] }));
      }

      if (pointsData) {
        setUserPoints(pointsData);
      } else if (hasUserSession) {
        setUserPoints({
          available_points: 0,
          total_points: 0,
          total_earned: 0,
          total_spent: 0,
          level: 1,
          level_name: '普通会员',
          level_progress: 0,
          monthly_rides: 0
        });
      }

      const normalizeProduct = (p, index, listLength) => ({
        ...p,
        name: p.name || p.product_name,
        points: p.points ?? p.points_cost ?? 0,
        is_hot: (p.points ?? p.points_cost ?? 0) < 1000,
        is_new: index >= Math.max(0, listLength - 3),
        original_price: (p.points ?? p.points_cost ?? 0) * 0.1
      });

      const productList = Array.isArray(productsData) ? productsData : productsData.list || [];
      setProducts(productList.map((p, index) => normalizeProduct(p, index, productList.length)));

      if (Array.isArray(benefitsData)) {
        setBenefits(benefitsData.map(item => ({
          ...item,
          description: item.description || item.benefits?.slice(0, 3).join('、') || ''
        })));
      } else if (benefitsData.list) {
        setBenefits(benefitsData.list.map(item => ({
          ...item,
          description: item.description || item.benefits?.slice(0, 3).join('、') || ''
        })));
      }

      const historyList = Array.isArray(historyData) ? historyData : historyData.list || [];
      setHistory(historyList.map(item => ({
        ...item,
        description: item.description || item.reason || '-',
        source: item.source || (item.related_transaction_id ? '交易积分' : '积分账户')
      })));

      setOrders(Array.isArray(ordersData) ? ordersData : ordersData.list || []);
    } catch (error) {
      console.warn('部分数据加载失败，但已展示可用数据');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (key) => {
    setActiveTab(key);
    setLoading(true);
    try {
      const res = await getPointProducts(key === 'all' ? {} : { category: key });
      const productList = Array.isArray(res) ? res : res?.list || [];
      setProducts(productList.map((p, index) => ({
        ...p,
        name: p.name || p.product_name,
        points: p.points ?? p.points_cost ?? 0,
        is_hot: (p.points ?? p.points_cost ?? 0) < 1000,
        is_new: index >= Math.max(0, productList.length - 3),
        original_price: (p.points ?? p.points_cost ?? 0) * 0.1
      })));
    } catch (error) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    if (!selectedProduct) return;
    const totalPoints = selectedProduct.points * exchangeQuantity;
    if (userPoints && totalPoints > userPoints.available_points) {
      message.error('积分不足');
      return;
    }

    try {
      await exchangeProduct(selectedProduct.id, { quantity: exchangeQuantity });
      message.success('兑换成功！');
      setExchangeModalVisible(false);
      loadData();
    } catch (error) {
      message.error('兑换失败');
    }
  };

  const showExchangeModal = (product) => {
    if (!isLoggedIn) {
      Modal.confirm({
        title: '需要登录',
        content: '请先登录后再兑换商品',
        okText: '去登录',
        cancelText: '取消',
        onOk: () => navigate('/login'),
      });
      return;
    }
    setSelectedProduct(product);
    setExchangeQuantity(1);
    setExchangeModalVisible(true);
  };

  const getCurrentLevel = (points) => {
    for (let i = levelConfig.length - 1; i >= 0; i--) {
      if (points >= levelConfig[i].min) return levelConfig[i];
    }
    return levelConfig[0];
  };

  const getLevelProgress = (points) => {
    const level = getCurrentLevel(points);
    const nextLevel = levelConfig.find(l => l.level === level.level + 1);
    if (!nextLevel) return 100;
    const current = points - level.min;
    const total = nextLevel.min - level.min;
    return Math.min(100, Math.round((current / total) * 100));
  };

  const getNextLevel = (points) => {
    const level = getCurrentLevel(points);
    return levelConfig.find(l => l.level === level.level + 1);
  };

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const colors = { earn: 'green', spend: 'red', expire: 'orange', adjust: 'blue' };
        const names = { earn: '获得', spend: '消费', expire: '过期', adjust: '调整' };
        return <Tag color={colors[type]}>{names[type] || type}</Tag>;
      },
    },
    {
      title: '积分变动',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points, record) => (
        <span style={{ color: record.type === 'earn' ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {record.type === 'earn' ? '+' : ''}{points}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
    },
  ];

  const trendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '获得积分',
        type: 'line',
        smooth: true,
        data: [1200, 1900, 1500, 2400, 2000, userPoints?.total_earned || 2800],
        areaStyle: { color: 'rgba(82, 196, 26, 0.2)' },
        lineStyle: { color: '#52c41a' },
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '消费积分',
        type: 'line',
        smooth: true,
        data: [500, 800, 600, 1200, 900, userPoints?.total_spent || 1500],
        areaStyle: { color: 'rgba(255, 77, 79, 0.2)' },
        lineStyle: { color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' },
      },
    ],
    legend: { data: ['获得积分', '消费积分'] },
  };

  const currentLevel = userPoints ? getCurrentLevel(userPoints.available_points) : null;
  const progress = userPoints ? getLevelProgress(userPoints.available_points) : 0;
  const nextLevel = userPoints ? getNextLevel(userPoints.available_points) : null;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={8}>
          <Card className="gradient-card" style={{ borderRadius: '12px', border: 'none', height: '100%' }}>
            {!isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <LoginOutlined style={{ fontSize: '48px', color: '#fff', marginBottom: '16px' }} />
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                  登录后查看积分
                </div>
                <div style={{ color: '#e6f7ff', fontSize: '13px', marginBottom: '16px' }}>
                  乘车、充值均可累计积分，兑换好礼
                </div>
                <Button type="primary" onClick={() => navigate('/login')}>
                  立即登录
                </Button>
              </div>
            ) : currentLevel ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Avatar size={64} style={{ backgroundColor: currentLevel.color, fontSize: '28px' }}>
                    {currentLevel.icon}
                  </Avatar>
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px' }}>当前等级</div>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{currentLevel.name}</div>
                  </div>
                </div>
                <div style={{ color: '#e6f7ff', marginBottom: '8px' }}>
                  可用积分：<span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{userPoints?.available_points || 0}</span>
                </div>
                {nextLevel && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e6f7ff', fontSize: '12px', marginBottom: '4px' }}>
                      <span>距离{nextLevel.name}</span>
                      <span>{nextLevel.min - (userPoints?.available_points || 0)} 积分</span>
                    </div>
                    <Progress percent={progress} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#fff' }}>
                <Spin tip="加载中..." />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card style={{ borderRadius: '12px', height: '100%' }}>
            {!isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <StarOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }} />
                <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                  登录后查看积分统计
                </div>
              </div>
            ) : (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="累计获得"
                      value={userPoints?.total_earned || 0}
                      prefix={<StarOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="累计消费"
                      value={userPoints?.total_spent || 0}
                      prefix={<GiftOutlined style={{ color: '#ff4d4f' }} />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8c8c8c' }}>
                    <span>本月乘车次数：{userPoints?.monthly_rides || 0}次</span>
                    <span>积分有效期：长期有效</span>
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="等级权益" style={{ borderRadius: '12px', height: '100%' }}>
            <List
              dataSource={benefits}
              size="small"
              renderItem={item => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    title={<span style={{ fontSize: '13px' }}>{item.name}</span>}
                    description={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.description}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="积分商城" style={{ borderRadius: '12px' }}>
            <Tabs activeKey={activeTab} onChange={handleCategoryChange}>
              <TabPane tab="全部商品" key="all" />
              <TabPane tab="优惠券" key="coupon" />
              <TabPane tab="实物礼品" key="physical" />
              <TabPane tab="虚拟商品" key="virtual" />
              <TabPane tab="乘车权益" key="transport" />
            </Tabs>

            <Spin spinning={loading}>
              {products.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {products.map(product => (
                    <Col xs={24} sm={12} lg={8} key={product.id}>
                      <Card
                        hoverable
                        style={{ borderRadius: '8px', height: '100%' }}
                        cover={<img alt={product.name} src={product.image_url || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(product.name)} style={{ height: '140px', objectFit: 'cover' }} />}
                        actions={[
                          <Button 
                            type="link" 
                            icon={<ShoppingCartOutlined />}
                            onClick={() => showExchangeModal(product)}
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? '已售罄' : '立即兑换'}
                          </Button>,
                        ]}
                      >
                        <Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '500' }}>{product.name}</span>
                              {product.is_hot && <Tag color="red">热门</Tag>}
                              {product.is_new && <Tag color="green">新品</Tag>}
                            </div>
                          }
                          description={
                            <div>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                                {product.description}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <span style={{ color: '#fa8c16', fontSize: '18px', fontWeight: 'bold' }}>{product.points}</span>
                                  <span style={{ color: '#8c8c8c', fontSize: '12px' }}> 积分</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                  库存：{product.stock}
                                </div>
                              </div>
                              {product.original_price && (
                                <div style={{ fontSize: '12px', color: '#bfbfbf', textDecoration: 'line-through', marginTop: '4px' }}>
                                  原价：¥{product.original_price}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="暂无商品" />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="积分走势" style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <ReactECharts option={trendOption} style={{ height: '250px' }} />
          </Card>

          <Card title="最近订单" style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <List
              dataSource={orders.slice(0, 5)}
              size="small"
              renderItem={item => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.product_image} />}
                    title={<span style={{ fontSize: '13px' }}>{item.product_name}</span>}
                    description={
                      <div>
                        <div style={{ fontSize: '12px', color: '#fa8c16' }}>{item.points} 积分 × {item.quantity}</div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{item.created_at}</div>
                      </div>
                    }
                  />
                  <Tag color={item.status === 'completed' ? 'green' : item.status === 'pending' ? 'orange' : 'red'}>
                    {item.status === 'completed' ? '已完成' : item.status === 'pending' ? '待发货' : '已取消'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>

          <Card 
            title={<span><HistoryOutlined /> 积分明细</span>} 
            style={{ borderRadius: '12px' }}
            extra={<Button type="link" size="small">查看全部</Button>}
          >
            <Table
              dataSource={history.slice(0, 5)}
              columns={historyColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认兑换"
        open={exchangeModalVisible}
        onCancel={() => setExchangeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExchangeModalVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={handleExchange}>
            确认兑换
          </Button>,
        ]}
      >
        {selectedProduct && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <img 
                  alt={selectedProduct.name} 
                  src={selectedProduct.image_url || 'https://via.placeholder.com/150x150?text=' + encodeURIComponent(selectedProduct.name)} 
                  style={{ width: '100%', borderRadius: '8px' }} 
                />
              </Col>
              <Col span={16}>
                <h3 style={{ margin: '0 0 8px' }}>{selectedProduct.name}</h3>
                <p style={{ color: '#8c8c8c', marginBottom: '12px' }}>{selectedProduct.description}</p>
                <div style={{ fontSize: '24px', color: '#fa8c16', fontWeight: 'bold', marginBottom: '8px' }}>
                  {selectedProduct.points} 积分
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  库存：{selectedProduct.stock} 件
                </div>
              </Col>
            </Row>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>兑换数量</span>
                <div>
                  <Button 
                    size="small" 
                    onClick={() => setExchangeQuantity(Math.max(1, exchangeQuantity - 1))}
                    disabled={exchangeQuantity <= 1}
                  >-</Button>
                  <span style={{ margin: '0 12px', fontWeight: 'bold' }}>{exchangeQuantity}</span>
                  <Button 
                    size="small" 
                    onClick={() => setExchangeQuantity(Math.min(selectedProduct.stock, exchangeQuantity + 1))}
                    disabled={exchangeQuantity >= selectedProduct.stock}
                  >+</Button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                <span>当前可用积分</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{userPoints?.available_points || 0} 积分</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fff7e6', borderRadius: '8px', marginTop: '8px' }}>
                <span>合计需要</span>
                <span style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: '18px' }}>{selectedProduct.points * exchangeQuantity} 积分</span>
              </div>
              {userPoints && selectedProduct.points * exchangeQuantity > userPoints.available_points && (
                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                  积分不足，还差 {selectedProduct.points * exchangeQuantity - userPoints.available_points} 积分
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PointsMall;
