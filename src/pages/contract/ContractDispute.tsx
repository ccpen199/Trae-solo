import { useState, useMemo, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Phone,
  Image,
  FileText,
  MessageCircle,
  Type,
  Send,
  User,
  Building2,
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Calendar,
  Shield,
} from 'lucide-react';
import { mockDisputes } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import Tag from '@/components/ui/Tag';
import Empty from '@/components/ui/Empty';
import { formatDate, formatDateTime } from '@/utils/helpers';
import type { Dispute, DisputeMessage } from '../../../shared/types';

const disputeTabs = [
  { id: 'all', label: '全部', status: null as null },
  { id: 'submitted', label: '待调解', status: 'submitted' as const },
  { id: 'mediating', label: '调解中', status: 'mediating' as const },
  { id: 'resolved', label: '已解决', status: 'resolved' as const },
  { id: 'escalated', label: '已升级仲裁', status: 'escalated' as const },
];

const disputeTypeMap: Record<string, { label: string; color: string }> = {
  salary: { label: '工资', color: 'red' },
  working_hours: { label: '工时', color: 'orange' },
  termination: { label: '解除合同', color: 'purple' },
  other: { label: '其他', color: 'gray' },
};

const evidenceIconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  image: { icon: <Image className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  document: { icon: <FileText className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
  chat: { icon: <MessageCircle className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  text: { icon: <Type className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
};

const mockMediators: Record<string, string> = {
  'user-003': '王管理',
};

export default function ContractDispute() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(mockDisputes[0]?.id || null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredDisputes = useMemo(() => {
    return mockDisputes.filter(dispute => {
      const tab = disputeTabs.find(t => t.id === activeTab);
      if (!tab?.status) return true;
      return dispute.status === tab.status;
    });
  }, [activeTab]);

  const selectedDispute = useMemo(() => {
    return mockDisputes.find(d => d.id === selectedId) || null;
  }, [selectedId]);

  const messages = selectedDispute?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput('');
  };

  const getSenderAvatar = (role: string) => {
    switch (role) {
      case 'employer':
        return <Building2 className="h-4 w-4 text-white" />;
      case 'jobseeker':
        return <User className="h-4 w-4 text-white" />;
      case 'mediator':
        return <Scale className="h-4 w-4 text-white" />;
      default:
        return <User className="h-4 w-4 text-white" />;
    }
  };

  const getSenderAvatarBg = (role: string) => {
    switch (role) {
      case 'employer':
        return 'bg-[#1E3A5F]';
      case 'jobseeker':
        return 'bg-[#FF6B35]';
      case 'mediator':
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      default:
        return 'bg-gray-500';
    }
  };

  const renderTimelineStep = (step: number) => {
    const steps = [
      { id: 1, title: '争议已提交', time: selectedDispute?.createdAt },
      { id: 2, title: '调解员已分配', mediator: selectedDispute?.mediatorId ? mockMediators[selectedDispute.mediatorId] : '待分配', time: selectedDispute?.createdAt },
      { id: 3, title: '调解进行中', time: null },
      { id: 4, title: '达成调解协议', time: null },
    ];

    const currentStep = selectedDispute?.status === 'submitted' ? 1 :
      selectedDispute?.status === 'mediating' ? 3 :
      selectedDispute?.status === 'resolved' ? 4 : 3;

    return steps.map((s, idx) => {
      const isCompleted = s.id <= currentStep;
      const isCurrent = s.id === currentStep;
      return (
        <div key={s.id} className="relative pl-8 pb-5 last:pb-0">
          {idx < steps.length - 1 && (
            <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 ${
              isCompleted ? 'bg-green-300' : 'bg-gray-200'
            }`} />
          )}
          <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
            isCompleted
              ? 'border-green-500 bg-green-500'
              : isCurrent
                ? 'border-[#FF6B35] bg-white'
                : 'border-gray-300 bg-white'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            ) : isCurrent ? (
              <Clock className="h-3.5 w-3.5 text-[#FF6B35]" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
          </div>
          <div>
            <p className={`text-sm font-medium ${
              isCompleted ? 'text-gray-900' : isCurrent ? 'text-[#FF6B35]' : 'text-gray-400'
            }`}>
              {s.title}
              {s.id === 2 && s.mediator && s.mediator !== '待分配' && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  （{s.mediator}）
                </span>
              )}
            </p>
            {s.time && (
              <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.time)}</p>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">争议调解中心</h1>
        </div>
        <p className="text-gray-500 ml-13">通过调解方式解决劳务纠纷，平台调解员全程介入，保障双方合法权益</p>
      </div>

      <div className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/50 via-white to-blue-50/50 border border-orange-100">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#FF6B35]" />
          <p className="text-sm text-gray-700">
            平台秉持<span className="font-semibold text-[#1E3A5F]">中立、公正、专业</span>的调解原则，所有调解过程均有区块链存证
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            提交新争议
          </button>
          <button className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2">
            <Phone className="h-4 w-4" />
            联系调解员
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-20 gap-6">
        <div className="lg:col-span-7">
          <div className="glass rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-1 p-1 bg-gray-50 rounded-xl">
                {disputeTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-[#1E3A5F] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[700px]">
              {filteredDisputes.map(dispute => {
                const typeInfo = disputeTypeMap[dispute.type] || disputeTypeMap.other;
                const isSelected = selectedId === dispute.id;
                return (
                  <div
                    key={dispute.id}
                    onClick={() => setSelectedId(dispute.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-md'
                        : 'border-transparent bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Tag label={typeInfo.label} color={typeInfo.color} />
                        <span className="text-xs font-mono text-gray-400">#{dispute.contractId}</span>
                      </div>
                      <StatusBadge status={dispute.status} type="dispute" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(dispute.createdAt)}</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span>
                        {dispute.complainantRole === 'employer' ? '企业发起' : '劳动者发起'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {dispute.description}
                    </p>
                    {dispute.messages && dispute.messages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                        <MessageCircle className="h-3 w-3" />
                        <span>{dispute.messages.length} 条沟通记录</span>
                        {dispute.evidence.length > 0 && (
                          <>
                            <span className="mx-1 text-gray-300">·</span>
                            <FileText className="h-3 w-3" />
                            <span>{dispute.evidence.length} 份证据</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredDisputes.length === 0 && (
                <div className="py-12">
                  <Empty
                    title="暂无争议记录"
                    description="当前筛选条件下没有争议记录"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-13">
          {selectedDispute ? (
            <div className="glass rounded-2xl overflow-hidden h-full flex flex-col max-h-[800px]">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-900">争议详情</h2>
                      <Tag
                        label={disputeTypeMap[selectedDispute.type]?.label || '其他'}
                        color={disputeTypeMap[selectedDispute.type]?.color || 'gray'}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(selectedDispute.createdAt)}
                      </span>
                      <span className="mx-1 text-gray-300">|</span>
                      <span>
                        提交方：
                        <span className={`font-medium ${
                          selectedDispute.complainantRole === 'employer' ? 'text-[#1E3A5F]' : 'text-[#FF6B35]'
                        }`}>
                          {selectedDispute.complainantRole === 'employer' ? '企业（甲方）' : '劳动者（乙方）'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={selectedDispute.status} type="dispute" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-100">
                  {selectedDispute.description}
                </p>

                {selectedDispute.evidence.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      证据材料（{selectedDispute.evidence.length}）
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedDispute.evidence.map(item => {
                        const evStyle = evidenceIconMap[item.type] || evidenceIconMap.text;
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
                          >
                            <div className={`w-10 h-10 rounded-lg ${evStyle.bg} ${evStyle.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                              {evStyle.icon}
                            </div>
                            <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#1E3A5F]" />
                  调解进程
                </h4>
                <div>{renderTimelineStep(3)}</div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#1E3A5F]" />
                    调解沟通区
                    <span className="text-xs font-normal text-gray-400 ml-1">（{messages.length} 条消息）</span>
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/20">
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      getSenderAvatar={getSenderAvatar}
                      getSenderAvatarBg={getSenderAvatarBg}
                    />
                  ))}

                  {messages.length === 0 && (
                    <div className="py-8">
                      <Empty
                        title="暂无沟通记录"
                        description="调解员分配完成后将在此进行沟通"
                      />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="输入消息内容..."
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]/50 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={`px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                        messageInput.trim()
                          ? 'bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]/90 shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      发送
                    </button>
                  </div>
                </div>
              </div>

              {(selectedDispute.status === 'mediating' || selectedDispute.status === 'resolved') && (
                <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  {selectedDispute.status === 'mediating' ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        同意调解方案
                      </button>
                      <button className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <XCircle className="h-4 w-4" />
                        不同意，申请仲裁
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">已达成调解协议</span>
                      </div>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>• 甲方须于2026年6月28日前支付乙方5月份全部工资共计人民币4,850元</p>
                        <p>• 双方确认劳动关系于2026年5月31日终止，无其他争议</p>
                        <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                          调解协议编号：TJ-{selectedDispute.id.toUpperCase()} · 已完成区块链存证
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl h-full">
              <Empty
                title="请选择争议记录"
                description="从左侧列表选择一条争议记录查看详情"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  getSenderAvatar,
  getSenderAvatarBg,
}: {
  message: DisputeMessage;
  getSenderAvatar: (role: string) => React.ReactNode;
  getSenderAvatarBg: (role: string) => string;
}) {
  const isMediator = message.senderRole === 'mediator';

  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getSenderAvatarBg(message.senderRole)}`}>
        {getSenderAvatar(message.senderRole)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${
            isMediator ? 'text-green-700' : 'text-gray-900'
          }`}>
            {message.senderName}
          </span>
          {isMediator && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-semibold rounded-full shadow-sm">
              调解员
            </span>
          )}
          <span className="text-xs text-gray-400">{formatDateTime(message.createdAt)}</span>
        </div>
        <div className={`inline-block max-w-full ${
          isMediator
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-green-900'
            : 'bg-white border border-gray-200 text-gray-800'
        } rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
