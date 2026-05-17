import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Spin } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { whitelistApi } from '../services/api';
import { useApp } from '../store/appContext';

const WhitelistPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [loading, setLoading] = useState(false);
  const [notWhitelisted, setNotWhitelisted] = useState(false);
  const [contactPhone, setContactPhone] = useState('');

  const handleCheck = async (values) => {
    setLoading(true);
    try {
      const result = await whitelistApi.check(values.phone);
      
      if (!result.data.isWhitelisted) {
        setNotWhitelisted(true);
        setContactPhone(result.data.contactPhone);
      } else {
        if (result.data.isRegistered) {
          login({
            userId: result.data.userId,
            phone: result.data.phone,
            merchantName: result.data.merchantName
          });
          navigate('/home');
        } else {
          navigate('/register', { state: { whitelistInfo: result.data } });
        }
      }
    } catch (error) {
      console.error('白名单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>佣金垫付服务</h1>
      </div>
      <div className="page-content">
        {notWhitelisted ? (
          <Alert
            message="暂无法使用该服务"
            description={
              <div>
                <p>您不在服务白名单中，请联系房产交易云店客服申请开通。</p>
                <p style={{ marginTop: 8 }}>
                  <strong>客服电话：</strong>
                  <a href={`tel:${contactPhone}`} style={{ color: '#1890ff' }}>
                    {contactPhone}
                  </a>
                </p>
              </div>
            }
            type="warning"
            showIcon
            action={
              <Button size="small" onClick={() => setNotWhitelisted(false)}>
                重新输入
              </Button>
            }
          />
        ) : (
          <Card bordered={false}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <LockOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
              <p style={{ color: '#595959' }}>请输入您的手机号进行验证</p>
            </div>

            <Form
              name="whitelist"
              onFinish={handleCheck}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="请输入手机号"
                  maxLength={11}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? <Spin size="small" /> : '验证'}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#8c8c8c' }}>
              <p>测试手机号：13800138000（已注册用户）</p>
              <p>13900139000（白名单未注册）</p>
              <p>13600136000（非白名单）</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WhitelistPage;
