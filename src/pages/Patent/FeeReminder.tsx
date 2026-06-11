import { useState } from 'react';
import { Table, Card, Tag, Button, Drawer, Checkbox, InputNumber, Row, Col, Modal, Radio, Descriptions, Divider, theme, message } from 'antd';
import { BellOutlined, DollarOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined, WarningOutlined, AuditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface FeeRecord {
  id: string;
  patentName: string;
  patentNumber: string;
  feeYear: number;
  feeAmount: number;
  dueDate: string;
  status: '待缴费' | '已缴费' | '已逾期' | '即将到期';
}

interface PaymentConfirmation {
  id: string;
  patentNumber: string;
  feeAmount: number;
  paymentDate: string;
  receiptStatus: '已回执' | '待回执';
  reviewer: string;
  reviewTime: string;
  confirmationNumber: string;
  paymentTimestamp: string;
}

const statusColorMap: Record<FeeRecord['status'], string> = {
  '待缴费': 'orange',
  '已缴费': 'green',
  '已逾期': 'red',
  '即将到期': 'blue',
};

const mockFeeData: FeeRecord[] = [
  { id: '1', patentName: '一种智能土壤耕作装置', patentNumber: 'CN202410123456.7', feeYear: 2, feeAmount: 900, dueDate: '2026-06-14', status: '即将到期' },
  { id: '2', patentName: '基于深度学习的农作物种植优化方法', patentNumber: 'CN202410234567.8', feeYear: 3, feeAmount: 1200, dueDate: '2026-06-25', status: '待缴费' },
  { id: '3', patentName: '一种便携式生物信号检测仪', patentNumber: 'CN202310345678.9', feeYear: 4, feeAmount: 1200, dueDate: '2026-07-18', status: '待缴费' },
  { id: '4', patentName: '纳米靶向药物递送系统', patentNumber: 'CN202410456789.0', feeYear: 2, feeAmount: 900, dueDate: '2026-06-12', status: '即将到期' },
  { id: '5', patentName: '电动汽车无线充电系统及方法', patentNumber: 'CN202410567890.1', feeYear: 1, feeAmount: 600, dueDate: '2026-05-30', status: '已逾期' },
  { id: '6', patentName: '基于纳米材料的生物传感器', patentNumber: 'CN202310678901.2', feeYear: 5, feeAmount: 2000, dueDate: '2026-08-15', status: '待缴费' },
  { id: '7', patentName: '一种杂环化合物的合成方法', patentNumber: 'CN202410789012.3', feeYear: 2, feeAmount: 900, dueDate: '2026-06-09', status: '即将到期' },
  { id: '8', patentName: '基于Transformer的中文文本检索系统', patentNumber: 'CN202410890123.4', feeYear: 1, feeAmount: 600, dueDate: '2026-05-20', status: '已逾期' },
  { id: '9', patentName: '一种联邦学习隐私保护方法', patentNumber: 'CN202410901234.5', feeYear: 1, feeAmount: 600, dueDate: '2026-09-01', status: '待缴费' },
  { id: '10', patentName: '光谱分析检测食品中有害物质的方法', patentNumber: 'CN202310012345.6', feeYear: 6, feeAmount: 2000, dueDate: '2026-07-22', status: '待缴费' },
  { id: '11', patentName: '一种手扶式微型耕作机', patentNumber: 'CN202310123456.0', feeYear: 7, feeAmount: 3000, dueDate: '2026-04-10', status: '已逾期' },
  { id: '12', patentName: '高精度光学检测装置', patentNumber: 'CN202411001122.3', feeYear: 2, feeAmount: 900, dueDate: '2026-06-30', status: '待缴费' },
];

const mockPaymentConfirmations: PaymentConfirmation[] = [
  { id: '1', patentNumber: 'CN202410123456.7', feeAmount: 900, paymentDate: '2026-05-20', receiptStatus: '已回执', reviewer: '李助理', reviewTime: '2026-05-22 10:30', confirmationNumber: 'PAY20260520001', paymentTimestamp: '2026-05-20 14:25:33' },
  { id: '2', patentNumber: 'CN202410234567.8', feeAmount: 1200, paymentDate: '2026-05-18', receiptStatus: '已回执', reviewer: '李助理', reviewTime: '2026-05-19 09:15', confirmationNumber: 'PAY20260518002', paymentTimestamp: '2026-05-18 11:08:42' },
  { id: '3', patentNumber: 'CN202310345678.9', feeAmount: 1200, paymentDate: '2026-05-15', receiptStatus: '待回执', reviewer: '李助理', reviewTime: '-', confirmationNumber: 'PAY20260515003', paymentTimestamp: '2026-05-15 16:45:21' },
  { id: '4', patentNumber: 'CN202310678901.2', feeAmount: 2000, paymentDate: '2026-05-10', receiptStatus: '已回执', reviewer: '李助理', reviewTime: '2026-05-12 14:00', confirmationNumber: 'PAY20260510004', paymentTimestamp: '2026-05-10 09:32:17' },
  { id: '5', patentNumber: 'CN202310012345.6', feeAmount: 2000, paymentDate: '2026-04-28', receiptStatus: '已回执', reviewer: '李助理', reviewTime: '2026-04-30 11:20', confirmationNumber: 'PAY20260428005', paymentTimestamp: '2026-04-28 15:10:55' },
];

const overdueRiskPatents = [
  { id: '1', patentName: '电动汽车无线充电系统及方法', patentNumber: 'CN202410567890.1', dueDate: '2026-05-30', overdueDays: 10, feeAmount: 600 },
  { id: '2', patentName: '基于Transformer的中文文本检索系统', patentNumber: 'CN202410890123.4', dueDate: '2026-05-20', overdueDays: 20, feeAmount: 600 },
  { id: '3', patentName: '一种手扶式微型耕作机', patentNumber: 'CN202310123456.0', dueDate: '2026-04-10', overdueDays: 60, feeAmount: 3000 },
];

const PatentFeeReminder: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<FeeRecord | null>(null);
  const [reminderDays, setReminderDays] = useState(7);
  const [notifyMethods, setNotifyMethods] = useState(['email']);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payRecord, setPayRecord] = useState<FeeRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('corporate');
  const [payConfirmLoading, setPayConfirmLoading] = useState(false);
  const { token } = theme.useToken();

  const summaryCounts = {
    expiringSoon: mockFeeData.filter((d) => d.status === '即将到期').length,
    thisMonth: mockFeeData.filter((d) => d.status === '待缴费' || d.status === '即将到期').length,
    overdue: mockFeeData.filter((d) => d.status === '已逾期').length,
  };

  const handlePayClick = (record: FeeRecord) => {
    if (record.status === '已缴费') return;
    setPayRecord(record);
    setPayModalOpen(true);
  };

  const handlePayConfirm = () => {
    setPayConfirmLoading(true);
    setTimeout(() => {
      setPayConfirmLoading(false);
      setPayModalOpen(false);
      setPayRecord(null);
      message.success('代缴申请已提交成功！确认号：PAY20260609006');
    }, 1500);
  };

  const columns: ColumnsType<FeeRecord> = [
    {
      title: '专利名称',
      dataIndex: 'patentName',
      key: 'patentName',
      width: 240,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '专利号',
      dataIndex: 'patentNumber',
      key: 'patentNumber',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '年费年度',
      dataIndex: 'feeYear',
      key: 'feeYear',
      width: 90,
      align: 'center',
      render: (year: number) => <span>第{year}年</span>,
    },
    {
      title: '应缴金额',
      dataIndex: 'feeAmount',
      key: 'feeAmount',
      width: 100,
      align: 'right',
      render: (amount: number) => <span style={{ fontWeight: 600, color: token.colorPrimary }}>¥{amount.toLocaleString()}</span>,
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: '缴费状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: FeeRecord['status']) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_: unknown, record: FeeRecord) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handlePayClick(record)}
            disabled={record.status === '已缴费'}
          >
            代缴
          </Button>
          <Button
            size="small"
            icon={<BellOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setDrawerOpen(true);
            }}
          >
            设置提醒
          </Button>
        </div>
      ),
    },
  ];

  const reviewColumns: ColumnsType<PaymentConfirmation> = [
    {
      title: '专利号',
      dataIndex: 'patentNumber',
      key: 'patentNumber',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '缴费金额',
      dataIndex: 'feeAmount',
      key: 'feeAmount',
      width: 100,
      align: 'right',
      render: (amount: number) => <span style={{ fontWeight: 600, color: token.colorPrimary }}>¥{amount.toLocaleString()}</span>,
    },
    {
      title: '缴费日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 110,
    },
    {
      title: '回执状态',
      dataIndex: 'receiptStatus',
      key: 'receiptStatus',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === '已回执' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: '复核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 90,
      align: 'center',
    },
    {
      title: '复核时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 160,
    },
  ];

  const summaryCards = [
    {
      title: '即将到期（7天内）',
      count: summaryCounts.expiringSoon,
      icon: <ClockCircleOutlined style={{ fontSize: 28 }} />,
      color: '#1890ff',
      bg: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
    },
    {
      title: '本月待缴',
      count: summaryCounts.thisMonth,
      icon: <ExclamationCircleOutlined style={{ fontSize: 28 }} />,
      color: '#fa8c16',
      bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
    },
    {
      title: '已逾期',
      count: summaryCounts.overdue,
      icon: <CheckCircleOutlined style={{ fontSize: 28 }} />,
      color: '#f5222d',
      bg: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: token.colorTextHeading }}>年费代缴提醒</h2>
        <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>管理专利年费缴纳，避免因逾期导致专利失效</span>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {summaryCards.map((card) => (
          <Col span={8} key={card.title}>
            <Card
              style={{
                borderRadius: 12,
                background: card.bg,
                border: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: card.color, marginBottom: 8, fontWeight: 500 }}>{card.title}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.count}</div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>件专利</div>
                </div>
                <div style={{ color: card.color, opacity: 0.3 }}>{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="逾期风险预警"
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #ffccc7',
          background: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)',
        }}
        styles={{ header: { borderBottom: `1px solid #ffd591`, color: '#cf1322' } }}
      >
        <Row gutter={16}>
          {overdueRiskPatents.map((item) => (
            <Col span={8} key={item.id}>
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  border: '1px solid #ffccc7',
                  background: '#fff',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, flex: 1, marginRight: 8 }}>{item.patentName}</div>
                  <Tag color="red" icon={<WarningOutlined />}>逾期{item.overdueDays}天</Tag>
                </div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>专利号：{item.patentNumber}</span>
                  <span>到期日：{item.dueDate}</span>
                  <span style={{ fontWeight: 600, color: '#f5222d' }}>应缴金额：¥{item.feeAmount.toLocaleString()}</span>
                </div>
                <Button
                  type="primary"
                  danger
                  size="small"
                  block
                  style={{ marginTop: 10 }}
                  icon={<DollarOutlined />}
                  onClick={() => {
                    const record = mockFeeData.find((r) => r.patentNumber === item.patentNumber);
                    if (record) handlePayClick(record);
                  }}
                >
                  立即代缴
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={mockFeeData}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 条记录` }}
          rowClassName={(record) =>
            record.status === '已逾期' ? 'fee-row-overdue' : ''
          }
        />
      </Card>

      <Card
        title={<><AuditOutlined style={{ marginRight: 6 }} />缴费复核</>}
        style={{ borderRadius: 12, marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` }, body: { padding: 0 } }}
      >
        <Table
          columns={reviewColumns}
          dataSource={mockPaymentConfirmations}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total) => `共 ${total} 条记录` }}
        />
      </Card>

      <Modal
        title="确认代缴"
        open={payModalOpen}
        onCancel={() => {
          setPayModalOpen(false);
          setPayRecord(null);
        }}
        footer={null}
        width={480}
      >
        {payRecord && (
          <div>
            <div style={{
              padding: 16,
              background: token.colorBgLayout,
              borderRadius: 10,
              marginBottom: 20,
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{payRecord.patentName}</div>
              <Descriptions column={1} size="small" contentStyle={{ fontSize: 12 }} labelStyle={{ fontSize: 12, color: token.colorTextSecondary }}>
                <Descriptions.Item label="专利号">{payRecord.patentNumber}</Descriptions.Item>
                <Descriptions.Item label="年费年度">第{payRecord.feeYear}年</Descriptions.Item>
                <Descriptions.Item label="应缴金额">
                  <span style={{ fontWeight: 700, color: token.colorPrimary, fontSize: 16 }}>¥{payRecord.feeAmount.toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="到期日期">{payRecord.dueDate}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={statusColorMap[payRecord.status]}>{payRecord.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>付款方式</div>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <Radio value="corporate">
                  <span style={{ fontWeight: 500 }}>对公转账</span>
                  <span style={{ fontSize: 12, color: token.colorTextSecondary, marginLeft: 8 }}>通过企业银行账户转账</span>
                </Radio>
                <Radio value="online">
                  <span style={{ fontWeight: 500 }}>在线支付</span>
                  <span style={{ fontSize: 12, color: token.colorTextSecondary, marginLeft: 8 }}>支持微信/支付宝/银联</span>
                </Radio>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={payConfirmLoading}
              onClick={handlePayConfirm}
              style={{ borderRadius: 8, fontWeight: 600, height: 44 }}
            >
              确认代缴 ¥{payRecord.feeAmount.toLocaleString()}
            </Button>
          </div>
        )}
      </Modal>

      <Drawer
        title="设置缴费提醒"
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentRecord(null);
        }}
        extra={
          <Button
            type="primary"
            onClick={() => {
              message.success('提醒设置已保存');
              setDrawerOpen(false);
              setCurrentRecord(null);
            }}
          >
            保存设置
          </Button>
        }
      >
        {currentRecord && (
          <div>
            <div style={{
              padding: 16,
              background: token.colorBgLayout,
              borderRadius: 10,
              marginBottom: 24,
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{currentRecord.patentName}</div>
              <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                专利号：{currentRecord.patentNumber} · 第{currentRecord.feeYear}年年费 · ¥{currentRecord.feeAmount.toLocaleString()} · 到期：{currentRecord.dueDate}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>提前提醒天数</div>
              <InputNumber
                min={1}
                max={90}
                value={reminderDays}
                onChange={(val) => setReminderDays(val ?? 7)}
                addonAfter="天"
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 8 }}>
                在年费到期前 {reminderDays} 天发送提醒通知
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>通知方式</div>
              <Checkbox.Group
                value={notifyMethods}
                onChange={(vals) => setNotifyMethods(vals as string[])}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <Checkbox value="email">邮件通知</Checkbox>
                <Checkbox value="sms">短信通知</Checkbox>
                <Checkbox value="wechat">微信通知</Checkbox>
                <Checkbox value="system">站内消息</Checkbox>
              </Checkbox.Group>
            </div>

            <div style={{
              padding: 16,
              background: 'linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%)',
              borderRadius: 10,
              border: '1px solid #ffd591',
            }}>
              <div style={{ fontSize: 13, color: '#d46b08', fontWeight: 500, marginBottom: 4 }}>
                <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                温馨提示
              </div>
              <div style={{ fontSize: 12, color: '#ad6800', lineHeight: 1.7 }}>
                专利年费逾期超过6个月将产生滞纳金，逾期超过12个月且未补缴的专利将失效。建议及时缴纳年费或设置自动提醒。
              </div>
            </div>

            <Divider style={{ margin: '24px 0 16px 0' }} />

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>缴费确认记录</div>
              {mockPaymentConfirmations.filter((pc) => pc.patentNumber === currentRecord.patentNumber).length > 0 ? (
                mockPaymentConfirmations
                  .filter((pc) => pc.patentNumber === currentRecord.patentNumber)
                  .map((pc) => (
                    <Card
                      key={pc.id}
                      size="small"
                      style={{
                        borderRadius: 10,
                        marginBottom: 8,
                        background: token.colorBgLayout,
                      }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <Descriptions column={1} size="small" contentStyle={{ fontSize: 12 }} labelStyle={{ fontSize: 12, color: token.colorTextSecondary }}>
                        <Descriptions.Item label="确认号">{pc.confirmationNumber}</Descriptions.Item>
                        <Descriptions.Item label="缴费时间">{pc.paymentTimestamp}</Descriptions.Item>
                        <Descriptions.Item label="回执状态">
                          <Tag color={pc.receiptStatus === '已回执' ? 'green' : 'orange'}>{pc.receiptStatus}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="复核人">{pc.reviewer}</Descriptions.Item>
                        <Descriptions.Item label="复核时间">{pc.reviewTime}</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))
              ) : (
                <span style={{ fontSize: 12, color: token.colorTextSecondary }}>暂无缴费确认记录</span>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <style>{`
        .fee-row-overdue {
          background: #fff1f0 !important;
        }
        .fee-row-overdue:hover > td {
          background: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default PatentFeeReminder;
