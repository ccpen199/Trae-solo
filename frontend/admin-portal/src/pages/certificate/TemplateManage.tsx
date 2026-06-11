import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Popconfirm, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface TemplateRecord {
  id: string;
  name: string;
  certType: string;
  fields: string[];
  version: string;
  status: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const mockData: TemplateRecord[] = [
  { id: 'TPL001', name: '身份证模板', certType: '身份证', fields: ['姓名', '性别', '民族', '出生日期', '住址', '证件号'], version: 'v2.0', status: 1, usageCount: 15680, createdAt: '2025-01-01 00:00:00', updatedAt: '2025-05-20 10:00:00' },
  { id: 'TPL002', name: '营业执照模板', certType: '营业执照', fields: ['企业名称', '统一社会信用代码', '法定代表人', '注册资本', '经营范围'], version: 'v1.5', status: 1, usageCount: 8920, createdAt: '2025-01-15 09:00:00', updatedAt: '2025-05-18 14:00:00' },
  { id: 'TPL003', name: '结婚证模板', certType: '结婚证', fields: ['男方姓名', '女方姓名', '登记日期', '证件号'], version: 'v1.2', status: 1, usageCount: 3450, createdAt: '2025-02-01 08:00:00', updatedAt: '2025-05-10 09:00:00' },
  { id: 'TPL004', name: '房产证模板', certType: '房产证', fields: ['权利人', '不动产单元号', '坐落', '面积', '用途'], version: 'v1.0', status: 1, usageCount: 5230, createdAt: '2025-03-01 10:00:00', updatedAt: '2025-04-28 16:00:00' },
  { id: 'TPL005', name: '驾驶证模板', certType: '驾驶证', fields: ['姓名', '证件号', '准驾车型', '有效期始', '有效期至'], version: 'v1.3', status: 0, usageCount: 6780, createdAt: '2025-03-15 11:00:00', updatedAt: '2025-06-01 08:00:00' },
];

const TemplateManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TemplateRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => item.name.includes(searchText) || item.certType.includes(searchText));

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: TemplateRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({ ...record, fields: record.fields.join(',') });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const fieldsArr = typeof values.fields === 'string' ? values.fields.split(',').map((s: string) => s.trim()) : values.fields;
      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values, fields: fieldsArr, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } : item)));
        message.success('更新成功');
      } else {
        const newRecord: TemplateRecord = {
          ...values,
          id: `TPL${String(data.length + 1).padStart(3, '0')}`,
          fields: fieldsArr,
          status: 1,
          usageCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '模板ID', dataIndex: 'id', width: 90 },
    { title: '模板名称', dataIndex: 'name', width: 140 },
    { title: '证照类型', dataIndex: 'certType', width: 110 },
    { title: '字段列表', dataIndex: 'fields', width: 280, render: (v: string[]) => v.map((f) => <Tag key={f}>{f}</Tag>) },
    { title: '版本', dataIndex: 'version', width: 70 },
    { title: '使用次数', dataIndex: 'usageCount', width: 90 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: unknown, record: TemplateRecord) => (
        <Space>
          <Button type="link" size="small" icon={<CopyOutlined />}>复制</Button>
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
            placeholder="搜索模板名称/证照类型"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增模板</Button>
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
        title={editingRecord ? '编辑模板' : '新增模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="certType" label="证照类型" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['身份证', '营业执照', '结婚证', '房产证', '驾驶证'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="fields" label="字段列表" rules={[{ required: true, message: '请输入' }]} extra="多个字段用英文逗号分隔">
            <Input.TextArea rows={3} placeholder="姓名,性别,证件号" />
          </Form.Item>
          <Form.Item name="version" label="版本号">
            <Input placeholder="v1.0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateManage;
