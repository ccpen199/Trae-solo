import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card, Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ApiRecord {
  id: string;
  name: string;
  path: string;
  method: string;
  category: string;
  provider: string;
  status: number;
  qpsLimit: number;
  version: string;
  updatedAt: string;
}

const mockData: ApiRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `API${String(i + 1).padStart(4, '0')}`,
  name: ['社保查询', '医保结算', '公积金查询', '户籍办理', '不动产登记', '税务申报'][i % 6],
  path: `/api/v1/${['social', 'medical', 'housing', 'household', 'estate', 'tax'][i % 6]}/${['query', 'settle', 'query', 'register', 'register', 'declare'][i % 6]}`,
  method: ['GET', 'POST', 'GET', 'POST', 'POST', 'POST'][i % 6],
  category: ['社会保障', '医疗卫生', '住房保障', '户籍管理', '不动产', '税务服务'][i % 6],
  provider: ['社保局', '医保局', '公积金中心', '公安局', '自然资源局', '税务局'][i % 6],
  status: i % 8 === 0 ? 0 : 1,
  qpsLimit: [100, 200, 150, 80, 50, 120][i % 6],
  version: `v${1 + (i % 3)}.${i % 5}.0`,
  updatedAt: dayjs().subtract(i * 2, 'day').format('YYYY-MM-DD HH:mm:ss'),
}));

const methodColor: Record<string, string> = { GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red' };

const ApiManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ApiRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.path.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ApiRecord) => {
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
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } : item)));
        message.success('更新成功');
      } else {
        const newRecord: ApiRecord = {
          ...values,
          id: `API${String(data.length + 1).padStart(4, '0')}`,
          status: 1,
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: 'API ID', dataIndex: 'id', width: 100 },
    { title: '接口名称', dataIndex: 'name', width: 120 },
    {
      title: '请求方式', dataIndex: 'method', width: 90,
      render: (v: string) => <Tag color={methodColor[v]}>{v}</Tag>,
    },
    { title: '接口路径', dataIndex: 'path', width: 260, ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '提供方', dataIndex: 'provider', width: 110 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => v === 1 ? <Badge status="success" text="已发布" /> : <Badge status="default" text="未发布" />,
    },
    { title: 'QPS限制', dataIndex: 'qpsLimit', width: 90 },
    { title: '版本', dataIndex: 'version', width: 80 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: ApiRecord) => (
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
            placeholder="搜索接口名称/路径"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增接口</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1400 }}
        />
      </Card>
      <Modal
        title={editingRecord ? '编辑接口' : '新增接口'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="接口名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="method" label="请求方式" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['GET', 'POST', 'PUT', 'DELETE'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="path" label="接口路径" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['社会保障', '医疗卫生', '住房保障', '户籍管理', '不动产', '税务服务'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="provider" label="提供方" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="qpsLimit" label="QPS限制" rules={[{ required: true, message: '请输入' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="version" label="版本号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiManage;
