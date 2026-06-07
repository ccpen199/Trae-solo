import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, MessageSquare, Sparkles, CheckCircle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import type { Ticket } from '@/types';

const mockTicket: Ticket = {
  id: 1,
  title: '电梯故障维修',
  description: '3号楼2单元电梯出现异响，运行过程中有明显的震动和摩擦声，已有多位业主反映此问题。电梯型号为XX品牌XX型号，安装于2018年。',
  status: 'processing',
  priority: 'high',
  category: '设施维修',
  progress: 60,
  createdAt: '2024-01-15 09:30',
  updatedAt: '2024-01-15 14:00',
  assignee: '物业小王',
  reporter: '业主张三',
  buildingId: 3,
};

const statusConfig = {
  pending: { label: '待处理', bg: 'bg-accent-yellow-100', text: 'text-accent-yellow-700' },
  processing: { label: '处理中', bg: 'bg-primary-100', text: 'text-primary-700' },
  completed: { label: '已完成', bg: 'bg-accent-green-100', text: 'text-accent-green-700' },
  cancelled: { label: '已取消', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const timeline = [
  { time: '2024-01-15 09:30', event: '工单创建', user: '业主张三', completed: true },
  { time: '2024-01-15 09:45', event: '工单已分配', user: '系统自动分派', completed: true, ai: true },
  { time: '2024-01-15 10:00', event: '开始处理', user: '物业小王', completed: true },
  { time: '2024-01-15 14:00', event: '联系维修人员', user: '物业小王', completed: true },
  { time: '2024-01-16 09:00', event: '预计维修完成', user: '维修张师傅', completed: false },
];

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const status = statusConfig[mockTicket.status];

  const handleAIAssign = async () => {
    setAssigning(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAiResult('AI智能分析：根据工单类型（设施维修）、位置（3号楼）和当前物业人员负载，推荐分派给「物业小王」处理。小王负责3-5号楼的设施维修工作，当前待处理工单3件，预计响应时间30分钟。');
    setAssigning(false);
  };

  const confirmAssign = () => {
    alert('已分派给物业小王处理！');
    setShowAssignModal(false);
    setAiResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">工单详情</h1>
          <p className="text-gray-500 mt-1">工单编号 #{id}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 font-serif">{mockTicket.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`badge ${status.bg} ${status.text}`}>{status.label}</span>
              <span className="badge bg-secondary-100 text-secondary-700">{mockTicket.category}</span>
            </div>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            智能分派
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">报修人</p>
              <p className="text-sm font-medium text-gray-900">{mockTicket.reporter}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">处理人</p>
              <p className="text-sm font-medium text-gray-900">{mockTicket.assignee || '未分配'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">创建时间</p>
              <p className="text-sm font-medium text-gray-900">{mockTicket.createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">更新时间</p>
              <p className="text-sm font-medium text-gray-900">{mockTicket.updatedAt}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-2">问题描述</h3>
          <p className="text-gray-600 leading-relaxed">{mockTicket.description}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">处理进度</h3>
            <span className="text-sm font-medium text-primary-600">{mockTicket.progress}%</span>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill" style={{ width: `${mockTicket.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">处理流程</h3>
        <div className="space-y-6">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.completed ? 'bg-accent-green-100 text-accent-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                {idx < timeline.length - 1 && (
                  <div className={`w-0.5 flex-1 ${item.completed ? 'bg-accent-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{item.event}</h4>
                  {item.ai && (
                    <span className="badge bg-secondary-100 text-secondary-700 text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI自动
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{item.user}</p>
                <p className="text-xs text-gray-400 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAiResult(null);
        }}
        onConfirm={confirmAssign}
        title="AI智能分派"
        message={aiResult || '是否启动AI智能分派功能？系统将根据工单类型、位置和人员负载自动推荐最佳处理人。'}
        confirmText="确认分派"
        cancelText="取消"
        type="info"
      />

      {showAssignModal && !aiResult && !assigning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <button
            onClick={handleAIAssign}
            className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
          >
            <Sparkles className="w-6 h-6" />
            启动AI智能分派
          </button>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center">
            <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium text-gray-900">AI正在分析...</p>
            <p className="text-sm text-gray-500 mt-2">正在为您匹配最佳处理人</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
