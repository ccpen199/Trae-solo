import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Card, Spin, Alert, Checkbox, Steps, Divider } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { creditApi } from '../services/api';

const { Step } = Steps;

const CreditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCreditInfo();
  }, []);

  const loadCreditInfo = async () => {
    setLoading(true);
    try {
      const result = await creditApi.getInfo();
      setCreditInfo(result.data);
      if (result.data) {
        form.setFieldsValue({
          companyName: result.data.company_name,
          creditCode: result.data.credit_code,
          legalName: result.data.legal_name,
          idCard: result.data.id_card,
          authAgreement: result.data.status === 2
        });
      }
    } catch (error) {
      console.error('加载授信信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await creditApi.submit(values);
      await loadCreditInfo();
    } catch (error) {
      console.error('提交授信申请失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentStep = () => {
    if (!creditInfo || creditInfo.status === 0) return 0;
    if (creditInfo.status === 1) return 1;
    return 2;
  };

  const getStatusText = () => {
    if (!creditInfo) return '未申请';
    switch (creditInfo.status) {
      case 0: return '未申请';
      case 1: return '审核中';
      case 2: return '已通过';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>授信管理</h1>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>授信管理</h1>
      </div>
      <div className="page-content">
        <Button
          className="back-btn"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/home')}
        >
          返回首页
        </Button>

        {creditInfo?.status === 2 ? (
          <Alert
            message="授信已通过"
            description={
              <div>
                <p>您的授信额度：<strong style={{ fontSize: 20, color: '#fa8c16' }}>¥{creditInfo.credit_limit?.toLocaleString()}</strong></p>
                <p>可用额度：<strong>¥{creditInfo.available_limit?.toLocaleString()}</strong></p>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        ) : (
          <Steps
            current={getCurrentStep()}
            status={creditInfo?.status === 1 ? 'process' : 'wait'}
            style={{ marginBottom: 24 }}
          >
            <Step title="提交申请" />
            <Step title="审核中" />
            <Step title="审核通过" />
          </Steps>
        )}

        {creditInfo?.status !== 2 && (
          <Card bordered={false}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <h3>企业授信申请</h3>
              <p style={{ color: '#8c8c8c' }}>请填写企业信息进行资质审核</p>
            </div>

            <Form
              form={form}
              name="credit"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
            >
              <div className="form-section">
                <div className="title">企业信息</div>
                
                <Form.Item
                  name="companyName"
                  label="企业名称"
                  rules={[{ required: true, message: '请输入企业名称' }]}
                >
                  <Input placeholder="请输入企业全称" />
                </Form.Item>

                <Form.Item
                  name="creditCode"
                  label="统一社会信用代码"
                  rules={[{ required: true, message: '请输入统一社会信用代码' }]}
                >
                  <Input placeholder="请输入18位统一社会信用代码" maxLength={18} />
                </Form.Item>
              </div>

              <div className="form-section">
                <div className="title">法人信息</div>
                
                <Form.Item
                  name="legalName"
                  label="法定代表人姓名"
                  rules={[{ required: true, message: '请输入法定代表人姓名' }]}
                >
                  <Input placeholder="请输入法定代表人姓名" />
                </Form.Item>

                <Form.Item
                  name="idCard"
                  label="身份证号"
                  rules={[
                    { required: true, message: '请输入身份证号' },
                    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号' }
                  ]}
                >
                  <Input placeholder="请输入18位身份证号" maxLength={18} />
                </Form.Item>
              </div>

              <div className="form-section">
                <div className="title">授权协议</div>
                <div className="agreement-box">
                  <p>本人同意并授权平台查询并使用以下信息：</p>
                  <p>1. 企业工商注册信息、经营状况信息；</p>
                  <p>2. 法定代表人个人身份信息、征信信息；</p>
                  <p>3. 与房产交易相关的业务信息；</p>
                  <p>4. 本人同意以上信息仅用于佣金垫付服务的资质审核。</p>
                </div>
                <Form.Item
                  name="authAgreement"
                  valuePropName="checked"
                  rules={[{ required: true, message: '请同意授权协议' }]}
                >
                  <Checkbox>我已阅读并同意《信息查询及使用授权协议</Checkbox>
                </Form.Item>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={submitting}
                  disabled={submitting || creditInfo?.status === 1}
                >
                  {creditInfo?.status === 1 ? '审核中，请耐心等待' : '提交审核'}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
              <p>提示：企业信息核验和四要素校验每日最多5次</p>
            </div>
          </Card>
        )}

        {creditInfo?.status === 2 && (
          <Card bordered={false} style={{ marginTop: 16 }}>
          <Divider orientation="left">额度使用说明</Divider>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <p>1. 授信额度仅用于佣金垫付服务；</p>
            <p>2. 单笔垫付金额不得超过待结佣金金额；</p>
            <p>3. 单笔垫付金额不得超过可用额度；</p>
            <p>4. 还款后额度将自动恢复；</p>
            <p>5. 如有疑问请联系客服。</p>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
};

export default CreditPage;
