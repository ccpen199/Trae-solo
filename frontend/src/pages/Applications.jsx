import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { canCreate, canUpdate, canDelete, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Applications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
    loadUsers();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/applications', {
        params: { page: pagination.current, pageSize: pagination.pageSize }
      });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users/list');
      setUsers(response.data);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除应用「${record.app_name}」吗？`,
      onOk: async () => {
        try {
          await api.delete(`/applications/${record.id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/applications/${editingItem.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/applications', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '应用编码', dataIndex: 'app_code', key: 'app_code', width: 120 },
    { title: '应用名称', dataIndex: 'app_name', key: 'app_name' },
    { title: '负责人', dataIndex: 'owner_name', key: 'owner_name', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : v === 'inactive' ? 'red' : 'orange'}>
          {v === 'active' ? '启用' : v === 'inactive' ? '禁用' : '待审批'}
        </Tag>
      )
    },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {canUpdate(userRole, 'application') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete(userRole, 'application') && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">应用管理</h1>
        {canCreate(userRole, 'application') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建应用
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title={editingItem ? '编辑应用' : '新建应用'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="app_code" label="应用编码" rules={[{ required: true, message: '请输入应用编码' }]}>
            <Input placeholder="请输入应用编码" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="app_name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
            <Input placeholder="请输入应用名称" />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={3} placeholder="请输入应用描述" />
          </Form.Item>
          <Form.Item name="app_owner_id" label="应用负责人">
            <Select placeholder="请选择负责人">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.real_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {editingItem && (
            <Form.Item name="status" label="状态">
              <Select>
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Applications;
