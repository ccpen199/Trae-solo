import { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Clock,
  User,
  MapPin,
  Eye,
  Send,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Smartphone,
  MessageSquare,
  Tv,
  Radio,
  Share2,
  BarChart3,
  Calendar,
  ChevronDown,
  Check,
  X,
  ThumbsUp,
  Users,
  SmartphoneIcon,
  MessageCircle,
  Monitors,
  Volume2,
  Heart,
  Filter,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
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

const levelBorderColors: Record<string, string> = {
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
  normal: 'border-l-slate-400',
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

const publishChannels = [
  { key: 'app', label: 'APP推送', icon: Smartphone, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'sms', label: '短信通知', icon: MessageSquare, color: 'bg-green-50 text-green-600 border-green-200' },
  { key: 'tv', label: '电视滚动字幕', icon: Tv, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'radio', label: '广播播报', icon: Radio, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { key: 'social', label: '微博微信', icon: Share2, color: 'bg-red-50 text-red-600 border-red-200' },
];

const pinDurations = [
  { value: '1h', label: '1小时' },
  { value: '3h', label: '3小时' },
  { value: '6h', label: '6小时' },
  { value: '12h', label: '12小时' },
  { value: '24h', label: '24小时' },
  { value: '72h', label: '72小时' },
];

const timeRanges = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '近7天' },
  { value: 'month', label: '近30天' },
  { value: 'all', label: '全部' },
];

interface ExtendedEmergency extends EmergencyInfo {
  channels: string[];
  pinDuration?: string;
  effectiveTime?: string;
  expectedEndTime?: string;
  reachDetail?: {
    pushReach: number;
    appOpenRate: number;
    smsDeliveryRate: number;
    tvViewEstimate: number;
    citizenFeedback: number;
    satisfaction: number;
  };
}

interface FormData {
  title: string;
  content: string;
  level: EmergencyLevel;
  type: string;
  targetAreas: string[];
  isPinned: boolean;
  pinDuration: string;
  channels: string[];
  effectiveTime: string;
  expectedEndTime: string;
}

const defaultFormData: FormData = {
  title: '',
  content: '',
  level: 'yellow',
  type: '天气预警',
  targetAreas: [],
  isPinned: false,
  pinDuration: '6h',
  channels: ['app', 'sms'],
  effectiveTime: '',
  expectedEndTime: '',
};

export default function EmergencyManagement() {
  const [selectedLevel, setSelectedLevel] = useState<EmergencyLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EmergencyStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState<ExtendedEmergency | null>(null);
  const [showReachPanel, setShowReachPanel] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const togglePin = (emergency: ExtendedEmergency) => {
    emergency.isPinned = !emergency.isPinned;
    setEmergencies([...emergencies]);
  };

  const mockEmergencies: ExtendedEmergency[] = [
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
      channels: ['app', 'sms', 'tv', 'radio'],
      pinDuration: '6h',
      effectiveTime: '2024-06-20 08:30:00',
      expectedEndTime: '2024-06-20 20:30:00',
      reachDetail: {
        pushReach: 680000,
        appOpenRate: 42.5,
        smsDeliveryRate: 96.8,
        tvViewEstimate: 1200000,
        citizenFeedback: 326,
        satisfaction: 92,
      },
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
      channels: ['app', 'sms'],
      effectiveTime: '2024-06-20 09:00:00',
      expectedEndTime: '2024-06-20 17:00:00',
      reachDetail: {
        pushReach: 95000,
        appOpenRate: 38.2,
        smsDeliveryRate: 98.5,
        tvViewEstimate: 0,
        citizenFeedback: 89,
        satisfaction: 87,
      },
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
      channels: ['app', 'sms', 'tv', 'radio', 'social'],
      pinDuration: '24h',
      reachDetail: {
        pushReach: 980000,
        appOpenRate: 55.6,
        smsDeliveryRate: 97.2,
        tvViewEstimate: 2100000,
        citizenFeedback: 1256,
        satisfaction: 95,
      },
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
      channels: ['app'],
      effectiveTime: '2024-06-22 07:00:00',
      expectedEndTime: '2024-06-22 19:00:00',
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
      channels: ['app', 'radio'],
      effectiveTime: '2024-06-23 22:00:00',
      expectedEndTime: '2024-06-30 06:00:00',
      reachDetail: {
        pushReach: 280000,
        appOpenRate: 31.8,
        smsDeliveryRate: 0,
        tvViewEstimate: 0,
        citizenFeedback: 156,
        satisfaction: 82,
      },
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
      channels: ['app', 'sms'],
      effectiveTime: '2024-06-21 14:00:00',
      expectedEndTime: '2024-06-21 22:00:00',
      reachDetail: {
        pushReach: 35000,
        appOpenRate: 29.4,
        smsDeliveryRate: 97.8,
        tvViewEstimate: 0,
        citizenFeedback: 42,
        satisfaction: 85,
      },
    },
  ];

  const [emergencies, setEmergencies] = useState<ExtendedEmergency[]>(mockEmergencies);

  const filteredEmergencies = emergencies.filter((e) => {
    if (selectedLevel !== 'all' && e.level !== selectedLevel) return false;
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
    if (selectedType !== 'all' && e.type !== selectedType) return false;
    if (selectedDistrict !== 'all' && !e.targetAreas.includes(selectedDistrict) && !e.targetAreas.includes('全市')) return false;
    if (keyword && !e.title.includes(keyword) && !e.content.includes(keyword)) return false;
    return true;
  });

  const stats = [
    { title: '进行中预警', value: emergencies.filter(e => e.status === 'published').length, icon: <AlertTriangle className="w-5 h-5" />, color: 'red' as const },
    { title: '今日发布', value: 2, icon: <Calendar className="w-5 h-5" />, color: 'blue' as const },
    { title: '强制置顶', value: emergencies.filter(e => e.isPinned).length, icon: <Pin className="w-5 h-5" />, color: 'orange' as const },
    { title: '触达人次', value: emergencies.reduce((sum, e) => sum + e.reachCount, 0).toLocaleString(), icon: <Users className="w-5 h-5" />, color: 'green' as const },
  ];

  const openPublishModal = (emergency?: ExtendedEmergency) => {
    if (emergency) {
      setEditingEmergency(emergency);
      setFormData({
        title: emergency.title,
        content: emergency.content,
        level: emergency.level,
        type: emergency.type,
        targetAreas: emergency.targetAreas,
        isPinned: emergency.isPinned,
        pinDuration: emergency.pinDuration || '6h',
        channels: emergency.channels || ['app', 'sms'],
        effectiveTime: emergency.effectiveTime?.slice(0, 16).replace(' ', 'T') || '',
        expectedEndTime: emergency.expectedEndTime?.slice(0, 16).replace(' ', 'T') || '',
      });
    } else {
      setEditingEmergency(null);
      setFormData(defaultFormData);
    }
    setShowPublishModal(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setShowPublishModal(false);
    setFormData(defaultFormData);
    setEditingEmergency(null);
  };

  const toggleArea = (area: string) => {
    if (area === '全市') {
      setFormData({ ...formData, targetAreas: formData.targetAreas.includes('全市') ? [] : ['全市'] });
    } else {
      const areas = formData.targetAreas.filter(a => a !== '全市');
      if (areas.includes(area)) {
        setFormData({ ...formData, targetAreas: areas.filter(a => a !== area) });
      } else {
        setFormData({ ...formData, targetAreas: [...areas, area] });
      }
    }
  };

  const toggleChannel = (key: string) => {
    if (formData.channels.includes(key)) {
      setFormData({ ...formData, channels: formData.channels.filter(c => c !== key) });
    } else {
      setFormData({ ...formData, channels: [...formData.channels, key] });
    }
  };

  const getChannelIcon = (key: string) => {
    const ch = publishChannels.find(c => c.key === key);
    return ch ? ch.icon : Smartphone;
  };

  const getChannelLabel = (key: string) => {
    const ch = publishChannels.find(c => c.key === key);
    return ch ? ch.label : key;
  };

  const getReachTrendOption = () => ({
    grid: { top: 10, right: 10, bottom: 20, left: 30 },
    xAxis: {
      type: 'category',
      data: ['6h', '12h', '18h', '24h', '30h', '36h'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [{
      data: [120000, 350000, 580000, 680000, 720000, 856432],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ],
        },
      },
    }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="应急管理中心"
        description="应急信息强制置顶与定向区域推送管理"
        actions={
          <button
            onClick={() => openPublishModal()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            发布应急信息
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 border border-slate-200">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">预警等级：</span>
            {Object.entries(emergencyLevelLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn('w-3 h-3 rounded-full', levelColors[key])}></span>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">发布渠道：</span>
            {publishChannels.map((ch) => {
              const Icon = ch.icon;
              return (
                <span key={ch.key} className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border', ch.color)}>
                  <Icon className="w-3 h-3" />
                  {ch.label}
                </span>
              );
            })}
          </div>
        </div>
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
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部区域</option>
            <option value="全市">全市</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
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

          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            {timeRanges.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredEmergencies.map((emergency) => (
            <div
              key={emergency.id}
              className={cn(
                'p-5 rounded-xl border-l-4 border transition-all hover:shadow-sm bg-white',
                levelBorderColors[emergency.level],
                levelBgColors[emergency.level]
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className={cn('w-4 h-4 rounded-full mt-1', levelColors[emergency.level])}>
                      {emergency.isPinned && (
                        <div className={cn('absolute inset-0 w-4 h-4 rounded-full animate-ping', levelColors[emergency.level])}></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className={cn('font-semibold text-base', levelTextColors[emergency.level])}>
                        {emergency.title}
                      </h3>
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusColors[emergency.status])}>
                        {statusLabels[emergency.status]}
                      </span>
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded', `bg-white ${levelTextColors[emergency.level]} border border-current`)}>
                        {emergencyLevelLabels[emergency.level]}
                      </span>
                      {emergency.isPinned && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded border border-red-200">
                          <Pin className="w-3 h-3" />
                          置顶
                          {emergency.pinDuration && <span className="ml-0.5">({pinDurations.find(p => p.value === emergency.pinDuration)?.label})</span>}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{emergency.content}</p>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 mr-1">覆盖区域：</span>
                        <div className="flex flex-wrap gap-1">
                          {emergency.targetAreas.map((area) => (
                            <span key={area} className="px-2 py-0.5 text-xs bg-primary-50 text-primary-600 rounded border border-primary-100">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 mr-1">发布渠道：</span>
                        <div className="flex flex-wrap gap-1">
                          {emergency.channels?.map((ch) => {
                            const Icon = getChannelIcon(ch);
                            return (
                              <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-50 text-slate-600 rounded border border-slate-200">
                                <Icon className="w-3 h-3" />
                                {getChannelLabel(ch)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {emergency.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {emergency.creatorName}
                      </span>
                      {emergency.effectiveTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          生效：{emergency.effectiveTime.slice(5, 16)}
                        </span>
                      )}
                      {emergency.status === 'published' && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          触达 {emergency.reachCount.toLocaleString()} 人
                        </span>
                      )}
                    </div>

                    {emergency.status === 'published' && showReachPanel === emergency.id && emergency.reachDetail && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">触达反馈数据</h4>
                            <p className="text-xs text-slate-400">多渠道发布效果追踪</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg text-center">
                            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{(emergency.reachDetail.pushReach / 10000).toFixed(1)}万</p>
                            <p className="text-xs text-slate-500">推送触达数</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg text-center">
                            <SmartphoneIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{emergency.reachDetail.appOpenRate}%</p>
                            <p className="text-xs text-slate-500">APP打开率</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg text-center">
                            <MessageCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{emergency.reachDetail.smsDeliveryRate}%</p>
                            <p className="text-xs text-slate-500">短信送达率</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg text-center">
                            <Monitors className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{(emergency.reachDetail.tvViewEstimate / 10000).toFixed(1)}万</p>
                            <p className="text-xs text-slate-500">电视收视估计</p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg text-center">
                            <MessageSquare className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{emergency.reachDetail.citizenFeedback}</p>
                            <p className="text-xs text-slate-500">市民反馈数</p>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-lg text-center">
                            <Heart className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900">{emergency.reachDetail.satisfaction}%</p>
                            <p className="text-xs text-slate-500">满意度</p>
                          </div>
                        </div>
                        <div className="h-40">
                          <ReactECharts option={getReachTrendOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePin(emergency)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        emergency.isPinned
                          ? 'text-red-500 bg-red-50 hover:bg-red-100'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                      )}
                      title={emergency.isPinned ? '取消置顶' : '强制置顶'}
                    >
                      {emergency.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                    </button>
                    {emergency.status === 'published' && (
                      <button
                        onClick={() => setShowReachPanel(showReachPanel === emergency.id ? null : emergency.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          showReachPanel === emergency.id
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
                        )}
                        title="触达数据"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}
                    {emergency.status === 'draft' && (
                      <button
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="发布"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openPublishModal(emergency)}
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

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingEmergency ? '编辑应急信息' : '发布应急信息'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">请填写应急信息详情并选择发布渠道</p>
              </div>
              <button
                onClick={() => { setShowPublishModal(false); setEditingEmergency(null); setFormData(defaultFormData); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入应急信息标题"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">预警等级</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as EmergencyLevel })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  >
                    {Object.entries(emergencyLevelLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">应急类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  >
                    {emergencyTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">内容详情</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="请详细描述应急信息内容..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-slate-700">强制置顶设置</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600">启用强制置顶</span>
                  </label>
                  {formData.isPinned && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">置顶时长：</span>
                      <select
                        value={formData.pinDuration}
                        onChange={(e) => setFormData({ ...formData, pinDuration: e.target.value })}
                        className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-primary-500 outline-none"
                      >
                        {pinDurations.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-slate-700">定向区域推送</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <button
                    onClick={() => toggleArea('全市')}
                    className={cn(
                      'flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                      formData.targetAreas.includes('全市')
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                    )}
                  >
                    {formData.targetAreas.includes('全市') && <Check className="w-3.5 h-3.5" />}
                    全市
                  </button>
                  {districts.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArea(d)}
                      className={cn(
                        'flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                        formData.targetAreas.includes(d)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                      )}
                    >
                      {formData.targetAreas.includes(d) && <Check className="w-3.5 h-3.5" />}
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-700">发布渠道</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {publishChannels.map((ch) => {
                    const Icon = ch.icon;
                    const selected = formData.channels.includes(ch.key);
                    return (
                      <button
                        key={ch.key}
                        onClick={() => toggleChannel(ch.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all',
                          selected
                            ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <Icon className={cn('w-5 h-5', selected ? 'text-primary-600' : 'text-slate-400')} />
                        <span className="text-xs font-medium">{ch.label}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-primary-600 absolute top-1 right-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">生效时间</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={formData.effectiveTime}
                      onChange={(e) => setFormData({ ...formData, effectiveTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">预计结束时间</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={formData.expectedEndTime}
                      onChange={(e) => setFormData({ ...formData, expectedEndTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => { setShowPublishModal(false); setEditingEmergency(null); setFormData(defaultFormData); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  formData.title.trim() && formData.content.trim()
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-300 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
                {editingEmergency ? '保存修改' : '发布应急信息'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
