import { useState, useEffect } from 'react';
import { Card, Select, InputNumber, Row, Col, Tag, Button, Pagination, Spin, Empty, message } from 'antd';
import { ShoppingCartOutlined, ThunderboltOutlined, ShopOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../api';

interface Sku {
  id: string;
  title: string;
  price: number;
  image: string;
  stockType: 'self' | 'property';
  stock: number;
  category: string;
}

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: 'food', label: '食品' },
  { value: 'service', label: '服务' },
  { value: 'daily', label: '日用品' },
  { value: 'digital', label: '数码' },
];

const Shop: React.FC = () => {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchSkus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/skus', {
        params: { category, radius, page, pageSize: 12 },
      });
      setSkus(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setSkus([
        { id: '1', title: '有机蔬菜礼盒', price: 68, image: '', stockType: 'self', stock: 50, category: 'food' },
        { id: '2', title: '社区家政清洁服务', price: 120, image: '', stockType: 'property', stock: 10, category: 'service' },
        { id: '3', title: '进口水果拼盘', price: 88, image: '', stockType: 'self', stock: 30, category: 'food' },
        { id: '4', title: '管道疏通服务', price: 80, image: '', stockType: 'property', stock: 5, category: 'service' },
        { id: '5', title: '品牌洗衣液', price: 35, image: '', stockType: 'self', stock: 100, category: 'daily' },
        { id: '6', title: '蓝牙音箱', price: 199, image: '', stockType: 'self', stock: 15, category: 'digital' },
      ]);
      setTotal(6);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkus();
  }, [category, page]);

  const handleAddCart = async (skuId: string) => {
    try {
      await api.post('/cart', { skuId, quantity: 1 });
      message.success('已加入购物车');
    } catch {
      message.error('加入购物车失败');
    }
  };

  const handleBuyNow = async (skuId: string) => {
    try {
      const { data } = await api.post('/orders', { items: [{ skuId, quantity: 1 }] });
      message.success('下单成功');
    } catch {
      message.error('下单失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
              options={categoryOptions}
              style={{ width: 140 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: 8 }}>配送半径:</span>
            <InputNumber
              value={radius}
              onChange={(v) => setRadius(v)}
              placeholder="km"
              min={0}
              style={{ width: 100 }}
              addonAfter="km"
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchSkus}>筛选</Button>
          </Col>
        </Row>
      </Card>

      {skus.length === 0 ? (
        <Empty description="暂无商品" />
      ) : (
        <Row gutter={[16, 16]}>
          {skus.map((sku) => (
            <Col span={6} key={sku.id}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      height: 160,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ccc',
                      fontSize: 40,
                    }}
                  >
                    <ShopOutlined />
                  </div>
                }
                actions={[
                  <Button
                    key="cart"
                    type="text"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddCart(sku.id)}
                  >
                    加购
                  </Button>,
                  <Button
                    key="buy"
                    type="text"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleBuyNow(sku.id)}
                  >
                    立即购买
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={sku.title}
                  description={
                    <div>
                      <div style={{ color: '#f50', fontSize: 18, fontWeight: 'bold' }}>
                        ¥{sku.price}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={sku.stockType === 'self' ? 'blue' : 'green'} icon={sku.stockType === 'self' ? <ShopOutlined /> : <HomeOutlined />}>
                          {sku.stockType === 'self' ? '自营库存' : '物业代收点库存'}
                        </Tag>
                      </div>
                      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                        库存: {sku.stock}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination current={page} total={total} pageSize={12} onChange={setPage} />
      </div>
    </div>
  );
};

export default Shop;
