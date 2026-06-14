import { useState } from 'react';
import { Button, Modal, Form, Input, Select, Tree, Table, Tag, Space, Drawer, Divider, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer, StatusTag } from '@/components/common';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type MenuItem,
} from '@/services/api/system';

const dataScopeOptions = [
  { label: '全部数据', value: 'all' },
  { label: '本区域数据', value: 'region' },
  { label: '本人数据', value: 'self' },
];

const mockMenuTree: MenuItem[] = [
  {
    id: '1', name: '数据概览', code: 'dashboard', path: '/dashboard', sort: 1, type: 'menu',
    children: [
      { id: '1-1', name: '查看', code: 'dashboard:view', sort: 1, type: 'button', parentId: '1' },
    ],
  },
  {
    id: '2', name: '场所管理', code: 'place', path: '/place', sort: 2, type: 'directory',
    children: [
      { id: '2-1', name: '场所列表', code: 'place:list', path: '/place/list', sort: 1, type: 'menu', parentId: '2' },
      { id: '2-2', name: '审核管理', code: 'place:review', path: '/place/review', sort: 2, type: 'menu', parentId: '2' },
      { id: '2-3', name: '新增', code: 'place:add', sort: 3, type: 'button', parentId: '2' },
      { id: '2-4', name: '编辑', code: 'place:edit', sort: 4, type: 'button', parentId: '2' },
      { id: '2-5', name: '删除', code: 'place:delete', sort: 5, type: 'button', parentId: '2' },
    ],
  },
  {
    id: '3', name: '预约管理', code: 'reservation', path: '/reservation', sort: 3, type: 'directory',
    children: [
      { id: '3-1', name: '预约列表', code: 'reservation:list', path: '/reservation/list', sort: 1, type: 'menu', parentId: '3' },
      { id: '3-2', name: '预约配置', code: 'reservation:config', path: '/reservation/config', sort: 2, type: 'menu', parentId: '3' },
    ],
  },
  {
    id: '4', name: '核验管理', code: 'verification', path: '/verification', sort: 4, type: 'directory',
    children: [
      { id: '4-1', name: '核验记录', code: 'verification:list', path: '/verification/list', sort: 1, type: 'menu', parentId: '4' },
      { id: '4-2', name: '实名核验', code: 'verification:realname', path: '/verification/realname', sort: 2, type: 'menu', parentId: '4' },
    ],
  },
  {
    id: '5', name: '告警管理', code: 'alarm', path: '/alarm', sort: 5, type: 'directory',
    children: [
      { id: '5-1', name: '告警列表', code: 'alarm:list', path: '/alarm/list', sort: 1, type: 'menu', parentId: '5' },
      { id: '5-2', name: '处理', code: 'alarm:handle', sort: 2, type: 'button', parentId: '5' },
    ],
  },
  {
    id: '6', name: '巡检管理', code: 'inspection', path: '/inspection', sort: 6, type: 'directory',
    children: [
      { id: '6-1', name: '任务列表', code: 'inspection:list', path: '/inspection/list', sort: 1, type: 'menu', parentId: '6' },
      { id: '6-2', name: '创建任务', code: 'inspection:create', path: '/inspection/create', sort: 2, type: 'menu', parentId: '6' },
    ],
  },
  {
    id: '7', name: '数据分析', code: 'analytics', path: '/analytics', sort: 7, type: 'directory',
    children: [
      { id: '7-1', name: '经营数据', code: 'analytics:overview', path: '/analytics/overview', sort: 1, type: 'menu', parentId: '7' },
      { id: '7-2', name: '统计报表', code: 'analytics:reports', path: '/analytics/reports', sort: 2, type: 'menu', parentId: '7' },
      { id: '7-3', name: '导出', code: 'analytics:export', sort: 3, type: 'button', parentId: '7' },
    ],
  },
  {
    id: '8', name: '系统管理', code: 'system', path: '/system', sort: 8, type: 'directory',
    children: [
      { id: '8-1', name: '用户管理', code: 'system:user', path: '/system/users', sort: 1, type: 'menu', parentId: '8' },
      { id: '8-2', name: '角色权限', code: 'system:role', path: '/system/roles', sort: 2, type: 'menu', parentId: '8' },
      { id: '8-3', name: '日志审计', code: 'system:log', path: '/system/logs', sort: 3, type: 'menu', parentId: '8' },
      { id: '8-4', name: '等保配置', code: 'system:security', path: '/system/security', sort: 4, type: 'menu', parentId: '8' },
    ],
  },
];

const buildTreeData = (items: MenuItem[]): { key: string; title: React.ReactNode; children?: ReturnType<typeof buildTreeData> }[] => {
  return items.map((item) => ({
    key: item.id,
    title: (
      <span>
        {item.name}
        {item.type === 'button' && (
          <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>按钮</Tag>
        )}
        {item.type === 'directory' && (
          <Tag color="orange" style={{ marginLeft: 6, fontSize: 11 }}>目录</Tag>
        )}
        {item.type === 'menu' && (
          <Tag color="green" style={{ marginLeft: 6, fontSize: 11 }}>菜单</Tag>
        )}
      </span>
    ),
    children: item.children ? buildTreeData(item.children) : undefined,
  }));
};

const RoleManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionRole, setPermissionRole] = useState<Role | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const [form] = Form.useForm();

  const { data: roleData, refresh: refreshRoles } = useRequest(getRoleList);
  const roles = roleData?.data || [];

  const { run: doCreate, loading: creating } = useRequest(createRole, {
    manual: true,
    onSuccess: () => {
      message.success('角色创建成功');
      setModalOpen(false);
      refreshRoles();
    },
  });

  const { run: doUpdate, loading: updating } = useRequest(updateRole, {
    manual: true,
    onSuccess: () => {
      message.success('角色更新成功');
      setModalOpen(false);
      setEditingRole(null);
      refreshRoles();
    },
  });

  const { run: doUpdatePermissions, loading: updatingPermissions } = useRequest(updateRole, {
    manual: true,
    onSuccess: () => {
      message.success('权限配置保存成功');
      setDrawerOpen(false);
      setPermissionRole(null);
      refreshRoles();
    },
  });

  const { run: doDelete } = useRequest(deleteRole, {
    manual: true,
    onSuccess: () => {
      message.success('角色删除成功');
      refreshRoles();
    },
  });

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Role) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handlePermission = (record: Role) => {
    setPermissionRole(record);
    setCheckedKeys(record.permissions || []);
    setDrawerOpen(true);
  };

  const handleDelete = (record: Role) => {
    Modal.confirm({
      title: '删除角色',
      content: `确认删除角色 ${record.name}？此操作不可恢复。`,
      okType: 'danger',
      onOk: () => doDelete(record.id),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        doUpdate(editingRole.id, values);
      } else {
        doCreate(values as Omit<Role, 'id' | 'createdAt' | 'updatedAt'>);
      }
    } catch { /* validation failed */ }
  };

  const handlePermissionSave = () => {
    if (permissionRole) {
      doUpdatePermissions(permissionRole.id, { permissions: checkedKeys });
    }
  };

  const treeData = buildTreeData(mockMenuTree);

  const columns = [
    { title: '角色编码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '权限数',
      key: 'permCount',
      width: 90,
      render: (_: unknown, record: Role) => record.permissions?.length || 0,
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: () => <StatusTag status="success" text="启用" />,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: Role) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => handlePermission(record)}>
            权限
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="角色权限管理"
      subTitle="管理系统角色及菜单、按钮权限"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增角色
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={roles}
        pagination={false}
      />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRole(null); }}
        onOk={handleSubmit}
        confirmLoading={creating || updating}
        width={520}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="请输入角色编码" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item name="dataScope" label="数据范围" rules={[{ required: true, message: '请选择数据范围' }]} initialValue="all">
            <Select options={dataScopeOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`权限配置 - ${permissionRole?.name || ''}`}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setPermissionRole(null); }}
        width={480}
        extra={
          <Button type="primary" onClick={handlePermissionSave} loading={updatingPermissions}>
            保存权限
          </Button>
        }
        destroyOnClose
      >
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
          勾选菜单和按钮权限，分配给当前角色。目录节点下的菜单和按钮权限将自动关联。
        </div>
        <Divider orientation="left" style={{ fontSize: 14, margin: '12px 0' }}>菜单权限</Divider>
        <Tree
          checkable
          checkedKeys={checkedKeys}
          onCheck={(keys) => setCheckedKeys(keys as string[])}
          treeData={treeData}
          defaultExpandAll
          style={{ maxHeight: 'calc(100vh - 260px)', overflow: 'auto' }}
        />
        <Divider orientation="left" style={{ fontSize: 14, margin: '16px 0 12px' }}>已选权限</Divider>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {checkedKeys.length === 0 && (
            <span style={{ color: '#999', fontSize: 13 }}>暂未选择任何权限</span>
          )}
          {checkedKeys.map((key) => {
            const findItem = (items: MenuItem[]): MenuItem | undefined => {
              for (const item of items) {
                if (item.id === key) return item;
                if (item.children) {
                  const found = findItem(item.children);
                  if (found) return found;
                }
              }
              return undefined;
            };
            const item = findItem(mockMenuTree);
            if (!item) return null;
            return (
              <Tag
                key={key}
                closable
                onClose={() => setCheckedKeys(checkedKeys.filter((k) => k !== key))}
                color={item.type === 'button' ? 'blue' : item.type === 'menu' ? 'green' : 'orange'}
              >
                {item.name}
              </Tag>
            );
          })}
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default RoleManagement;
