import { Card, Avatar, Descriptions, Button, Form, Input, message, Modal } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../api';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ name: user.name, address: user.address, phone: user.phone });
    }
  }, [user]);

  const handleUpdate = async (values: any) => {
    try {
      await api.put(`/auth/me`, values).catch(() => {});
      updateUser(values);
      message.success('更新成功');
      setEditModal(false);
    } catch (err) {
      message.error('更新失败');
    }
  };

  const roleMap: Record<string, string> = {
    owner: '业主',
    merchant: '商户',
    property: '物业管理员',
    worker: '维修人员',
    admin: '系统管理员',
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, padding: 16, background: 'linear-gradient(135deg, #e6f4ff, #f0f5ff)', borderRadius: 12 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
          <div style={{ marginLeft: 24 }}>
            <h2 style={{ margin: 0 }}>{user?.name}</h2>
            <div style={{ color: '#888', marginTop: 4 }}>
              {roleMap[user?.role || '']} · {user?.phone}
            </div>
            {user?.merchantInfo?.storeName && (
              <div style={{ color: '#1677ff', marginTop: 4 }}>{user.merchantInfo.storeName}</div>
            )}
          </div>
        </div>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="手机号">{user?.phone}</Descriptions.Item>
          <Descriptions.Item label="用户角色">{roleMap[user?.role || '']}</Descriptions.Item>
          <Descriptions.Item label="家庭住址">{user?.address || '-'}</Descriptions.Item>
          {user?.merchantInfo && (
            <>
              <Descriptions.Item label="店铺名称">{user.merchantInfo.storeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="店铺类别">{user.merchantInfo.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="店铺介绍">{user.merchantInfo.description || '-'}</Descriptions.Item>
            </>
          )}
        </Descriptions>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditModal(true)}>
            编辑信息
          </Button>
          <Button
            danger
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出登录
          </Button>
        </div>
      </Card>

      <Modal title="编辑个人信息" open={editModal} onCancel={() => setEditModal(false)} footer={null}>
        <Form form={form} onFinish={handleUpdate} layout="vertical">
          <Form.Item label="昵称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input disabled />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
