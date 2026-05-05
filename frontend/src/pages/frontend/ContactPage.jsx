import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography,
  Form,
  Input,
  Select,
  Button,
  message,
  Divider,
  Breadcrumb,
  Spin
} from 'antd';
import { 
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  WechatOutlined,
  SendOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { messagesApi, commonApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ContactPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [messageCategories, setMessageCategories] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyRes, catsRes] = await Promise.all([
        commonApi.getCompanyInfo(),
        messagesApi.getCategories()
      ]);
      setCompanyInfo(companyRes.data);
      setMessageCategories(catsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setCompanyInfo({
        name: '某某科技有限公司',
        address: '北京市海淀区中关村科技园',
        phone: '400-888-8888',
        fax: '010-88888888',
        email: 'contact@example.com',
        qq: '12345678',
        wechat: 'example_tech',
        work_time: '周一至周五 9:00-18:00'
      });
      setMessageCategories([
        { id: 1, name: '产品咨询' },
        { id: 2, name: '售后服务' },
        { id: 3, name: '合作洽谈' },
        { id: 4, name: '意见反馈' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await messagesApi.create(values);
      message.success('留言提交成功，我们将尽快与您联系');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>联系我们</Breadcrumb.Item>
        </Breadcrumb>

        <Spin spinning={loading}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={10}>
              <Card title="联系方式">
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    height: 200,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    marginBottom: 24
                  }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                      <Title level={4} style={{ color: '#fff', margin: 0 }}>公司位置</Title>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20, padding: '16px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <EnvironmentOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 12 }} />
                      <Text strong>公司地址</Text>
                    </div>
                    <Text type="secondary" style={{ marginLeft: 32 }}>
                      {companyInfo?.address || '北京市海淀区中关村科技园'}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 20, padding: '16px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <PhoneOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 12 }} />
                      <Text strong>联系电话</Text>
                    </div>
                    <Text type="secondary" style={{ marginLeft: 32 }}>
                      {companyInfo?.phone || '400-888-8888'}
                    </Text>
                    {companyInfo?.fax && (
                      <div style={{ marginLeft: 32, marginTop: 4 }}>
                        <Text type="secondary">传真：{companyInfo.fax}</Text>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 20, padding: '16px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <MailOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 12 }} />
                      <Text strong>电子邮箱</Text>
                    </div>
                    <Text type="secondary" style={{ marginLeft: 32 }}>
                      {companyInfo?.email || 'contact@example.com'}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 20, padding: '16px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 12 }} />
                      <Text strong>工作时间</Text>
                    </div>
                    <Text type="secondary" style={{ marginLeft: 32 }}>
                      {companyInfo?.work_time || '周一至周五 9:00-18:00'}
                    </Text>
                  </div>

                  {companyInfo?.wechat && (
                    <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <WechatOutlined style={{ fontSize: 20, color: '#52c41a', marginRight: 12 }} />
                        <Text strong>微信号</Text>
                      </div>
                      <Text type="secondary" style={{ marginLeft: 32 }}>
                        {companyInfo.wechat}
                      </Text>
                      {companyInfo?.qq && (
                        <div style={{ marginLeft: 32, marginTop: 4 }}>
                          <Text type="secondary">QQ：{companyInfo.qq}</Text>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} md={14}>
              <Card title="在线留言">
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
                  <Text type="secondary">
                    <MessageOutlined style={{ marginRight: 8 }} />
                    请填写以下表单，我们将尽快与您联系
                  </Text>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="name"
                        label="您的姓名"
                        rules={[{ required: true, message: '请输入您的姓名' }]}
                      >
                        <Input placeholder="请输入您的姓名" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="phone"
                        label="联系电话"
                        rules={[
                          { required: true, message: '请输入联系电话' },
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                        ]}
                      >
                        <Input placeholder="请输入您的联系电话" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label="电子邮箱"
                        rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                      >
                        <Input placeholder="请输入您的电子邮箱（选填）" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="company"
                        label="公司名称"
                      >
                        <Input placeholder="请输入您的公司名称（选填）" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="category_id"
                    label="咨询类型"
                    rules={[{ required: true, message: '请选择咨询类型' }]}
                  >
                    <Select placeholder="请选择咨询类型" size="large">
                      {messageCategories.map(cat => (
                        <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="content"
                    label="留言内容"
                    rules={[{ required: true, message: '请输入留言内容' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="请输入您想咨询的问题或留言内容" 
                      size="large"
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Row justify="end">
                      <Button 
                        size="large"
                        onClick={() => form.resetFields()}
                        style={{ marginRight: 12 }}
                      >
                        重置
                      </Button>
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<SendOutlined />}
                        htmlType="submit"
                        loading={submitting}
                      >
                        提交留言
                      </Button>
                    </Row>
                  </Form.Item>
                </Form>
              </Card>

              <Card title="常见问题" style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ color: '#1890ff' }}>Q：如何获取产品报价？</Text>
                  <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    您可以通过以下方式获取产品报价：1. 在线留言；2. 拨打客服热线；3. 发送邮件至联系邮箱。我们的销售团队会在1个工作日内与您联系。
                  </Paragraph>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ color: '#1890ff' }}>Q：产品保修期是多久？</Text>
                  <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    我们的产品提供1年免费保修服务，保修期内非人为损坏可免费维修或更换。超过保修期后，我们提供成本价维修服务。
                  </Paragraph>
                </div>
                <div>
                  <Text strong style={{ color: '#1890ff' }}>Q：如何成为合作伙伴？</Text>
                  <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    如果您有意成为我们的合作伙伴，请选择"合作洽谈"类型提交留言，或直接拨打销售热线。我们的商务团队会与您详细洽谈合作事宜。
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
}

export default ContactPage;
