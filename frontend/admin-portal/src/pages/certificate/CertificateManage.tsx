import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card, Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface CertRecord {
  id: string;
  certNumber: string;
  certType: string;
  holderName: string;
  holderIdCard: string;
  issueOrg: string;
  issueDate: string;
  expireDate: string;
  status: string;
  verifyCount: number;
}

const mockData: CertRecord[] = Array.from({ length: 22 }, (_, i) => ({
  id: `CERT${String(i + 1).padStart(5, '0')}`,
  certNumber: `GZ${String(2025000 + i)}`,
  certType: ['身份证', '营业执照', '结婚证', '房产证', '驾驶证'][i % 5],
  holderName: ['张三', '李四', '王五', '贵州XX公司', '赵六'][i % 5],
  holderIdCard: `5222${String(1990 + i).slice(2)}****${String(1000 + i * 7)}`,
  issueOrg: ['贵州省公安厅', '贵州省市场监管局', '贵州省民政厅', '贵州省自然资源厅', '贵州省交警总队'][i % 5],
  issueDate: dayjs().subtract(365 - i * 10, 'day').format('YYYY-MM-DD'),
  expireDate: dayjs().add(365 * (5 - i % 5), 'day').format('YYYY-MM-DD'),
  status: ['有效', '有效', '已过期', '有效', '已注销'][i % 5],
  verifyCount: Math.floor(Math.random() * 100),
}));

const statusColor: Record<string, string> = { '有效': 'success', '已过期': 'warning', '已注销': 'default' };

const CertificateManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CertRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<CertRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) =>
    item.certNumber.includes(searchText) || item.holderName.includes(searchText) || item.certType.includes(searchText),
  );

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: CertRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record: CertRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
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
        const newRecord: CertRecord = {
          ...values,
          id: `CERT${String(data.length + 1).padStart(5, '0')}`,
          verifyCount: 0,
          status: '有效',
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '证照ID', dataIndex: 'id', width: 110 },
    { title: '证照编号', dataIndex: 'certNumber', width: 110 },
    { title: '证照类型', dataIndex: 'certType', width: 100 },
    { title: '持有人', dataIndex: 'holderName', width: 100 },
    { title: '持有人证件号', dataIndex: 'holderIdCard', width: 160 },
    { title: '颁发机构', dataIndex: 'issueOrg', width: 150 },
    { title: '颁发日期', dataIndex: 'issueDate', width: 110 },
    { title: '有效期至', dataIndex: 'expireDate', width: 110 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '核验次数', dataIndex: 'verifyCount', width: 90 },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: CertRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
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
            placeholder="搜索证照编号/持有人/类型"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增证照</Button>
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
        title={editingRecord ? '编辑证照' : '新增证照'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="certType" label="证照类型" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['身份证', '营业执照', '结婚证', '房产证', '驾驶证'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="holderName" label="持有人" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="holderIdCard" label="证件号" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="issueOrg" label="颁发机构" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="issueDate" label="颁发日期" rules={[{ required: true, message: '请选择' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="expireDate" label="有效期至" rules={[{ required: true, message: '请选择' }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="证照详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {viewingRecord && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries({
              证照ID: viewingRecord.id,
              证照编号: viewingRecord.certNumber,
              证照类型: viewingRecord.certType,
              持有人: viewingRecord.holderName,
              证件号: viewingRecord.holderIdCard,
              颁发机构: viewingRecord.issueOrg,
              颁发日期: viewingRecord.issueDate,
              有效期至: viewingRecord.expireDate,
              状态: viewingRecord.status,
              核验次数: viewingRecord.verifyCount,
            }).map(([k, v]) => (
              <div key={k}><strong>{k}：</strong>{v}</div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManage;
