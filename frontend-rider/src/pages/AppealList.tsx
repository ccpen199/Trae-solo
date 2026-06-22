import { useState } from 'react';
import { Tabs, Card, Tag, Button, Modal, Form, Select, Input, message, FloatButton } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import Empty from '@/components/Empty';

const { TabPane } = Tabs;
const { TextArea } = Input;

type AppealStatus = 'pending' | 'approved' | 'rejected';
type AppealLevel = 'first' | 'second' | 'final';
type AppealType = 'timeout' | 'cancel' | 'complaint' | 'fine' | 'other';

interface AppealRecord {
  id: string;
  orderNo: string;
  type: AppealType;
  reason: string;
  submitTime: number;
  status: AppealStatus;
  level: AppealLevel;
  rejectReason?: string;
}

const appealTypeLabels: Record<AppealType, string> = {
  timeout: '配送超时',
  cancel: '订单取消',
  complaint: '用户投诉',
  fine: '罚款申诉',
  other: '其他问题',
};

const appealTypeColors: Record<AppealType, string> = {
  timeout: 'orange',
  cancel: 'blue',
  complaint: 'red',
  fine: 'purple',
  other: 'default',
};

const statusMap: Record<AppealStatus, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'gold', text: '进行中', icon: <ClockCircleOutlined /> },
  approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
  rejected: { color: 'red', text: '已驳回', icon: <CloseCircleOutlined /> },
};

const levelMap: Record<AppealLevel, string> = {
  first: '初审',
  second: '二审',
  final: '终审',
};

const mockAppeals: AppealRecord[] = [
  {
    id: '1',
    orderNo: 'DD20240601001',
    type: 'timeout',
    reason: '因道路施工导致配送延误，实际距离比导航远3公里',
    submitTime: Date.now() - 2 * 60 * 60 * 1000,
    status: 'pending',
    level: 'first',
  },
  {
    id: '2',
    orderNo: 'DD20240531008',
    type: 'complaint',
    reason: '用户投诉餐品洒漏，但取餐时已确认包装完好，有照片为证',
    submitTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
    status: 'approved',
    level: 'second',
  },
  {
    id: '3',
    orderNo: 'DD20240530015',
    type: 'cancel',
    reason: '商家出餐超时40分钟，用户主动取消订单，非骑手责任',
    submitTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    status: 'rejected',
    level: 'final',
    rejectReason: '未提供商家出餐超时的有效凭证',
  },
  {
    id: '4',
    orderNo: 'DD20240529023',
    type: 'fine',
    reason: '被误判为提前点击送达，实际已送达用户指定位置',
    submitTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: 'pending',
    level: 'second',
  },
];

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

const AppealList: React.FC = () => {
  const [appeals, setAppeals] = useState<AppealRecord[]>(mockAppeals);
  const [activeTab, setActiveTab] = useState<AppealStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<AppealRecord | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const filteredAppeals = activeTab === 'all'
    ? appeals
    : appeals.filter((a) => a.status === activeTab);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newAppeal: AppealRecord = {
        id: `${Date.now()}`,
        orderNo: values.orderNo,
        type: values.type,
        reason: values.reason,
        submitTime: Date.now(),
        status: 'pending',
        level: 'first',
      };

      setAppeals([newAppeal, ...appeals]);
      message.success('申诉提交成功');
      setModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReappeal = (appeal: AppealRecord) => {
    setSelectedAppeal(appeal);
    form.setFieldsValue({
      orderNo: appeal.orderNo,
      type: appeal.type,
      reason: '',
    });
    setModalOpen(true);
  };

  const handleViewDetail = (appeal: AppealRecord) => {
    setSelectedAppeal(appeal);
    setDetailOpen(true);
  };

  return (
    <div className="page-container pb-20">
      <PageHeader title="申诉复查" />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as AppealStatus | 'all')}
        className="px-4"
      >
        <TabPane tab="全部" key="all" />
        <TabPane
          tab={
            <span className="flex items-center gap-1">
              <ClockCircleOutlined className="text-gold" />
              进行中
            </span>
          }
          key="pending"
        />
        <TabPane
          tab={
            <span className="flex items-center gap-1">
              <CheckCircleOutlined className="text-green" />
              已通过
            </span>
          }
          key="approved"
        />
        <TabPane
          tab={
            <span className="flex items-center gap-1">
              <CloseCircleOutlined className="text-red" />
              已驳回
            </span>
          }
          key="rejected"
        />
      </Tabs>

      <div className="px-4 space-y-3">
        {filteredAppeals.length === 0 ? (
          <Empty description="暂无申诉记录" />
        ) : (
          filteredAppeals.map((appeal) => (
            <Card key={appeal.id} size="small" className="shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-gray-400" />
                  <span className="font-mono text-sm font-medium">{appeal.orderNo}</span>
                </div>
                <Tag color={statusMap[appeal.status].color} icon={statusMap[appeal.status].icon}>
                  {statusMap[appeal.status].text}
                </Tag>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Tag color={appealTypeColors[appeal.type]}>
                  {appealTypeLabels[appeal.type]}
                </Tag>
                <Tag color="blue" bordered={false}>
                  {levelMap[appeal.level]}
                </Tag>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{appeal.reason}</p>

              {appeal.status === 'rejected' && appeal.rejectReason && (
                <div className="bg-red-50 rounded p-2 mb-2">
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <ExclamationCircleOutlined />
                    驳回原因：{appeal.rejectReason}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined />
                  {formatDate(appeal.submitTime)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(appeal)}
                  className="flex-1"
                >
                  查看详情
                </Button>
                {appeal.status === 'rejected' && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => handleReappeal(appeal)}
                    className="flex-1"
                  >
                    重新申诉
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        tooltip="发起申诉"
        onClick={() => {
          setSelectedAppeal(null);
          form.resetFields();
          setModalOpen(true);
        }}
      />

      <Modal
        title={selectedAppeal ? '重新申诉' : '发起申诉'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            提交申诉
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderNo"
            label="订单号"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item
            name="type"
            label="申诉类型"
            rules={[{ required: true, message: '请选择申诉类型' }]}
          >
            <Select placeholder="请选择申诉类型">
              {(Object.keys(appealTypeLabels) as AppealType[]).map((type) => (
                <Select.Option key={type} value={type}>
                  {appealTypeLabels[type]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="申诉原因"
            rules={[{ required: true, message: '请输入申诉原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述申诉原因，建议附相关凭证说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申诉详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedAppeal && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">订单号：</span>
              <span className="font-mono">{selectedAppeal.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">申诉类型：</span>
              <Tag color={appealTypeColors[selectedAppeal.type]}>
                {appealTypeLabels[selectedAppeal.type]}
              </Tag>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">当前状态：</span>
              <Tag color={statusMap[selectedAppeal.status].color}>
                {statusMap[selectedAppeal.status].text}
              </Tag>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">审核级别：</span>
              <span>{levelMap[selectedAppeal.level]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">提交时间：</span>
              <span>{formatDate(selectedAppeal.submitTime)}</span>
            </div>
            <div>
              <div className="text-gray-500 mb-1">申诉原因：</div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                {selectedAppeal.reason}
              </div>
            </div>
            {selectedAppeal.rejectReason && (
              <div>
                <div className="text-gray-500 mb-1">驳回原因：</div>
                <div className="bg-red-50 rounded p-3 text-sm text-red-600">
                  {selectedAppeal.rejectReason}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppealList;
