import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  ArrowRight,
  X,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ListChecks,
  ChevronRight,
  Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stageFilters = [
  { key: 'all', label: '全部阶段' },
  { key: 'hydropower', label: '🔵 水电改造' },
  { key: 'tile', label: '🟠 泥瓦工程' },
  { key: 'carpentry', label: '🟤 木工工程' },
  { key: 'paint', label: '🎨 油漆工程' },
  { key: 'installation', label: '🔌 安装工程' },
  { key: 'soft', label: '🛋 软装进场' },
];

const riskFilters = [
  { key: 'all', label: '全部风险' },
  { key: 'high', label: '🔴 高风险', color: 'rose' },
  { key: 'medium', label: '🟡 中风险', color: 'amber' },
  { key: 'low', label: '🟢 低风险', color: 'emerald' },
];

const sortOptions = [
  { key: 'hot', label: '热门排行' },
  { key: 'new', label: '最新发布' },
  { key: 'risk', label: '风险等级' },
];

interface PitfallItem {
  id: string;
  title: string;
  summary: string;
  stage: string;
  risk: 'high' | 'medium' | 'low';
  viewCount: number;
  symptoms: string[];
  solutions: { title: string; desc: string }[];
  relatedProcess: string;
  relatedProcessName: string;
  height: number;
}

const pitfalls: PitfallItem[] = [
  {
    id: 'pit1', title: '电路改造10大坑：偷工减料后患无穷',
    summary: '电线不穿管直接埋墙、回路混乱不独立、零线火线接反...这些电路改造坑，轻则跳闸重则火灾！',
    stage: 'hydropower', risk: 'high', viewCount: 185620, height: 340,
    symptoms: ['入住后频繁跳闸', '大功率电器一开就断电', '插座用电笔检测发现接反', '某房间所有插座同时断电'],
    solutions: [
      { title: '1. 材料验收环节', desc: '进场时核对电线品牌/规格，要求使用国标BV线，大功率用4-6平方线，穿线管壁厚≥1.5mm。' },
      { title: '2. 回路规划', desc: '空调、厨房、卫生间、电热水器必须独立回路，每回路空开匹配线径，配电箱做好标识。' },
      { title: '3. 施工验收', desc: '封槽前做绝缘测试(≥0.5MΩ)、相位检测，拍照留存管线走向图，留底至少5年。' },
    ],
    relatedProcess: 'p1', relatedProcessName: '强电回路布设',
  },
  {
    id: 'pit2', title: '卫生间防水没做好？楼下邻居找你索赔',
    summary: '防水只刷一遍、高度不够、闭水试验走过场，这些都可能导致你赔掉几万的装修费！',
    stage: 'hydropower', risk: 'high', viewCount: 152340, height: 360,
    symptoms: ['楼下天花板渗水发霉', '卫生间门外墙面返潮', '瓷砖缝隙持续冒水珠', '墙角踢脚线发黑'],
    solutions: [
      { title: '1. 基层处理', desc: '先找平地面再做防水，管根、墙角做圆弧倒角处理，涂刷防水涂料前充分润湿。' },
      { title: '2. 三遍涂刷工艺', desc: '第一遍横向、第二遍纵向、第三遍重点区域加强，淋浴区≥1.8m高，干区≥30cm高。' },
      { title: '3. 闭水试验', desc: '蓄水3-5cm深，48小时后检查楼下及隔壁墙面，无渗漏才算合格，建议做两次闭水。' },
    ],
    relatedProcess: 'p5', relatedProcessName: '卫生间防水层',
  },
  {
    id: 'pit3', title: '瓷砖空鼓脱落？90%都是因为这3点',
    summary: '贴砖前不泡砖、砂浆比例不对、砖缝留得太窄...入住半年墙砖就开始掉了！',
    stage: 'tile', risk: 'medium', viewCount: 98760, height: 320,
    symptoms: ['敲击瓷砖有空响', '砖缝四周发黑发黄', '瓷砖边角翘起', '墙砖大面积脱落'],
    solutions: [
      { title: '1. 选对铺贴工艺', desc: '地砖推荐薄贴法配齿形刮板，墙砖泡水30分钟阴干后铺贴，大砖必用瓷砖胶。' },
      { title: '2. 留缝标准', desc: '墙砖≥1.5mm、地砖≥2mm，热胀冷缩才不会挤裂，美缝前清缝要彻底。' },
      { title: '3. 空鼓检测', desc: '铺贴24h后用空鼓锤逐块检测，单块空鼓率≤5%，通道位置零空鼓。' },
    ],
    relatedProcess: 'p8', relatedProcessName: '瓷砖薄贴工艺',
  },
  {
    id: 'pit4', title: '插座布局的10个血泪教训',
    summary: '沙发挡住插座、厨房不够插、床头线太短...这就是没提前做点位规划的下场！',
    stage: 'hydropower', risk: 'medium', viewCount: 87432, height: 340,
    symptoms: ['大量使用插排拖线板', '家具遮挡插座无法使用', '床头手机充电线够不到', '厨房小电器轮流插'],
    solutions: [
      { title: '1. 模拟家具摆放', desc: '提前确认家具尺寸，沙发两侧、床头柜上方、电视柜后预留至少2个五孔。' },
      { title: '2. 厨房点位公式', desc: '台面上方30-50cm高度每80cm至少1个五孔，水槽下方预留2个(净水器/垃圾处理器)。' },
      { title: '3. 多留不算错', desc: '全屋插座总数=房间数×5 + 10，宁可多装几个空着，也别后期拉明线。' },
    ],
    relatedProcess: 'p24', relatedProcessName: '开关插座安装',
  },
  {
    id: 'pit5', title: '定制衣柜踩坑？这些增项套路要警惕',
    summary: '报价1万实际2万？板材偷换、五金加价、见光板另算...定制柜水太深了！',
    stage: 'carpentry', risk: 'high', viewCount: 134560, height: 380,
    symptoms: ['实际付款远超报价', '安装后发现板材不对', '抽屉门铰全要加价', '售后找不到人'],
    solutions: [
      { title: '1. 合同写明细节', desc: '板材品牌/型号/环保等级(E0/ENF)、五金品牌、见光板、抽屉数量、收口方式全部写清楚。' },
      { title: '2. 报价对比维度', desc: '不要只看投影面积单价，要对比：展开面积、标配五金、抽屉数、见光板价格、安装运输。' },
      { title: '3. 验收标准', desc: '柜体垂直偏差≤2mm，门缝≤2mm，推拉门顺畅无异响，板材封边无爆边。' },
    ],
    relatedProcess: 'p13', relatedProcessName: '定制衣柜安装',
  },
  {
    id: 'pit6', title: '墙面乳胶漆开裂？90%是基层没做好',
    summary: '刚刷完的墙没俩月就裂了，不是漆的问题，是腻子层、挂网、找平偷工减料了！',
    stage: 'paint', risk: 'medium', viewCount: 76540, height: 300,
    symptoms: ['墙面出现竖向/横向裂纹', '墙角处八字形裂缝', '顶面石膏板接缝开裂', '腻子层整块脱落'],
    solutions: [
      { title: '1. 开槽处挂网', desc: '所有水电开槽位置、新旧墙体交接处、石膏板接缝处必须贴网格布或牛皮纸。' },
      { title: '2. 腻子层控制', desc: '每遍腻子厚度≤2mm，三遍总厚≤5mm，太厚必裂，每遍彻底干透才能刮下一遍。' },
      { title: '3. 施工环境', desc: '5℃以下或湿度＞85%禁止施工，阴雨天不开窗，干燥期避免强光直晒墙面。' },
    ],
    relatedProcess: 'p16', relatedProcessName: '墙面基层处理',
  },
  {
    id: 'pit7', title: '甲醛超标？这几处才是重灾区',
    summary: '别只盯着板材，胶黏剂、窗帘、床垫甚至乳胶漆里都可能藏着甲醛！',
    stage: 'soft', risk: 'high', viewCount: 215680, height: 350,
    symptoms: ['入住后眼睛喉咙刺痛', '小孩频繁感冒咳嗽', '室内有刺鼻异味', '绿植莫名发黄枯萎'],
    solutions: [
      { title: '1. 源头控制', desc: '板材选ENF/E0级，胶选白乳胶免钉胶，窗帘布艺洗过再挂，床垫选无胶工艺。' },
      { title: '2. 科学治理', desc: '最有效是通风(至少3个月)，其次是活性炭(定期晒)，空气净化器选CADR高的。' },
      { title: '3. 专业检测', desc: '入住前必做CMA认证检测，标准≤0.07mg/m³(GB50325)，有小孩建议≤0.05。' },
    ],
    relatedProcess: 'p17', relatedProcessName: '乳胶漆涂刷',
  },
  {
    id: 'pit8', title: '木地板起拱变形？都是安装惹的祸',
    summary: '留缝不够、地面不平、防潮膜没铺，入住一年地板就鼓起大包！',
    stage: 'installation', risk: 'low', viewCount: 45320, height: 310,
    symptoms: ['地板踩踏有空响', '局部起拱走路绊倒', '墙边缝隙过大', '地板发黑发霉'],
    solutions: [
      { title: '1. 地面找平', desc: '铺地板前用2米靠尺检查，误差≤3mm，否则先做自流平找平。' },
      { title: '2. 伸缩缝预留', desc: '四周墙边留8-12mm伸缩缝(踢脚线盖住)，长度超过8m要做过桥扣条。' },
      { title: '3. 防潮处理', desc: '地面铺珍珠棉防潮膜，接口重叠20cm胶带密封，厨卫门口做防潮隔断。' },
    ],
    relatedProcess: 'p21', relatedProcessName: '木地板铺装',
  },
  {
    id: 'pit9', title: '厨房台面一擦就渗色？选石英石要懂这3点',
    summary: '便宜的台面用两年就像大花脸，酱油渗进去擦不掉，都是石英石含量不够！',
    stage: 'carpentry', risk: 'medium', viewCount: 67890, height: 290,
    symptoms: ['酱油渍擦不掉', '台面有划痕泛白', '接缝位置发黑', '开水烫了留印'],
    solutions: [
      { title: '1. 看石英石含量', desc: '优质石英石含石英砂≥93%，低于80%的容易渗色，表面摸起来有颗粒感才对。' },
      { title: '2. 现场测试', desc: '用马克笔写字擦不掉的不要，滴酱油1小时擦不掉的不要，钥匙划不动的才好。' },
      { title: '3. 定期养护', desc: '新台面做一次防渗涂层，每年打蜡1次，热锅别直接放台面，用隔热垫。' },
    ],
    relatedProcess: 'p22', relatedProcessName: '定制橱柜安装',
  },
];

export default function PitfallGuide() {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState('all');
  const [activeRisk, setActiveRisk] = useState('all');
  const [sortBy, setSortBy] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PitfallItem | null>(null);

  let filtered = pitfalls.filter(p => {
    const matchStage = activeStage === 'all' || p.stage === activeStage;
    const matchRisk = activeRisk === 'all' || p.risk === activeRisk;
    const matchSearch = !searchQuery || p.title.includes(searchQuery) || p.summary.includes(searchQuery);
    return matchStage && matchRisk && matchSearch;
  });

  if (sortBy === 'hot') filtered = [...filtered].sort((a, b) => b.viewCount - a.viewCount);
  if (sortBy === 'risk') {
    const rank = { high: 0, medium: 1, low: 2 };
    filtered = [...filtered].sort((a, b) => rank[a.risk] - rank[b.risk]);
  }

  const getRiskBadge = (risk: string, size: 'sm' | 'md' = 'sm') => {
    const base = size === 'md' ? 'badge text-xs' : 'badge text-[10px]';
    if (risk === 'high') return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}>🔴 高风险</span>;
    if (risk === 'medium') return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>🟡 中风险</span>;
    return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>🟢 低风险</span>;
  };

  const RiskIcon = ({ risk }: { risk: string }) => {
    if (risk === 'high') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (risk === 'medium') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">避坑指南</h1>
          <p className="section-subtitle">328条真实业主经验总结，帮你避开90%的装修陷阱</p>
        </div>

        <div className="sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 -mx-4 px-4 py-4 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
              <input
                type="text"
                placeholder="搜索避坑关键词..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-base pl-10"
              />
            </div>
            <div className="flex gap-2">
              {sortOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={cn(
                    'px-4 py-2 rounded-btn text-sm font-medium transition-all',
                    sortBy === opt.key
                      ? 'bg-terracotta-500 text-white shadow-sm'
                      : 'bg-white text-carbon-600 border border-ivory-300 hover:border-wood-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {stageFilters.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActiveStage(opt.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeStage === opt.key
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'bg-white text-carbon-600 border border-ivory-300 hover:border-wood-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {riskFilters.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActiveRisk(opt.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  activeRisk === opt.key
                    ? opt.color === 'rose' ? 'bg-rose-500 text-white'
                      : opt.color === 'amber' ? 'bg-amber-500 text-white'
                        : opt.color === 'emerald' ? 'bg-emerald-500 text-white'
                          : 'bg-haze-500 text-white'
                    : 'bg-ivory-100 text-carbon-600 hover:bg-ivory-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="columns-3 gap-5 [column-fill:_balance]">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
              className="break-inside-avoid mb-5"
              onClick={() => setSelectedItem(item)}
            >
              <div
                className="card-hoverable overflow-hidden cursor-pointer"
                style={{ minHeight: item.height }}
              >
                <div className={cn(
                  'h-1.5',
                  item.risk === 'high' && 'bg-gradient-to-r from-rose-400 to-rose-600',
                  item.risk === 'medium' && 'bg-gradient-to-r from-amber-400 to-amber-600',
                  item.risk === 'low' && 'bg-gradient-to-r from-emerald-400 to-emerald-600',
                )} />
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getRiskBadge(item.risk, 'md')}
                    <span className="badge-wood text-[10px]">
                      {stageFilters.find(s => s.key === item.stage)?.label.replace(/[🔵🟠🟤🎨🔌🛋]/g, '').trim()}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-carbon-800 mb-2 leading-snug group-hover:text-terracotta-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ivory-600 line-clamp-2 leading-relaxed mb-4">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-ivory-100">
                    <span className="text-xs text-ivory-500 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.viewCount.toLocaleString()}
                    </span>
                    <span className="text-xs text-terracotta-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      查看解决方案
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card-base p-16 text-center">
            <p className="text-ivory-500">没有找到匹配的避坑指南</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedItem(null)}
          >
            <div className="absolute inset-0 bg-carbon-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 z-10">
                <div className={cn(
                  'h-2',
                  selectedItem.risk === 'high' && 'bg-gradient-to-r from-rose-400 to-rose-600',
                  selectedItem.risk === 'medium' && 'bg-gradient-to-r from-amber-400 to-amber-600',
                  selectedItem.risk === 'low' && 'bg-gradient-to-r from-emerald-400 to-emerald-600',
                )} />
                <div className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-ivory-200">
                  <div className="flex items-center gap-3">
                    <RiskIcon risk={selectedItem.risk} />
                    <div>
                      <div className="flex gap-2 mb-0.5">
                        {getRiskBadge(selectedItem.risk)}
                        <span className="badge-wood text-[10px]">
                          {stageFilters.find(s => s.key === selectedItem.stage)?.label.replace(/[🔵🟠🟤🎨🔌🛋]/g, '').trim()}
                        </span>
                      </div>
                      <h2 className="font-serif text-xl font-bold text-carbon-900">{selectedItem.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-9 h-9 rounded-full hover:bg-ivory-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-carbon-500" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto scrollbar-thin max-h-[85vh] pt-[92px] pb-8 px-6 md:px-8">
                <div className="mb-8 p-4 bg-rose-50/60 rounded-xl border border-rose-100">
                  <h4 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    典型症状表现
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {selectedItem.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-terracotta-500" />
                    解决方案步骤
                  </h4>
                  <div className="space-y-4">
                    {selectedItem.solutions.map((sol, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="p-5 rounded-xl bg-gradient-to-br from-ivory-50 to-white border border-ivory-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-lg bg-terracotta-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <h5 className="font-semibold text-carbon-800 mb-1">{sol.title}</h5>
                            <p className="text-sm text-carbon-600 leading-relaxed">{sol.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div
                  onClick={() => navigate(`/owner/process/${selectedItem.relatedProcess}`)}
                  className="p-5 rounded-xl bg-wood-50/60 border border-wood-200 cursor-pointer hover:bg-wood-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-wood-600" />
                      <div>
                        <p className="text-xs text-wood-600 mb-0.5">关联标准工艺</p>
                        <p className="font-semibold text-carbon-800 group-hover:text-terracotta-700 transition-colors">
                          {selectedItem.relatedProcessName}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-ivory-400 group-hover:text-terracotta-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
