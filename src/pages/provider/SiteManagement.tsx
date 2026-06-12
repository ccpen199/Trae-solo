import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, Upload, MessageSquare, FileText, AlertTriangle,
  MapPin, User, Calendar, Clock, Camera, Building2, Wrench,
  CheckCircle2, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Tabs, Input, Avatar, Progress, Tag, Badge, Empty } from 'antd';

type SiteStatus = 'all' | 'ongoing' | 'acceptance' | 'completed';
type Stage = '水电' | '泥瓦' | '木工' | '油漆' | '安装';

interface Site {
  id: number;
  name: string;
  ownerName: string;
  ownerAvatar: string;
  address: string;
  currentStage: Stage;
  plannedProgress: number;
  actualProgress: number;
  inspectionCount: number;
  dailyLogCount: number;
  photoCount: number;
  status: SiteStatus;
  warnings: string[];
  startDate: string;
  plannedDays: number;
  manager: string;
}

const mockSites: Site[] = [
  {
    id: 1,
    name: '阳光花园3栋全屋整装',
    ownerName: '张女士',
    ownerAvatar: 'Z',
    address: '阳光花园·3栋·2301',
    currentStage: '油漆',
    plannedProgress: 80,
    actualProgress: 75,
    inspectionCount: 8,
    dailyLogCount: 45,
    photoCount: 186,
    status: 'ongoing',
    warnings: ['进度延期5天'],
    startDate: '2024-03-20',
    plannedDays: 75,
    manager: '张工',
  },
  {
    id: 2,
    name: '滨江壹号大平层装修',
    ownerName: '王先生',
    ownerAvatar: 'W',
    address: '滨江壹号·5栋·1202',
    currentStage: '安装',
    plannedProgress: 100,
    actualProgress: 100,
    inspectionCount: 12,
    dailyLogCount: 88,
    photoCount: 342,
    status: 'acceptance',
    warnings: [],
    startDate: '2024-02-10',
    plannedDays: 120,
    manager: '李工',
  },
  {
    id: 3,
    name: '绿城春江月三居室',
    ownerName: '李先生',
    ownerAvatar: 'L',
    address: '绿城春江月·7栋·803',
    currentStage: '泥瓦',
    plannedProgress: 50,
    actualProgress: 42,
    inspectionCount: 5,
    dailyLogCount: 28,
    photoCount: 98,
    status: 'ongoing',
    warnings: ['防水工程待验收整改'],
    startDate: '2024-05-01',
    plannedDays: 65,
    manager: '王工',
  },
  {
    id: 4,
    name: '万科城六期精装修',
    ownerName: '赵女士',
    ownerAvatar: 'Z',
    address: '万科城六期·2栋·1501',
    currentStage: '安装',
    plannedProgress: 100,
    actualProgress: 100,
    inspectionCount: 8,
    dailyLogCount: 42,
    photoCount: 168,
    status: 'completed',
    warnings: [],
    startDate: '2024-02-20',
    plannedDays: 45,
    manager: '张工',
  },
  {
    id: 5,
    name: '江南府精装改造',
    ownerName: '刘女士',
    ownerAvatar: 'L',
    address: '江南府·10栋·1806',
    currentStage: '水电',
    plannedProgress: 25,
    actualProgress: 28,
    inspectionCount: 3,
    dailyLogCount: 15,
    photoCount: 62,
    status: 'ongoing',
    warnings: [],
    startDate: '2024-06-01',
    plannedDays: 90,
    manager: '李工',
  },
  {
    id: 6,
    name: '保利时光印象三居室',
    ownerName: '周女士',
    ownerAvatar: 'Z',
    address: '保利时光印象·6栋·905',
    currentStage: '木工',
    plannedProgress: 60,
    actualProgress: 60,
    inspectionCount: 6,
    dailyLogCount: 32,
    photoCount: 124,
    status: 'ongoing',
    warnings: [],
    startDate: '2024-04-15',
    plannedDays: 70,
    manager: '王工',
  },
];

const stageConfig: Record<Stage, { color: string; bg: string; border: string; icon: typeof Wrench }> = {
  水电: { color: 'text-haze-700', bg: 'bg-haze-50', border: 'border-haze-300', icon: Wrench },
  泥瓦: { color: 'text-terracotta-700', bg: 'bg-terracotta-50', border: 'border-terracotta-300', icon: Building2 },
  木工: { color: 'text-wood-700', bg: 'bg-wood-50', border: 'border-wood-300', icon: Building2 },
  油漆: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: Wrench },
  安装: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: CheckCircle2 },
};

const statusMap: Record<SiteStatus, { label: string; color: string }> = {
  all: { label: '全部工地', color: '#C4623A' },
  ongoing: { label: '进行中', color: '#6B8E9F' },
  acceptance: { label: '待验收', color: '#F59E0B' },
  completed: { label: '已完成', color: '#10B981' },
};

const SiteManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SiteStatus>('all');
  const [searchText, setSearchText] = useState('');

  const filteredSites = useMemo(() => {
    return mockSites.filter(
      (s) =>
        (activeTab === 'all' || s.status === activeTab) &&
        (!searchText ||
          s.name.includes(searchText) ||
          s.ownerName.includes(searchText) ||
          s.address.includes(searchText))
    );
  }, [activeTab, searchText]);

  const tabCounts = {
    all: mockSites.length,
    ongoing: mockSites.filter(s => s.status === 'ongoing').length,
    acceptance: mockSites.filter(s => s.status === 'acceptance').length,
    completed: mockSites.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="section-title">工地管理</h1>
        <p className="text-ivory-600">
          活跃工地 {tabCounts.ongoing} 个 · 待验收 {tabCounts.acceptance} 个 · 本月延期预警 {mockSites.filter(s => s.warnings.length > 0).length} 个
        </p>
      </div>

      <div className="card-base overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-4 pb-0 flex-wrap">
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as SiteStatus)}
            items={(['all', 'ongoing', 'acceptance', 'completed'] as SiteStatus[]).map((key) => ({
              key,
              label: (
                <span className="flex items-center gap-2 py-1 px-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusMap[key].color }}
                  />
                  {statusMap[key].label}
                  <Badge
                    count={tabCounts[key]}
                    showZero
                    className="[&_.ant-badge-count]:!bg-ivory-100 [&_.ant-badge-count]:!text-ivory-700 [&_.ant-badge-count]:!shadow-none [&_.ant-badge-count]:!text-xs [&_.ant-badge-count-sm]:!px-2"
                  />
                </span>
              ),
            }))}
            className="[&_.ant-tabs-nav]:!m-0 [&_.ant-tabs-ink-bar]:!bg-terracotta-500 [&_.ant-tabs-tab-active]:!text-terracotta-600"
          />
          <div className="flex-1 max-w-xs min-w-[240px]">
            <Input
              prefix={<Search className="w-4 h-4 text-ivory-400" />}
              placeholder="搜索项目/业主/地址"
              className="!rounded-btn"
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredSites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSites.map((site, idx) => {
            const stage = stageConfig[site.currentStage];
            const StageIcon = stage.icon;
            const isDelayed = site.actualProgress < site.plannedProgress;
            const isAhead = site.actualProgress > site.plannedProgress;

            return (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className="card-base overflow-hidden group"
              >
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-serif font-semibold text-carbon-800 line-clamp-1 mb-1.5 group-hover:text-terracotta-600 transition-colors">
                        {site.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Avatar size={18} className="!bg-terracotta-400 !text-white !text-[10px]">
                          {site.ownerAvatar}
                        </Avatar>
                        <span className="text-sm text-carbon-700 font-medium">{site.ownerName}</span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl ${stage.bg} ${stage.border} border`}>
                      <div className={`flex items-center gap-1.5 ${stage.color}`}>
                        <StageIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{site.currentStage}阶段</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-ivory-600 mb-4 px-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{site.address}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-ivory-600">施工进度</span>
                      <div className="flex items-center gap-2">
                        {isDelayed ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-100">
                            <TrendingDown className="w-3 h-3" />
                            延期{site.plannedProgress - site.actualProgress}%
                          </span>
                        ) : isAhead ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">
                            <TrendingUp className="w-3 h-3" />
                            超前{site.actualProgress - site.plannedProgress}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-ivory-600 bg-ivory-100 px-1.5 py-0.5 rounded text-[10px]">
                            进度正常
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative h-7">
                      <div className="absolute inset-x-0 top-1 h-2 rounded-full bg-ivory-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${site.plannedProgress}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + idx * 0.05 }}
                          className="h-full bg-ivory-300/70 rounded-full"
                        />
                      </div>
                      <div className="absolute inset-x-0 top-1 h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${site.actualProgress}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + idx * 0.05 }}
                          className={`h-full rounded-full ${
                            isDelayed
                              ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                              : isAhead
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                              : 'bg-gradient-to-r from-terracotta-400 to-terracotta-500'
                          } shadow-sm`}
                        />
                      </div>
                      <div className="absolute inset-x-0 top-4 flex items-center justify-between text-[10px]">
                        <span className="text-ivory-500">
                          计划 <span className="font-mono text-ivory-700">{site.plannedProgress}%</span>
                        </span>
                        <span className={`font-mono font-semibold ${
                          isDelayed ? 'text-rose-600' : isAhead ? 'text-emerald-600' : 'text-terracotta-600'
                        }`}>
                          实际 {site.actualProgress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-ivory-100 mb-4">
                    {[
                      { icon: FileText, value: site.inspectionCount, label: '巡检', unit: '次' },
                      { icon: Calendar, value: site.dailyLogCount, label: '日志', unit: '天' },
                      { icon: Camera, value: site.photoCount, label: '照片', unit: '张' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <item.icon className="w-3.5 h-3.5 text-ivory-500" />
                          <span className="font-mono font-bold text-carbon-800 text-sm">
                            {item.value}
                          </span>
                          <span className="text-[10px] text-ivory-500">{item.unit}</span>
                        </div>
                        <span className="text-[11px] text-ivory-500">{item.label}记录</span>
                      </div>
                    ))}
                  </div>

                  {site.warnings.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-rose-50/80 to-amber-50/50 border border-rose-200/60">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {site.warnings.map((w, i) => (
                            <p key={i} className="text-xs text-rose-700 font-medium">{w}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-ivory-600 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      项目经理 {site.manager}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      计划{site.plannedDays}天
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => navigate(`/provider/sites/${site.id}/log`)}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl hover:bg-haze-50 text-ivory-600 hover:text-haze-700 transition-colors"
                    >
                      <FileText className="w-4.5 h-4.5" />
                      <span className="text-[11px] font-medium">查看日志</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl hover:bg-terracotta-50 text-ivory-600 hover:text-terracotta-700 transition-colors">
                      <Upload className="w-4.5 h-4.5" />
                      <span className="text-[11px] font-medium">上传巡检</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl hover:bg-wood-50 text-ivory-600 hover:text-wood-700 transition-colors">
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span className="text-[11px] font-medium">业主沟通</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card-base py-20">
          <Empty
            description={
              <div>
                <p className="text-carbon-600 font-medium mb-1">没有找到匹配的工地</p>
                <p className="text-xs text-ivory-500">试试调整筛选条件或搜索关键词</p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default SiteManagement;
