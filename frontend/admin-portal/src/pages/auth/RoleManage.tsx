import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card, Tree,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  status: number;
  userCount: number;
  createdAt: string;
}

const permissionTree = [
  { title: '系统首页', key: 'dashboard' },
  {
    title: '认证管理', key: 'auth',
    children: [
      { title: '用户管理', key: 'auth:user' },
      { title: '角色管理', key: 'auth:role' },
      { title: '审计日志', key: 'auth:audit' },
    ],
  },
  {
    title: '数据共享', key: 'data',
    children: [
      { title: 'API管理', key: 'data:api' },
      { title: '数据权限', key: 'data:permission' },
      { title: '脱敏规则', key: 'data:desensitize' },
    ],
  },
  {
    title: '证照管理', key: 'certificate',
    children: [
      { title: '证照管理', key: 'certificate:manage' },
      { title: '模板管理', key: 'certificate:template' },
    ],
  },
  {
    title: '补贴监管', key: 'subsidy',
    children: [
      { title: '政策管理', key: 'subsidy:policy' },
      { title: '发放管理', key: 'subsidy:grant' },
      { title: '资金追踪', key: 'subsidy:fund' },
      { title: '风险预警', key: 'subsidy:risk' },
    ],
  },
  {
    title: '服务监控', key: 'monitor',
    children: [
      { title: '服务监控', key: 'monitor:service' },
      { title: '告警管理', key: 'monitor:alert' },
      { title: 'SLA管理', key: 'monitor:sla' },
    ],
  },
  {
    title: '诉求管理', key: 'ticket',
    children: [
      { title: '工单管理', key: 'ticket:manage' },
      { title: '分拨规则', key: 'ticket:dispatch' },
      { title: '知识库', key: 'ticket:knowledge' },
    ],
  },
];

const mockData: RoleRecord[] = [
  { id: 'R001', name: '超级管理员', code: 'admin', description: '系统最高权限', permissions: ['dashboard', 'auth', 'data', 'certificate', 'subsidy', 'monitor', 'ticket'], status: 1, userCount: 3, createdAt: '2025-01-01 00:00:00' },
  { id: 'R002', name: '运营人员', code: 'operator', description: '日常运营管理', permissions: ['dashboard', 'subsidy', 'ticket'], status: 1, userCount: 12, createdAt: '2025-01-15 10:00:00' },
  { id: 'R003', name: '审计员', code: 'auditor', description: '审计与监管', permissions: ['dashboard', 'auth:audit', 'subsidy:fund', 'subsidy:risk'], status: 1, userCount: 5, createdAt: '2025-02-01 09:00:00' },
  { id: 'R004', name: '只读用户', code: 'viewer', description: '只读查看权限', permissions: ['dashboard'], status: 1, userCount: 20, createdAt: '2025-03-01 08:00:00' },
  { id: 'R005', name: '数据管理员', code: 'data_admin', description: '数据资源管理', permissions: ['dashboard', 'data', 'certificate'], status: 0, userCount: 8, createdAt: '2025-04-01 11:00:00' },
];

const RoleManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.code.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setCheckedKeys([]);
    setModalVisible(true);
  };

  const handleEdit = (record: RoleRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setCheckedKeys(record.permissions);
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
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values, permissions: checkedKeys } : item)));
        message.success('更新成功');
      } else {
        const newRecord: RoleRecord = {
          ...values,
          id: `R${String(data.length + 1).padStart(3, '0')}`,
          permissions: checkedKeys,
          status: 1,
          userCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '角色ID', dataIndex: 'id', width: 80 },
    { title: '角色名称', dataIndex: 'name', width: 120 },
    { title: '角色编码', dataIndex: 'code', width: 120 },
    { title: '描述', dataIndex: 'description', width: 180 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (status: number) => status === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    { title: '用户数', dataIndex: 'userCount', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: RoleRecord) => (
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
          <Input
            placeholder="搜索角色名称/编码"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增角色</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
      <Modal
        title={editingRecord ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="权限配置">
            <Tree
              checkable
              checkedKeys={checkedKeys}
              onCheck={(keys) => setCheckedKeys(keys as string[])}
              treeData={permissionTree}
              defaultExpandAll
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManage;
