import React, { useState, useMemo } from 'react';
import {
  Gift,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Upload,
  X,
  Plus,
  Eye,
  Edit3,
  Trash2,
  DollarSign,
  Users,
  BookOpen,
  Home,
  Wrench,
  Shield,
  Building,
} from 'lucide-react';
import {
  Tabs,
  Tag,
  Button,
  Progress,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload as AntUpload,
  message,
  Tooltip,
  Timeline,
  Descriptions,
  Card,
  List,
  Space,
  Popconfirm,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import StatsCard from '@/components/common/StatsCard';
import {
  AVAILABLE_SUBSIDIES,
  mySubsidyApplications,
  getSubsidyStats,
  type AvailableSubsidy,
  type MySubsidyApplication,
} from '@/mock/progress';
import { cn } from '@/lib/utils';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = AntUpload;

const STATUS_COLOR: Record<string, string> = {
  草稿: 'default',
  已提交: 'processing',
  审核中: 'processing',
  已通过: 'success',
  已拒绝: 'error',
  已发放: 'success',
};

const STEP_STATUS_COLOR: Record<string, string> = {
  通过: '#00B42A',
  驳回: '#F53F3F',
  审核中: '#165DFF',
  待审核: '#C9CDD4',
};

const SUBSIDY_ICONS: Record<string, React.ReactNode> = {
  GRADUATE_EMPLOY: <BookOpen size={24} />,
  SKILL_UPGRADE: <Wrench size={24} />,
  SOCIAL_INSURANCE: <Shield size={24} />,
  HOUSING: <Home size={24} />,
};

function SubsidyCard({
  subsidy,
  onApply,
}: {
  subsidy: AvailableSubsidy;
  onApply: (s: AvailableSubsidy) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-card-hover hover:border-industrial-blue-200 transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', subsidy.bgColor)}>
              <span className="text-2xl">{subsidy.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subsidy.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{subsidy.description}</p>
            </div>
          </div>
          <Tag color="success" className="!text-sm !font-medium">
            {subsidy.amountRange}
          </Tag>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">申请条件：</p>
          <div className="space-y-1">
            {subsidy.conditions.map((condition, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">所需材料：</p>
          <div className="flex flex-wrap gap-1.5">
            {subsidy.requiredMaterials.map((material, idx) => (
              <Tag key={idx} className="!m-0 !text-xs !bg-gray-50 !text-gray-600">
                <FileText size={10} className="mr-1" />
                {material}
              </Tag>
            ))}
          </div>
        </div>

        <Button
          type="primary"
          block
          icon={<Plus size={14} />}
          onClick={() => onApply(subsidy)}
          className="!h-10"
        >
          立即申请
        </Button>
      </div>
    </motion.div>
  );
}

function ApplicationCard({
  application,
  onViewDetail,
  onSupplement,
  onCancel,
}: {
  application: MySubsidyApplication;
  onViewDetail: (app: MySubsidyApplication) => void;
  onSupplement: (app: MySubsidyApplication) => void;
  onCancel: (app: MySubsidyApplication) => void;
}) {
  const isRejected = application.status === '已拒绝';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white rounded-xl border overflow-hidden transition-all duration-300',
        isRejected
          ? 'border-gray-200 opacity-80'
          : 'border-gray-100 hover:border-industrial-blue-200 hover:shadow-card-hover'
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                application.type === 'GRADUATE_EMPLOY'
                  ? 'bg-vital-orange-100 text-vital-orange-600'
                  : application.type === 'SKILL_UPGRADE'
                  ? 'bg-industrial-blue-100 text-industrial-blue-600'
                  : application.type === 'SOCIAL_INSURANCE'
                  ? 'bg-success-100 text-success-600'
                  : 'bg-purple-100 text-purple-600'
              )}
            >
              {SUBSIDY_ICONS[application.type]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{application.typeName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">申请时间：{application.appliedAt}</p>
            </div>
          </div>
          <div className="text-right">
            <Tag color={STATUS_COLOR[application.status]} className="!m-0 !text-xs !font-medium">
              {application.status}
            </Tag>
            <p className="text-xl font-bold text-vital-orange-500 mt-1">
              ¥{application.amount.toLocaleString()}
            </p>
          </div>
        </div>

        {isRejected && application.rejectReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} />
              驳回原因：{application.rejectReason}
            </p>
          </div>
        )}

        {application.status === '已发放' && application.paidAt && (
          <div className="mb-4 p-3 bg-success-50 border border-success-100 rounded-lg">
            <p className="text-xs text-success-600 flex items-center gap-1">
              <CheckCircle size={12} />
              补贴已发放，发放时间：{application.paidAt}
            </p>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">审核进度</span>
            <span className="text-gray-700 font-medium">
              {application.currentStep}/{application.totalSteps} 步
            </span>
          </div>
          <Progress
            percent={application.progressPercent}
            size="small"
            status={isRejected ? 'exception' : undefined}
            strokeColor={
              isRejected
                ? '#F53F3F'
                : application.progressPercent === 100
                ? '#00B42A'
                : '#165DFF'
            }
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button size="small" icon={<Eye size={12} />} onClick={() => onViewDetail(application)}>
            查看详情
          </Button>
          {application.status === '草稿' && (
            <Button size="small" icon={<Edit3 size={12} />} onClick={() => onSupplement(application)}>
              继续编辑
            </Button>
          )}
          {application.status === '审核中' && (
            <Button size="small" icon={<Upload size={12} />} onClick={() => onSupplement(application)}>
              补充材料
            </Button>
          )}
          {(application.status === '草稿' || application.status === '已提交') && (
            <Popconfirm
              title="确认撤销"
              description="确定要撤销这个补贴申请吗？"
              onConfirm={() => onCancel(application)}
              okText="确认撤销"
              cancelText="取消"
            >
              <Button size="small" danger icon={<Trash2 size={12} />}>
                撤销申请
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Subsidy() {
  const [activeTab, setActiveTab] = useState('available');
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSubsidy, setSelectedSubsidy] = useState<AvailableSubsidy | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<MySubsidyApplication | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const stats = getSubsidyStats();

  const handleApply = (subsidy: AvailableSubsidy) => {
    setSelectedSubsidy(subsidy);
    form.resetFields();
    setFileList([]);
    setApplyModalVisible(true);
  };

  const handleViewDetail = (application: MySubsidyApplication) => {
    setSelectedApplication(application);
    setDetailModalVisible(true);
  };

  const handleSupplement = (application: MySubsidyApplication) => {
    message.info(`正在为「${application.typeName}」补充材料...`);
  };

  const handleCancel = (application: MySubsidyApplication) => {
    message.success(`已撤销「${application.typeName}」的申请`);
  };

  const handleSubmitApply = () => {
    form.validateFields().then(() => {
      message.success('补贴申请已提交，请等待审核');
      setApplyModalVisible(false);
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">就业补贴</h1>
          <p className="text-gray-500">中山市就业创业补贴一站式申领服务</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="可申请补贴"
            value={stats.available}
            unit="项"
            theme="blue"
            icon={<Gift size={18} />}
          />
          <StatsCard
            title="申请中"
            value={stats.applying}
            unit="项"
            theme="orange"
            icon={<Clock size={18} />}
          />
          <StatsCard
            title="已通过"
            value={stats.approved}
            unit="项"
            theme="green"
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            title="累计获得补贴"
            value={stats.totalAmount}
            unit="元"
            theme="purple"
            icon={<DollarSign size={18} />}
            prefix="¥"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="px-5 pt-4"
            items={[
              { key: 'available', label: '可申请的补贴' },
              { key: 'records', label: '我的申请记录' },
            ]}
          />

          <div className="p-5 pt-0">
            <AnimatePresence mode="wait">
              {activeTab === 'available' ? (
                <motion.div
                  key="available"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {AVAILABLE_SUBSIDIES.map((subsidy) => (
                    <SubsidyCard key={subsidy.id} subsidy={subsidy} onApply={handleApply} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="records"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {mySubsidyApplications.length > 0 ? (
                    mySubsidyApplications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onViewDetail={handleViewDetail}
                        onSupplement={handleSupplement}
                        onCancel={handleCancel}
                      />
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={36} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500">暂无申请记录</p>
                      <Button
                        type="primary"
                        className="mt-4"
                        onClick={() => setActiveTab('available')}
                      >
                        去申请补贴
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            {selectedSubsidy && <span className="text-2xl">{selectedSubsidy.icon}</span>}
            <span>申请 {selectedSubsidy?.name}</span>
          </div>
        }
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setApplyModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" onClick={() => form.validateFields().then(() => message.success('已保存为草稿'))}>
            保存草稿
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitApply}>
            提交申请
          </Button>,
        ]}
      >
        {selectedSubsidy && (
          <Form form={form} layout="vertical" className="mt-4">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-2">补贴信息</p>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="补贴类型">{selectedSubsidy.name}</Descriptions.Item>
                <Descriptions.Item label="补贴金额">{selectedSubsidy.amountRange}</Descriptions.Item>
              </Descriptions>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[{ required: true, message: '请输入身份证号' }]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入手机号码" />
              </Form.Item>
              <Form.Item
                name="applyDate"
                label="申请日期"
                rules={[{ required: true, message: '请选择申请日期' }]}
              >
                <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="enterprise"
                label="就业单位"
                rules={[{ required: true, message: '请输入就业单位' }]}
              >
                <Input placeholder="请输入就业单位名称" />
              </Form.Item>
              <Form.Item
                name="position"
                label="工作岗位"
                rules={[{ required: true, message: '请输入工作岗位' }]}
              >
                <Input placeholder="请输入工作岗位" />
              </Form.Item>
            </div>

            <Form.Item
              name="remark"
              label="备注说明"
            >
              <TextArea rows={3} placeholder="如有其他需要说明的情况请在此填写" />
            </Form.Item>

            <Form.Item
              name="documents"
              label="上传材料"
              rules={[{ required: true, message: '请上传相关材料' }]}
            >
              <Dragger
                fileList={fileList}
                onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                beforeUpload={() => false}
                multiple
              >
                <p className="ant-upload-drag-icon">
                  <Upload size={32} className="text-industrial-blue-500" />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint text-xs text-gray-400">
                  需要上传：{selectedSubsidy.requiredMaterials.join('、')}
                </p>
              </Dragger>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            {selectedApplication && SUBSIDY_ICONS[selectedApplication.type]}
            <span>申请详情 - {selectedApplication?.typeName}</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={650}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedApplication && (
          <div className="mt-4">
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="申请编号">{selectedApplication.id}</Descriptions.Item>
              <Descriptions.Item label="申请类型">{selectedApplication.typeName}</Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <span className="text-vital-orange-500 font-bold">
                  ¥{selectedApplication.amount.toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedApplication.appliedAt}</Descriptions.Item>
              <Descriptions.Item label="当前状态" span={2}>
                <Tag color={STATUS_COLOR[selectedApplication.status]}>
                  {selectedApplication.status}
                </Tag>
              </Descriptions.Item>
              {selectedApplication.paidAt && (
                <Descriptions.Item label="发放时间" span={2}>
                  {selectedApplication.paidAt}
                </Descriptions.Item>
              )}
              {selectedApplication.rejectReason && (
                <Descriptions.Item label="驳回原因" span={2}>
                  <span className="text-red-500">{selectedApplication.rejectReason}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700 mb-3">审核进度</p>
              <Progress
                percent={selectedApplication.progressPercent}
                status={selectedApplication.status === '已拒绝' ? 'exception' : undefined}
                strokeColor={
                  selectedApplication.status === '已拒绝'
                    ? '#F53F3F'
                    : selectedApplication.progressPercent === 100
                    ? '#00B42A'
                    : '#165DFF'
                }
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">审核时间线</p>
              <Timeline>
                {selectedApplication.auditTrail.map((step, idx) => (
                  <Timeline.Item
                    key={idx}
                    color={STEP_STATUS_COLOR[step.status]}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{step.step}</p>
                        <p className="text-xs text-gray-500">处理人：{step.operator}</p>
                        {step.comment && (
                          <p className="text-xs text-gray-500 mt-0.5">备注：{step.comment}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {step.operatedAt || '待处理'}
                      </span>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
