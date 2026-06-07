import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Modal, Form, Input, DatePicker, message } from 'antd';
import { ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface ServiceSKU {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  duration: number;
  includedItems: string[];
  excludedItems: string[];
  categoryId: number;
  category?: { name: string };
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const Services: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceSKU[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceSKU | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setSelectedCategory(parseInt(categoryId));
    }
  }, [searchParams]);

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const loadServices = async () => {
    try {
      const url = selectedCategory ? `/services?categoryId=${selectedCategory}` : '/services';
      const response = await api.get(url);
      setServices(response.data.skus);
    } catch (error) {
      console.error('Load services error:', error);
    }
  };

  const handleOrder = async (values: any) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    try {
      setLoading(true);
      await api.post('/orders', {
        items: [{ type: 'service', skuId: selectedService?.id, quantity: 1 }],
        customerAddress: values.address,
        latitude: 39.9042,
        longitude: 116.4074,
        scheduledTime: values.scheduledTime?.toISOString(),
        customerNotes: values.notes,
      });
      message.success('订单创建成功！系统正在为您派单');
      setOrderModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '下单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button 
            type={!selectedCategory ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </Button>
          {categories.map((cat) => (
            <Button 
              key={cat.id}
              type={selectedCategory === cat.id ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {services.map((service) => (
          <Col span={8} key={service.id}>
            <Card 
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    setSelectedService(service);
                    setOrderModalVisible(true);
                  }}
                >
                  立即预约
                </Button>
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{service.name}</span>
                    {service.category && <Tag color="blue">{service.category.name}</Tag>}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 24, color: '#f5222d', fontWeight: 600 }}>¥{service.price}</span>
                      {service.originalPrice > service.price && (
                        <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: 8 }}>
                          ¥{service.originalPrice}
                        </span>
                      )}
                      {service.duration > 0 && (
                        <Tag style={{ marginLeft: 8 }}><ClockCircleOutlined /> {service.duration}分钟</Tag>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <div style={{ marginBottom: 4 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                        服务包含：
                      </div>
                      <div>
                        {(service.includedItems?.slice(0, 3) || []).map((item, index) => (
                          <div key = {String(item) + "-" + index} style={{ padding: '2px 0' }}>{item}</div>
                        ))}
                      </div>
                      {service.excludedItems && service.excludedItems.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                          不含：{service.excludedItems[0]}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="确认预约"
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedService && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{selectedService.name}</span>
                <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{selectedService.price}</span>
              </div>
            </Card>

            <Form form={form} onFinish={handleOrder} layout="vertical">
              <Form.Item
                name="address"
                label="服务地址"
                rules={[{ required: true, message: '请输入服务地址' }]}
              >
                <Input.TextArea rows={2} placeholder="请输入详细地址" />
              </Form.Item>

              <Form.Item
                name="scheduledTime"
                label="预约时间"
                rules={[{ required: true, message: '请选择预约时间' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item name="notes" label="备注信息">
                <Input.TextArea rows={2} placeholder="请输入特殊要求或备注" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  确认下单
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Services;
