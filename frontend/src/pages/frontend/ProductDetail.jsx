import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Descriptions, 
  Button, 
  Tag, 
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Breadcrumb,
  List,
  Empty,
  Spin
} from 'antd';
import { 
  LeftOutlined, 
  MessageOutlined, 
  PhoneOutlined, 
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi, messagesApi, commonApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [messageCategories, setMessageCategories] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadMessageCategories();
    loadCompanyInfo();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getDetail(id);
      setProduct(res.data);
    } catch (error) {
      console.error('加载产品详情失败:', error);
      setProduct({
        id: id,
        title: '智能产品A1',
        subtitle: '高端智能产品，品质之选',
        description: '这是一款高品质的智能产品，采用先进的技术制造，性能卓越，经久耐用。',
        content: '<p>详细介绍内容...</p>',
        price: '2999.00',
        specs: '{"尺寸":"100x100x50mm","重量":"2.5kg","材质":"铝合金","颜色":"黑色/银色"}',
        is_recommended: true,
        is_top: false,
        view_count: 128,
        series_name: '智能系列',
        category_name: '智能设备'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessageCategories = async () => {
    try {
      const res = await messagesApi.getCategories();
      setMessageCategories(res.data || []);
    } catch (error) {
      console.error('加载留言分类失败:', error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const res = await commonApi.getCompanyInfo();
      setCompanyInfo(res.data);
    } catch (error) {
      console.error('加载企业信息失败:', error);
    }
  };

  const handleMessageSubmit = async (values) => {
    setSubmitting(true);
    try {
      await messagesApi.create({
        ...values,
        product_id: id
      });
      message.success('留言提交成功，请等待回复');
      setMessageModalVisible(false);
      messageForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const parseSpecs = (specs) => {
    if (!specs) return [];
    try {
      const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs;
      return Object.entries(parsed).map(([key, value]) => ({ key, value }));
    } catch {
      return [];
    }
  };

  const specs = parseSpecs(product?.specs);

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>产品中心</Breadcrumb.Item>
          <Breadcrumb.Item>{product?.title || '产品详情'}</Breadcrumb.Item>
        </Breadcrumb>

        <Spin spinning={loading}>
          {product ? (
            <>
              <Card>
                <Row gutter={[40, 24]}>
                  <Col xs={24} md={10}>
                    <div style={{
                      height: 400,
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8
                    }}>
                      <div style={{ fontSize: 80, color: '#1890ff' }}>📦</div>
                    </div>
                  </Col>
                  <Col xs={24} md={14}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        {product.series_name && <Tag color="blue">{product.series_name}</Tag>}
                        {product.category_name && <Tag color="green">{product.category_name}</Tag>}
                        {product.is_recommended && <Tag color="gold">推荐</Tag>}
                        {product.is_top && <Tag color="red">置顶</Tag>}
                      </div>
                      <Title level={2} style={{ marginBottom: 16 }}>{product.title}</Title>
                      {product.subtitle && (
                        <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>
                          {product.subtitle}
                        </Text>
                      )}
                      
                      {product.price && (
                        <div style={{ marginBottom: 24 }}>
                          <Text type="secondary">价格：</Text>
                          <Text style={{ fontSize: 28, color: '#f5222d', fontWeight: 'bold' }}>
                            ¥{product.price}
                          </Text>
                        </div>
                      )}

                      {product.description && (
                        <div style={{ marginBottom: 24 }}>
                          <Text strong style={{ display: 'block', marginBottom: 8 }}>产品简介：</Text>
                          <Paragraph type="secondary">{product.description}</Paragraph>
                        </div>
                      )}

                      {product.view_count && (
                        <div style={{ marginBottom: 24 }}>
                          <Text type="secondary">浏览次数：{product.view_count}</Text>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 16 }}>
                        <Button 
                          type="primary" 
                          size="large" 
                          icon={<MessageOutlined />}
                          onClick={() => setMessageModalVisible(true)}
                        >
                          咨询产品
                        </Button>
                        <Button 
                          size="large" 
                          icon={<LeftOutlined />}
                          onClick={() => navigate('/products')}
                        >
                          返回列表
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {specs.length > 0 && (
                <Card title="产品规格" style={{ marginTop: 24 }}>
                  <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                    {specs.map((spec, index) => (
                      <Descriptions.Item key={index} label={spec.key}>
                        {spec.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              )}

              {product.content && (
                <Card title="详细介绍" style={{ marginTop: 24 }}>
                  <div dangerouslySetInnerHTML={{ __html: product.content }} style={{ lineHeight: 1.8 }} />
                </Card>
              )}

              <Card title="联系方式" style={{ marginTop: 24 }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <PhoneOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>电话咨询</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">{companyInfo?.phone || '400-888-8888'}</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <MailOutlined style={{ fontSize: 40, color: '#52c41a' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>邮件联系</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">{companyInfo?.email || 'contact@example.com'}</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <EnvironmentOutlined style={{ fontSize: 40, color: '#722ed1' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>公司地址</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">{companyInfo?.address || '北京市海淀区中关村科技园'}</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </>
          ) : (
            <Card>
              <Empty description="产品不存在或已下架" />
            </Card>
          )}
        </Spin>

        <Modal
          title="产品咨询"
          open={messageModalVisible}
          onCancel={() => setMessageModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={messageForm}
            layout="vertical"
            onFinish={handleMessageSubmit}
          >
            <Form.Item
              name="category_id"
              label="咨询类型"
              rules={[{ required: true, message: '请选择咨询类型' }]}
            >
              <Select placeholder="请选择咨询类型">
                {messageCategories.map(cat => (
                  <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="name"
              label="您的姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入您的姓名" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input placeholder="请输入您的联系电话" />
            </Form.Item>

            <Form.Item
              name="email"
              label="电子邮箱"
              rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
            >
              <Input placeholder="请输入您的电子邮箱（选填）" />
            </Form.Item>

            <Form.Item
              name="company"
              label="公司名称"
            >
              <Input placeholder="请输入您的公司名称（选填）" />
            </Form.Item>

            <Form.Item
              name="content"
              label="咨询内容"
              rules={[{ required: true, message: '请输入咨询内容' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="请输入您想咨询的问题，例如产品价格、规格、交货期等" 
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button 
                onClick={() => setMessageModalVisible(false)}
                style={{ marginRight: 12 }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交咨询
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default ProductDetail;
