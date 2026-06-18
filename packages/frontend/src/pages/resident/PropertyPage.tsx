import { useState } from 'react';
import {
  DoorOpen,
  CreditCard,
  Wrench,
  MessageCircleWarning,
  Bell,
  Plus,
  CheckCircle,
  Clock,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import type { RepairStatus } from '@neighborhood/shared';

type PropertyTab = 'quick' | 'access' | 'bills' | 'repairs' | 'complaints' | 'notifications';

export default function PropertyPage() {
  const [tab, setTab] = useState<PropertyTab>('quick');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: DoorOpen, label: '门禁开门', tab: 'access' as PropertyTab, color: 'bg-blue-100 text-blue-600' },
          { icon: CreditCard, label: '缴费', tab: 'bills' as PropertyTab, color: 'bg-green-100 text-green-600' },
          { icon: Wrench, label: '报修', tab: 'repairs' as PropertyTab, color: 'bg-orange-100 text-orange-600' },
          { icon: MessageCircleWarning, label: '投诉', tab: 'complaints' as PropertyTab, color: 'bg-red-100 text-red-600' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setTab(item.tab)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {([
          { key: 'quick', label: '快捷' },
          { key: 'access', label: '门禁' },
          { key: 'bills', label: '缴费' },
          { key: 'repairs', label: '报修' },
          { key: 'complaints', label: '投诉' },
          { key: 'notifications', label: '通知' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'quick' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">门禁设备</h3>
            <div className="space-y-2">
              {['3号楼大门', '地下车库入口'].map((device) => (
                <div key={device} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">{device}</span>
                    <StatusBadge status="online" label="在线" />
                  </div>
                  <button className="btn-primary text-xs px-3 py-1">开门</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">待缴费</h3>
            <div className="text-sm text-gray-500">暂无待缴费账单</div>
          </div>
        </div>
      )}

      {tab === 'access' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">门禁管理</h3>
          {['3号楼大门', '地下车库入口', '单元门'].map((device) => (
            <div key={device} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{device}</p>
                <p className="text-xs text-gray-400 mt-0.5">设备编号：ACC-{device.length}001</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="online" label="在线" />
                <button className="btn-primary text-xs px-3 py-1">远程开门</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bills' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">缴费管理</h3>
          <div className="flex gap-2 mb-2">
            <button className="px-3 py-1 rounded-full text-sm bg-primary-600 text-white">未缴</button>
            <button className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">已缴</button>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">物业费 - 2024年{i}月</p>
                <p className="text-xs text-gray-400 mt-0.5">到期日：2024-0{i + 1}-15</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">¥{(200 + i * 50).toFixed(2)}</span>
                <button className="btn-primary text-xs px-3 py-1">缴费</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'repairs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">报修管理</h3>
            <button className="btn-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />
              提交报修
            </button>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">水管漏水</p>
                <StatusBadge status={i === 1 ? 'in_progress' : 'completed'} />
              </div>
              <p className="text-xs text-gray-500">厨房水管接口处渗水，需要维修</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>2024-01-{10 + i}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'complaints' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">投诉管理</h3>
            <button className="btn-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />
              提交投诉
            </button>
          </div>
          {[1].map((i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">噪音扰民</p>
                <StatusBadge status="processing" />
              </div>
              <p className="text-xs text-gray-500">楼上邻居深夜装修噪音严重</p>
              <div className="mt-2 text-xs text-gray-400">2024-01-12</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">社区通知</h3>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-community-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {i === 1 ? '停水通知' : i === 2 ? '电梯维保通知' : '社区活动通知'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {i === 1
                      ? '因管道维修，1月15日8:00-12:00将暂停供水'
                      : i === 2
                      ? '2号电梯将于1月16日进行年度维保'
                      : '社区春节联欢晚会报名开始'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2024-01-{10 + i}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
