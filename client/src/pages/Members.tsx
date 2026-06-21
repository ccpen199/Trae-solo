import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Switch,
  message, Popconfirm, Empty, Avatar, Descriptions, Tooltip
} from 'antd';
import {
  UserAddOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, UserOutlined, KeyOutlined,
  ShareAltOutlined, PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { userApi, deviceApi } from '@/services/api';
import { formatTime, getRoleText } from '@/utils/format';
import { User, DeviceShare } from '@/types';

const { Option } = Select;

const Members: React.FC = observer(() => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [shares, setShares] = useState<DeviceShare[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'members' | 'shares'>('members');

  const [modal, setModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadMembers();
    loadShares();
  }, [page, pageSize]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await userApi.listSubAccounts({ page, pageSize });
      setMembers(res.list || []);
      setTotal(res.total || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadShares = async () => {
    try {
      const [outgoing, incoming] = await Promise.all([
        deviceApi.listOutgoingShares(),
        deviceApi.listIncomingShares()
      ]);
      setShares([...(outgoing?.list || []), ...(Array.isArray(incoming) ? incoming : incoming?.list || [])]);
    } catch (e) {}
  };

  const openModal = (member?: User) => {
    setEditingMember(member || null);
    form.resetFields();
    if (member) {
      form.setFieldsValue({
        nickname: member.nickname,
        role: member.role,
        phone: member.phone,
        status: !!member.status,
      });
    } else {
      form.setFieldsValue({
        role: 'member',
        status: true,
      });
    }
    setModal(true);
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMember) {
        await userApi.updateSubAccount(editingMember.id, {
          ...values,
          status: values.status ? 1 : 0,
        });
        message.success('更新成功');
      } else {
        if (!values.username || !values.password) {
          message.error('用户名和密码为必填项');
          return;
        }
        await userApi.createSubAccount(values);
        message.success('创建成功');
      }
      setModal(false);
      loadMembers();
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const deleteMember = async (id: number) => {
    try {
      await userApi.deleteSubAccount(id);
      message.success('已删除');
      loadMembers();
    } catch (e) {}
  };

  const memberColumns = [
    {
      title: '成员信息',
      key: 'info',
      width: 260,
      render: (_: any, r: User) => (
        <div className="flex items-center gap-3">
          <Avatar size={44} icon={<UserOutlined />} src={r.avatar} />
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-2">
              {r.nickname || r.username}
              <Tag color={
                r.role === 'owner' ? 'purple' :
                r.role === 'member' ? 'blue' : 'default'
              }>
                {getRoleText(r.role)}
              </Tag>
            </div>
            <div className="text-xs text-gray-500">@{r.username}</div>
          </div>
        </div>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_: any, r: User) => (
        <div className="text-sm space-y-0.5">
          {r.phone && <div className="flex items-center gap-1 text-gray-600"><PhoneOutlined /> {r.phone}</div>}
          {r.email && <div className="flex items-center gap-1 text-gray-600"><MailOutlined /> {r.email}</div>}
          {!r.phone && !r.email && <span className="text-gray-400 text-xs">未绑定</span>}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : 'default'}>
          {v === 1 ? '正常' : '已禁用'}
        </Tag>
      )
    },
    {
      title: '加入时间',
      dataIndex: 'created_at',
      key: 'created',
      width: 180,
      render: (v: string) => formatTime(v, 'YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: User) => (
        <Space size={4}>
          <Tooltip title="编辑信息">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => {
              Modal.confirm({
                title: '重置密码',
                content: '是否将密码重置为默认的 12345678？',
                okText: '重置',
                onOk: async () => {
                  try {
                    await userApi.updateSubAccount(r.id, {});
                    message.success('已重置，新密码为 12345678');
                  } catch (e) {}
                }
              });
            }} />
          </Tooltip>
          <Popconfirm
            title={`确认移除成员「${r.nickname || r.username}」？`}
            description="移除后该账号将无法访问您的设备与数据"
            onConfirm={() => deleteMember(r.id)}
            okText="移除"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <Card
      className="!rounded-xl"
      title={<span className="font-semibold"><TeamOutlined /> 成员与分享管理</span>}
      tabList={[
        { key: 'members', tab: <span><UserAddOutlined /> 家庭成员 ({total})</span> },
        { key: 'shares', tab: <span><ShareAltOutlined /> 分享记录 ({shares.length})</span> },
      ]}
      activeTabKey={activeTab}
      onTabChange={(k) => setActiveTab(k as any)}
      extra={activeTab === 'members' ? (
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => openModal()}>
          添加成员
        </Button>
      ) : null}
    >
      {activeTab === 'members' ? (
        <Table
          rowKey="id"
          loading={loading}
          columns={memberColumns}
          dataSource={members}
          locale={{ emptyText: <Empty description="暂无家庭成员，点击右上角添加" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 位成员`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
        />
      ) : shares.length === 0 ? (
        <Empty description="暂无分享记录" />
      ) : (
        <div className="space-y-3">
          {shares.map((s) => (
            <div key={s.id} className="p-4 border rounded-lg flex items-start gap-4 hover:bg-gray-50 transition-colors">
              <Avatar
                size={48}
                style={{ backgroundColor: '#1677ff' }}
                icon={<ShareAltOutlined />}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.device_name}</span>
                  <Tag color="geekblue">{s.device_sn}</Tag>
                  <Tag color={
                    s.permission_level === 'config' ? 'blue' :
                    s.permission_level === 'talk' ? 'orange' : 'green'
                  }>
                    {s.permission_level === 'config' ? '可配置' :
                     s.permission_level === 'talk' ? '可对讲' : '只看'}
                  </Tag>
                  {!s.status && <Tag color="default">已撤销</Tag>}
                  {s.temporary_token && <Tag color="purple">临时链接</Tag>}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  分享对象：<strong>{s.to_nickname || s.to_username || s.to_username || s.share_to_phone || (s.from_username ? '来自 ' + s.from_username : '临时访客')}</strong>
                </div>
                <div className="text-xs text-gray-400 mt-1 space-x-3">
                  <span>分享时间：{formatTime(s.created_at, 'YYYY-MM-DD HH:mm')}</span>
                  {s.expire_at && <span>有效期至：{formatTime(s.expire_at)}</span>}
                </div>
              </div>
              {s.status && s.device_name && (
                <Space>
                  <Popconfirm
                    title="撤销此分享？"
                    onConfirm={async () => {
                      try {
                        await deviceApi.revokeShare(s.id);
                        message.success('已撤销');
                        loadShares();
                      } catch (e) {}
                    }}
                    okText="撤销"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger>撤销</Button>
                  </Popconfirm>
                </Space>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingMember ? '编辑成员' : '添加家庭成员'}
        open={modal}
        onOk={submit}
        onCancel={() => setModal(false)}
        width={560}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          {!editingMember && (
            <>
              <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请设置用户名' }, { min: 3, max: 20 }]}>
                <Input placeholder="用于登录的用户名" />
              </Form.Item>
              <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请设置密码' }, { min: 8 }]}>
                <Input.Password placeholder="至少 8 位" />
              </Form.Item>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="nickname" label="昵称">
              <Input placeholder="显示名称" />
            </Form.Item>
            <Form.Item name="role" label="账号角色" rules={[{ required: true }]}>
              <Select>
                <Option value="member">家庭成员（受限查看）</Option>
                <Option value="guest">访客（临时查看权限）</Option>
              </Select>
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="可选" maxLength={11} />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input prefix={<MailOutlined />} placeholder="可选" />
            </Form.Item>
            <Form.Item name="status" label="账号状态" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
          </div>
          <div className="mt-2 text-sm bg-blue-50 p-3 rounded text-blue-800">
            💡 <strong>角色权限说明：</strong>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li><strong>家庭成员</strong>：可查看被分享的设备实时画面与录像回放</li>
              <li><strong>访客</strong>：仅可访问临时分享的设备，有时间限制</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </Card>
  );
});

export default Members;
