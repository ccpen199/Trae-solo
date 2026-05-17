import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Checkbox, Card, Spin, Alert, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { userApi } from '../services/api';
import { useApp } from '../store/appContext';

const { Paragraph, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const whitelistInfo = location.state?.whitelistInfo;

  if (!whitelistInfo) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>用户注册</h1>
        </div>
        <div className="page-content">
          <Alert
            message="请先进行白名单验证"
            type="warning"
            showIcon
            action={
              <Button size="small" onClick={() => navigate('/')}>
                去验证
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const result = await userApi.register({
        phone: whitelistInfo.phone,
        registerAgreement: values.registerAgreement,
        commissionAgreement: values.commissionAgreement
      });

      login({
        userId: result.data.userId,
        phone: result.data.phone,
        merchantName: result.data.merchantName
      });

      navigate('/home');
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>用户注册</h1>
      </div>
      <div className="page-content">
        <Card bordered={false}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>{whitelistInfo.merchantName}</h3>
            <p style={{ color: '#8c8c8c' }}>手机号：{whitelistInfo.phone}</p>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            autoComplete="off"
          >
            <div className="form-section">
              <div className="title">用户注册协议</div>
              <div className="agreement-box">
                <Paragraph>
                  <Text strong>第一条 服务说明</Text>
                </Paragraph>
                <Paragraph>
                  本服务为房产交易云店经纪门店提供佣金垫付服务。用户在使用本服务前应仔细阅读并理解本协议全部内容。
                </Paragraph>
                <Paragraph>
                  <Text strong>第二条 用户资格</Text>
                </Paragraph>
                <Paragraph>
                  1. 用户应为具有完全民事行为能力的自然人或合法经营的企业法人；
                  2. 用户必须是房产交易云店认证的经纪门店法定代表人；
                  3. 用户需通过白名单验证后方可使用本服务。
                </Paragraph>
                <Paragraph>
                  <Text strong>第三条 服务内容</Text>
                </Paragraph>
                <Paragraph>
                  1. 佣金垫付：在符合条件的情况下，为用户提前垫付房产交易佣金；
                  2. 授信额度：根据用户资质提供相应的垫付额度；
                  3. 还款服务：提供便捷的还款渠道和还款提醒服务。
                </Paragraph>
              </div>
              <Form.Item
                name="registerAgreement"
                valuePropName="checked"
                rules={[{ required: true, message: '请同意用户注册协议' }]}
              >
                <Checkbox>我已阅读并同意《用户注册协议》</Checkbox>
              </Form.Item>
            </div>

            <div className="form-section">
              <div className="title">佣金垫付服务协议</div>
              <div className="agreement-box">
                <Paragraph>
                  <Text strong>第一条 垫付条件</Text>
                </Paragraph>
                <Paragraph>
                  1. 用户必须完成实名认证和企业资质审核；
                  2. 用户必须绑定本人银行卡；
                  3. 佣金必须是已确认的待结佣金；
                  4. 用户必须通过人脸识别验证。
                </Paragraph>
                <Paragraph>
                  <Text strong>第二条 费用说明</Text>
                </Paragraph>
                <Paragraph>
                  1. 佣金垫付服务将收取一定比例的服务费用；
                  2. 具体费率将根据用户资质和市场情况确定；
                  3. 用户应按照约定时间足额偿还垫付款项。
                </Paragraph>
                <Paragraph>
                  <Text strong>第三条 违约责任</Text>
                </Paragraph>
                <Paragraph>
                  1. 用户逾期还款将产生逾期费用；
                  2. 严重逾期将影响用户信用记录和后续服务使用；
                  3. 平台保留通过法律途径追偿的权利。
                </Paragraph>
              </div>
              <Form.Item
                name="commissionAgreement"
                valuePropName="checked"
                rules={[{ required: true, message: '请同意佣金垫付服务协议' }]}
              >
                <Checkbox>我已阅读并同意《佣金垫付服务协议》</Checkbox>
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                disabled={loading}
              >
                {loading ? <Spin size="small" /> : '确认注册'}
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="text"
            block
            onClick={() => navigate('/')}
            style={{ marginTop: 8 }}
          >
            返回重新验证
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
