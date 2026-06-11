import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Popconfirm, Card, Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface DispatchRuleRecord {
  id: string;
  name: string;
  category: string;
  priority: string;
  assigneeGroup: string;
  autoAssign: boolean;
  condition: string;
  matchCount: number;
  status: number;
  createdAt: string;
}

const mockData: DispatchRuleRecord[] = [
  { id: 'DR001', name: '技术故障-高优-技术组', category: '技术故障', priority: '高', assigneeGroup: '技术组', autoAssign: true, condition: '分类=技术故障 AND 优先级=高', matchCount: 156, status: 1, createdAt: '2025-01-01 00:00:00' },
  { id: 'DR002', name: '业务异常-业务组', category: '业务异常', priority: '全部', assigneeGroup: '业务组', autoAssign: true, condition: '分类=业务异常', matchCount: 230, status: 1, createdAt: '2025-01-01 00:00:00' },
  { id: 'DR003', name: '数据异常-数据组', category: '数据异常', priority: '全部', assigneeGroup: '数据组', autoAssign: true, condition: '分类=数据异常', matchCount: 89, status: 1, createdAt: '2025-01-15 09:00:00' },
  { id: 'DR004', name: '安全事件-安全组', category: '安全事件', priority: '高', assigneeGroup: '安全组', autoAssign: true, condition: '分类=安全事件 AND 优先级=高', matchCount: 12, status: 1, createdAt: '2025-02-01 10:00:00' },
  { id: 'DR005', name: '性能问题-运维组', category: '性能问题', priority: '中', assigneeGroup: '运维组', autoAssign: false, condition: '分类=性能问题 AND 优先级>=中', matchCount: 45, status: 1, createdAt: '2025-03-01 08:00:00' },
  { id: 'DR006', name: '投诉类-客服组', category: '投诉', priority: '全部', assigneeGroup: '客服组', autoAssign: true, condition: '来源=电话投诉 OR 来源=线上反馈', matchCount: 310, status: 0, createdAt: '2025-03-15 11:00:00' },
];

const DispatchRule: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DispatchRuleRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.category.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: DispatchRuleRecord) => {
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
      const condition = `分类=${values.category}${values.priority !== '全部' ? ` AND 优先级=${values.priority}` : ''}`;
      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values, condition } : item)));
        message.success('更新成功');
      } else {
        const newRecord: DispatchRuleRecord = {
          ...values,
          id: `DR${String(data.length + 1).padStart(3, '0')}`,
          condition,
          matchCount: 0,
          status: 1,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '规则ID', dataIndex: 'id', width: 80 },
    { title: '规则名称', dataIndex: 'name', width: 180, ellipsis: true },
    { title: '工单分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    { title: '指派组', dataIndex: 'assigneeGroup', width: 100 },
    { title: '自动分派', dataIndex: 'autoAssign', width: 100, render: (v: boolean) => <Switch checked={v} size="small" disabled /> },
    { title: '匹配条件', dataIndex: 'condition', width: 250, ellipsis: true },
    { title: '匹配次数', dataIndex: 'matchCount', width: 90 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: DispatchRuleRecord) => (
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
            placeholder="搜索规则名称/分类"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增规则</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1300 }}
        />
      </Card>
      <Modal
        title={editingRecord ? '编辑分拨规则' : '新增分拨规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="工单分类" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['技术故障', '业务异常', '数据异常', '性能问题', '安全事件', '投诉'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['全部', '高', '中', '低'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="assigneeGroup" label="指派组" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['技术组', '业务组', '数据组', '安全组', '运维组', '客服组'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="autoAssign" label="自动分派" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DispatchRule;
