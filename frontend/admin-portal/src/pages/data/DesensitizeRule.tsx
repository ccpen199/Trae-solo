import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface RuleRecord {
  id: string;
  name: string;
  fieldType: string;
  ruleType: string;
  pattern: string;
  example: string;
  status: number;
  applyScope: string;
  updatedAt: string;
}

const mockData: RuleRecord[] = [
  { id: 'DR001', name: '身份证号脱敏', fieldType: '身份证号', ruleType: '部分遮盖', pattern: '前3后4保留，中间*', example: '520***1234', status: 1, applyScope: '全平台', updatedAt: '2025-05-10 09:00:00' },
  { id: 'DR002', name: '手机号脱敏', fieldType: '手机号', ruleType: '部分遮盖', pattern: '前3后4保留，中间*', example: '138****5678', status: 1, applyScope: '全平台', updatedAt: '2025-05-10 09:00:00' },
  { id: 'DR003', name: '姓名脱敏', fieldType: '姓名', ruleType: '部分遮盖', pattern: '保留姓，名用*替代', example: '张**', status: 1, applyScope: '全平台', updatedAt: '2025-05-12 10:00:00' },
  { id: 'DR004', name: '银行卡号脱敏', fieldType: '银行卡号', ruleType: '部分遮盖', pattern: '前6后4保留，中间*', example: '622848****1234', status: 1, applyScope: '补贴监管', updatedAt: '2025-05-15 14:00:00' },
  { id: 'DR005', name: '地址脱敏', fieldType: '住址', ruleType: '截断', pattern: '仅保留省市', example: '贵州省贵阳市***', status: 1, applyScope: '证照管理', updatedAt: '2025-06-01 08:00:00' },
  { id: 'DR006', name: '邮箱脱敏', fieldType: '邮箱', ruleType: '部分遮盖', pattern: '前2字符+*@domain', example: 'zh***@example.com', status: 0, applyScope: '全平台', updatedAt: '2025-06-05 11:00:00' },
  { id: 'DR007', name: '金额哈希', fieldType: '金额', ruleType: '哈希', pattern: 'SHA-256哈希', example: 'a1b2c3...', status: 0, applyScope: '补贴监管', updatedAt: '2025-06-08 16:00:00' },
];

const DesensitizeRule: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RuleRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.fieldType.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: RuleRecord) => {
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
        const newRecord: RuleRecord = {
          ...values,
          id: `DR${String(data.length + 1).padStart(3, '0')}`,
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
    { title: '规则ID', dataIndex: 'id', width: 80 },
    { title: '规则名称', dataIndex: 'name', width: 140 },
    { title: '字段类型', dataIndex: 'fieldType', width: 110 },
    { title: '脱敏方式', dataIndex: 'ruleType', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '规则描述', dataIndex: 'pattern', width: 180, ellipsis: true },
    { title: '示例', dataIndex: 'example', width: 150 },
    { title: '适用范围', dataIndex: 'applyScope', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: RuleRecord) => (
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
            placeholder="搜索规则名称/字段类型"
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
        title={editingRecord ? '编辑脱敏规则' : '新增脱敏规则'}
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
          <Form.Item name="fieldType" label="字段类型" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ruleType" label="脱敏方式" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['部分遮盖', '截断', '哈希', '替换'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="pattern" label="规则描述" rules={[{ required: true, message: '请输入' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="example" label="示例">
            <Input />
          </Form.Item>
          <Form.Item name="applyScope" label="适用范围" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['全平台', '补贴监管', '证照管理', '数据共享'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DesensitizeRule;
