import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Card, Descriptions, Statistic, Row, Col,
} from 'antd';
import { SearchOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface RiskRecord {
  id: string;
  policyName: string;
  riskType: string;
  riskLevel: string;
  description: string;
  targetName: string;
  targetId: string;
  status: string;
  discoveredAt: string;
  handlerName: string;
  handleResult: string;
}

const mockData: RiskRecord[] = [
  { id: 'RW001', policyName: '农村低保补助', riskType: '重复领取', riskLevel: '高', description: '同一身份证号在不同区县重复领取低保补助', targetName: '张某某', targetId: '5222***1234', status: '待处理', discoveredAt: '2025-06-08 08:30:00', handlerName: '', handleResult: '' },
  { id: 'RW002', policyName: '医疗保险补贴', riskType: '金额异常', riskLevel: '中', description: '单次发放金额超出政策标准200%', targetName: '李某某', targetId: '5222***5678', status: '处理中', discoveredAt: '2025-06-07 14:20:00', handlerName: '王审计员', handleResult: '' },
  { id: 'RW003', policyName: '创业担保贷款贴息', riskType: '身份冒用', riskLevel: '高', description: '贷款申请人身份信息与公安系统不匹配', targetName: '陈某某', targetId: '5222***9012', status: '已处理', discoveredAt: '2025-06-05 09:15:00', handlerName: '赵审计员', handleResult: '已冻结账户，移交公安机关' },
  { id: 'RW004', policyName: '残疾人两项补贴', riskType: '资格不符', riskLevel: '低', description: '受益人残疾等级与补贴标准不符', targetName: '刘某某', targetId: '5222***3456', status: '已处理', discoveredAt: '2025-06-04 11:00:00', handlerName: '孙审计员', handleResult: '已调整补贴标准' },
  { id: 'RW005', policyName: '农村低保补助', riskType: '频次异常', riskLevel: '中', description: '同一账户单日收到3次以上发放', targetName: '黄某某', targetId: '5222***7890', status: '待处理', discoveredAt: '2025-06-08 10:45:00', handlerName: '', handleResult: '' },
  { id: 'RW006', policyName: '学前教育资助', riskType: '重复领取', riskLevel: '高', description: '同一幼儿在多所幼儿园重复申请资助', targetName: '周某某', targetId: '5222***2345', status: '处理中', discoveredAt: '2025-06-06 16:30:00', handlerName: '钱审计员', handleResult: '' },
];

const levelColor: Record<string, string> = { '高': 'error', '中': 'warning', '低': 'success' };
const statusColor: Record<string, string> = { '待处理': 'error', '处理中': 'processing', '已处理': 'success' };

const RiskWarning: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<RiskRecord | null>(null);
  const [handlingRecord, setHandlingRecord] = useState<RiskRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) =>
    item.targetName.includes(searchText) || item.policyName.includes(searchText) || item.riskType.includes(searchText),
  );

  const pendingCount = data.filter((i) => i.status === '待处理').length;
  const processingCount = data.filter((i) => i.status === '处理中').length;
  const highLevelCount = data.filter((i) => i.riskLevel === '高').length;

  const handleView = (record: RiskRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const openHandle = (record: RiskRecord) => {
    setHandlingRecord(record);
    form.resetFields();
    setHandleVisible(true);
  };

  const submitHandle = async () => {
    try {
      const values = await form.validateFields();
      if (handlingRecord) {
        setData(data.map((item) =>
          item.id === handlingRecord.id
            ? { ...item, ...values, status: '已处理', handlerName: '当前用户' }
            : item,
        ));
        message.success('处理成功');
      }
      setHandleVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '预警ID', dataIndex: 'id', width: 80 },
    { title: '关联政策', dataIndex: 'policyName', width: 140 },
    { title: '风险类型', dataIndex: 'riskType', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '风险等级', dataIndex: 'riskLevel', width: 90, render: (v: string) => <Tag color={levelColor[v]} icon={v === '高' ? <ExclamationCircleOutlined /> : undefined}>{v}</Tag> },
    { title: '预警描述', dataIndex: 'description', width: 240, ellipsis: true },
    { title: '涉及对象', dataIndex: 'targetName', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '发现时间', dataIndex: 'discoveredAt', width: 170 },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: RiskRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleView(record)}>详情</Button>
          {record.status !== '已处理' && (
            <Button size="small" type="primary" onClick={() => openHandle(record)}>处理</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="待处理预警" value={pendingCount} valueStyle={{ color: '#ff4d4f' }} prefix={<WarningOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="处理中" value={processingCount} valueStyle={{ color: '#1677ff' }} prefix={<ExclamationCircleOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="高风险预警" value={highLevelCount} valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} /></Card>
        </Col>
      </Row>
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="搜索对象/政策/风险类型"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1300 }}
        />
      </Card>
      <Modal title="预警详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={560}>
        {viewingRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="预警ID">{viewingRecord.id}</Descriptions.Item>
            <Descriptions.Item label="关联政策">{viewingRecord.policyName}</Descriptions.Item>
            <Descriptions.Item label="风险类型">{viewingRecord.riskType}</Descriptions.Item>
            <Descriptions.Item label="风险等级">{viewingRecord.riskLevel}</Descriptions.Item>
            <Descriptions.Item label="涉及对象">{viewingRecord.targetName}</Descriptions.Item>
            <Descriptions.Item label="证件号">{viewingRecord.targetId}</Descriptions.Item>
            <Descriptions.Item label="预警描述" span={2}>{viewingRecord.description}</Descriptions.Item>
            <Descriptions.Item label="状态">{viewingRecord.status}</Descriptions.Item>
            <Descriptions.Item label="发现时间">{viewingRecord.discoveredAt}</Descriptions.Item>
            {viewingRecord.handlerName && <Descriptions.Item label="处理人">{viewingRecord.handlerName}</Descriptions.Item>}
            {viewingRecord.handleResult && <Descriptions.Item label="处理结果" span={2}>{viewingRecord.handleResult}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
      <Modal title="处理预警" open={handleVisible} onOk={submitHandle} onCancel={() => setHandleVisible(false)} width={480} destroyOnClose>
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="handleResult" label="处理结果" rules={[{ required: true, message: '请输入处理结果' }]}>
            <Input.TextArea rows={4} placeholder="请描述处理措施和结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RiskWarning;
