import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Rate,
  message,
  Table,
  Empty,
  Divider,
  Badge,
  Checkbox
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  ShoppingOutlined,
  StarOutlined,
  EyeOutlined,
  LikeOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  ShopOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serviceAPI } from '../../api/index.js';

const { Title, Text } = Typography;

const COMPARE_KEY = 'wedding_compare_list';

const ServiceCompare = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showDifference, setShowDifference] = useState(false);
  const [likedServices, setLikedServices] = useState({});

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(Number).filter(Boolean);
      if (ids.length >= 2) {
        fetchCompareData(ids);
      } else {
        message.warning('请至少选择2个服务进行对比');
        navigate('/services');
      }
    } else {
      loadFromLocalStorage();
    }
    loadCompareList();
  }, []);

  const loadCompareList = () => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('加载对比列表失败', e);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (list.length >= 2) {
          const ids = list.map(item => item.id);
          fetchCompareData(ids);
        } else {
          message.warning('请至少选择2个服务进行对比');
          navigate('/services');
        }
      } else {
        message.warning('请先选择要对比的服务');
        navigate('/services');
      }
    } catch (e) {
      console.error('加载本地数据失败', e);
      navigate('/services');
    }
  };

  const fetchCompareData = async (ids) => {
    setLoading(true);
    try {
      const response = await serviceAPI.compare(ids);
      setServices(response.data || []);
    } catch (error) {
      message.error('获取对比数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeService = async (serviceId) => {
    try {
      const response = await serviceAPI.like(serviceId);
      setLikedServices(prev => ({
        ...prev,
        [serviceId]: response.data.liked
      }));
      setServices(prev => prev.map(s =>
        s.id === serviceId
          ? { ...s, like_count: response.data.like_count }
          : s
      ));
      message.success(response.data.liked ? '已收藏' : '已取消收藏');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleRemoveFromCompare = (serviceId) => {
    const newList = compareList.filter(item => item.id !== serviceId);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(newList));
    setCompareList(newList);
    setServices(prev => prev.filter(s => s.id !== serviceId));

    if (newList.length < 2) {
      message.warning('对比列表不足2个服务，返回服务列表');
      navigate('/services');
    } else {
      message.success('已从对比列表移除');
    }
  };

  const handleClearCompare = () => {
    localStorage.removeItem(COMPARE_KEY);
    setCompareList([]);
    setServices([]);
    message.success('已清空对比列表');
    navigate('/services');
  };

  const getCategoryColor = (categoryKey) => {
    const colors = {
      photography: '#ff4d6d',
      emcee: '#722ed1',
      hotel: '#1890ff',
      wedding_dress: '#eb2f96'
    };
    return colors[categoryKey] || '#ff4d6d';
  };

  const getBestValue = (key, isHigher = true) => {
    if (services.length < 2) return null;

    const values = services.map(s => ({
      id: s.id,
      value: s[key]
    })).filter(v => v.value !== null && v.value !== undefined);

    if (values.length === 0) return null;

    const best = isHigher
      ? Math.max(...values.map(v => v.value))
      : Math.min(...values.map(v => v.value));

    return values.filter(v => v.value === best).map(v => v.id);
  };

  const isBestValue = (serviceId, key, isHigher = true) => {
    if (!showDifference) return false;
    const bestIds = getBestValue(key, isHigher);
    return bestIds?.includes(serviceId);
  };

  const renderCompareItem = (label, key, isHigher = true, renderValue = null) => {
    return (
      <Row align="middle" style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Col xs={24} sm={6} style={{ paddingLeft: 16 }}>
          <Text type="secondary">{label}</Text>
        </Col>
        {services.map(service => (
          <Col xs={24} sm={6} key={service.id} style={{ textAlign: 'center' }}>
            {renderValue ? (
              renderValue(service, isBestValue(service.id, key, isHigher))
            ) : (
              <Text strong={isBestValue(service.id, key, isHigher)} style={{
                color: isBestValue(service.id, key, isHigher) ? '#ff4d6d' : undefined
              }}>
                {service[key] ?? '-'}
                {isBestValue(service.id, key, isHigher) && (
                  <Tag color="red" style={{ marginLeft: 4 }}>最优</Tag>
                )}
              </Text>
            )}
          </Col>
        ))}
      </Row>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Card loading={true} style={{ maxWidth: 1200, margin: '0 auto' }} />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Empty description="没有可对比的服务" />
        <Button onClick={() => navigate('/services')} style={{ marginTop: 16 }}>
          返回服务列表
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Button type="link" onClick={() => navigate(-1)} style={{ padding: 0 }}>
              <ArrowLeftOutlined /> 返回
            </Button>
            <Title level={3} style={{ margin: 0, fontSize: 20 }}>
              服务对比 ({services.length}/3)
            </Title>
          </Space>
          <Space>
            <Checkbox
              checked={showDifference}
              onChange={(e) => setShowDifference(e.target.checked)}
            >
              高亮差异项
            </Checkbox>
            <Button icon={<PlusOutlined />} onClick={() => navigate('/services')}>
              添加对比
            </Button>
            <Button danger onClick={handleClearCompare}>
              清空对比
            </Button>
          </Space>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* 服务卡片对比 */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
          {/* 服务基本信息行 */}
          <Row align="stretch">
            <Col xs={24} sm={6} style={{ padding: 24, background: '#fafafa', borderRight: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>服务信息</Text>
            </Col>
            {services.map(service => (
              <Col xs={24} sm={6} key={service.id} style={{ padding: 24, borderRight: services.indexOf(service) < services.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      paddingTop: '60%',
                      backgroundImage: `url(${service.images?.[0] || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(service.category_name || 'service')}&image_size=landscape_16_9`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 8,
                      marginBottom: 16
                    }}
                  />
                  <Tag
                    color={getCategoryColor(service.category)}
                    style={{ position: 'absolute', top: 12, left: 12 }}
                  >
                    {service.category_name}
                  </Tag>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFromCompare(service.id)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)' }}
                  />
                </div>

                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  {service.name}
                </Text>

                <div style={{ marginBottom: 12 }}>
                  <Rate disabled value={service.rating} style={{ fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>{service.rating}</Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="danger" strong style={{ fontSize: 24 }}>
                    ¥{service.price.toLocaleString()}
                  </Text>
                  {service.original_price && (
                    <Text delete type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      ¥{service.original_price.toLocaleString()}
                    </Text>
                  )}
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    查看详情
                  </Button>
                  <Space style={{ width: '100%' }}>
                    <Button
                      block
                      icon={likedServices[service.id] ? <HeartFilled style={{ color: '#ff4d6d' }} /> : <HeartOutlined />}
                      onClick={() => handleLikeService(service.id)}
                    >
                      收藏 {service.like_count || 0}
                    </Button>
                    <Button block icon={<ShopOutlined />}>
                      进店
                    </Button>
                  </Space>
                </Space>
              </Col>
            ))}
          </Row>

          {/* 对比详情 */}
          <div style={{ padding: '0 24px' }}>
            {renderCompareItem('所属商家', 'company_name', true, (service) => (
              <Space>
                <Avatar size={24} src={service.merchant_logo}>
                  {service.company_name?.[0]}
                </Avatar>
                <Text>{service.company_name}</Text>
              </Space>
            ))}

            {renderCompareItem('服务评分', 'rating', true, (service, isBest) => (
              <Space>
                <Rate disabled value={service.rating} style={{ fontSize: 14 }} />
                <Text strong={isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {service.rating}
                </Text>
                {isBest && <Tag color="red">最高</Tag>}
              </Space>
            ))}

            {renderCompareItem('价格', 'price', false, (service, isBest) => (
              <Space>
                <Text type="danger" strong style={{ fontSize: 18, color: isBest ? '#ff4d6d' : undefined }}>
                  ¥{service.price.toLocaleString()}
                </Text>
                {service.original_price && (
                  <Text delete type="secondary">¥{service.original_price.toLocaleString()}</Text>
                )}
                {isBest && <Tag color="green">最低</Tag>}
              </Space>
            ))}

            {renderCompareItem('原价', 'original_price', false, (service) => (
              <Text>
                {service.original_price ? `¥${service.original_price.toLocaleString()}` : '-'}
              </Text>
            ))}

            {renderCompareItem('优惠金额', null, false, (service, isBest) => {
              const discount = service.original_price && service.original_price > service.price
                ? service.original_price - service.price
                : 0;
              return (
                <Text type="danger" strong={discount > 0 && isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {discount > 0 ? `¥${discount.toLocaleString()}` : '无'}
                  {isBest && discount > 0 && <Tag color="red">最大</Tag>}
                </Text>
              );
            })}

            {renderCompareItem('所在城市', 'city', true, (service) => (
              <Space>
                <EnvironmentOutlined style={{ color: '#1890ff' }} />
                <Text>{service.city}</Text>
              </Space>
            ))}

            {renderCompareItem('服务标签', 'tags', true, (service) => (
              <Space size={[4, 4]} wrap style={{ justifyContent: 'center' }}>
                {service.tags && service.tags.length > 0
                  ? service.tags.map((tag, idx) => <Tag key={idx}>{tag}</Tag>)
                  : '-'}
              </Space>
            ))}

            {renderCompareItem('浏览次数', 'view_count', true, (service, isBest) => (
              <Space>
                <EyeOutlined style={{ color: '#1890ff' }} />
                <Text strong={isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {service.view_count || 0}
                </Text>
                {isBest && <Tag color="red">最高</Tag>}
              </Space>
            ))}

            {renderCompareItem('收藏数量', 'like_count', true, (service, isBest) => (
              <Space>
                <HeartOutlined style={{ color: '#ff4d6d' }} />
                <Text strong={isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {service.like_count || 0}
                </Text>
                {isBest && <Tag color="red">最多</Tag>}
              </Space>
            ))}

            {renderCompareItem('评价数量', 'review_count', true, (service, isBest) => (
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <Text strong={isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {service.review_count || 0}
                </Text>
                {isBest && <Tag color="red">最多</Tag>}
              </Space>
            ))}

            {renderCompareItem('商家评分', 'merchant_rating', true, (service, isBest) => (
              <Space>
                <Rate disabled value={service.merchant_rating} style={{ fontSize: 14 }} />
                <Text strong={isBest} style={{ color: isBest ? '#ff4d6d' : undefined }}>
                  {service.merchant_rating}
                </Text>
                {isBest && <Tag color="red">最高</Tag>}
              </Space>
            ))}

            <Row align="middle" style={{ padding: '16px 0' }}>
              <Col xs={24} sm={6} style={{ paddingLeft: 16 }}>
                <Text type="secondary">服务描述</Text>
              </Col>
              {services.map(service => (
                <Col xs={24} sm={6} key={service.id} style={{ textAlign: 'center', padding: '0 12px' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {service.description || '暂无描述'}
                  </Text>
                </Col>
              ))}
            </Row>

            <Row align="middle" style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
              <Col xs={24} sm={6} style={{ paddingLeft: 16 }}>
                <Text type="secondary">操作</Text>
              </Col>
              {services.map(service => (
                <Col xs={24} sm={6} key={service.id} style={{ textAlign: 'center' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      block
                      icon={<ShoppingOutlined />}
                      style={{ background: 'linear-gradient(135deg, #ff4d6d, #ff7875)', border: 'none' }}
                    >
                      立即预订
                    </Button>
                    <Button block onClick={() => navigate(`/services/${service.id}`)}>
                      查看详情
                    </Button>
                  </Space>
                </Col>
              ))}
            </Row>
          </div>
        </Card>

        {/* 对比结论 */}
        <Card title="对比总结" style={{ borderRadius: 12 }}>
          <Row gutter={[24, 24]}>
            {services.map((service, index) => {
              const highlights = [];
              if (isBestValue(service.id, 'price', false)) highlights.push('价格最低');
              if (isBestValue(service.id, 'rating', true)) highlights.push('评分最高');
              if (isBestValue(service.id, 'like_count', true)) highlights.push('收藏最多');
              if (isBestValue(service.id, 'review_count', true)) highlights.push('评价最多');
              if (isBestValue(service.id, 'merchant_rating', true)) highlights.push('商家评分最高');
              const discount = service.original_price && service.original_price > service.price
                ? service.original_price - service.price
                : 0;
              if (discount > 0 && services.every(s => {
                const d = s.original_price && s.original_price > s.price
                  ? s.original_price - s.price
                  : 0;
                return discount >= d;
              })) highlights.push('优惠最大');

              return (
                <Col xs={24} sm={8} key={service.id}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        <Badge count={index === 0 ? '推荐' : null} color="#ff4d6d">
                          <Text strong>{service.name}</Text>
                        </Badge>
                      </Space>
                    }
                    extra={
                      <Tag color={getCategoryColor(service.category)}>{service.category_name}</Tag>
                    }
                  >
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Text type="danger" strong style={{ fontSize: 28 }}>
                        ¥{service.price.toLocaleString()}
                      </Text>
                    </div>
                    {highlights.length > 0 && (
                      <>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>优势：</Text>
                        <Space size={[4, 4]} wrap>
                          {highlights.map((h, i) => (
                            <Tag key={i} color="green" icon={<CheckOutlined />}>
                              {h}
                            </Tag>
                          ))}
                        </Space>
                      </>
                    )}
                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        block
                        onClick={() => navigate(`/services/${service.id}`)}
                      >
                        立即预订
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ServiceCompare;
