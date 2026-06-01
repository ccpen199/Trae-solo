import React, { useState, useEffect } from 'react';
import { Card, Tag, Spin, Button, Empty, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import AppLayout from '../components/Layout';

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productAPI.getList();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('获取产品列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCardClick = (id) => {
    navigate(`/products/${id}`);
  };

  if (loading) {
    return (
      <AppLayout title="贷款产品">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="贷款产品">
        <div className="error-container">
          <p style={{ color: '#ff4d4f', marginBottom: 16 }}>{error}</p>
          <Button type="primary" onClick={fetchProducts}>重试</Button>
        </div>
      </AppLayout>
    );
  }

  if (!products?.length) {
    return (
      <AppLayout title="贷款产品">
        <div className="empty-container">
          <Empty description="暂无产品" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="贷款产品">
      <div className="page-container">
        <div className="card-list">
          {products.map((product) => (
            <Card
              key={product.id}
              className="product-card"
              hoverable
              onClick={() => handleCardClick(product.id)}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 'bold' }}>{product.name}</span>
                    <Tag color="green">可申请</Tag>
                  </div>
                }
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>{product.description}</p>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <span style={{ color: '#999' }}>额度：</span>
                        <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 16 }}>
                          {(product.min_amount / 10000).toFixed(0)}万 - {(product.max_amount / 10000).toFixed(0)}万
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#999' }}>期限：</span>
                        <span>{product.term_min} - {product.term_max}个月</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ color: '#999' }}>日利率：</span>
                      <span style={{ color: '#ff4d4f' }}>{(product.interest_rate * 100).toFixed(3)}%</span>
                    </div>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Products;
