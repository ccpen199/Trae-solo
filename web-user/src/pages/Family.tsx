import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Dropdown,
  MenuProps,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  message,
  Avatar,
  List,
  Divider,
  Tooltip,
} from 'antd';
import {
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  UserX,
  Crown,
  Shield,
  User,
  Eye,
  Phone,
  Mail,
  Calendar,
  Info,
  Check,
} from 'lucide-react';
import type { FamilyMember } from '@/types';

const { Option } = Select;

const mockMembers: FamilyMember[] = [
  {
    id: '1',
    name: '张三',
    avatar: 'https://picsum.photos/seed/user1/100/100',
    role: 'owner',
    permissions: ['all'],
    joinTime: '2023-06-15',
  },
  {
    id: '2',
    name: '李四',
    avatar: 'https://picsum.photos/seed/user2/100/100',
    role: 'admin',
    permissions: ['device:view', 'device:control', 'alert:view', 'scene:manage'],
    joinTime: '2023-08-20',
  },
  {
    id: '3',
    name: '王五',
    avatar: 'https://picsum.photos/seed/user3/100/100',
    role: 'member',
    permissions: ['device:view', 'alert:view'],
    joinTime: '2023-10-10',
  },
  {
    id: '4',
    name: '赵六',
    avatar: 'https://picsum.photos/seed/user4/100/100',
    role: 'viewer',
    permissions: ['device:view'],
    joinTime: '2024-01-05',
  },
];

const roleMap: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  owner: {
    label: '所有者',
    color: 'gold',
    icon: <Crown size={14} />,
    description: '拥有家庭所有权限，可管理所有设备和成员',
  },
  admin: {
    label: '管理员',
    color: 'blue',
    icon: <Shield size={14} />,
    description: '可管理设备、场景和告警，可邀请成员',
  },
  member: {
    label: '成员',
    color: 'green',
    icon: <User size={14} />,
    description: '可查看设备和告警，可控制部分设备',
  },
  viewer: {
    label: '查看者',
    color: 'purple',
    icon: <Eye size={14} />,
    description: '仅可查看设备实时画面和告警，无控制权',
  },
};

const permissionsMap: Record<string, string> = {
  'device:view': '查看设备',
  'device:control': '控制设备',
  'alert:view': '查看告警',
  'alert:manage': '管理告警',
  'scene:manage': '管理场景',
  'family:manage': '管理家庭',
  'storage:manage': '管理存储',
  'all': '所有权限',
};

export default function Family() {
  const [members, setMembers] = useState<FamilyMember[]>(mockMembers);
  const [loading, setLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [form] = Form.useForm();

  const handleInvite = () => {
    setEditingMember(null);
    form.resetFields();
    setInviteModalVisible(true);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    form.setFieldsValue({
      name: member.name,
      role: member.role,
      phone: '',
      email: '',
    });
    setEditModalVisible(true);
  };

  const handleRemove = (member: FamilyMember) => {
    Modal.confirm({
      title: '确认移除',
      content: `确定要移除成员「${member.name}」吗？移除后该成员将无法访问家庭设备。`,
      okText: '确认移除',
      okButtonProps: { danger: true },
      onOk: () => {
        setMembers(members.filter(m => m.id !== member.id));
        message.success('成员已移除');
      },
    });
  };

  const handleInviteSubmit = (values: any) => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: values.name,
      avatar: `https://picsum.photos/seed/user${Date.now()}/100/100`,
      role: values.role,
      permissions: [],
      joinTime: new Date().toISOString().split('T')[0],
    };
    setMembers([...members, newMember]);
    message.success('邀请已发送');
    setInviteModalVisible(false);
    form.resetFields();
  };

  const handleEditSubmit = (values: any) => {
    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...values } : m));
      message.success('成员信息已更新');
      setEditModalVisible(false);
    }
  };

  const getMenuItems = (member: FamilyMember): MenuProps['items'] => {
    if (member.role === 'owner') {
      return [
        {
          key: 'edit',
          icon: <Edit size={14} />,
          label: '编辑信息',
          onClick: () => handleEdit(member),
        },
      ];
    }
    return [
      {
        key: 'edit',
        icon: <Edit size={14} />,
        label: '编辑角色',
        onClick: () => handleEdit(member),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'remove',
        danger: true,
        icon: <UserX size={14} />,
        label: '移除成员',
        onClick: () => handleRemove(member),
      },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">家庭管理</h1>
          <p className="text-gray-500 mt-1">共 {members.length} 位家庭成员</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleInvite}>
          邀请成员
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-xl border-0 shadow-sm" title="家庭成员">
            <Spin spinning={loading}>
              {members.length > 0 ? (
                <List
                  dataSource={members}
                  renderItem={(member) => (
                    <List.Item
                      key={member.id}
                      className="px-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size={48} src={member.avatar} className="rounded-full">
                            <User size={20} />
                          </Avatar>
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{member.name}</span>
                            <Tag color={roleMap[member.role]?.color} icon={roleMap[member.role]?.icon}>
                              {roleMap[member.role]?.label}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              加入于 {member.joinTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Check size={12} className="text-success-500" />
                              {member.permissions.length} 项权限
                            </span>
                          </div>
                        }
                      />
                      <Dropdown menu={{ items: getMenuItems(member) }} trigger={['click']}>
                        <Button type="text" icon={<MoreHorizontal size={18} />} />
                      </Dropdown>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无成员" className="py-8" />
              )}
            </Spin>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border-0 shadow-sm" title="角色说明">
            <div className="space-y-4">
              {Object.entries(roleMap).map(([key, role]) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${key === 'owner' ? 'bg-yellow-100 text-yellow-600' :
                      key === 'admin' ? 'bg-blue-100 text-blue-600' :
                      key === 'member' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'}`}>
                    {role.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{role.label}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-xl border-0 shadow-sm" title="权限说明">
            <div className="space-y-2">
              {Object.entries(permissionsMap).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-success-500 flex-shrink-0" />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
            <Divider />
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              <p>所有者拥有所有权限，管理员拥有大部分管理权限，成员可查看和控制设备，查看者只能查看。</p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title="邀请成员"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleInviteSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入成员姓名" prefix={<User size={16} className="text-gray-400" />} />
          </Form.Item>

          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="member">成员</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>

          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" prefix={<Phone size={16} className="text-gray-400" />} />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱（选填）" prefix={<Mail size={16} className="text-gray-400" />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发送邀请
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑成员"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入成员姓名" />
          </Form.Item>

          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              <Option value="owner">所有者</Option>
              <Option value="admin">管理员</Option>
              <Option value="member">成员</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
