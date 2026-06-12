import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Space, Typography, App, Tag, Row, Col, Statistic } from 'antd';
import { UserOutlined, SaveOutlined, TrophyOutlined, HistoryOutlined } from '@ant-design/icons';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function Profile() {
  const { user, setUser } = useAppStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (user) form.setFieldsValue(user);
  }, [user, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.put('/auth/profile', values) as any;
      if (data.user) { setUser({ ...user!, ...data.user }); }
      message.success('资料已更新');
    } catch (e: any) { message.error(e.error || '更新失败'); }
    finally { setLoading(false); }
  };

  if (!user) return <Card loading />;

  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Card style={{ textAlign: 'center' }}>
          <Avatar size={96} icon={<UserOutlined />} src={user.avatar} style={{ marginBottom: 16 }} />
          <Title level={4} style={{ margin: 0 }}>{user.name}</Title>
          <div style={{ color: '#999', marginBottom: 16 }}>@{user.username}</div>
          <Space wrap style={{ justifyContent: 'center', marginBottom: 16 }}>
            <Tag color="blue">{user.role === 'jobseeker' ? '求职者' : user.role === 'hr' ? 'HR' : user.role === 'trainer' ? '培训师' : '管理员'}</Tag>
            <Tag color="gold"><TrophyOutlined /> {user.points || 0} 积分</Tag>
          </Space>
          <Row gutter={8}>
            <Col span={12}><Card size="small"><Statistic title="加入天数" value={dayjs().diff(dayjs((user as any).created_at || new Date()), 'day')} /></Card></Col>
            <Col span={12}><Card size="small"><Statistic title="操作记录" value={128} /></Card></Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="个人资料">
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="name" label="姓名"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="email" label="邮箱"><Input /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="phone" label="手机号"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="avatar" label="头像URL"><Input placeholder="头像图片链接" /></Form.Item></Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>保存修改</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
