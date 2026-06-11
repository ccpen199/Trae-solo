import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface UserRecord {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  department: string;
  status: number;
  roles: string[];
  createdAt: string;
}

const mockData: UserRecord[] = Array.from({ length: 28 }, (_, i) => ({
  id: `U${String(i + 1).padStart(4, '0')}`,
  username: `user${i + 1}`,
  realName: `用户${i + 1}`,
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  email: `user${i + 1}@example.com`,
  department: ['信息技术部', '政务服务部', '数据资源部', '社会保障部', '财政监管部'][i % 5],
  status: i % 7 === 0 ? 0 : 1,
  roles: [['admin'], ['operator'], ['viewer'], ['operator', 'auditor']][i % 4],
  createdAt: dayjs().subtract(i * 3, 'day').format('YYYY-MM-DD HH:mm:ss'),
}));

const UserManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter(
    (item) =>
      item.username.includes(searchText) ||
      item.realName.includes(searchText) ||
      item.phone.includes(searchText),
  );

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: UserRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)));
        message.success('更新成功');
      } else {
        const newRecord: UserRecord = {
          ...values,
          id: `U${String(data.length + 1).padStart(4, '0')}`,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 1,
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '用户ID', dataIndex: 'id', width: 100 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '真实姓名', dataIndex: 'realName', width: 100 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '部门', dataIndex: 'department', width: 120 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (status: number) => status === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '角色', dataIndex: 'roles', width: 160,
      render: (roles: string[]) => roles.map((r) => <Tag key={r} color="blue">{r}</Tag>),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索用户名/姓名/手机号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => setSearchText('')}>重置</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
          scroll={{ x: 1300 }}
        />
      </Card>
      <Modal
        title={editingRecord ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select options={[
              { label: '信息技术部', value: '信息技术部' },
              { label: '政务服务部', value: '政务服务部' },
              { label: '数据资源部', value: '数据资源部' },
              { label: '社会保障部', value: '社会保障部' },
              { label: '财政监管部', value: '财政监管部' },
            ]} />
          </Form.Item>
          <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select mode="multiple" options={[
              { label: 'admin', value: 'admin' },
              { label: 'operator', value: 'operator' },
              { label: 'viewer', value: 'viewer' },
              { label: 'auditor', value: 'auditor' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
