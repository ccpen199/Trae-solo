import { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  Eye,
  Send,
  Edit,
  Trash2,
  Pin,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { emergencyLevelLabels, districts } from '@shared/types';
import type { EmergencyInfo, EmergencyLevel, EmergencyStatus } from '@shared/types';
import { cn } from '@/lib/utils';

const emergencyTypes = ['停水通知', '停电通知', '停气通知', '天气预警', '交通管制', '疫情防控', '突发事件'];

const levelColors: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  normal: 'bg-slate-500',
};

const levelBgColors: Record<string, string> = {
  red: 'bg-red-50 border-red-200',
  orange: 'bg-orange-50 border-orange-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  normal: 'bg-slate-50 border-slate-200',
};

const levelTextColors: Record<string, string> = {
  red: 'text-red-700',
  orange: 'text-orange-700',
  yellow: 'text-yellow-700',
  normal: 'text-slate-700',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  expired: '已过期',
};

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
};

export default function EmergencyManagement() {
  const [selectedLevel, setSelectedLevel] = useState<EmergencyLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EmergencyStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const mockEmergencies: EmergencyInfo[] = [
    {
      id: 'e1',
      title: '暴雨黄色预警信号',
      content: '徐州市气象台发布暴雨黄色预警信号：预计未来12小时内我市大部分地区将出现50毫米以上降水，局部地区可达100毫米以上，并伴有雷暴大风等强对流天气。请做好防范准备。',
      level: 'yellow',
      type: '天气预警',
      targetAreas: ['全市'],
      isPinned: true,
      status: 'published',
      publishTime: '2024-06-20 08:30:00',
      createTime: '2024-06-20 08:00:00',
      creatorId: '1',
      creatorName: '气象局',
      reachCount: 856432,
    },
    {
      id: 'e2',
      title: '鼓楼区供水管道维修停水通知',
      content: '因供水主管道老化更换施工，定于6月20日9时至17时，鼓楼区中山北路沿线区域将暂停供水。请相关用户提前做好储水准备，施工期间给您带来不便，敬请谅解。服务热线：96110。',
      level: 'orange',
      type: '停水通知',
      targetAreas: ['鼓楼区'],
      isPinned: false,
      status: 'published',
      publishTime: '2024-06-19 16:00:00',
      createTime: '2024-06-19 14:30:00',
      creatorId: '2',
      creatorName: '水务局',
      reachCount: 125680,
    },
    {
      id: 'e3',
      title: '高温红色预警信号',
      content: '徐州市气象台发布高温红色预警信号：预计未来24小时内我市最高气温将升至40℃以上。请做好防暑降温工作，减少户外活动。',
      level: 'red',
      type: '天气预警',
      targetAreas: ['全市'],
      isPinned: true,
      status: 'expired',
      publishTime: '2024-06-15 10:00:00',
      expireTime: '2024-06-16 20:00:00',
      createTime: '2024-06-15 09:00:00',
      creatorId: '1',
      creatorName: '气象局',
      reachCount: 1256000,
    },
    {
      id: 'e4',
      title: '云龙区变电站检修停电公告',
      content: '因电网升级改造，定于6月22日7时至19时，云龙区和平大道沿线区域将暂停供电。请相关用户提前做好准备，施工期间给您带来不便，敬请谅解。供电服务热线：95598。',
      level: 'orange',
      type: '停电通知',
      targetAreas: ['云龙区'],
      isPinned: false,
      status: 'draft',
      createTime: '2024-06-20 10:15:00',
      creatorId: '3',
      creatorName: '供电公司',
      reachCount: 0,
    },
    {
      id: 'e5',
      title: '东三环快速路交通管制通告',
      content: '因东三环快速路扩建工程施工，定于6月23日至6月30日，每日22时至次日6时，对东三环快速路部分路段实施交通管制。请过往车辆注意绕行。',
      level: 'yellow',
      type: '交通管制',
      targetAreas: ['云龙区', '贾汪区'],
      isPinned: false,
      status: 'published',
      publishTime: '2024-06-18 09:00:00',
      createTime: '2024-06-17 16:00:00',
      creatorId: '4',
      creatorName: '交通局',
      reachCount: 356780,
    },
    {
      id: 'e6',
      title: '燃气管道改造施工通知',
      content: '因燃气管道改造施工，定于6月21日14时至22时，鼓楼区民主路附近区域将暂停供气。请相关用户关闭好燃气阀门，注意安全。燃气服务热线：95577。',
      level: 'normal',
      type: '停气通知',
      targetAreas: ['鼓楼区'],
      isPinned: false,
      status: 'published',
      publishTime: '2024-06-19 10:00:00',
      createTime: '2024-06-18 14:00:00',
      creatorId: '5',
      creatorName: '燃气公司',
      reachCount: 45230,
    },
  ];

  const filteredEmergencies = mockEmergencies.filter((e) => {
    if (selectedLevel !== 'all' && e.level !== selectedLevel) return false;
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
    if (selectedType !== 'all' && e.type !== selectedType) return false;
    if (keyword && !e.title.includes(keyword) && !e.content.includes(keyword)) return false;
    return true;
  });

  const stats = [
    { label: '全部应急', value: mockEmergencies.length, color: 'text-slate-700' },
    { label: '已发布', value: mockEmergencies.filter(e => e.status === 'published').length, color: 'text-green-600' },
    { label: '红色预警', value: mockEmergencies.filter(e => e.level === 'red').length, color: 'text-red-600' },
    { label: '橙色预警', value: mockEmergencies.filter(e => e.level === 'orange').length, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="应急管理中心"
        description="应急信息强制置顶与定向区域推送管理"
        actions={
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            发布应急信息
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-card p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索应急信息..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as EmergencyLevel | 'all')}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部等级</option>
            {Object.entries(emergencyLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as EmergencyStatus | 'all')}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部类型</option>
            {emergencyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredEmergencies.map((emergency) => (
            <div
              key={emergency.id}
              className={cn(
                'p-4 rounded-xl border-2 transition-all hover:shadow-sm',
                levelBgColors[emergency.level]
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('w-3 h-3 rounded-full mt-1.5 flex-shrink-0', levelColors[emergency.level])}>
                    {emergency.isPinned && (
                      <div className={cn('absolute w-3 h-3 rounded-full animate-ping', levelColors[emergency.level])}></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn('font-semibold', levelTextColors[emergency.level])}>
                        {emergency.title}
                      </h3>
                      {emergency.isPinned && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                          <Pin className="w-3 h-3" />
                          置顶
                        </span>
                      )}
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColors[emergency.status])}>
                        {statusLabels[emergency.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{emergency.content}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {emergency.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {emergency.targetAreas.join('、')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {emergency.creatorName}
                      </span>
                      {emergency.publishTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {emergency.publishTime}
                        </span>
                      )}
                      {emergency.status === 'published' && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          触达 {emergency.reachCount.toLocaleString()} 人
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {emergency.status === 'draft' && (
                    <button
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="发布"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredEmergencies.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p>暂无符合条件的应急信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
