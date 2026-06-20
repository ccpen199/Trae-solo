import { useState, useEffect } from 'react';
import { Card, Tabs, List, Avatar, Button, Tag, Form, Input, message, Modal } from 'antd';
import { UserOutlined, HeartOutlined, MessageOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/request';

interface Props {
  user: any;
}

export default function UserCenter({ user }: Props) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [profileVisible, setProfileVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFavorites();
    loadConsultations();
  }, []);

  const loadFavorites = async () => {
    try {
      const res: any = await api.get('/user/favorites');
      setFavorites(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConsultations = async () => {
    try {
      const res: any = await api.get('/user/consultations');
      setConsultations(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFavorite = async (id: number) => {
    try {
      await api.delete(`/user/favorites/${id}`);
      message.success('已取消收藏');
      loadFavorites();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await form.validateFields();
      await api.put('/auth/profile', values);
      message.success('个人信息更新成功');
      setProfileVisible(false);
    } catch (e: any) {
      message.error(e.message || '更新失败');
    }
  };

  const tabItems = [
    {
      key: 'favorites',
      label: <span><HeartOutlined /> 我的收藏</span>,
      children: (
        <List
          dataSource={favorites}
          renderItem={(item: any) => {
            const images = item.images ? JSON.parse(item.images) : [];
            return (
              <List.Item
                actions={[
                  <Button type="link" danger onClick={() => handleRemoveFavorite(item.fav_id)}>
                    取消收藏
                  </Button>,
                  <Button type="link" onClick={() => navigate(`/property/${item.id}`)}>
                    查看详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <img 
                      src={images[0] || 'https://via.placeholder.com/80?text=No+Image'} 
                      alt=""
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                  }
                  title={<span style={{ cursor: 'pointer' }} onClick={() => navigate(`/property/${item.id}`)}>{item.title}</span>}
                  description={
                    <div>
                      <span className="price-text" style={{ fontSize: 16 }}>{item.price}万</span>
                      <span style={{ color: '#999', marginLeft: 12 }}>
                        {item.room_count}室{item.hall_count}厅 · {item.area}㎡ · {item.district}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ),
    },
    {
      key: 'consultations',
      label: <span><MessageOutlined /> 我的咨询</span>,
      children: (
        <List
          dataSource={consultations}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Tag color={item.status === 'replied' ? 'green' : 'orange'}>
                  {item.status === 'replied' ? '已回复' : '待回复'}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                title={item.property_title}
                description={
                  <div>
                    <div style={{ color: '#666' }}>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      经纪人: {item.agent_name || '暂无'} · {item.created_at}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'transactions',
      label: <span><FileTextOutlined /> 我的交易</span>,
      children: (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Button type="primary" onClick={() => navigate('/transactions')}>
            查看全部交易
          </Button>
        </div>
      ),
    },
    {
      key: 'profile',
      label: <span><SettingOutlined /> 个人设置</span>,
      children: (
        <div style={{ maxWidth: 400 }}>
          <p><strong>用户名：</strong>{user?.username}</p>
          <p><strong>姓名：</strong>{user?.real_name || '未设置'}</p>
          <p><strong>手机号：</strong>{user?.phone || '未设置'}</p>
          <p><strong>邮箱：</strong>{user?.email || '未设置'}</p>
          <p><strong>角色：</strong>
            {({ user: '普通用户', agent: '经纪人', developer: '开发商', admin: '管理员' } as Record<string, string>)[user?.role || 'user']}
          </p>
          <Button type="primary" onClick={() => {
            form.setFieldsValue({ realName: user?.real_name, phone: user?.phone, email: user?.email });
            setProfileVisible(true);
          }}>
            编辑资料
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Avatar size={64} icon={<UserOutlined />} src={user?.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>{user?.real_name || user?.username}</h2>
            <div style={{ color: '#999', marginTop: 4 }}>
              <Tag color="blue">
                {({ user: '普通用户', agent: '经纪人', developer: '开发商', admin: '管理员' } as Record<string, string>)[user?.role || 'user']}
              </Tag>
              {user?.status === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>}
            </div>
          </div>
        </div>

        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="编辑个人资料"
        open={profileVisible}
        onOk={handleUpdateProfile}
        onCancel={() => setProfileVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="realName" label="真实姓名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
