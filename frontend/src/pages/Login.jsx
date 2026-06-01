import React from 'react';
import { Form, Input, Button, Card, message, Row, Col, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request.js';

function Login({ setUser }) {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await request.post('/auth/login', values);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      message.success('登录成功');
      
      setTimeout(() => {
        switch (res.user.role) {
          case 'author':
            navigate('/author/novels');
            break;
          case 'editor':
          case 'admin':
            navigate('/editor/dashboard');
            break;
          case 'finance':
            navigate('/finance/settlements');
            break;
          default:
            navigate('/');
        }
      }, 500);
    } catch (e) {
      message.error(e.response?.data?.error || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card title="登录" style={{ width: 500 }}>
        <Row gutter={24}>
          <Col span={14}>
            <Form onFinish={onFinish}>
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" style={{ width: '100%' }}>
                  登录
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#999', fontSize: 12 }}>还没有账号？</span>
                <a onClick={() => navigate('/register')} style={{ cursor: 'pointer', color: '#1677ff', fontSize: 12 }}>立即注册</a>
              </div>
            </Form>
          </Col>
          <Col span={10} style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#1677ff' }}>角色工作台</h4>
            <Space direction="vertical" size={12} style={{ width: '100%', fontSize: 12 }}>
              <div style={{ background: '#e6f4ff', padding: 10, borderRadius: 6 }}>
                <strong>✍️ 作者</strong>
                <div style={{ color: '#666', marginTop: 4, fontSize: 11 }}>作品管理·章节发布·草稿箱</div>
              </div>
              <div style={{ background: '#f6ffed', padding: 10, borderRadius: 6 }}>
                <strong>📝 编辑</strong>
                <div style={{ color: '#666', marginTop: 4, fontSize: 11 }}>作品审核·推荐位·违规处理</div>
              </div>
              <div style={{ background: '#f9f0ff', padding: 10, borderRadius: 6 }}>
                <strong>📖 读者</strong>
                <div style={{ color: '#666', marginTop: 4, fontSize: 11 }}>书架·订阅·评论打赏</div>
              </div>
              <div style={{ background: '#fff7e6', padding: 10, borderRadius: 6 }}>
                <strong>💰 结算</strong>
                <div style={{ color: '#666', marginTop: 4, fontSize: 11 }}>账单明细·收入统计</div>
              </div>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 11, color: '#999' }}>
              <p style={{ marginBottom: 4 }}><strong>测试账号：</strong></p>
              <p style={{ margin: '2px 0' }}>作者: author1 / author123</p>
              <p style={{ margin: '2px 0' }}>编辑: editor1 / editor123</p>
              <p style={{ margin: '2px 0' }}>读者: reader1 / reader123</p>
              <p style={{ margin: '2px 0' }}>结算: finance1 / finance123</p>
              <p style={{ margin: '2px 0' }}>管理员: admin / admin123</p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Login;
