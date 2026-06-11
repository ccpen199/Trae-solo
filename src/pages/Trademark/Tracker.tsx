import { useState } from 'react';
import {
  Table,
  Steps,
  Drawer,
  Switch,
  Badge,
  Tag,
  Card,
  Descriptions,
  Timeline,
  Typography,
  Space,
  Button,
  Modal,
  message,
} from 'antd';
import {
  EyeOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  ExportOutlined,
  HistoryOutlined,
  SettingOutlined,
  LinkOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const statusConfig: Record<string, { color: string; badge: 'processing' | 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }> = {
  '申请提交': { color: 'default', badge: 'default', icon: <ClockCircleOutlined /> },
  '形式审查': { color: 'processing', badge: 'processing', icon: <SyncOutlined spin /> },
  '实质审查': { color: 'processing', badge: 'processing', icon: <SyncOutlined spin /> },
  '初审公告': { color: 'warning', badge: 'warning', icon: <ExclamationCircleOutlined /> },
  '注册公告': { color: 'success', badge: 'success', icon: <CheckCircleOutlined /> },
  '证书发放': { color: 'green', badge: 'success', icon: <CheckCircleOutlined /> },
  '驳回': { color: 'red', badge: 'error', icon: <ExclamationCircleOutlined /> },
};

const stepLabels = ['申请提交', '形式审查', '实质审查', '初审公告', '注册公告', '证书发放'];

interface PushRecord {
  time: string;
  trigger: string;
  event: string;
  channel: string;
}

interface TrademarkEntry {
  key: string;
  name: string;
  appNo: string;
  applicant: string;
  currentStatus: string;
  submitDate: string;
  currentStep: number;
  isRejected: boolean;
  timeline: { status: string; time: string; note: string }[];
  pushRecords: PushRecord[];
}

const mockPushRecordsMap: Record<string, PushRecord[]> = {
  '1': [
    { time: '2026-06-09 14:32', trigger: '系统自动', event: '申请已提交', channel: '已推送短信+邮件至张代理' },
    { time: '2026-06-08 10:15', trigger: '商标局', event: '形式审查通过', channel: '已推送站内信' },
  ],
  '2': [
    { time: '2026-06-07 09:20', trigger: '系统自动', event: '申请已提交', channel: '已推送短信+邮件至李经理' },
    { time: '2026-06-05 14:00', trigger: '商标局', event: '形式审查通过', channel: '已推送站内信+微信' },
    { time: '2026-06-03 11:30', trigger: '商标局', event: '实质审查通过', channel: '已推送短信+邮件+站内信' },
  ],
  '3': [
    { time: '2026-05-28 08:45', trigger: '系统自动', event: '申请已提交', channel: '已推送短信至王总' },
    { time: '2026-05-25 16:20', trigger: '商标局', event: '形式审查通过', channel: '已推送站内信' },
    { time: '2026-05-20 10:00', trigger: '商标局', event: '注册公告发布', channel: '已推送全渠道通知' },
  ],
  '4': [
    { time: '2026-06-06 13:10', trigger: '系统自动', event: '申请已提交', channel: '已推送短信+站内信' },
  ],
  '5': [
    { time: '2026-06-04 09:00', trigger: '系统自动', event: '申请已提交', channel: '已推送短信至赵律师' },
    { time: '2026-06-02 15:30', trigger: '商标局', event: '形式审查通过', channel: '已推送站内信' },
    { time: '2026-05-30 10:45', trigger: '商标局', event: '实质审查驳回', channel: '已推送短信+邮件+站内信+微信' },
  ],
  '6': [
    { time: '2026-05-15 11:00', trigger: '系统自动', event: '申请已提交', channel: '已推送短信至陈经理' },
    { time: '2026-05-10 14:30', trigger: '商标局', event: '注册公告发布', channel: '已推送全渠道通知' },
  ],
  '7': [
    { time: '2026-06-09 08:00', trigger: '系统自动', event: '申请已提交', channel: '已推送短信至刘总' },
  ],
};

const rejectionDetails: Record<string, { reason: string; lawBasis: string; suggestion: string; deadline: string }> = {
  '5': {
    reason: '申请商标"锦程服饰"与在先注册的第25类商标"锦程"（注册号：TM2021-003456）构成近似商标，容易导致相关公众对商品来源产生混淆误认。',
    lawBasis: '《商标法》第三十条：申请注册的商标，凡不符合本法有关规定或者同他人在同一种商品或者类似商品上已经注册的或者初步审定的商标相同或者近似的，由商标局驳回申请，不予公告。',
    suggestion: '建议在收到驳回通知之日起15日内向国家知识产权局提出复审申请，或考虑修改商标图样后重新申请。',
    deadline: '2026-06-24',
  },
};

const mockData: TrademarkEntry[] = [
  {
    key: '1', name: '星辰科技', appNo: 'TM2024-001256', applicant: '北京星辰科技有限公司',
    currentStatus: '实质审查', submitDate: '2024-08-15', currentStep: 2, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-08-15 09:30', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-08-22 14:00', note: '形式审查通过' },
      { status: '实质审查', time: '2024-09-10 10:15', note: '进入实质审查阶段' },
    ],
    pushRecords: mockPushRecordsMap['1'],
  },
  {
    key: '2', name: '云翼信息', appNo: 'TM2024-002389', applicant: '上海云翼信息技术有限公司',
    currentStatus: '初审公告', submitDate: '2024-05-20', currentStep: 3, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-05-20 11:00', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-05-28 16:30', note: '形式审查通过' },
      { status: '实质审查', time: '2024-07-05 09:45', note: '实质审查通过' },
      { status: '初审公告', time: '2024-08-01 10:00', note: '初审公告期3个月' },
    ],
    pushRecords: mockPushRecordsMap['2'],
  },
  {
    key: '3', name: '蓝鲸数据', appNo: 'TM2024-003012', applicant: '深圳蓝鲸数据科技有限公司',
    currentStatus: '证书发放', submitDate: '2024-01-10', currentStep: 5, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-01-10 08:00', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-01-18 11:20', note: '形式审查通过' },
      { status: '实质审查', time: '2024-03-02 14:30', note: '实质审查通过' },
      { status: '初审公告', time: '2024-04-01 09:00', note: '初审公告期满' },
      { status: '注册公告', time: '2024-07-15 10:00', note: '注册公告发布' },
      { status: '证书发放', time: '2024-08-01 15:00', note: '注册证已发放' },
    ],
    pushRecords: mockPushRecordsMap['3'],
  },
  {
    key: '4', name: '锐视传媒', appNo: 'TM2024-004567', applicant: '广州锐视传媒有限公司',
    currentStatus: '形式审查', submitDate: '2024-10-08', currentStep: 1, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-10-08 13:45', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-10-15 09:00', note: '进入形式审查阶段' },
    ],
    pushRecords: mockPushRecordsMap['4'],
  },
  {
    key: '5', name: '锦程服饰', appNo: 'TM2024-005890', applicant: '杭州锦程服饰有限公司',
    currentStatus: '驳回', submitDate: '2024-06-22', currentStep: 2, isRejected: true,
    timeline: [
      { status: '申请提交', time: '2024-06-22 10:30', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-07-01 16:00', note: '形式审查通过' },
      { status: '实质审查', time: '2024-08-20 11:00', note: '实质审查驳回，与在先商标近似' },
    ],
    pushRecords: mockPushRecordsMap['5'],
  },
  {
    key: '6', name: '味享餐饮', appNo: 'TM2024-006234', applicant: '成都味享餐饮管理有限公司',
    currentStatus: '注册公告', submitDate: '2024-03-05', currentStep: 4, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-03-05 09:00', note: '申请材料已提交' },
      { status: '形式审查', time: '2024-03-12 14:20', note: '形式审查通过' },
      { status: '实质审查', time: '2024-05-08 10:30', note: '实质审查通过' },
      { status: '初审公告', time: '2024-06-01 09:00', note: '初审公告期满，无异议' },
      { status: '注册公告', time: '2024-09-10 10:00', note: '注册公告发布' },
    ],
    pushRecords: mockPushRecordsMap['6'],
  },
  {
    key: '7', name: '华创化工', appNo: 'TM2024-007891', applicant: '南京华创化工科技有限公司',
    currentStatus: '申请提交', submitDate: '2024-11-01', currentStep: 0, isRejected: false,
    timeline: [
      { status: '申请提交', time: '2024-11-01 15:30', note: '申请材料已提交，等待形式审查' },
    ],
    pushRecords: mockPushRecordsMap['7'],
  },
];

const TrademarkTracker: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TrademarkEntry | null>(null);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    '1': true, '2': true, '3': false, '4': true, '5': false, '6': true, '7': false,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionKey, setRejectionKey] = useState<string>('');
  const [pushHistoryDrawerOpen, setPushHistoryDrawerOpen] = useState(false);
  const [channelSettings, setChannelSettings] = useState<Record<string, boolean>>({
    sms: true, email: true, internal: true, wechat: false,
  });

  const showDrawer = (record: TrademarkEntry) => {
    setCurrentRecord(record);
    setDrawerOpen(true);
  };

  const showRejectionModal = (key: string) => {
    setRejectionKey(key);
    setRejectionModalOpen(true);
  };

  const handleBatchPush = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商标');
      return;
    }
    message.success('已向 ' + selectedRowKeys.length + ' 个商标相关人员推送提醒');
  };

  const handleExport = () => {
    message.success('清单导出成功');
  };

  const columns = [
    {
      title: '商标名称', dataIndex: 'name', key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '申请号', dataIndex: 'appNo', key: 'appNo',
      render: (text: string) => <Text code>{text}</Text>,
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
    {
      title: '当前状态', dataIndex: 'currentStatus', key: 'currentStatus',
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig['申请提交'];
        return (
          <Badge status={config.badge} text={
            <Tag color={config.color} icon={config.icon} style={{ marginRight: 0 }}>{status}</Tag>
          } />
        );
      },
    },
    { title: '提交日期', dataIndex: 'submitDate', key: 'submitDate' },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: TrademarkEntry) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => showDrawer(record)}>详情</Button>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: TrademarkEntry) => (
    <div style={{ padding: '16px 48px' }}>
      <Steps
        current={record.isRejected ? -1 : record.currentStep}
        status={record.isRejected ? 'error' : 'process'}
        items={stepLabels.map((label, idx) => ({
          title: label,
          description: record.currentStep >= idx || record.isRejected
            ? record.timeline.find((t) => t.status === label)?.time || ''
            : '',
          icon: record.isRejected && label === '实质审查'
            ? <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            : undefined,
        }))}
      />
      {record.isRejected && (
        <div style={{ marginTop: 12, padding: '8px 16px', background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="danger" strong>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            驳回原因：{record.timeline[record.timeline.length - 1]?.note}
          </Text>
          <Button
            type="link"
            icon={<LinkOutlined />}
            danger
            onClick={() => showRejectionModal(record.key)}
          >
            查看驳回原因
          </Button>
        </div>
      )}
    </div>
  );

  const channelLabels: Record<string, string> = {
    sms: '短信', email: '邮件', internal: '站内信', wechat: '微信',
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>注册进度追踪</Title>
        <Space>
          <Tag color="processing">审查中: {mockData.filter((d) => !d.isRejected && d.currentStep < 5).length}</Tag>
          <Tag color="success">已注册: {mockData.filter((d) => d.currentStep === 5).length}</Tag>
          <Tag color="error">已驳回: {mockData.filter((d) => d.isRejected).length}</Tag>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleBatchPush}
              disabled={selectedRowKeys.length === 0}
            >
              批量推送提醒
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出清单
            </Button>
            {selectedRowKeys.length > 0 && (
              <Text type="secondary">已选择 {selectedRowKeys.length} 项</Text>
            )}
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={mockData}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>商标详情 - {currentRecord?.name}</span>
          </Space>
        }
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {currentRecord && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="商标名称">{currentRecord.name}</Descriptions.Item>
              <Descriptions.Item label="申请号"><Text code>{currentRecord.appNo}</Text></Descriptions.Item>
              <Descriptions.Item label="申请人">{currentRecord.applicant}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusConfig[currentRecord.currentStatus]?.color || 'default'}>
                  {currentRecord.currentStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="提交日期">{currentRecord.submitDate}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>状态变更记录</Title>
            <Timeline
              style={{ marginBottom: 24 }}
              items={currentRecord.timeline.map((item, idx) => ({
                color: idx === currentRecord.timeline.length - 1
                  ? (currentRecord.isRejected ? 'red' : 'blue')
                  : 'green',
                children: (
                  <div>
                    <div>
                      <Text strong>{item.status}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{item.time}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 13 }}>{item.note}</Text>
                  </div>
                ),
              }))}
            />

            <Title level={5}>
              <HistoryOutlined style={{ marginRight: 8 }} />
              状态变更推送记录
            </Title>
            <Timeline
              style={{ marginBottom: 24 }}
              items={currentRecord.pushRecords.map((pr, idx) => ({
                color: idx === 0 ? 'blue' : 'gray',
                children: (
                  <div>
                    <div>
                      <Text strong>{pr.time}</Text>
                    </div>
                    <div>
                      <Text type="secondary">{pr.trigger} · {pr.event}</Text>
                    </div>
                    <div>
                      <Tag color="blue" style={{ fontSize: 11 }}>{pr.channel}</Tag>
                    </div>
                  </div>
                ),
              }))}
            />

            <div
              style={{
                padding: 20,
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                  <SettingOutlined />
                  <Text strong>节点变更推送设置</Text>
                </Space>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(channelLabels).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{label}通知</Text>
                    <Switch
                      checked={channelSettings[key]}
                      onChange={(checked) => setChannelSettings((prev) => ({ ...prev, [key]: checked }))}
                      checkedChildren="开"
                      unCheckedChildren="关"
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => setPushHistoryDrawerOpen(true)}
                >
                  推送记录
                </Button>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <BellOutlined />
                <Text strong>状态变更推送通知</Text>
              </Space>
              <Switch
                checked={notifications[currentRecord.key]}
                onChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [currentRecord.key]: checked }))
                }
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>推送记录 - {currentRecord?.name}</span>
          </Space>
        }
        placement="right"
        width={480}
        open={pushHistoryDrawerOpen}
        onClose={() => setPushHistoryDrawerOpen(false)}
      >
        {currentRecord && (
          <Timeline
            items={currentRecord.pushRecords.map((pr, idx) => ({
              color: idx === 0 ? 'blue' : 'green',
              children: (
                <div>
                  <div><Text strong>{pr.time}</Text></div>
                  <div><Text type="secondary">{pr.trigger} · {pr.event}</Text></div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue" style={{ fontSize: 11 }}>{pr.channel}</Tag>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>驳回详情 - {mockData.find((d) => d.key === rejectionKey)?.name}</span>
          </Space>
        }
        open={rejectionModalOpen}
        onCancel={() => setRejectionModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setRejectionModalOpen(false)}>关闭</Button>,
          <Button key="review" type="primary" danger>申请复审</Button>,
        ]}
        width={600}
      >
        {rejectionDetails[rejectionKey] && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="驳回原因">{rejectionDetails[rejectionKey].reason}</Descriptions.Item>
              <Descriptions.Item label="法律依据">{rejectionDetails[rejectionKey].lawBasis}</Descriptions.Item>
              <Descriptions.Item label="建议措施">{rejectionDetails[rejectionKey].suggestion}</Descriptions.Item>
              <Descriptions.Item label="复审截止日期">
                <Text type="danger" strong>{rejectionDetails[rejectionKey].deadline}</Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrademarkTracker;
