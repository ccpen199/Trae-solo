import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Descriptions, Tag, InputNumber, message, Space } from 'antd';
import { ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('加载商品失败', error);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      await api.post(`/products/${id}/purchase`, { quantity });
      message.success('购买成功！');
      loadProduct();
    } catch (error) {
      message.error(error.response?.data?.error || '购买失败');
    }
    setPurchasing(false);
  };

  if (!product) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Card loading={loading}>
        <Row gutter={24}>
          <Col span={10}>
            <div style={{ height: 400, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <ShopOutlined style={{ fontSize: 128, color: '#ccc' }} />
            </div>
          </Col>
          <Col span={14}>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>{product.name}</h1>
            
            <Space style={{ marginBottom: 16 }}>
              {product.is_limited && <Tag color="red">限量发售</Tag>}
              {product.serial_number && <Tag color="purple">编号: {product.serial_number}</Tag>}
              {product.status === 'approved' && <Tag color="green">已审核</Tag>}
            </Space>

            <div style={{ fontSize: 32, color: '#ff4d4f', fontWeight: 'bold', marginBottom: 24 }}>
              ¥{product.price}
            </div>

            <Descriptions column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="分类">
                {product.category === 'stamp' && '集邮票品'}
                {product.category === 'newspaper' && '报刊订阅'}
                {product.category === 'postcard' && '封片卡'}
                {product.category === 'culture' && '定制文创'}
                {product.category === 'magazine' && '杂志'}
              </Descriptions.Item>
              <Descriptions.Item label="库存">{product.stock} 件</Descriptions.Item>
              <Descriptions.Item label="商品描述">{product.description}</Descriptions.Item>
            </Descriptions>

            <Space size="large" align="center" style={{ marginBottom: 24 }}>
              <span>购买数量：</span>
              <InputNumber
                min={1}
                max={product.stock}
                value={quantity}
                onChange={setQuantity}
                size="large"
              />
            </Space>

            <Space>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handlePurchase}
                loading={purchasing}
                disabled={product.stock === 0}
              >
                立即购买
              </Button>
              <Button size="large">加入购物车</Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ProductDetail;
