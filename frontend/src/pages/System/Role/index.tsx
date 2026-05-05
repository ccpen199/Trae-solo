import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tree, Checkbox, Popconfirm, Card, Tag } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { roleApi, moduleApi } from '@/services/api';

const { Option } = Select;
const { TextArea } = Input;

const PermissionTypeMap: Record<string, string> = {
  view: '查看',
  create: '新增',
  update: '编辑',
  delete: '删除',
  all: '全部',
};

const Role: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [roleRes, moduleRes] = await Promise.all([
        roleApi.getList(),
        moduleApi.getTree(true),
      ]);
      setList(Array.isArray(roleRes) ? roleRes : (roleRes.data || []));
      setModules(Array.isArray(moduleRes) ? moduleRes : (moduleRes.data || []));
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await roleApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handlePerms = async (record: any) => {
    setSelectedRole(record);
    const perms: Record<string, string[]> = {};
    
    if (record.rolePermissions) {
      record.rolePermissions.forEach((rp: any) => {
        perms[rp.moduleId] = rp.permissions;
      });
    }
    
    setSelectedPermissions(perms);
    setPermModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await roleApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await roleApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handlePermSubmit = async () => {
    try {
      const modulePermissions = Object.entries(selectedPermissions)
        .filter(([_, perms]) => perms.length > 0)
        .map(([moduleId, permissions]) => ({ moduleId, permissions }));
      
      await roleApi.assignPermissions(selectedRole.id, modulePermissions);
      message.success('权限分配成功');
      setPermModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handlePermissionChange = (moduleId: string, checkedValues: string[]) => {
    setSelectedPermissions({
      ...selectedPermissions,
      [moduleId]: checkedValues,
    });
  };

  const buildModuleTree = (data: any[]): any[] => {
    return data.map((item) => ({
      key: item.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>{item.name}</span>
          <Checkbox.Group
            options={[
              { label: '查看', value: 'view' },
              { label: '新增', value: 'create' },
              { label: '编辑', value: 'update' },
              { label: '删除', value: 'delete' },
            ]}
            value={selectedPermissions[item.id] || []}
            onChange={(values) => handlePermissionChange(item.id, values as string[])}
          />
        </div>
      ),
      children: item.children?.length > 0 ? buildModuleTree(item.children) : undefined,
    }));
  };

  const columns = [
    { title: '角色编码', dataIndex: 'code', key: 'code' },
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '系统角色',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'blue' : 'default'}>
          {isSystem ? '系统内置' : '自定义'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (enabled ? '启用' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handlePerms(record)}
          >
            权限分配
          </Button>
          {!record.isSystem && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>角色管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <span>角色列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增角色
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="角色编码"
            rules={[{ required: true, message: '请输入角色编码' }]}
          >
            <Input placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item name="enabled" label="状态">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`权限分配 - ${selectedRole?.name || ''}`}
        open={permModalVisible}
        onOk={handlePermSubmit}
        onCancel={() => setPermModalVisible(false)}
        width={800}
      >
        <div className="tree-container">
          <Tree
            treeData={buildModuleTree(modules)}
            defaultExpandAll
            showLine={{ showLeafIcon: false }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Role;
