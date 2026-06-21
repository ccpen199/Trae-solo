import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MoreHorizontal,
  Shield,
  Search,
  Edit,
  Trash2,
  UserCheck,
  Crown,
  Briefcase,
  Scale,
} from 'lucide-react';
import {
  Tree,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Avatar,
  Dropdown,
  Tabs,
  Switch,
  message,
  Card,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  roleKey: string;
  department: string;
  departmentId: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
}

const mockMembers: TeamMember[] = [
  { id: 'u-001', name: '张明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming', role: '高级合伙人', roleKey: 'partner', department: '诉讼部', departmentId: 'dept-1', phone: '13800138000', email: 'zhangming@justicelaw.com', status: 'active', joinedAt: '2018-06-15' },
  { id: 'u-002', name: '李静', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lijing', role: '合伙人', roleKey: 'partner', department: '公司部', departmentId: 'dept-2', phone: '13900139001', email: 'lijing@justicelaw.com', status: 'active', joinedAt: '2019-03-10' },
  { id: 'u-003', name: '王建国', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo', role: '资深律师', roleKey: 'senior_lawyer', department: '诉讼部', departmentId: 'dept-1', phone: '13700137002', email: 'wangjianguo@justicelaw.com', status: 'active', joinedAt: '2020-08-20' },
  { id: 'u-004', name: '陈晓峰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenxiaofeng', role: '律师', roleKey: 'lawyer', department: '知识产权部', departmentId: 'dept-3', phone: '13600136003', email: 'chenxiaofeng@justicelaw.com', status: 'active', joinedAt: '2021-05-15' },
  { id: 'u-005', name: '刘芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang', role: '律师', roleKey: 'lawyer', department: '公司部', departmentId: 'dept-2', phone: '13500135004', email: 'liufang@justicelaw.com', status: 'active', joinedAt: '2022-01-10' },
  { id: 'u-006', name: '赵磊', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei', role: '律师助理', roleKey: 'paralegal', department: '诉讼部', departmentId: 'dept-1', phone: '13400134005', email: 'zhaolei@justicelaw.com', status: 'active', joinedAt: '2023-03-01' },
  { id: 'u-007', name: '孙雪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunxue', role: '律师助理', roleKey: 'paralegal', department: '知识产权部', departmentId: 'dept-3', phone: '13300133006', email: 'sunxue@justicelaw.com', status: 'pending', joinedAt: '2024-03-15' },
  { id: 'u-008', name: '周强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouqiang', role: '行政主管', roleKey: 'admin', department: '行政部', departmentId: 'dept-4', phone: '13200132007', email: 'zhouqiang@justicelaw.com', status: 'active', joinedAt: '2020-11-20' },
  { id: 'u-009', name: '吴敏', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wumin', role: '财务专员', roleKey: 'finance', department: '财务部', departmentId: 'dept-5', phone: '13100131008', email: 'wumin@justicelaw.com', status: 'active', joinedAt: '2021-09-05' },
  { id: 'u-010', name: '郑浩', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhenghao', role: '律师', roleKey: 'lawyer', department: '诉讼部', departmentId: 'dept-1', phone: '13000130009', email: 'zhenghao@justicelaw.com', status: 'inactive', joinedAt: '2019-07-12' },
];

const departments = [
  { id: 'dept-1', name: '诉讼部', members: 4, icon: <Scale className="w-4 h-4" /> },
  { id: 'dept-2', name: '公司部', members: 2, icon: <Briefcase className="w-4 h-4" /> },
  { id: 'dept-3', name: '知识产权部', members: 2, icon: <Shield className="w-4 h-4" /> },
  { id: 'dept-4', name: '行政部', members: 1, icon: <Building2 className="w-4 h-4" /> },
  { id: 'dept-5', name: '财务部', members: 1, icon: <Users className="w-4 h-4" /> },
];

const roleOptions = [
  { value: 'partner', label: '合伙人' },
  { value: 'senior_lawyer', label: '资深律师' },
  { value: 'lawyer', label: '律师' },
  { value: 'paralegal', label: '律师助理' },
  { value: 'admin', label: '行政人员' },
  { value: 'finance', label: '财务人员' },
];

const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));

const statusConfig: Record<TeamMember['status'], { label: string; color: string; dot: string }> = {
  active: { label: '在职', color: 'success', dot: 'bg-green-500' },
  inactive: { label: '离职', color: 'default', dot: 'bg-neutral-ink-400' },
  pending: { label: '待激活', color: 'warning', dot: 'bg-yellow-500' },
};

const roleIconMap: Record<string, React.ReactNode> = {
  partner: <Crown className="w-3.5 h-3.5" />,
  senior_lawyer: <UserCheck className="w-3.5 h-3.5" />,
  lawyer: <Scale className="w-3.5 h-3.5" />,
  paralegal: <Briefcase className="w-3.5 h-3.5" />,
  admin: <Building2 className="w-3.5 h-3.5" />,
  finance: <Users className="w-3.5 h-3.5" />,
};

const permissionsData = [
  { module: '案件管理', key: 'case', desc: '查看、创建、编辑案件信息', permissions: [
    { key: 'case_view', label: '查看案件' },
    { key: 'case_create', label: '创建案件' },
    { key: 'case_edit', label: '编辑案件' },
    { key: 'case_delete', label: '删除案件' },
    { key: 'case_archive', label: '归档案件' },
  ]},
  { module: '客户管理', key: 'client', desc: '管理客户信息及沟通记录', permissions: [
    { key: 'client_view', label: '查看客户' },
    { key: 'client_create', label: '添加客户' },
    { key: 'client_edit', label: '编辑客户' },
    { key: 'client_delete', label: '删除客户' },
  ]},
  { module: '财务管理', key: 'finance', desc: '收付款、发票、报销管理', permissions: [
    { key: 'finance_view', label: '查看财务' },
    { key: 'finance_create', label: '创建账单' },
    { key: 'finance_approve', label: '审批报销' },
    { key: 'finance_export', label: '导出报表' },
  ]},
  { module: '文档管理', key: 'document', desc: '合同、证据、法律文书管理', permissions: [
    { key: 'doc_view', label: '查看文档' },
    { key: 'doc_upload', label: '上传文档' },
    { key: 'doc_download', label: '下载文档' },
    { key: 'doc_delete', label: '删除文档' },
  ]},
  { module: '团队管理', key: 'team', desc: '成员、角色、权限管理', permissions: [
    { key: 'team_view', label: '查看团队' },
    { key: 'team_invite', label: '邀请成员' },
    { key: 'team_edit', label: '编辑成员' },
    { key: 'team_remove', label: '移除成员' },
    { key: 'team_permission', label: '权限配置' },
  ]},
];

const rolePermissions: Record<string, Record<string, boolean>> = {
  partner: Object.fromEntries(permissionsData.flatMap(m => m.permissions.map(p => [p.key, true]))),
  senior_lawyer: {
    case_view: true, case_create: true, case_edit: true, case_delete: false, case_archive: true,
    client_view: true, client_create: true, client_edit: true, client_delete: false,
    finance_view: true, finance_create: true, finance_approve: false, finance_export: true,
    doc_view: true, doc_upload: true, doc_download: true, doc_delete: true,
    team_view: true, team_invite: false, team_edit: false, team_remove: false, team_permission: false,
  },
  lawyer: {
    case_view: true, case_create: true, case_edit: true, case_delete: false, case_archive: false,
    client_view: true, client_create: true, client_edit: false, client_delete: false,
    finance_view: true, finance_create: false, finance_approve: false, finance_export: false,
    doc_view: true, doc_upload: true, doc_download: true, doc_delete: false,
    team_view: true, team_invite: false, team_edit: false, team_remove: false, team_permission: false,
  },
  paralegal: {
    case_view: true, case_create: false, case_edit: false, case_delete: false, case_archive: false,
    client_view: true, client_create: false, client_edit: false, client_delete: false,
    finance_view: false, finance_create: false, finance_approve: false, finance_export: false,
    doc_view: true, doc_upload: true, doc_download: true, doc_delete: false,
    team_view: true, team_invite: false, team_edit: false, team_remove: false, team_permission: false,
  },
  admin: {
    case_view: false, case_create: false, case_edit: false, case_delete: false, case_archive: false,
    client_view: false, client_create: false, client_edit: false, client_delete: false,
    finance_view: false, finance_create: false, finance_approve: false, finance_export: false,
    doc_view: true, doc_upload: true, doc_download: true, doc_delete: false,
    team_view: true, team_invite: true, team_edit: true, team_remove: false, team_permission: false,
  },
  finance: {
    case_view: true, case_create: false, case_edit: false, case_delete: false, case_archive: false,
    client_view: true, client_create: false, client_edit: false, client_delete: false,
    finance_view: true, finance_create: true, finance_approve: true, finance_export: true,
    doc_view: true, doc_upload: true, doc_download: true, doc_delete: false,
    team_view: true, team_invite: false, team_edit: false, team_remove: false, team_permission: false,
  },
};

const Team: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState('lawyer');
  const [form] = Form.useForm();

  const buildTreeData = (): DataNode[] => {
    const deptMembers: Record<string, TeamMember[]> = {};
    mockMembers.forEach(m => {
      if (!deptMembers[m.departmentId]) deptMembers[m.departmentId] = [];
      deptMembers[m.departmentId].push(m);
    });

    return departments.map(dept => ({
      key: dept.id,
      title: (
        <div className="flex items-center gap-2 py-1">
          <Building2 className="w-4 h-4 text-primary-500" />
          <span className="font-medium text-neutral-ink-800">{dept.name}</span>
          <Tag className="!m-0 !text-xs !py-0">{dept.members}人</Tag>
        </div>
      ),
      children: deptMembers[dept.id]?.map(m => ({
        key: m.id,
        title: (
          <div className="flex items-center gap-2 py-0.5">
            <Avatar size={20} src={m.avatar} />
            <span className="text-sm text-neutral-ink-700">{m.name}</span>
            <span className="text-xs text-neutral-ink-400">{m.role}</span>
          </div>
        ),
      })) || [],
    }));
  };

  const filteredMembers = mockMembers.filter(m => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      if (!m.name.toLowerCase().includes(kw) &&
          !m.email.toLowerCase().includes(kw) &&
          !m.phone.includes(kw)) return false;
    }
    if (filterDept !== 'all' && m.departmentId !== filterDept) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    return true;
  });

  const columns: ColumnsType<TeamMember> = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={36} src={record.avatar} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-neutral-ink-900">{record.name}</span>
              <span className="text-accent-gold">{roleIconMap[record.roleKey]}</span>
            </div>
            <span className="text-xs text-neutral-ink-500">{record.role}</span>
          </div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text) => (
        <Tag className="!m-0">{text}</Tag>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => (
        <span className="text-sm text-neutral-ink-700 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-neutral-ink-400" />
          {text}
        </span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (text) => (
        <span className="text-sm text-neutral-ink-700 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-neutral-ink-400" />
          {text}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TeamMember['status']) => {
        const config = statusConfig[status];
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={cn('w-2 h-2 rounded-full', config.dot)} />
            <span className="text-neutral-ink-700">{config.label}</span>
          </span>
        );
      },
    },
    {
      title: '入职日期',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 120,
      render: (text) => <span className="text-sm text-neutral-ink-700">{formatDate(text)}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: '编辑信息', icon: <Edit className="w-4 h-4" /> },
              { key: 'role', label: '调整角色' },
              { type: 'divider' as const },
              { key: 'remove', label: '移除成员', danger: true, icon: <Trash2 className="w-4 h-4" /> },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') message.info('编辑功能开发中');
              if (key === 'remove') message.warning('移除成员需谨慎操作');
            },
          }}
          trigger={['click']}
        >
          <button className="p-1.5 hover:bg-neutral-ink-100 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-neutral-ink-500" />
          </button>
        </Dropdown>
      ),
    },
  ];

  const handleInvite = async (values: any) => {
    message.success(`已向 ${values.email} 发送邀请邮件`);
    setInviteModalVisible(false);
    form.resetFields();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">团队管理</h1>
          <p className="text-neutral-ink-500 mt-1">管理律所成员、部门架构及权限配置</p>
        </div>
        <button
          onClick={() => setInviteModalVisible(true)}
          className="lc-btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          邀请成员
        </button>
      </div>

      <Tabs
        defaultActiveKey="members"
        items={[
          {
            key: 'members',
            label: <span className="flex items-center gap-2"><Users className="w-4 h-4" />成员列表</span>,
            children: (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lc-card border-0 lg:col-span-1">
                  <h3 className="font-serif font-semibold text-base text-neutral-ink-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    组织架构
                  </h3>
                  <Tree
                    showLine={{ showLeafIcon: false }}
                    switcherIcon={({ expanded }) =>
                      expanded ? <ChevronDown className="w-4 h-4 text-neutral-ink-400" /> : <ChevronRight className="w-4 h-4 text-neutral-ink-400" />
                    }
                    treeData={buildTreeData()}
                    defaultExpandAll
                    blockNode
                  />
                </Card>

                <div className="lg:col-span-3 space-y-4">
                  <div className="lc-card p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-ink-400" />
                          <Input
                            placeholder="搜索姓名、电话、邮箱..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="pl-10"
                            allowClear
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={filterDept}
                            onChange={setFilterDept}
                            className="w-32"
                            placeholder="选择部门"
                            allowClear
                            options={[{ value: 'all', label: '全部部门' }, ...deptOptions]}
                          />
                          <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            className="w-28"
                            placeholder="成员状态"
                            allowClear
                            options={[
                              { value: 'all', label: '全部状态' },
                              { value: 'active', label: '在职' },
                              { value: 'inactive', label: '离职' },
                              { value: 'pending', label: '待激活' },
                            ]}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-neutral-ink-500">共 {filteredMembers.length} 位成员</span>
                    </div>
                  </div>

                  <div className="lc-card">
                    <Table
                      columns={columns}
                      dataSource={filteredMembers}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 位成员`,
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'permissions',
            label: <span className="flex items-center gap-2"><Shield className="w-4 h-4" />角色与权限</span>,
            children: (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {roleOptions.map(role => (
                    <button
                      key={role.value}
                      onClick={() => setCurrentRole(role.value)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                        currentRole === role.value
                          ? 'bg-primary-900 text-white shadow-card'
                          : 'bg-white border border-neutral-ink-200 text-neutral-ink-700 hover:border-primary-300 hover:text-primary-700'
                      )}
                    >
                      {roleIconMap[role.value]}
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {permissionsData.map(module => (
                    <Card key={module.key} className="lc-card border-0">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-serif font-semibold text-base text-neutral-ink-900">{module.module}</h3>
                          <p className="text-sm text-neutral-ink-500 mt-0.5">{module.desc}</p>
                        </div>
                        <Button
                          size="small"
                          type="link"
                          onClick={() => message.info('批量设置功能开发中')}
                        >
                          全选
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {module.permissions.map(perm => (
                          <div
                            key={perm.key}
                            className="flex items-center justify-between p-3 rounded-lg bg-neutral-ink-50 hover:bg-primary-50/50 transition-colors"
                          >
                            <span className="text-sm text-neutral-ink-700">{perm.label}</span>
                            <Switch
                              checked={rolePermissions[currentRole]?.[perm.key] || false}
                              onChange={(checked) => {
                                if (!rolePermissions[currentRole]) rolePermissions[currentRole] = {};
                                rolePermissions[currentRole][perm.key] = checked;
                                message.success(`${checked ? '已授予' : '已撤销'}「${perm.label}」权限`);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={<span className="font-serif text-lg font-semibold">邀请团队成员</span>}
        open={inviteModalVisible}
        onCancel={() => {
          setInviteModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvite}
          className="mt-4"
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入成员姓名' }]}
          >
            <Input placeholder="请输入成员姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="用于发送邀请邮件" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" maxLength={11} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="角色"
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
              initialValue="lawyer"
            >
              <Select options={roleOptions} placeholder="选择角色" />
            </Form.Item>
            <Form.Item
              label="部门"
              name="department"
              rules={[{ required: true, message: '请选择部门' }]}
            >
              <Select options={deptOptions} placeholder="选择部门" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button onClick={() => {
              setInviteModalVisible(false);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700">
              发送邀请
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Team;
