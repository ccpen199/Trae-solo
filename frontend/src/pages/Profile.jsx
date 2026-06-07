import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Input, message, Space, Descriptions, Avatar, Tag, Divider, Modal } from 'antd';
import { UserOutlined, EditOutlined, SafetyOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, IdcardOutlined, KeyOutlined } from '@ant-design/icons';
import { authAPI } from '../api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const Profile = () => {
  const { user, updateUser } = useUserStore();
  const [profile, setProfile] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      setProfile(res.data);
    } catch (err) {
      message.error('加载个人信息失败');
    }
  };

  const handleEdit = async (values) => {
    try {
      await authAPI.updateProfile(values);
      message.success('个人信息更新成功');
      setEditVisible(false);
      form.resetFields();
      loadProfile();
      updateUser();
    } catch (err) {
      message.error(err.response?.data?.error || '更新失败');
    }
  };

  const handleChangePassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return;
    }
    try {
      await authAPI.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功');
      setPasswordVisible(false);
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || '密码修改失败');
    }
  };

  const getRoleTag = (role) => {
    const roleMap = {
      admin: { color: 'red', text: '系统管理员' },
      operator: { color: 'blue', text: '运营人员' },
      grid_worker: { color: 'green', text: '网格员' },
      user: { color: 'default', text: '普通用户' },
    };
    const info = roleMap[role] || { color: 'default', text: role };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (!profile) return null;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>个人中心</h2>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ textAlign: 'center', marginBottom: 16 }}>
            <Avatar size={96} icon={<UserOutlined />} src={profile.avatar} />
            <h3 style={{ margin: '16px 0 8px 0' }}>
              {profile.real_name || user?.username}
            </h3>
            <Space>
              {getRoleTag(user?.role)}
              {profile.verified && (
                <Tag color="green" icon={<SafetyOutlined />}>已实名</Tag>
              )}
            </Space>
            <Divider />
            <p style={{ color: '#666', margin: 0 }}>
              用户编号：<span style={{ fontFamily: 'monospace' }}>{profile.user_no}</span>
            </p>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              注册时间：{dayjs(profile.created_at).format('YYYY-MM-DD')}
            </p>
          </Card>

          <Card title="快捷操作" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<EditOutlined />} onClick={() => {
                form.setFieldsValue({
                  real_name: profile.real_name,
                  phone: profile.phone,
                  email: profile.email,
                  address: profile.address,
                  id_card: profile.id_card,
                });
                setEditVisible(true);
              }}>
                编辑个人信息
              </Button>
              <Button block icon={<KeyOutlined />} onClick={() => setPasswordVisible(true)}>
                修改密码
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="基本信息" bordered={false}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="用户名">
                <Space>
                  <UserOutlined />
                  {user?.username}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="真实姓名">
                <Space>
                  <IdcardOutlined />
                  {profile.real_name || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {profile.id_card ? `${profile.id_card.substring(0, 6)}********${profile.id_card.substring(14)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="手机号码">
                <Space>
                  <PhoneOutlined />
                  {profile.phone || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="电子邮箱">
                <Space>
                  <MailOutlined />
                  {profile.email || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系地址">
                <Space>
                  <EnvironmentOutlined />
                  {profile.address || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="所属组织">
                {profile.organization_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实名状态">
                {profile.verified ? (
                  <Tag color="green" icon={<SafetyOutlined />}>已实名认证</Tag>
                ) : (
                  <Tag color="warning">未实名认证</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="气表信息" bordered={false} style={{ marginTop: 16 }}>
            {profile.meters && profile.meters.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {profile.meters.map(meter => (
                  <Card key={meter.id} size="small">
                    <Row align="middle">
                      <Col span={12}>
                        <p style={{ margin: 0 }}>
                          <span style={{ color: '#666' }}>表具编号：</span>
                          <span style={{ fontFamily: 'monospace' }}>{meter.meter_no}</span>
                        </p>
                        <p style={{ margin: '4px 0 0 0' }}>
                          <span style={{ color: '#666' }}>安装地址：</span>
                          {meter.install_address}
                        </p>
                      </Col>
                      <Col span={6}>
                        <p style={{ margin: 0 }}>
                          <span style={{ color: '#666' }}>当前读数：</span>
                          <strong>{meter.current_reading} m³</strong>
                        </p>
                        <p style={{ margin: '4px 0 0 0' }}>
                          <span style={{ color: '#666' }}>上次抄表：</span>
                          {meter.last_reading ? dayjs(meter.last_reading_date).format('YYYY-MM-DD') : '-'}
                        </p>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Tag color={meter.status === 'active' ? 'success' : 'default'}>
                          {meter.status === 'active' ? '正常使用' : meter.status === 'inactive' ? '停用' : '维修中'}
                        </Tag>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                暂无绑定的气表信息
              </p>
            )}
          </Card>

          {profile.organization_info && (
            <Card title="所属单位信息" bordered={false} style={{ marginTop: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="单位名称">{profile.organization_info.name}</Descriptions.Item>
                <Descriptions.Item label="单位类型">{profile.organization_info.type}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{profile.organization_info.phone}</Descriptions.Item>
                <Descriptions.Item label="单位地址">{profile.organization_info.address}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="编辑个人信息"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="real_name"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号码"
                rules={[
                  { required: true, message: '请输入手机号码' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                ]}
              >
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="电子邮箱"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入电子邮箱（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="id_card"
            label="身份证号"
            rules={[
              { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' },
            ]}
          >
            <Input placeholder="请输入身份证号（用于实名认证）" />
          </Form.Item>
          <Form.Item
            name="address"
            label="联系地址"
          >
            <Input.TextArea rows={2} placeholder="请输入详细联系地址" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setEditVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordVisible}
        onCancel={() => setPasswordVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（不少于6位）" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setPasswordVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认修改</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
