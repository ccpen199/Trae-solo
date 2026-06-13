import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Space, Tag, List, Avatar,
  Modal, Form, Input, Select, App, Tooltip, Empty,
} from 'antd';
import {
  PlusOutlined, HomeOutlined, UserOutlined, EditOutlined,
  DeleteOutlined, SettingOutlined, ThunderboltOutlined,
  TeamOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../services/api';

const { Option } = Select;

const HomeManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [homes, setHomes] = useState<any[]>([]);
  const [currentHome, setCurrentHome] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [homeModal, setHomeModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [homeForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [memberForm] = Form.useForm();

  useEffect(() => {
    loadHomes();
  }, []);

  const loadHomes = async () => {
    try {
      setLoading(true);
      const res: any = await homeAPI.getHomes().catch(() => ({ items: [] }));
      const items = res.items || res || [];
      const defaultHomes = items.length > 0 ? items : [
        { id: 'home1', name: '我的家', address: '北京市朝阳区', members: [{ id: 'u1', email: 'demo@example.com', role: 'owner', name: 'demo' }], createdAt: '2024-01-01' },
      ];
      setHomes(defaultHomes);
      if (defaultHomes.length > 0 && !currentHome) {
        setCurrentHome(defaultHomes[0]);
        loadRooms(defaultHomes[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async (homeId: string) => {
    try {
      const res: any = await homeAPI.getRoomsWithDevices(homeId).catch(() => []);
      const defaultRooms = Array.isArray(res) && res.length > 0 ? res : [
        { id: 'r1', name: '客厅', icon: '🛋️', devicesCount: 8 },
        { id: 'r2', name: '主卧', icon: '🛏️', devicesCount: 5 },
        { id: 'r3', name: '次卧', icon: '🛏️', devicesCount: 3 },
        { id: 'r4', name: '书房', icon: '📚', devicesCount: 4 },
        { id: 'r5', name: '厨房', icon: '🍳', devicesCount: 2 },
        { id: 'r6', name: '卫生间', icon: '🚿', devicesCount: 1 },
        { id: 'r7', name: '阳台', icon: '🌿', devicesCount: 2 },
      ];
      setRooms(defaultRooms);
    } catch {
      setRooms([]);
    }
  };

  const handleCreateHome = async (values: any) => {
    try {
      const res: any = await homeAPI.createHome(values);
      message.success('家庭已创建');
      setHomeModal(false);
      homeForm.resetFields();
      loadHomes();
    } catch (err: any) {
      message.error(err.message || '创建失败');
    }
  };

  const handleCreateRoom = async (values: any) => {
    try {
      await homeAPI.createRoom(currentHome.id, values);
      message.success('房间已创建');
      setRoomModal(false);
      roomForm.resetFields();
      loadRooms(currentHome.id);
    } catch (err: any) {
      message.error(err.message || '创建失败');
    }
  };

  const handleAddMember = async (values: any) => {
    try {
      await homeAPI.addMember(currentHome.id, values);
      message.success('成员已添加');
      setMemberModal(false);
      memberForm.resetFields();
      loadHomes();
    } catch (err: any) {
      message.error(err.message || '添加失败');
    }
  };

  const handleRemoveMember = (member: any) => {
    modal.confirm({
      title: `确认移除成员 ${member.email || member.name}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await homeAPI.removeMember(currentHome.id, member.id);
          message.success('已移除');
          loadHomes();
        } catch (err: any) {
          message.error(err.message || '移除失败');
        }
      },
    });
  };

  const handleDeleteRoom = (room: any) => {
    modal.confirm({
      title: `确认删除房间"${room.name}"？`,
      content: '房间下的设备将变为未分配状态',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await homeAPI.deleteRoom(room.id);
          message.success('已删除');
          loadRooms(currentHome.id);
        } catch (err: any) {
          message.error(err.message || '删除失败');
        }
      },
    });
  };

  const selectHome = (home: any) => {
    setCurrentHome(home);
    loadRooms(home.id);
  };

  const roleColors: Record<string, string> = { owner: 'red', admin: 'blue', member: 'default' };
  const roleLabels: Record<string, string> = { owner: '所有者', admin: '管理员', member: '成员' };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 500 }}>家庭管理</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadHomes}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setHomeModal(true)}>
            新建家庭
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={6}>
          <Card title="家庭列表" size="small" loading={loading}>
            {homes.length === 0 ? (
              <Empty description="暂无家庭" />
            ) : (
              <List
                dataSource={homes}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      background: currentHome?.id === item.id ? '#e6f4ff' : 'transparent',
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: 'pointer',
                      padding: '8px 12px',
                    }}
                    onClick={() => selectHome(item)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: currentHome?.id === item.id ? '#1677ff' : '#d9d9d9' }} icon={<HomeOutlined />} />
                      }
                      title={item.name}
                      description={
                        <Space>
                          <Tag><TeamOutlined /> {item.members?.length || 0} 人</Tag>
                          <Tag><ThunderboltOutlined /> {rooms.length} 房间</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          {currentHome && (
            <Card
              title={currentHome.name}
              loading={loading}
              extra={
                <Space>
                  <Button size="small" icon={<SettingOutlined />}>编辑</Button>
                </Space>
              }
            >
              {currentHome.address && (
                <Tag style={{ marginBottom: 16 }}>📍 {currentHome.address}</Tag>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 500 }}>房间管理</span>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setRoomModal(true)}>
                  添加房间
                </Button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}>
                {rooms.map((room) => (
                  <Card
                    key={room.id}
                    size="small"
                    hoverable
                    onClick={() => navigate('/devices')}
                    style={{ borderRadius: 8 }}
                    styles={{ body: { padding: 12 } }}
                    extra={
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }}
                      />
                    }
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{room.icon || '🚪'}</div>
                    <div style={{ fontWeight: 500 }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{room.devicesCount || 0} 台设备</div>
                  </Card>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 500 }}>家庭成员</span>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setMemberModal(true)}>
                  添加成员
                </Button>
              </div>
              <List
                dataSource={currentHome.members || []}
                renderItem={(item) => (
                  <List.Item
                    actions={item.role !== 'owner' ? [
                      <Button type="text" size="small" danger onClick={() => handleRemoveMember(item)}>移除</Button>,
                    ] : []}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={item.name || item.email}
                      description={item.email || item.phone}
                    />
                    <Tag color={roleColors[item.role] || 'default'}>{roleLabels[item.role] || item.role}</Tag>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Modal title="新建家庭" open={homeModal} onCancel={() => setHomeModal(false)} footer={null}>
        <Form form={homeForm} layout="vertical" onFinish={handleCreateHome}>
          <Form.Item name="name" label="家庭名称" rules={[{ required: true }]}>
            <Input placeholder="如：我的家" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加房间" open={roomModal} onCancel={() => setRoomModal(false)} footer={null}>
        <Form form={roomForm} layout="vertical" onFinish={handleCreateRoom}>
          <Form.Item name="name" label="房间名称" rules={[{ required: true }]}>
            <Input placeholder="如：客厅" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select placeholder="选择图标">
              <Option value="🛋️">🛋️ 客厅</Option>
              <Option value="🛏️">🛏️ 卧室</Option>
              <Option value="📚">📚 书房</Option>
              <Option value="🍳">🍳 厨房</Option>
              <Option value="🚿">🚿 卫生间</Option>
              <Option value="🌿">🌿 阳台</Option>
              <Option value="🍽️">🍽️ 餐厅</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加家庭成员" open={memberModal} onCancel={() => setMemberModal(false)} footer={null}>
        <Form form={memberForm} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="emailOrPhone" label="邮箱或手机号" rules={[{ required: true }]}>
            <Input placeholder="输入对方的邮箱或手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]} initialValue="member">
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="member">普通成员</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>发送邀请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeManagementPage;
