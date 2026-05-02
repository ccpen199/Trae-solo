import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, List, message, Spin, Modal, Form, Input, InputNumber, Select, Switch } from 'antd';
import { CheckOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { planApi, subscriptionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isAdmin, isOperator, user } = useAuth();
  const canManagePlans = isAdmin() || isOperator();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await planApi.getAll();
      setPlans(response.data.data.plans || []);
    } catch (error) {
      message.error('获取套餐列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const colors = {
      active: 'green',
      draft: 'gold',
      inactive: 'default',
    };
    const names = {
      active: '上架',
      draft: '草稿',
      inactive: '下架',
    };
    return <Tag color={colors[status]}>{names[status]}</Tag>;
  };

  const getBillingCycleText = (cycle) => {
    const names = {
      monthly: '月付',
      quarterly: '季付',
      yearly: '年付',
      daily: '日付',
      weekly: '周付',
    };
    return names[cycle] || cycle;
  };

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setSubscribeModalVisible(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    
    setSubscribing(true);
    try {
      const subscribeResponse = await subscriptionApi.subscribe(selectedPlan.id);
      const subscription = subscribeResponse.data.data.subscription;
      
      message.info('订阅创建成功，正在处理支付...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const payResponse = await subscriptionApi.pay(subscription.id);
      
      message.success('支付成功！您的订阅已激活！即将跳转到订阅页面...');
      setSubscribeModalVisible(false);
      
      setTimeout(() => {
        navigate('/subscriptions');
      }, 1500);
      
    } catch (error) {
      message.error(error.response?.data?.error || '订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCreatePlan = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleEditPlan = (plan) => {
    form.setFieldsValue({
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      billingCycle: plan.billing_cycle,
      price: plan.price,
      trialDays: plan.trial_days,
      status: plan.status === 'active',
    });
    setCreateModalVisible(true);
  };

  const handleSubmitPlan = async (values) => {
    try {
      const planData = {
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        billingCycle: values.billingCycle,
        price: values.price,
        trialDays: values.trialDays || 0,
        status: values.status ? 'active' : 'draft',
        features: [],
      };
      
      await planApi.create(planData);
      message.success('套餐创建成功');
      setCreateModalVisible(false);
      fetchPlans();
    } catch (error) {
      message.error(error.response?.data?.error || '创建套餐失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>套餐中心</h2>
        {canManagePlans && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlan}>
            创建套餐
          </Button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <p>暂无可用套餐</p>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {plans.map((plan, index) => (
            <Col xs={24} sm={12} lg={8} key={plan.id}>
              <Card 
                className={`plan-card ${index === 1 ? 'featured' : ''}`}
                hoverable
                actions={[
                  canManagePlans ? (
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => handleEditPlan(plan)}
                    >
                      编辑
                    </Button>
                  ) : null,
                  !canManagePlans && plan.status === 'active' ? (
                    <Button 
                      type="primary"
                      onClick={() => handleSubscribe(plan)}
                    >
                      立即订阅
                    </Button>
                  ) : null,
                ].filter(Boolean)}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {canManagePlans && (
                    <div style={{ marginBottom: 8 }}>
                      {getStatusTag(plan.status)}
                    </div>
                  )}
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    {plan.display_name}
                  </h3>
                  {plan.trial_days > 0 && (
                    <Tag color="purple" style={{ marginTop: 8 }}>
                      免费试用 {plan.trial_days} 天
                    </Tag>
                  )}
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span className="price-tag">¥{plan.price.toFixed(2)}</span>
                  <span className="price-period">/{getBillingCycleText(plan.billing_cycle)}</span>
                </div>
                
                {plan.description && (
                  <p style={{ color: '#666', marginBottom: 16, textAlign: 'center' }}>
                    {plan.description}
                  </p>
                )}
                
                {plan.features && plan.features.length > 0 && (
                  <div className="plan-features">
                    <List
                      dataSource={plan.features}
                      renderItem={(feature) => (
                        <List.Item className="plan-feature">
                          <CheckOutlined className="plan-feature-icon" />
                          <span>
                            <strong>{feature.feature_name}:</strong> {feature.feature_value}
                          </span>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="确认订阅"
        open={subscribeModalVisible}
        onOk={confirmSubscribe}
        onCancel={() => setSubscribeModalVisible(false)}
        confirmLoading={subscribing}
        okText="确认订阅"
        cancelText="取消"
      >
        {selectedPlan && (
          <div>
            <p>您即将订阅以下套餐：</p>
            <h3>{selectedPlan.display_name}</h3>
            <p>价格：¥{selectedPlan.price.toFixed(2)}/{getBillingCycleText(selectedPlan.billing_cycle)}</p>
            {selectedPlan.trial_days > 0 && (
              <p>包含 {selectedPlan.trial_days} 天免费试用期</p>
            )}
            <p style={{ color: '#666', marginTop: 16 }}>
              点击确认后，系统将自动完成支付并激活您的订阅。
            </p>
          </div>
        )}
      </Modal>

      <Modal
        title={form.getFieldValue('name') ? '编辑套餐' : '创建套餐'}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPlan}
        >
          <Form.Item
            name="name"
            label="套餐标识"
            rules={[{ required: true, message: '请输入套餐标识' }]}
          >
            <Input placeholder="例如: basic_monthly" />
          </Form.Item>
          
          <Form.Item
            name="displayName"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="例如: 基础版-月付" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="套餐描述"
          >
            <TextArea rows={3} placeholder="套餐功能描述" />
          </Form.Item>
          
          <Form.Item
            name="billingCycle"
            label="计费周期"
            rules={[{ required: true, message: '请选择计费周期' }]}
          >
            <Select placeholder="选择计费周期">
              <Option value="daily">日付</Option>
              <Option value="weekly">周付</Option>
              <Option value="monthly">月付</Option>
              <Option value="quarterly">季付</Option>
              <Option value="yearly">年付</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="价格 (¥)"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="例如: 29.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trialDays"
                label="免费试用天数"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="例如: 7" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="status"
            label="立即上架"
            valuePropName="checked"
          >
            <Switch checkedChildren="上架" unCheckedChildren="草稿" />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Plans;
