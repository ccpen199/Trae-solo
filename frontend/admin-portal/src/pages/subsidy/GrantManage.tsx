import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Popconfirm, Card, Descriptions,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface GrantRecord {
  id: string;
  policyName: string;
  beneficiaryName: string;
  beneficiaryId: string;
  bankAccount: string;
  amount: number;
  grantDate: string;
  status: string;
  verifyStatus: string;
  remark: string;
}

const mockData: GrantRecord[] = Array.from({ length: 25 }, (_, i) => ({
  id: `GR${String(i + 1).padStart(5, '0')}`,
  policyName: ['农村低保补助', '医疗保险补贴', '创业担保贷款贴息', '学前教育资助', '残疾人两项补贴'][i % 5],
  beneficiaryName: ['王建国', '李秀英', '张明远', '陈晓红', '刘大伟'][i % 5],
  beneficiaryId: `5222${String(1990 + i).slice(2)}****${String(1000 + i * 3)}`,
  bankAccount: `622848****${String(3000 + i * 7)}`,
  amount: [400, 50, 2500, 125, 100][i % 5],
  grantDate: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
  status: ['已发放', '已发放', '待发放', '已退回', '已发放'][i % 5],
  verifyStatus: ['已核销', '待核销', '—', '—', '已核销'][i % 5],
  remark: i % 5 === 3 ? '账户信息有误，已退回' : '',
}));

const statusColor: Record<string, string> = { '已发放': 'success', '待发放': 'processing', '已退回': 'error' };
const verifyColor: Record<string, string> = { '已核销': 'success', '待核销': 'warning', '—': 'default' };

const GrantManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [detailVisible, setDetailVisible] = useState(false);
  const [grantVisible, setGrantVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<GrantRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) =>
    item.beneficiaryName.includes(searchText) || item.policyName.includes(searchText) || item.beneficiaryId.includes(searchText),
  );

  const handleView = (record: GrantRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const handleVerify = (id: string) => {
    setData(data.map((item) => item.id === id ? { ...item, verifyStatus: '已核销' } : item));
    message.success('核销成功');
  };

  const handleGrant = async () => {
    try {
      const values = await form.validateFields();
      const newRecord: GrantRecord = {
        ...values,
        id: `GR${String(data.length + 1).padStart(5, '0')}`,
        status: '待发放',
        verifyStatus: '—',
        remark: '',
        grantDate: dayjs().format('YYYY-MM-DD'),
      };
      setData([newRecord, ...data]);
      message.success('发放记录已创建');
      setGrantVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '发放ID', dataIndex: 'id', width: 100 },
    { title: '补贴政策', dataIndex: 'policyName', width: 150 },
    { title: '受益人', dataIndex: 'beneficiaryName', width: 90 },
    { title: '证件号', dataIndex: 'beneficiaryId', width: 150 },
    { title: '银行账户', dataIndex: 'bankAccount', width: 150 },
    { title: '发放金额(元)', dataIndex: 'amount', width: 110, render: (v: number) => <span style={{ color: '#1677ff', fontWeight: 600 }}>¥{v.toLocaleString()}</span> },
    { title: '发放日期', dataIndex: 'grantDate', width: 110 },
    { title: '发放状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '核销状态', dataIndex: 'verifyStatus', width: 90, render: (v: string) => <Tag color={verifyColor[v]}>{v}</Tag> },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: unknown, record: GrantRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {record.verifyStatus === '待核销' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleVerify(record.id)}>核销</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="搜索受益人/政策名称/证件号"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setGrantVisible(true); }}>新增发放</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1300 }}
        />
      </Card>
      <Modal title="发放详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={560}>
        {viewingRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="发放ID">{viewingRecord.id}</Descriptions.Item>
            <Descriptions.Item label="补贴政策">{viewingRecord.policyName}</Descriptions.Item>
            <Descriptions.Item label="受益人">{viewingRecord.beneficiaryName}</Descriptions.Item>
            <Descriptions.Item label="证件号">{viewingRecord.beneficiaryId}</Descriptions.Item>
            <Descriptions.Item label="银行账户">{viewingRecord.bankAccount}</Descriptions.Item>
            <Descriptions.Item label="发放金额">¥{viewingRecord.amount.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="发放日期">{viewingRecord.grantDate}</Descriptions.Item>
            <Descriptions.Item label="发放状态">{viewingRecord.status}</Descriptions.Item>
            <Descriptions.Item label="核销状态">{viewingRecord.verifyStatus}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{viewingRecord.remark || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <Modal title="新增发放记录" open={grantVisible} onOk={handleGrant} onCancel={() => setGrantVisible(false)} width={560} destroyOnClose>
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="policyName" label="补贴政策" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['农村低保补助', '医疗保险补贴', '创业担保贷款贴息', '学前教育资助', '残疾人两项补贴'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="beneficiaryName" label="受益人" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="beneficiaryId" label="证件号" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="bankAccount" label="银行账户" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="发放金额(元)" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GrantManage;
