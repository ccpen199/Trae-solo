import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Popconfirm, Card, Progress,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface SlaRecord {
  id: string;
  serviceName: string;
  availabilityTarget: number;
  responseTimeTarget: number;
  errorRateTarget: number;
  currentAvailability: number;
  currentResponseTime: number;
  currentErrorRate: number;
  penalty: string;
  status: number;
  createdAt: string;
}

const mockData: SlaRecord[] = [
  { id: 'SLA001', serviceName: '社保查询服务', availabilityTarget: 99.9, responseTimeTarget: 200, errorRateTarget: 0.1, currentAvailability: 99.98, currentResponseTime: 120, currentErrorRate: 0.02, penalty: '月服务费1%', status: 1, createdAt: '2025-01-01 00:00:00' },
  { id: 'SLA002', serviceName: '医保结算服务', availabilityTarget: 99.9, responseTimeTarget: 300, errorRateTarget: 0.5, currentAvailability: 99.95, currentResponseTime: 230, currentErrorRate: 0.05, penalty: '月服务费2%', status: 1, createdAt: '2025-01-01 00:00:00' },
  { id: 'SLA003', serviceName: '公积金查询服务', availabilityTarget: 99.5, responseTimeTarget: 500, errorRateTarget: 1.0, currentAvailability: 98.5, currentResponseTime: 580, currentErrorRate: 1.5, penalty: '月服务费3%', status: 1, createdAt: '2025-01-15 09:00:00' },
  { id: 'SLA004', serviceName: '不动产登记服务', availabilityTarget: 99.0, responseTimeTarget: 1000, errorRateTarget: 2.0, currentAvailability: 95.2, currentResponseTime: 1200, currentErrorRate: 4.8, penalty: '月服务费5%', status: 1, createdAt: '2025-02-01 08:00:00' },
  { id: 'SLA005', serviceName: '补贴发放服务', availabilityTarget: 99.9, responseTimeTarget: 300, errorRateTarget: 0.5, currentAvailability: 99.9, currentResponseTime: 180, currentErrorRate: 0.1, penalty: '月服务费2%', status: 1, createdAt: '2025-02-15 10:00:00' },
];

const SlaManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SlaRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.serviceName.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: SlaRecord) => {
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
        const newRecord: SlaRecord = {
          ...values,
          id: `SLA${String(data.length + 1).padStart(3, '0')}`,
          currentAvailability: 100,
          currentResponseTime: 0,
          currentErrorRate: 0,
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
    { title: 'SLA ID', dataIndex: 'id', width: 90 },
    { title: '服务名称', dataIndex: 'serviceName', width: 140 },
    { title: '可用性目标(%)', dataIndex: 'availabilityTarget', width: 120, render: (v: number) => `${v}%` },
    {
      title: '当前可用性', dataIndex: 'currentAvailability', width: 130,
      render: (v: number, r: SlaRecord) => (
        <Progress
          percent={v}
          size="small"
          status={v >= r.availabilityTarget ? 'success' : 'exception'}
        />
      ),
    },
    { title: '响应时间目标(ms)', dataIndex: 'responseTimeTarget', width: 140, render: (v: number) => `${v}ms` },
    {
      title: '当前响应时间', dataIndex: 'currentResponseTime', width: 130,
      render: (v: number, r: SlaRecord) => (
        <span style={{ color: v <= r.responseTimeTarget ? '#52c41a' : '#ff4d4f' }}>{v}ms</span>
      ),
    },
    { title: '错误率目标(%)', dataIndex: 'errorRateTarget', width: 120, render: (v: number) => `${v}%` },
    {
      title: '当前错误率', dataIndex: 'currentErrorRate', width: 120,
      render: (v: number, r: SlaRecord) => (
        <Tag color={v <= r.errorRateTarget ? 'success' : 'error'}>{v}%</Tag>
      ),
    },
    { title: '违约处罚', dataIndex: 'penalty', width: 120 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: unknown, record: SlaRecord) => (
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
            placeholder="搜索服务名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增SLA</Button>
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
        title={editingRecord ? '编辑SLA' : '新增SLA'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="serviceName" label="服务名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="availabilityTarget" label="可用性目标(%)" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber min={90} max={100} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="responseTimeTarget" label="响应时间目标(ms)" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="errorRateTarget" label="错误率目标(%)" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="penalty" label="违约处罚">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SlaManage;
