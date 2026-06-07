import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Descriptions, Rate, Modal, Form, Input, Select, DatePicker, message, Space, Divider, Statistic } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined, CalendarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { productAPI } from '../api';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyVisible, setBuyVisible] = useState(false);
  const [buyForm] = Form.useForm();
  const tradeInPrice = location.state?.tradeInPrice || 0;

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProduct(id);
      setProduct(res.data);
    } catch (err) {
      message.error('加载商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (values) => {
    try {
      const data = {
        ...values,
        product_id: product.id,
        quantity: 1,
        trade_in_price: tradeInPrice,
        appointment_time: values.appointment_time ? values.appointment_time.format('YYYY-MM-DD HH:mm:ss') : null,
      };
      await productAPI.createOrder(data);
      message.success('订单提交成功');
      setBuyVisible(false);
      navigate('/mall-orders');
    } catch (err) {
      message.error(err.response?.data?.error || '提交失败');
    }
  };

  if (!product) return null;

  const finalPrice = product.price - tradeInPrice;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mall')}>
            返回商城
          </Button>
          <h2 style={{ margin: 0 }}>商品详情</h2>
        </Space>
      </Card>

      <Card bordered={false}>
        <Row gutter={32}>
          <Col span={10}>
            <div style={{
              height: 360,
              background: `linear-gradient(135deg, ${product.color || '#1890ff'}, ${product.color || '#1890ff'}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 96,
              borderRadius: 8,
            }}>
              {product.category === 'gas_appliance' ? '🔥' : product.category === 'home_appliance' ? '📺' : '🎁'}
            </div>
          </Col>
          <Col span={14}>
            <h1 style={{ margin: 0 }}>{product.name}</h1>
            <div style={{ margin: '16px 0' }}>
              <Space>
                <Rate disabled defaultValue={product.rating || 4.5} />
                <span style={{ color: '#999' }}>{product.sales || 0}人已购</span>
                {product.tag && <Tag color={product.tag === '热销' ? 'red' : product.tag === '新品' ? 'green' : 'blue'}>{product.tag}</Tag>}
              </Space>
            </div>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#999', fontSize: 14 }}>¥</span>
              <span style={{ color: '#f5222d', fontSize: 36, fontWeight: 'bold' }}>{finalPrice}</span>
              {tradeInPrice > 0 && (
                <Space style={{ marginLeft: 16 }}>
                  <Tag color="green">以旧换新抵扣 ¥{tradeInPrice}</Tag>
                  <span style={{ color: '#999', textDecoration: 'line-through' }}>原价 ¥{product.price}</span>
                </Space>
              )}
            </div>

            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="商品分类">
                {{ gas_appliance: '燃气具', home_appliance: '家电', local_specialty: '本地特产' }[product.category]}
              </Descriptions.Item>
              <Descriptions.Item label="品牌">{product.brand || '-'}</Descriptions.Item>
              <Descriptions.Item label="规格">{product.spec || '-'}</Descriptions.Item>
              <Descriptions.Item label="质保期限">{product.warranty_months || 12}个月</Descriptions.Item>
            </Descriptions>

            <Card size="small" style={{ background: '#fafafa', marginBottom: 16 }}>
              <p style={{ margin: 0, color: '#666' }}>{product.description}</p>
            </Card>

            <Space size="large">
              <Button size="large" icon={<ShoppingCartOutlined />}>
                加入购物车
              </Button>
              <Button type="primary" size="large" onClick={() => setBuyVisible(true)}>
                立即购买
              </Button>
              <Button size="large" icon={<SafetyCertificateOutlined />} onClick={() => navigate('/warranty')}>
                查看电子质保
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Modal
        title="确认订单"
        open={buyVisible}
        onCancel={() => setBuyVisible(false)}
        footer={null}
        width={600}
      >
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Row align="middle">
            <Col span={18}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{product.name}</p>
              <p style={{ margin: 0, color: '#666' }}>{product.spec}</p>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#f5222d', fontSize: 18, fontWeight: 'bold' }}>¥{finalPrice}</p>
              {tradeInPrice > 0 && <p style={{ margin: 0, color: '#52c41a', fontSize: 12 }}>已抵扣¥{tradeInPrice}</p>}
            </Col>
          </Row>
        </Card>
        <Form form={buyForm} layout="vertical" onFinish={handleBuy}>
          <Form.Item
            name="address"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input.TextArea rows={2} placeholder="请输入详细收货地址" />
          </Form.Item>
          <Form.Item
            name="contact_name"
            label="收货人"
            rules={[{ required: true, message: '请输入收货人姓名' }]}
          >
            <Input placeholder="请输入收货人姓名" />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="appointment_time"
            label={
              <Space>
                <CalendarOutlined />
                预约安装时间
              </Space>
            }
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择期望的安装时间（可选）"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item
            name="payment_method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="bank">银行卡</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="其他需求或备注" />
          </Form.Item>
          <Divider />
          <Row justify="space-between" align="middle">
            <Col>
              <span style={{ color: '#666' }}>应付金额：</span>
              <span style={{ color: '#f5222d', fontSize: 24, fontWeight: 'bold' }}>¥{finalPrice}</span>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => setBuyVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">确认支付</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductDetail;
