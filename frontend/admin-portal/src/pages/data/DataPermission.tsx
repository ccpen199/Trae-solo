import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface PermissionRecord {
  id: string;
  name: string;
  dataSource: string;
  accessType: string;
  applicant: string;
  scope: string;
  status: string;
  expireAt: string;
  createdAt: string;
}

const mockData: PermissionRecord[] = Array.from({ length: 18 }, (_, i) => ({
  id: `PERM${String(i + 1).padStart(4, '0')}`,
  name: ['社保数据查询权', '医保结算读取权', '公积金数据写入权', '户籍信息查询权', '不动产数据导出权'][i % 5],
  dataSource: ['社保局数据库', '医保局数据库', '公积金中心', '公安局数据库', '自然资源局'][i % 5],
  accessType: ['只读', '只读', '读写', '只读', '导出'][i % 5],
  applicant: ['政务服务部', '社会保障部', '财政监管部', '信息技术部', '数据资源部'][i % 5],
  scope: ['全量数据', '脱敏数据', '汇总统计', '指定字段', '全量数据'][i % 5],
  status: ['已授权', '审批中', '已过期', '已拒绝', '已授权'][i % 5],
  expireAt: dayjs().add(90 - i * 15, 'day').format('YYYY-MM-DD'),
  createdAt: dayjs().subtract(i * 5, 'day').format('YYYY-MM-DD HH:mm:ss'),
}));

const statusColor: Record<string, string> = {
  '已授权': 'success', '审批中': 'processing', '已过期': 'default', '已拒绝': 'error',
};

const DataPermission: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PermissionRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.applicant.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PermissionRecord) => {
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
        const newRecord: PermissionRecord = {
          ...values,
          id: `PERM${String(data.length + 1).padStart(4, '0')}`,
          status: '审批中',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('申请已提交');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '权限ID', dataIndex: 'id', width: 110 },
    { title: '权限名称', dataIndex: 'name', width: 150 },
    { title: '数据源', dataIndex: 'dataSource', width: 130 },
    { title: '访问类型', dataIndex: 'accessType', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '申请部门', dataIndex: 'applicant', width: 110 },
    { title: '数据范围', dataIndex: 'scope', width: 100 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '到期时间', dataIndex: 'expireAt', width: 120 },
    { title: '申请时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: PermissionRecord) => (
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
            placeholder="搜索权限名称/申请部门"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>申请权限</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1200 }}
        />
      </Card>
      <Modal
        title={editingRecord ? '编辑权限' : '申请权限'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="权限名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dataSource" label="数据源" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['社保局数据库', '医保局数据库', '公积金中心', '公安局数据库', '自然资源局'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="accessType" label="访问类型" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['只读', '读写', '导出'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="scope" label="数据范围" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['全量数据', '脱敏数据', '汇总统计', '指定字段'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="expireAt" label="到期时间" rules={[{ required: true, message: '请选择' }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataPermission;
