import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  History,
  Briefcase,
  UserCheck,
  Send,
  Award,
  UserPlus,
  Shield,
} from 'lucide-react';
import {
  Tabs,
  Tag,
  Button,
  Timeline,
  Progress,
  Modal,
  message,
  Tooltip,
  Badge,
  Descriptions,
  List,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from '@/components/common/StatsCard';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import {
  myApplications,
  getApplicationStats,
  type MyApplication,
  type RPOProcessStep,
} from '@/mock/progress';
import { cn } from '@/lib/utils';

const { TabPane } = Tabs;

const STATUS_COLOR: Record<string, string> = {
  处理中: 'processing',
  面试中: 'processing',
  Offer: 'warning',
  已入职: 'success',
  未通过: 'error',
};

const STATUS_BG: Record<string, string> = {
  处理中: 'bg-blue-50 text-blue-700 border-blue-200',
  面试中: 'bg-purple-50 text-purple-700 border-purple-200',
  Offer: 'bg-vital-orange-50 text-vital-orange-700 border-vital-orange-200',
  已入职: 'bg-success-50 text-success-700 border-success-200',
  未通过: 'bg-gray-50 text-gray-500 border-gray-200',
};

const RPO_ICONS = [
  <ClipboardList size={14} />,
  <History size={14} />,
  <UserCheck size={14} />,
  <Send size={14} />,
  <MessageSquare size={14} />,
  <Award size={14} />,
  <UserPlus size={14} />,
  <Shield size={14} />,
];

function getStageColor(status: RPOProcessStep['status']) {
  if (status === 'completed') return '#00B42A';
  if (status === 'current') return '#165DFF';
  return '#C9CDD4';
}

function getStageBg(status: RPOProcessStep['status']) {
  if (status === 'completed') return 'bg-success-100 text-success-600 border-success-300';
  if (status === 'current') return 'bg-industrial-blue-100 text-industrial-blue-600 border-industrial-blue-300';
  return 'bg-gray-100 text-gray-400 border-gray-200';
}

function ApplicationCard({ application }: { application: MyApplication }) {
  const [expanded, setExpanded] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

  const handleAcceptOffer = () => {
    message.success('已接受 Offer，恭喜您入职成功！');
    setOfferModalVisible(false);
  };

  const handleRejectOffer = () => {
    Modal.confirm({
      title: '确认拒绝 Offer',
      content: '确定要拒绝这个 Offer 吗？此操作不可撤销。',
      okText: '确认拒绝',
      okType: 'danger',
      cancelText: '再考虑',
      onOk: () => {
        message.success('已拒绝 Offer');
        setOfferModalVisible(false);
      },
    });
  };

  const handleDownload = (docName: string) => {
    message.success(`正在下载 ${docName}...`);
  };

  const handleAuthorizeBg = () => {
    message.success('背调授权已提交');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white rounded-xl border overflow-hidden transition-all duration-300',
        expanded ? 'border-industrial-blue-400 shadow-lg shadow-industrial-blue-100' : 'border-gray-100 hover:border-industrial-blue-200 hover:shadow-card-hover'
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-5">
          <div className="pt-1 flex-shrink-0">
            <MatchScoreRing score={application.matchScore} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {application.positionTitle}
                  </h3>
                  {application.status === 'Offer' && (
                    <Badge.Ribbon text="新Offer" color="#FF7D00" className="!text-xs">
                      <span />
                    </Badge.Ribbon>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{application.enterpriseName}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                    <MapPin size={10} />
                    {application.township}
                  </span>
                  <span className="text-lg font-bold text-vital-orange-500">
                    {application.salaryMin}-{application.salaryMax}K
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <Tag
                  color={STATUS_COLOR[application.status]}
                  className={cn('!text-xs !font-medium !m-0', STATUS_BG[application.status])}
                >
                  {application.subStatus || application.status}
                </Tag>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(application.lastUpdatedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {application.status === '已入职' && application.probationProgress !== undefined && (
              <div className="mb-4 p-3 bg-success-50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-success-700 font-medium">保用期进度</span>
                  <span className="text-success-600 font-mono-num">{application.probationProgress}%</span>
                </div>
                <Progress
                  percent={application.probationProgress}
                  size="small"
                  strokeColor="#00B42A"
                  showInfo={false}
                />
                <div className="text-xs text-gray-500 mt-1">
                  第 {Math.ceil(application.probationProgress / 33)} 个月，共 3 个月
                </div>
              </div>
            )}

            {application.status === 'Offer' && (
              <div className="mb-4 p-3 bg-vital-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vital-orange-700 font-medium text-sm mb-1">🎊 恭喜！您收到了 Offer</p>
                    <p className="text-xs text-gray-500">
                      请在 {application.offerDeadline} 前确认
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" type="primary" onClick={() => setOfferModalVisible(true)}>
                      查看详情
                    </Button>
                    <Button size="small" danger ghost onClick={handleRejectOffer}>
                      拒绝
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">RPO 处理进度</span>
                <span className="text-xs text-gray-400">
                  第 {application.currentStageIndex + 1} / 8 阶段
                </span>
              </div>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-gray-200 z-0">
                  <div
                    className="h-full bg-gradient-to-r from-success-500 to-industrial-blue-500 transition-all duration-700"
                    style={{
                      width: `${Math.min((application.currentStageIndex / (application.rpoStages.length - 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                {application.rpoStages.map((stage, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <Tooltip title={stage.completedAt ? `${stage.name} · ${stage.completedAt}` : stage.name}>
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                          getStageBg(stage.status)
                        )}
                      >
                        {stage.status === 'completed' ? (
                          <CheckCircle size={16} className="text-success-600" />
                        ) : (
                          RPO_ICONS[idx]
                        )}
                      </div>
                    </Tooltip>
                    <span
                      className={cn(
                        'text-[10px] mt-1 w-12 text-center transition-colors',
                        stage.status === 'pending' ? 'text-gray-400' : 'text-gray-700 font-medium'
                      )}
                    >
                      {stage.name}
                    </span>
                    {stage.completedAt && (
                      <span className="text-[10px] text-gray-400">
                        {stage.completedAt.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
          <Button
            type="link"
            icon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            onClick={() => setExpanded(!expanded)}
            className="!text-industrial-blue-600"
          >
            {expanded ? '收起详情' : '展开详情'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-industrial-blue-500" />
                  企业处理记录
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <Timeline>
                    {application.operationRecords.map((record, idx) => (
                      <Timeline.Item
                        key={idx}
                        color={idx === 0 ? '#165DFF' : '#C9CDD4'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-800">{record.remark}</p>
                            <p className="text-xs text-gray-500 mt-0.5">处理人：{record.operator}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {record.time}
                          </span>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </div>

              {application.backgroundCheck && (application.backgroundCheck.authorized || application.backgroundCheck.progress > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-success-500" />
                    背调状态
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">背调授权</p>
                        <Tag
                          color={application.backgroundCheck.authorized ? 'success' : 'warning'}
                          className="!m-0"
                        >
                          {application.backgroundCheck.authorized ? '已授权' : '待授权'}
                        </Tag>
                        {!application.backgroundCheck.authorized && application.status === '面试中' && (
                          <Button
                            size="small"
                            type="link"
                            className="!text-xs !mt-1 !p-0"
                            onClick={handleAuthorizeBg}
                          >
                            立即授权
                          </Button>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">背调进度</p>
                        <p className="text-sm font-semibold text-gray-800">
                          已完成 {application.backgroundCheck.completedItems}/{application.backgroundCheck.totalItems} 项
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">完成进度</p>
                        <span className="text-sm font-mono-num" style={{ color: getStageColor(application.backgroundCheck.progress === 100 ? 'completed' : 'current') }}>
                          {application.backgroundCheck.progress}%
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">背调结果</p>
                        <Tag
                          color={
                            application.backgroundCheck.resultLevel === '优秀'
                              ? 'success'
                              : application.backgroundCheck.resultLevel === '良好'
                              ? 'processing'
                              : application.backgroundCheck.resultLevel === '合格'
                              ? 'warning'
                              : 'error'
                          }
                          className="!m-0"
                        >
                          {application.backgroundCheck.resultLevel || '评估中'}
                        </Tag>
                      </div>
                    </div>
                    <Progress
                      percent={application.backgroundCheck.progress}
                      size="small"
                      strokeColor="#00B42A"
                      className="mb-4"
                    />
                    <div className="text-xs font-medium text-gray-600 mb-2">背调项明细：</div>
                    <List
                      size="small"
                      dataSource={application.backgroundCheck.items}
                      renderItem={(item) => (
                        <List.Item>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-gray-700">{item.project}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded',
                                  item.result === '通过'
                                    ? 'bg-success-100 text-success-700'
                                    : item.result === '不通过'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-500'
                                )}
                              >
                                {item.result}
                              </span>
                              {item.description && (
                                <span className="text-xs text-gray-400">{item.description}</span>
                              )}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </div>
              )}

              {application.hrFeedbacks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} className="text-purple-500" />
                    HR 反馈记录
                  </h4>
                  <div className="space-y-2">
                    {application.hrFeedbacks.map((feedback, idx) => (
                      <div
                        key={idx}
                        className="bg-purple-50 border border-purple-100 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-purple-600">HR 反馈</span>
                          <span className="text-xs text-gray-400">{feedback.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{feedback.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Download size={16} className="text-industrial-blue-500" />
                    可下载资料
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {application.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-industrial-blue-300 hover:bg-industrial-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleDownload(doc.name)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-industrial-blue-100 rounded-lg flex items-center justify-center">
                            <FileText size={18} className="text-industrial-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {doc.type} · {doc.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <Download size={16} className="text-industrial-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Award className="text-vital-orange-500" size={20} />
            <span>录用通知</span>
          </div>
        }
        open={offerModalVisible}
        onCancel={() => setOfferModalVisible(false)}
        width={600}
        footer={[
          <Button key="reject" danger onClick={handleRejectOffer}>
            拒绝 Offer
          </Button>,
          <Button key="accept" type="primary" onClick={handleAcceptOffer}>
            接受 Offer
          </Button>,
        ]}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="职位名称">{application.positionTitle}</Descriptions.Item>
          <Descriptions.Item label="企业名称">{application.enterpriseName}</Descriptions.Item>
          <Descriptions.Item label="工作地点">{application.township}</Descriptions.Item>
          <Descriptions.Item label="薪资待遇">
            <span className="text-vital-orange-500 font-bold">
              {application.salaryMin}-{application.salaryMax}K / 月
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="入职时间">2024年10月21日 周一 09:00</Descriptions.Item>
          <Descriptions.Item label="报到地点">
            {application.township} 企业办公区行政楼 3 楼人力资源部
          </Descriptions.Item>
          <Descriptions.Item label="截止确认">{application.offerDeadline}</Descriptions.Item>
        </Descriptions>
        <div className="mt-4 p-3 bg-vital-orange-50 rounded-lg">
          <p className="text-sm text-vital-orange-700">
            <AlertCircle size={14} className="inline mr-1" />
            请在截止日期前确认是否接受 Offer，逾期将自动取消。
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}

export default function Applications() {
  const [activeTab, setActiveTab] = useState('all');
  const stats = getApplicationStats();

  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') return myApplications;
    if (activeTab === 'processing') return myApplications.filter((app) => app.status === '处理中');
    if (activeTab === 'interviewing') return myApplications.filter((app) => app.status === '面试中');
    if (activeTab === 'offer') return myApplications.filter((app) => app.status === 'Offer');
    if (activeTab === 'onboarded') return myApplications.filter((app) => app.status === '已入职');
    if (activeTab === 'rejected') return myApplications.filter((app) => app.status === '未通过');
    return myApplications;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">投递记录</h1>
          <p className="text-gray-500">实时追踪您的所有求职申请进度</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="总投递数"
            value={stats.total}
            unit="个"
            theme="blue"
            icon={<Briefcase size={18} />}
          />
          <StatsCard
            title="处理中"
            value={stats.processing + stats.interviewing}
            unit="个"
            theme="purple"
            icon={<Clock size={18} />}
          />
          <StatsCard
            title="面试中"
            value={stats.interviewing}
            unit="个"
            theme="orange"
            icon={<MessageSquare size={18} />}
          />
          <StatsCard
            title="Offer / 已入职"
            value={stats.offer + stats.onboarded}
            unit="个"
            theme="green"
            icon={<CheckCircle size={18} />}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="px-5 pt-4"
            items={[
              { key: 'all', label: `全部 (${stats.total})` },
              { key: 'processing', label: `处理中 (${stats.processing})` },
              { key: 'interviewing', label: `面试中 (${stats.interviewing})` },
              { key: 'offer', label: `Offer (${stats.offer})` },
              { key: 'onboarded', label: `已入职 (${stats.onboarded})` },
              { key: 'rejected', label: `未通过 (${stats.rejected})` },
            ]}
          />

          <div className="p-5 pt-0 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase size={36} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500">暂无投递记录</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
