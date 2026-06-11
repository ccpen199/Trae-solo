import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Popconfirm, Card, DatePicker,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface PolicyRecord {
  id: string;
  name: string;
  category: string;
  targetGroup: string;
  amount: number;
  fundSource: string;
  status: string;
  startDate: string;
  endDate: string;
  beneficiaryCount: number;
  createdAt: string;
}

const mockData: PolicyRecord[] = [
  { id: 'POL001', name: '贵州省农村低保补助', category: '社会保障', targetGroup: '农村低收入家庭', amount: 4800, fundSource: '省级财政', status: '执行中', startDate: '2025-01-01', endDate: '2025-12-31', beneficiaryCount: 125600, createdAt: '2024-12-15 09:00:00' },
  { id: 'POL002', name: '城镇居民医疗保险补贴', category: '医疗卫生', targetGroup: '城镇参保居民', amount: 600, fundSource: '中央+省级', status: '执行中', startDate: '2025-01-01', endDate: '2025-12-31', beneficiaryCount: 89000, createdAt: '2024-12-20 10:00:00' },
  { id: 'POL003', name: '创业担保贷款贴息', category: '就业创业', targetGroup: '创业者', amount: 30000, fundSource: '省级财政', status: '执行中', startDate: '2025-03-01', endDate: '2026-02-28', beneficiaryCount: 3200, createdAt: '2025-02-10 14:00:00' },
  { id: 'POL004', name: '学前教育资助', category: '教育助学', targetGroup: '困难家庭幼儿', amount: 1500, fundSource: '中央财政', status: '已暂停', startDate: '2025-01-01', endDate: '2025-06-30', beneficiaryCount: 45000, createdAt: '2024-11-30 08:00:00' },
  { id: 'POL005', name: '公租房租赁补贴', category: '住房保障', targetGroup: '住房困难家庭', amount: 3600, fundSource: '市级财政', status: '待审批', startDate: '2025-07-01', endDate: '2026-06-30', beneficiaryCount: 0, createdAt: '2025-06-01 16:00:00' },
  { id: 'POL006', name: '残疾人两项补贴', category: '社会保障', targetGroup: '残疾人群体', amount: 1200, fundSource: '中央+省级', status: '执行中', startDate: '2025-01-01', endDate: '2025-12-31', beneficiaryCount: 67000, createdAt: '2024-12-01 11:00:00' },
];

const statusColor: Record<string, string> = { '执行中': 'success', '已暂停': 'warning', '待审批': 'processing', '已结束': 'default' };

const PolicyManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PolicyRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.category.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PolicyRecord) => {
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
        const newRecord: PolicyRecord = {
          ...values,
          id: `POL${String(data.length + 1).padStart(3, '0')}`,
          status: '待审批',
          beneficiaryCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '政策ID', dataIndex: 'id', width: 80 },
    { title: '政策名称', dataIndex: 'name', width: 200, ellipsis: true },
    { title: '类别', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '目标群体', dataIndex: 'targetGroup', width: 120 },
    { title: '补贴金额(元/年)', dataIndex: 'amount', width: 130, render: (v: number) => v.toLocaleString() },
    { title: '资金来源', dataIndex: 'fundSource', width: 100 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '执行期限', width: 200, render: (_: unknown, r: PolicyRecord) => `${r.startDate} ~ ${r.endDate}` },
    { title: '受惠人数', dataIndex: 'beneficiaryCount', width: 100, render: (v: number) => v.toLocaleString() },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: PolicyRecord) => (
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
            placeholder="搜索政策名称/类别"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增政策</Button>
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
        title={editingRecord ? '编辑补贴政策' : '新增补贴政策'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="name" label="政策名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['社会保障', '医疗卫生', '就业创业', '教育助学', '住房保障'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="targetGroup" label="目标群体" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="补贴金额(元)" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fundSource" label="资金来源" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: '请选择' }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PolicyManage;
