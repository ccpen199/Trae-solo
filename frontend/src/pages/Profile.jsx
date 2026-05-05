import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Tabs, message, Avatar, Descriptions, Tag, Space
} from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { userApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      profileForm.setFieldsValue({
        nickname: data.nickname,
        phone: data.phone
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const handleProfileSubmit = async (values) => {
    setLoading(true);
    try {
      const data = await userApi.updateProfile(values);
      message.success('资料更新成功');
      updateUser(data.user);
      fetchProfile();
    } catch (error) {
      console.error('更新资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('修改密码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'info',
      label: '个人信息',
      children: (
        <Card>
          <Descriptions
            title="基本信息"
            bordered
            column={2}
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="用户名">
              <Space>
                <Avatar icon={<UserOutlined />} src={profile?.avatar} />
                <span style={{ fontWeight: 500 }}>{profile?.username}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="昵称">{profile?.nickname || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">
              <Space>
                <MailOutlined /> {profile?.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              <Space>
                <PhoneOutlined /> {profile?.phone || '未填写'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={profile?.role === 'admin' ? 'red' : 'blue'}>
                {profile?.role === 'admin' ? '管理员' : '普通用户'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {profile?.created_at ? dayjs(profile.created_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 style={{ marginBottom: 16 }}>编辑资料</h3>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSubmit}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input placeholder="请输入昵称" size="large" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
            >
              <Input placeholder="请输入手机号" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Card>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="oldPassword"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password placeholder="请输入原密码" size="large" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入新密码（至少6个字符）" size="large" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              rules={[
                { required: true, message: '请再次输入新密码' }
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ];

  return (
    <AppLayout showSidebar>
      <Card title="个人中心">
        <Tabs items={tabItems} />
      </Card>
    </AppLayout>
  );
};

export default Profile;
