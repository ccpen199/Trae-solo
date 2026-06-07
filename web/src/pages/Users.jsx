import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, Modal, Form, Spin, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { users as usersApi, departments as deptApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

const userTypeMap = {
  person: { text: '个人', color: 'blue' },
  enterprise: { text: '企业', color: 'purple' },
  staff: { text: '工作人员', color: 'orange' },
  admin: { text: '管理员', color: 'red' },
};

const roleMap = {
  admin: '管理员',
  staff: '工作人员',
  user: '普通用户',
};

export default function Users() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [userType, setUserType] = useState(undefined);
  const [role, setRole] = useState(undefined);
  const [department, setDepartment] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreate, setIsCreate] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchDepartments = async () => {
    try {
      const res = await deptApi.getDepartments();
      const d = res.data?.data || res.data || [];
      setDepartments(Array.isArray(d) ? d : []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, page_size: pagination.pageSize };
      if (keyword) params.keyword = keyword;
      if (userType) params.user_type = userType;
      if (role) params.role = role;
      if (department) params.department_id = department;
      if (status) params.status = status;
      const res = await usersApi.getUsers(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const openEdit = (record) => {
    setEditingUser(record);
    setIsCreate(false);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setIsCreate(true);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (isCreate) {
        await usersApi.updateUser('new', values);
      } else if (editingUser) {
        await usersApi.updateUser(editingUser.id, values);
      }
      message.success(isCreate ? '创建成功' : '更新成功');
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      fetchData();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '真实姓名', dataIndex: 'real_name', key: 'real_name', width: 100 },
    { title: '身份证号', dataIndex: 'id_card', key: 'id_card', width: 180 },
    {
      title: '用户类型',
      dataIndex: 'user_type',
      key: 'user_type',
      width: 100,
      render: (v) => {
        const t = userTypeMap[v] || { text: v, color: 'default' };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (v) => roleMap[v] || v || '-',
    },
    { title: '所属部门', dataIndex: 'department_name', key: 'department_name', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => (v === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 170,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={4}>
            <Input placeholder="关键词" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} prefix={<SearchOutlined />} allowClear />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select placeholder="用户类型" value={userType} onChange={setUserType} allowClear style={{ width: '100%' }}>
              {Object.entries(userTypeMap).map(([k, v]) => (
                <Option key={k} value={k}>{v.text}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select placeholder="角色" value={role} onChange={setRole} allowClear style={{ width: '100%' }}>
              {Object.entries(roleMap).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select placeholder="所属部门" value={department} onChange={setDepartment} allowClear style={{ width: '100%' }}>
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={3}>
            <Select placeholder="状态" value={status} onChange={setStatus} allowClear style={{ width: '100%' }}>
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setUserType(undefined); setRole(undefined); setDepartment(undefined); setStatus(undefined); }}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>添加用户</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize, total: pag.total })}
        />
      </Card>

      <Modal
        title={isCreate ? '添加用户' : '编辑用户'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingUser(null); }}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {isCreate && (
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          <Form.Item name="real_name" label="真实姓名">
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select placeholder="请选择角色">
              {Object.entries(roleMap).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="department_id" label="所属部门">
            <Select placeholder="请选择所属部门" allowClear>
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
