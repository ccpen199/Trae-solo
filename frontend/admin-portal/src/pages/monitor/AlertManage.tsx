import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Card, Descriptions,
} from 'antd';
import { SearchOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface AlertRecord {
  id: string;
  serviceName: string;
  alertType: string;
  level: string;
  message: string;
  status: string;
  triggerValue: string;
  threshold: string;
  discoveredAt: string;
  handlerName: string;
  handleNote: string;
  handledAt: string;
}

const mockData: AlertRecord[] = [
  { id: 'ALT001', serviceName: '不动产登记服务', alertType: '可用性', level: '严重', message: '服务可用性低于95%阈值', status: '待处理', triggerValue: '95.2%', threshold: '99%', discoveredAt: '2025-06-09 09:30:00', handlerName: '', handleNote: '', handledAt: '' },
  { id: 'ALT002', serviceName: '公积金查询服务', alertType: '响应时间', level: '警告', message: '平均响应时间超过500ms', status: '处理中', triggerValue: '580ms', threshold: '500ms', discoveredAt: '2025-06-09 08:15:00', handlerName: '运维工程师A', handleNote: '', handledAt: '' },
  { id: 'ALT003', serviceName: '证照核验服务', alertType: '错误率', level: '警告', message: '错误率超过1%阈值', status: '待处理', triggerValue: '1.0%', threshold: '0.5%', discoveredAt: '2025-06-09 07:45:00', handlerName: '', handleNote: '', handledAt: '' },
  { id: 'ALT004', serviceName: '社保查询服务', alertType: 'QPS', level: '提示', message: 'QPS接近上限', status: '已处理', triggerValue: '580', threshold: '600', discoveredAt: '2025-06-08 16:00:00', handlerName: '运维工程师B', handleNote: '已扩容', handledAt: '2025-06-08 16:30:00' },
  { id: 'ALT005', serviceName: '补贴发放服务', alertType: '可用性', level: '严重', message: '服务可用性低于99%阈值', status: '已处理', triggerValue: '98.8%', threshold: '99%', discoveredAt: '2025-06-07 22:10:00', handlerName: '运维工程师A', handleNote: '数据库连接池已修复', handledAt: '2025-06-07 22:45:00' },
  { id: 'ALT006', serviceName: '医保结算服务', alertType: '响应时间', level: '提示', message: '响应时间持续升高', status: '已忽略', triggerValue: '230ms', threshold: '200ms', discoveredAt: '2025-06-07 10:00:00', handlerName: '运维工程师C', handleNote: '业务高峰期正常波动', handledAt: '2025-06-07 10:20:00' },
];

const levelColor: Record<string, string> = { '严重': 'error', '警告': 'warning', '提示': 'processing' };
const statusColor: Record<string, string> = { '待处理': 'error', '处理中': 'processing', '已处理': 'success', '已忽略': 'default' };

const AlertManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<AlertRecord | null>(null);
  const [handlingRecord, setHandlingRecord] = useState<AlertRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) =>
    item.serviceName.includes(searchText) || item.alertType.includes(searchText),
  );

  const handleView = (record: AlertRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const openHandle = (record: AlertRecord) => {
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
            ? { ...item, ...values, status: values.handleAction === 'ignore' ? '已忽略' : '已处理', handlerName: '当前用户', handledAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
            : item,
        ));
        message.success('处理成功');
      }
      setHandleVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '告警ID', dataIndex: 'id', width: 80 },
    { title: '服务名称', dataIndex: 'serviceName', width: 140 },
    { title: '告警类型', dataIndex: 'alertType', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '级别', dataIndex: 'level', width: 80, render: (v: string) => <Tag color={levelColor[v]}>{v}</Tag> },
    { title: '告警信息', dataIndex: 'message', width: 220, ellipsis: true },
    { title: '触发值', dataIndex: 'triggerValue', width: 90 },
    { title: '阈值', dataIndex: 'threshold', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '发现时间', dataIndex: 'discoveredAt', width: 170 },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: AlertRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {(record.status === '待处理' || record.status === '处理中') && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => openHandle(record)}>处理</Button>
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
            placeholder="搜索服务名称/告警类型"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
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
      <Modal title="告警详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={560}>
        {viewingRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="告警ID">{viewingRecord.id}</Descriptions.Item>
            <Descriptions.Item label="服务名称">{viewingRecord.serviceName}</Descriptions.Item>
            <Descriptions.Item label="告警类型">{viewingRecord.alertType}</Descriptions.Item>
            <Descriptions.Item label="级别">{viewingRecord.level}</Descriptions.Item>
            <Descriptions.Item label="触发值">{viewingRecord.triggerValue}</Descriptions.Item>
            <Descriptions.Item label="阈值">{viewingRecord.threshold}</Descriptions.Item>
            <Descriptions.Item label="告警信息" span={2}>{viewingRecord.message}</Descriptions.Item>
            <Descriptions.Item label="状态">{viewingRecord.status}</Descriptions.Item>
            <Descriptions.Item label="发现时间">{viewingRecord.discoveredAt}</Descriptions.Item>
            {viewingRecord.handlerName && <Descriptions.Item label="处理人">{viewingRecord.handlerName}</Descriptions.Item>}
            {viewingRecord.handleNote && <Descriptions.Item label="处理备注" span={2}>{viewingRecord.handleNote}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
      <Modal title="处理告警" open={handleVisible} onOk={submitHandle} onCancel={() => setHandleVisible(false)} width={480} destroyOnClose>
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="handleAction" label="处理方式" rules={[{ required: true, message: '请选择' }]}>
            <Select options={[{ label: '处理完成', value: 'resolve' }, { label: '忽略', value: 'ignore' }]} />
          </Form.Item>
          <Form.Item name="handleNote" label="处理备注" rules={[{ required: true, message: '请输入' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertManage;
