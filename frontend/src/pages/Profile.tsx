import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Descriptions, Button, Form, Input, Select, List, Tag, message, Tabs } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, EditOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { authAPI, socialAPI, cityAPI, postAPI } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;

interface ProfileProps {
  user: any;
  onUpdate: (user: any) => void;
}

const ProfilePage: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'profile';
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [citiesRes, followersRes, followingRes, appointmentsRes, postsRes] = await Promise.all([
        cityAPI.getCities(),
        socialAPI.getFollowers(),
        socialAPI.getFollowing(),
        socialAPI.getAppointments(),
        postAPI.getPosts(),
      ]);
      setCities(citiesRes.data.cities);
      setFollowers(followersRes.data.followers);
      setFollowing(followingRes.data.following);
      setAppointments(appointmentsRes.data.appointments);
      setMyPosts(postsRes.data.posts.filter((p: any) => p.user_id === user.id));
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleEdit = () => {
    form.setFieldsValue({
      nickname: user.nickname,
      city_id: user.city_id,
      district: user.district,
      street: user.street,
    });
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    try {
      await authAPI.updateProfile(values);
      const newUser = { ...user, ...values };
      onUpdate(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      setEditing(false);
      message.success('更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const handleFollow = async (targetUserId: number, isFollowing: boolean) => {
    try {
      await socialAPI.followUser(targetUserId);
      message.success(isFollowing ? '已取消关注' : '关注成功');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      children: (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <Avatar size={80} icon={<UserOutlined />} src={user.avatar} />
            <div style={{ marginLeft: 24, flex: 1 }}>
              <Title level={3} style={{ margin: 0 }}>
                {user.nickname}
                {user.is_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
                {user.is_admin ? <Tag color="red" style={{ marginLeft: 8 }}>管理员</Tag> : null}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                加入时间：{new Date(user.created_at).toLocaleDateString()}
              </Text>
            </div>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              编辑资料
            </Button>
          </div>

          {editing ? (
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Form.Item name="nickname" label="昵称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="city_id" label="城市" rules={[{ required: true }]}>
                <Select>
                  {cities.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="district" label="区县">
                <Input />
              </Form.Item>
              <Form.Item name="street" label="街道">
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">保存</Button>
                <Button onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>取消</Button>
              </Form.Item>
            </Form>
          ) : (
            <Descriptions column={2} bordered>
              <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
              <Descriptions.Item label="昵称">{user.nickname}</Descriptions.Item>
              <Descriptions.Item label="实名认证">
                {user.is_verified ? (
                  <span style={{ color: '#52c41a' }}><SafetyCertificateOutlined /> 已认证</span>
                ) : (
                  <Text type="warning">未认证</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">{user.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user.email || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="真实姓名">{user.real_name || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="所在城市">
                {cities.find((c) => c.id === user.city_id)?.name || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="详细地址">
                {user.district} {user.street || '未设置'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      ),
    },
    {
      key: 'following',
      label: `我的关注 (${following.length})`,
      children: (
        <Card>
          <List
            dataSource={following}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="text" danger onClick={() => handleFollow(item.id, true)}>取消关注</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatar} icon={<UserOutlined />} />}
                  title={
                    <span>
                      {item.nickname}
                      {item.is_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'followers',
      label: `我的粉丝 (${followers.length})`,
      children: (
        <Card>
          <List
            dataSource={followers}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="primary" onClick={() => handleFollow(item.id, false)}>关注</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatar} icon={<UserOutlined />} />}
                  title={
                    <span>
                      {item.nickname}
                      {item.is_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'appointments',
      label: `我的预约 (${appointments.length})`,
      children: (
        <Card>
          <List
            dataSource={appointments}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.post_title}
                  description={
                    <div>
                      <Tag>{item.appointment_type}</Tag>
                      <Text type="secondary">{item.appointment_time}</Text>
                      <Tag color={item.status === 'pending' ? 'gold' : 'green'}>
                        {item.status === 'pending' ? '待确认' : '已确认'}
                      </Tag>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'posts',
      label: `我的发布 (${myPosts.length})`,
      children: (
        <Card>
          <List
            dataSource={myPosts}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={
                    <div>
                      <Tag>{item.category}</Tag>
                      <Text type="secondary">{new Date(item.created_at).toLocaleDateString()}</Text>
                      <Text type="secondary" style={{ marginLeft: 16 }}>
                        浏览 {item.view_count} · 点赞 {item.like_count} · 评论 {item.comment_count}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return <Tabs activeKey={tab} items={tabItems} onChange={() => {}} />;
};

export default ProfilePage;
