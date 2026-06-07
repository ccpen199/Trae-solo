import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { authAPI } from '../api';

const { Title, Text } = Typography;

interface VerifyProps {
  onVerified: (user: any) => void;
}

const VerifyPage: React.FC<VerifyProps> = ({ onVerified }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authAPI.verifyIdentity(values);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.is_verified = 1;
        user.real_name = values.real_name;
        onVerified(user);
      }
      message.success('实名认证成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>实名认证</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          实名认证可以提升您的账号可信度，享受更多平台服务
        </Text>
        
        <Form
          name="verify"
          onFinish={onFinish}
          size="large"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item
            name="real_name"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入身份证上的姓名" />
          </Form.Item>

          <Form.Item
            name="id_card"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' }
            ]}
          >
            <Input placeholder="18位身份证号码" />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交认证
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default VerifyPage;
