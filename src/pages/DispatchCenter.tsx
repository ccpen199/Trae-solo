import { useState } from 'react';
import { ClipboardList, User, MapPin, Calendar, Home, ChevronRight } from 'lucide-react';
import { dispatchTasks } from '@/mock/data';
import type { DispatchTask } from '@/types';

const tabs = [
  { key: 'unassigned', label: '待分配' },
  { key: 'assigned', label: '已分配' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
] as const;

const intentBadge = (strength: string) => {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-emerald-100 text-emerald-700',
  };
  const labelMap: Record<string, string> = { high: '高意向', medium: '中意向', low: '低意向' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[strength] || ''}`}>
      {labelMap[strength] || strength}
    </span>
  );
};

const statusLabel: Record<string, string> = {
  unassigned: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-surface-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-surface-600 font-medium">{score}</span>
    </div>
  );
}

export default function DispatchCenter() {
  const [activeTab, setActiveTab] = useState<string>('unassigned');
  const [selectedTask, setSelectedTask] = useState<DispatchTask | null>(null);

  const filtered = dispatchTasks.filter((t) => t.status === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary-500" />
        <h2 className="text-xl font-bold text-primary-800">调度中心</h2>
      </div>

      <div className="flex gap-1 bg-surface-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedTask(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-surface-50 text-primary-700 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-surface-400">暂无{statusLabel[activeTab]}任务</div>
          )}
          {filtered.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`bg-surface-50 rounded-xl p-4 shadow-card border cursor-pointer transition-all hover:shadow-card-hover ${
                selectedTask?.id === task.id ? 'border-primary-300 ring-1 ring-primary-200' : 'border-surface-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-surface-400" />
                  <span className="font-semibold text-primary-800">{task.clientName}</span>
                  {intentBadge(task.intentStrength)}
                </div>
                <span className="text-xs text-surface-400">{statusLabel[task.status]}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-surface-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {task.scheduledTime}
                </span>
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  {task.propertyIds.length}套房源
                </span>
              </div>
            </div>
          ))}
        </div>

        <div>
          {selectedTask ? (
            <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200 sticky top-4">
              <h3 className="text-base font-semibold text-primary-800 mb-1">
                匹配经纪人
              </h3>
              <p className="text-xs text-surface-400 mb-4">
                为 {selectedTask.clientName} 推荐的经纪人
              </p>
              <div className="space-y-4">
                {selectedTask.matchedAgents.map((agent, idx) => (
                  <div
                    key={agent.agentId}
                    className={`p-3 rounded-lg border ${
                      idx === 0 ? 'border-primary-200 bg-primary-50/50' : 'border-surface-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-surface-800">{agent.agentName}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-surface-400">
                        <MapPin className="w-3 h-3" />
                        {agent.distance}km
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-2">
                      <ScoreBar label="距离匹配" score={agent.distanceScore} color="#3FA3A3" />
                      <ScoreBar label="意向匹配" score={agent.intentMatchScore} color="#D4A843" />
                      <ScoreBar label="成交匹配" score={agent.transactionRateScore} color="#0D4F4F" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                      <span className="text-xs text-surface-400">综合评分</span>
                      <span className="text-lg font-bold text-primary-600">{agent.totalScore}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1">
                分配经纪人 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-surface-50 rounded-xl p-8 shadow-card border border-surface-200 text-center text-surface-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p className="text-sm">点击左侧任务查看匹配经纪人</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
