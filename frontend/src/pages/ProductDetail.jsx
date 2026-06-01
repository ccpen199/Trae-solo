import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, message, Tag, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { productAPI, creditAPI } from '../services/api';
import AppLayout from '../components/Layout';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getDetail(id);
      setProduct(res.data);
    } catch (err) {
      console.error('Fetch product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const eligibilityRes = await creditAPI.checkEligibility(parseInt(id));
      if (!eligibilityRes.data?.eligible) {
        message.error(eligibilityRes.data?.message || '暂时不符合申请条件');
        return;
      }

      const creditRes = await creditAPI.create(parseInt(id));
      message.success('准入校验通过，开始申请流程');
      navigate(`/credit/apply/${creditRes.data.id}`);
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout title="产品详情">
        <div className="empty-container">
          <p>产品不存在</p>
          <Button onClick={() => navigate('/products')}>返回列表</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={product.name}>
      <div className="page-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>

        <Card>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="产品名称">
              <span style={{ fontWeight: 'bold' }}>{product.name}</span>
              <Tag color="green" style={{ marginLeft: 8 }}>可申请</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="产品描述">{product.description}</Descriptions.Item>
            <Descriptions.Item label="额度范围">
              <span style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>
                {(product.min_amount / 10000).toFixed(0)}万 - {(product.max_amount / 10000).toFixed(0)}万
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="期限范围">{product.term_min} - {product.term_max}个月</Descriptions.Item>
            <Descriptions.Item label="日利率">
              <span style={{ color: '#ff4d4f' }}>{(product.interest_rate * 100).toFixed(3)}%</span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <span style={{ fontWeight: 'bold' }}>申请条件</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>年龄在18-60周岁之间</li>
              <li>有稳定的收入来源</li>
              <li>个人征信记录良好</li>
              <li>具备还款能力</li>
            </ul>
          </div>

          <Button type="primary" size="large" block loading={applying} onClick={handleApply}>
            立即申请
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;
