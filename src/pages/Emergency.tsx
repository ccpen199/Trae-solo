import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  Phone,
  ShieldAlert,
  Info,
  AlertCircle,
  Flame,
  Droplets,
  Wind,
  ThermometerSun,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import AlertLevelChip, { type AlertLevel } from '@/components/AlertLevelChip';
import { type AlertItem } from '@/store';
import { cn } from '@/lib/utils';
import { normalizeAlertItem, unwrapApiData } from '@/lib/api';

interface EmergencyGuide {
  id: string;
  title: string;
  icon: any;
  color: string;
  steps: string[];
}

const emergencyGuides: EmergencyGuide[] = [
  {
    id: 'fire',
    title: '火灾逃生指南',
    icon: Flame,
    color: 'text-red-500',
    steps: [
      '发现火情立即拨打119报警，清晰说明地点和火势',
      '保持冷静，判断火势，选择安全出口迅速撤离',
      '用湿毛巾捂住口鼻，低姿匍匐前行，避免吸入浓烟',
      '如无法撤离，关闭门窗用湿物封堵，在窗口挥舞鲜艳物品呼救',
    ],
  },
  {
    id: 'flood',
    title: '暴雨防汛指南',
    icon: Droplets,
    color: 'text-blue-500',
    steps: [
      '关注天气预报和预警信息，提前做好防范准备',
      '关闭门窗，防止雨水进屋，切断低洼地带有危险的电源',
      '如遇积水，不要贸然涉水，注意避开井盖、电线杆等危险区域',
      '如被困高处，保存体力，及时拨打110或119求助',
    ],
  },
  {
    id: 'typhoon',
    title: '台风防护指南',
    icon: Wind,
    color: 'text-cyan-500',
    steps: [
      '台风来临前关好门窗，加固易被风吹动的搭建物',
      '储备足够的食物、饮用水和应急用品',
      '尽量不要外出，远离大树、广告牌、铁塔等危险物',
      '如在户外，就近寻找坚固建筑物躲避，切勿在临时构筑物下停留',
    ],
  },
  {
    id: 'heat',
    title: '高温防暑指南',
    icon: ThermometerSun,
    color: 'text-warm-500',
    steps: [
      '高温时段尽量减少户外活动，外出做好防晒措施',
      '多喝水，适量补充盐分和矿物质，避免饮用含酒精或大量糖分的饮料',
      '注意室内降温通风，合理使用空调，温度不宜过低',
      '如出现头晕、恶心等中暑症状，立即转移到阴凉通风处，严重时及时就医',
    ],
  },
];

const levelConfig = {
  blue: { label: '蓝色预警（一般）', desc: 'IV级', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info },
  yellow: { label: '黄色预警（较重）', desc: 'III级', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertCircle },
  orange: { label: '橙色预警（严重）', desc: 'II级', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  red: { label: '红色预警（特别严重）', desc: 'I级', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert },
};

const mockAlerts: AlertItem[] = [
  { id: 'a1', level: 'red', title: '暴雨红色预警信号', content: '盐城市气象台2025年06月20日08时30分升级发布暴雨红色预警信号：预计未来3小时内我市亭湖区、盐都区、城南新区、开发区将出现100毫米以上降水，并可能伴有短时强降水、雷暴大风等强对流天气。请特别注意防范！', timestamp: '2025-06-20 08:30' },
  { id: 'a2', level: 'orange', title: '高温橙色预警信号', content: '预计今天白天我市最高气温可达37-39度，市应急管理局、市气象局联合发布高温橙色预警。', timestamp: '2025-06-20 07:00' },
  { id: 'a3', level: 'yellow', title: '雷暴大风黄色预警', content: '预计未来6小时内我市大部分地区将出现雷电活动，并可能伴有7-9级雷暴大风和短时强降水。', timestamp: '2025-06-19 18:20' },
  { id: 'a4', level: 'blue', title: '大风蓝色预警信号', content: '预计未来24小时内我市沿海海面将出现平均风力7-8级、阵风9级的大风。', timestamp: '2025-06-19 16:00' },
];

const emergencyContacts = [
  { name: '报警电话', number: '110', desc: '公安报警服务', color: 'from-blue-500 to-blue-600' },
  { name: '火警电话', number: '119', desc: '消防救援服务', color: 'from-red-500 to-red-600' },
  { name: '医疗急救', number: '120', desc: '紧急医疗救援', color: 'from-emerald-500 to-emerald-600' },
  { name: '交通事故', number: '122', desc: '交通事故报警', color: 'from-purple-500 to-purple-600' },
  { name: '政务服务', number: '12345', desc: '政务服务热线', color: 'from-gov-500 to-gov-600' },
  { name: '气象服务', number: '12121', desc: '天气预报查询', color: 'from-cyan-500 to-cyan-600' },
];

export default function Emergency() {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [activeLevel, setActiveLevel] = useState<AlertLevel | 'all'>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const payload = await res.json() as any;
          const alerts = unwrapApiData<any[]>(payload);
          if (Array.isArray(alerts) && alerts.length > 0) {
            setAlerts(alerts.map(normalizeAlertItem));
          }
        }
      } catch {
        /* use mock */
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = activeLevel === 'all' ? alerts : alerts.filter((a) => a.level === activeLevel);

  return (
    <div>
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-yellow-400 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <Link to="/" className="hover:text-white transition-colors">首页</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">应急预警</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                <ShieldAlert className="w-9 h-9 md:w-10 md:h-10" />
                应急预警中心
              </h1>
              <p className="text-white/80 text-base">及时获取预警信息，掌握应急处置知识，守护您的生命财产安全</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['red', 'orange', 'yellow', 'blue'] as AlertLevel[]).slice(0, 3).map((level) => {
                const count = alerts.filter((a) => a.level === level).length;
                return (
                  <div key={level} className="text-center bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                    <AlertLevelChip level={level} size="sm" showIcon={false} />
                    <p className="text-2xl font-bold mt-2">{count}</p>
                    <p className="text-xs text-white/70">条预警</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {emergencyContacts.map((c, idx) => (
            <a
              key={c.number}
              href={`tel:${c.number}`}
              className={cn(
                'card p-5 flex items-center gap-4 group hover:-translate-y-0.5',
                'bg-gradient-to-r',
                c.color,
                'text-white border-0 shadow-lg hover:shadow-xl',
              )}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm opacity-90">{c.name}</p>
                <p className="text-3xl font-bold font-mono leading-tight">{c.number}</p>
                <p className="text-xs opacity-80">{c.desc}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-7 h-7 text-red-500" />
                预警通知
              </h2>
              <p className="section-subtitle mb-0">盐城市最新预警信号发布</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveLevel('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeLevel === 'all' ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              全部 ({alerts.length})
            </button>
            {(['red', 'orange', 'yellow', 'blue'] as AlertLevel[]).map((level) => {
              const count = alerts.filter((a) => a.level === level).length;
              return (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    activeLevel === level ? 'ring-2 ring-offset-1' : '',
                  )}
                >
                  <AlertLevelChip level={level} size="sm" />
                  <span className={activeLevel === level ? 'text-white' : 'text-gray-600'}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {filteredAlerts.map((alert, idx) => {
              const config = levelConfig[alert.level];
              const LevelIcon = config.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'card p-5 md:p-6 animate-fade-in-up border-l-4',
                    config.bg,
                    config.border,
                  )}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <AlertLevelChip level={alert.level} size="lg" pulse />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
                        <LevelIcon className={cn('w-5 h-5', alert.level === 'red' && 'text-red-500', alert.level === 'orange' && 'text-orange-500')} />
                        {alert.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-3">{alert.content}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {alert.timestamp}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          盐城市全域
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {config.desc}级响应
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="section-title mb-6">应急处置指南</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {emergencyGuides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <div key={guide.id} className="card p-6 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn('w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center', guide.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">{guide.title}</h3>
                  </div>
                  <ol className="space-y-3">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gov-100 text-gov-700 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed text-sm">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
