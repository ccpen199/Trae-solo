import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Input, Select, message, Carousel, Badge, Modal, Form, Rate, Statistic } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, SwapOutlined, ShoppingOutlined, GiftOutlined, FireOutlined } from '@ant-design/icons';
import { productAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const Mall = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [tradeVisible, setTradeVisible] = useState(false);
  const [tradeForm] = Form.useForm();
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [category, keyword]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts({ category, keyword });
      setProducts(res.data || []);
    } catch (err) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeIn = async (values) => {
    try {
      const res = await productAPI.estimateTradeIn({
        product_id: selectedProduct.id,
        old_product_type: values.old_product_type,
        old_brand: values.old_brand,
        usage_years: values.usage_years,
        condition: values.condition,
      });
      Modal.success({
        title: '以旧换新估价结果',
        content: (
          <div>
            <p>您的旧机估价：<strong style={{ color: '#f5222d', fontSize: 24 }}>¥{res.data.estimated_price}</strong></p>
            <p>购买新商品可直接抵扣，实际支付：<strong style={{ color: '#f5222d', fontSize: 20 }}>¥{selectedProduct.price - res.data.estimated_price}</strong></p>
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => {
              Modal.destroyAll();
              navigate(`/product/${selectedProduct.id}`, { state: { tradeInPrice: res.data.estimated_price } });
            }}>
              立即购买
            </Button>
          </div>
        ),
      });
    } catch (err) {
      message.error('估价失败');
    }
  };

  const categories = [
    { key: 'all', label: '全部', icon: <ShoppingOutlined /> },
    { key: 'gas_appliance', label: '燃气具', icon: <FireOutlined /> },
    { key: 'home_appliance', label: '家电', icon: <GiftOutlined /> },
    { key: 'local_specialty', label: '本地特产', icon: <GiftOutlined /> },
  ];

  const banners = [
    { title: '燃气具以旧换新', desc: '最高抵扣500元', color: '#ff6b6b' },
    { title: '新品上市', desc: '智能燃气灶首发', color: '#4ecdc4' },
    { title: '本地特产', desc: '产地直供 新鲜直达', color: '#feca57' },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
        <Carousel autoplay dotPosition="bottom">
          {banners.map((banner, idx) => (
            <div key={idx}>
              <div style={{
                background: `linear-gradient(135deg, ${banner.color}, ${banner.color}dd)`,
                height: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexDirection: 'column',
              }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: 28 }}>{banner.title}</h2>
                <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: 16, opacity: 0.9 }}>{banner.desc}</p>
              </div>
            </div>
          ))}
        </Carousel>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={18}>
            <Input.Search
              placeholder="搜索燃气具、家电、本地特产..."
              size="large"
              enterButton={<SearchOutlined />}
              onSearch={setKeyword}
            />
          </Col>
          <Col span={6}>
            <Select
              size="large"
              style={{ width: '100%' }}
              value={category}
              onChange={setCategory}
            >
              {categories.map(cat => (
                <Option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} title="商品列表" loading={loading}>
        <Row gutter={[16, 16]}>
          {products.map(product => (
            <Col span={6} key={product.id}>
              <Badge.Ribbon text={product.tag} color={product.tag === '热销' ? 'red' : product.tag === '新品' ? 'green' : 'blue'}>
                <Card
                  hoverable
                  cover={
                    <div style={{
                      height: 180,
                      background: `linear-gradient(135deg, ${product.color || '#1890ff'}, ${product.color || '#1890ff'}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 48,
                    }}>
                      {product.category === 'gas_appliance' ? '🔥' : product.category === 'home_appliance' ? '📺' : '🎁'}
                    </div>
                  }
                  actions={[
                    <Button type="text" icon={<SwapOutlined />} onClick={() => { setSelectedProduct(product); setTradeVisible(true); }}>
                      以旧换新
                    </Button>,
                    <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate(`/product/${product.id}`)}>
                      立即购买
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{product.name}</span>
                        <Tag color="red">¥{product.price}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Rate disabled defaultValue={product.rating || 4.5} style={{ fontSize: 12 }} />
                        <span style={{ color: '#999', marginLeft: 8 }}>{product.sales || 0}人已购</span>
                        <p style={{ color: '#666', margin: '8px 0 0 0' }}>{product.description.substring(0, 30)}...</p>
                      </div>
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title="以旧换新估价"
        open={tradeVisible}
        onCancel={() => setTradeVisible(false)}
        footer={null}
        width={500}
      >
        {selectedProduct && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Statistic
                title="换购商品"
                value={selectedProduct.name}
                suffix={` ¥${selectedProduct.price}`}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
            <Form form={tradeForm} layout="vertical" onFinish={handleTradeIn}>
              <Form.Item
                name="old_product_type"
                label="旧产品类型"
                rules={[{ required: true, message: '请选择旧产品类型' }]}
              >
                <Select placeholder="请选择旧产品类型">
                  <Option value="gas_stove">燃气灶</Option>
                  <Option value="gas_water_heater">燃气热水器</Option>
                  <Option value="gas_heater">燃气壁挂炉</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="old_brand"
                label="旧品牌"
                rules={[{ required: true, message: '请输入旧品牌' }]}
              >
                <Input placeholder="如：海尔、美的、方太" />
              </Form.Item>
              <Form.Item
                name="usage_years"
                label="使用年限"
                rules={[{ required: true, message: '请输入使用年限' }]}
              >
                <Input type="number" placeholder="请输入使用年限" addonAfter="年" />
              </Form.Item>
              <Form.Item
                name="condition"
                label="新旧程度"
                rules={[{ required: true, message: '请选择新旧程度' }]}
              >
                <Select placeholder="请选择新旧程度">
                  <Option value="excellent">九成新以上</Option>
                  <Option value="good">七成新以上</Option>
                  <Option value="fair">五成新以上</Option>
                  <Option value="poor">五成新以下</Option>
                </Select>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  立即估价
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Mall;
