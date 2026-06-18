import { useState } from 'react';
import {
  CheckCircle,
  Gift,
  Share2,
  MessageSquare,
  Star,
  Copy,
} from 'lucide-react';
import { SIGN_IN_REWARDS, INVITE_REWARD, REVIEW_REWARD } from '@neighborhood/shared';

export default function TasksPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [continuousDays, setContinuousDays] = useState(3);
  const [copied, setCopied] = useState(false);
  const inviteCode = 'NEIGHBOR_ABC123';

  const handleSignIn = () => {
    setSignedIn(true);
    setContinuousDays(continuousDays + 1);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tasks = [
    {
      icon: CheckCircle,
      name: '每日签到',
      reward: `¥${SIGN_IN_REWARDS[continuousDays % 7]}`,
      progress: signedIn ? 1 : 0,
      total: 1,
      completed: signedIn,
    },
    {
      icon: Share2,
      name: '邀请好友',
      reward: `¥${INVITE_REWARD}`,
      progress: 2,
      total: 5,
      completed: false,
    },
    {
      icon: Star,
      name: '评价订单',
      reward: `¥${REVIEW_REWARD}`,
      progress: 1,
      total: 1,
      completed: true,
    },
    {
      icon: MessageSquare,
      name: '分享话题',
      reward: '¥0.2',
      progress: 0,
      total: 1,
      completed: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">每日签到</h2>
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
            连续 {continuousDays} 天
          </span>
        </div>
        <div className="flex justify-between mb-4">
          {SIGN_IN_REWARDS.map((reward, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center ${
                idx < continuousDays ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < continuousDays
                    ? 'bg-white text-orange-500'
                    : 'bg-white/20 text-white'
                }`}
              >
                {idx < continuousDays ? '✓' : `+${reward}`}
              </div>
              <span className="text-[10px] mt-1">第{idx + 1}天</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleSignIn}
          disabled={signedIn}
          className="w-full py-2.5 bg-white text-orange-500 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signedIn ? '已签到' : '立即签到'}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">任务列表</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.name} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <task.icon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{task.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bg-primary-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (task.progress / task.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {task.progress}/{task.total}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-red-500">{task.reward}</span>
              </div>
              {task.completed && (
                <span className="badge-green">已完成</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">邀请好友</h3>
        <p className="text-sm text-gray-500 mb-3">
          邀请好友注册，双方均可获得奖励
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono">
            {inviteCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <Copy className="w-4 h-4" />
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
    </div>
  );
}
