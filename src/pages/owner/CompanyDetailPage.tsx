import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Award,
  Users,
  Briefcase,
  Calendar,
  Heart,
  Phone,
  Clock,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Building2,
  Hammer,
  Palette,
  MessageSquare,
  BadgeCheck,
  ChevronRight,
  User,
  Send,
  Home,
  Ruler,
  StickyNote,
  Clock3,
  X,
  ZoomIn,
  Eye,
} from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Input, DatePicker, message } from 'antd';
import { cn } from '@/lib/utils';
import type { WarrantyTerm } from '@/types';

const { TextArea } = Input;

const TABS = [
  { key: 'intro', label: '公司介绍', icon: Building2 },
  { key: 'certs', label: '资质证照', icon: ShieldCheck },
  { key: 'sites', label: '在建工地', icon: Hammer },
  { key: 'cases', label: '案例作品', icon: Palette },
  { key: 'reviews', label: '业主评价', icon: MessageSquare },
  { key: 'warranty', label: '质保条款', icon: BadgeCheck },
];

const qualificationBadge: Record<string, { text: string; className: string; bg: string }> = {
  level1: { text: '一级资质', className: 'text-amber-900', bg: 'bg-gradient-to-r from-amber-200 to-yellow-300 border-amber-400' },
  level2: { text: '二级资质', className: 'text-slate-700', bg: 'bg-gradient-to-r from-slate-200 to-gray-300 border-slate-400' },
  level3: { text: '三级资质', className: 'text-wood-900', bg: 'bg-gradient-to-r from-wood-200 to-wood-300 border-wood-400' },
};

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i <= fullStars
              ? 'text-amber-400 fill-amber-400'
              : i === fullStars + 1 && hasHalf
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-ivory-300'
          )}
        />
      ))}
    </div>
  );
}

function generateImage(prompt: string, seed: number): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3&seed=${seed + 2000}`;
}

function generateSquareImage(prompt: string, seed: number): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd&seed=${seed + 3000}`;
}

const companyInfo = {
  id: '1',
  name: '筑美装饰设计工程有限公司',
  logo: generateSquareImage('Minimalist elegant logo for decoration company, wood and terracotta colors, geometric design', 1),
  qualification: 'level1' as const,
  rating: 4.8,
  reviewCount: 632,
  serviceYears: 12,
  caseCount: 486,
  avgPrice: 1280,
  cities: ['北京', '上海', '广州', '深圳', '杭州'],
  intro: `筑美装饰成立于2013年，是一家专注于中高端住宅装修的综合性装饰企业。公司拥有国家一级施工资质，汇集了200余名资深设计师和专业工组长，累计为超过5000个家庭提供了优质的装修服务。

我们秉承"匠心筑家、品质为美"的企业理念，严格把控施工质量的每一个环节，采用德系工艺标准和环保材料体系，为业主打造健康、舒适、有品位的居家空间。公司先后获得"全国住宅装饰装修行业百强企业"、"中国家居产业环保先锋企业"等多项荣誉。`,
  scale: {
    designers: 68,
    teamLeaders: 36,
    workers: 186,
  },
  features: ['免费量房', '零增项承诺', '环保材料', '延期赔付', '金牌工长', '十年质保'],
};

const serviceProcess = [
  { step: 1, title: '免费量房', desc: '专业设计师上门勘测，记录户型结构、采光通风等基础数据', duration: '约1-2小时' },
  { step: 2, title: '方案设计', desc: '根据需求出具平面布局方案、3D效果图和初步预算报价', duration: '3-5个工作日' },
  { step: 3, title: '签订合同', desc: '确认最终方案和报价明细，签署正式装修合同并支付首期款', duration: '1天' },
  { step: 4, title: '施工交付', desc: '按节点分阶段施工，提供全程监理和定期巡检服务', duration: '60-120天' },
  { step: 5, title: '售后保障', desc: '竣工验收后提供水电5年、基础2年、整体10年质保服务', duration: '长期服务' },
];

const certDocs = [
  { type: '营业执照', img: generateImage('Official Chinese business license document, certificate with red stamp, professional photography', 1), ocr: { '统一社会信用代码': '91110105MA01ABCD23', '法定代表人': '张建明', '注册资本': '5000万元', '成立日期': '2013年08月15日', '经营范围': '住宅装饰和装修；建设工程设计；专业设计服务' }, verified: true },
  { type: '建筑业企业资质证', img: generateImage('Chinese construction enterprise qualification certificate, level 1 decoration, official document with seal', 2), ocr: { '资质类别及等级': '建筑装修装饰工程专业承包一级', '证书编号': 'D211012345', '发证机关': '北京市住房和城乡建设委员会', '有效期至': '2028年12月31日' }, verified: true },
  { type: '安全生产许可证', img: generateImage('Chinese work safety production license certificate, official document with red seals, formal layout', 3), ocr: { '许可证编号': '京JZ安许证字[2018]012345', '主要负责人': '张建明', '许可范围': '建筑施工', '有效期': '2021年01月10日至2024年01月09日' }, verified: true },
  { type: 'ISO质量管理体系认证', img: generateImage('ISO 9001 quality management system certification certificate, international standard, professional document', 4), ocr: { '认证标准': 'GB/T 19001-2016/ISO 9001:2015', '证书编号': 'CQM/2023/ISO01234', '认证机构': '中国质量认证中心', '有效期至': '2026年05月20日' }, verified: true },
];

const constructionSites = [
  { id: 1, community: '融科橄榄城', area: 138, progress: 75, stage: '油漆阶段', img: generateImage('Interior house painting construction site, professional painters working, renovation in progress', 10), updated: '2小时前' },
  { id: 2, community: '保利中央公园', area: 165, progress: 45, stage: '泥瓦阶段', img: generateImage('Tiling work in progress, bathroom floor tiles being laid, professional tiler', 11), updated: '5小时前' },
  { id: 3, community: '万科翡翠公园', area: 89, progress: 20, stage: '水电阶段', img: generateImage('Electrical wiring installation during house renovation, electrician working, junction boxes', 12), updated: '1天前' },
  { id: 4, community: '龙湖天街', area: 220, progress: 90, stage: '安装阶段', img: generateImage('Kitchen cabinet installation, carpenter working, custom cabinetry fitting', 13), updated: '3小时前' },
  { id: 5, community: '朝阳公园8号', area: 310, progress: 35, stage: '木工阶段', img: generateImage('Carpentry work in interior renovation, wooden ceiling framework, professional carpenter', 14), updated: '8小时前' },
  { id: 6, community: '东湖湾名邸', area: 112, progress: 60, stage: '泥木阶段', img: generateImage('Wall plastering and tiling during renovation, worker applying plaster, smooth finish', 15), updated: '6小时前' },
];

const caseItems = [
  { id: 1, title: '北欧风·暖阳三居', type: '三室两厅', area: 135, style: '北欧', price: 22, cover: generateImage('Bright Scandinavian nordic interior design, cozy living room, white walls, wooden floor, plants, natural light', 30) },
  { id: 2, title: '新中式·东方雅韵', type: '四室两厅', area: 186, style: '新中式', price: 58, cover: generateImage('Elegant New Chinese style interior, living room with oriental furniture, warm wood tones, ink painting', 31) },
  { id: 3, title: '现代简约·都市质感', type: '两室一厅', area: 89, style: '现代简约', price: 14, cover: generateImage('Modern minimalist interior apartment, clean lines, neutral tones, wood furniture, warm lighting', 32) },
  { id: 4, title: '轻奢主义·精致生活', type: '三室两厅', area: 156, style: '轻奢', price: 42, cover: generateImage('Luxury modern interior design, marble accents, golden details, velvet sofa, elegant chandelier', 33) },
  { id: 5, title: '日式禅意·静谧小筑', type: '两室两厅', area: 98, style: '日式', price: 18, cover: generateImage('Japanese zen interior design, tatami mats, shoji screens, natural wood, minimalist tranquil', 34) },
  { id: 6, title: '地中海·阳光假期', type: '四室三厅', area: 230, style: '地中海', price: 68, cover: generateImage('Mediterranean interior design, whitewashed walls, blue accents, terracotta tiles, natural light, seaside villa', 35) },
  { id: 7, title: '工业风·LOFT个性', type: 'LOFT', area: 168, style: '工业风', price: 36, cover: generateImage('Industrial style interior loft, exposed brick wall, metal pipes, concrete floor, vintage furniture', 36) },
  { id: 8, title: '美式乡村·温暖家', type: '别墅', area: 320, style: '美式', price: 98, cover: generateImage('American country style interior, warm wood furniture, fireplace, cozy family room, classic decor', 37) },
];

const reviews = [
  {
    id: 1,
    avatar: generateSquareImage('Professional asian woman avatar portrait, friendly smile, soft lighting', 50),
    name: '李女士',
    rating: 5,
    date: '2024-05-20',
    tags: ['工艺精致', '材料环保', '准时交付'],
    content: '从设计到施工，全程非常满意！设计师很专业，给了很多实用的建议。施工团队也很负责，每天都会发工地照片，沟通很顺畅。最让我感动的是瓷砖铺贴非常工整，完全没有空鼓。最终效果超出预期，朋友来都夸好看！',
    photos: [
      generateSquareImage('Beautiful finished modern living room interior, professional photography, warm lighting, stylish furniture', 60),
      generateSquareImage('Elegant master bedroom interior design, comfortable bed, soft lighting, cozy atmosphere', 61),
      generateSquareImage('Modern kitchen interior, white cabinets, marble countertop, stainless steel appliances', 62),
    ],
    reply: '感谢李女士的信任与好评！您的满意是我们最大的动力。我们会继续秉持匠心精神，为更多业主打造温馨的家。后期有任何问题随时联系我们的客服，祝您入住愉快！',
  },
  {
    id: 2,
    avatar: generateSquareImage('Asian middle aged man avatar portrait, professional appearance, glasses', 51),
    name: '王先生',
    rating: 4.5,
    date: '2024-05-08',
    tags: ['沟通顺畅', '设计专业', '项目经理负责'],
    content: '整体合作非常愉快，设计师小张特别耐心，前前后后改了5稿方案都没有不耐烦。施工过程中项目经理张工每天都在现场，遇到问题也会及时和我们沟通协调。唯一的小遗憾是工期因为疫情耽误了一周，但总体是一次非常好的装修体验。',
    photos: [
      generateSquareImage('Spacious dining room interior with modern chandelier, wooden dining table, elegant decor', 63),
      generateSquareImage('Luxury bathroom interior with freestanding bathtub, marble tiles, modern fixtures', 64),
      generateSquareImage('Home office interior design, wooden desk, bookshelves, comfortable chair, natural light', 65),
    ],
    reply: '感谢王先生的宝贵反馈！工期延期确实是我们需要改进的地方，已将您的建议反馈给工程部。期待下次能为您提供更完善的服务，再次感谢选择筑美装饰！',
  },
  {
    id: 3,
    avatar: generateSquareImage('Young asian couple smiling portrait, warm family photo, happy expressions', 52),
    name: '陈先生 & 刘女士',
    rating: 5,
    date: '2024-04-15',
    tags: ['零增项', '工艺精致', '服务贴心'],
    content: '这是我们第二次装修了，对比之前的装修公司，筑美真的好太多！合同签了多少钱就是多少钱，完全没有之前遇到的各种增项加价。工人师傅手艺也很好，特别是木工师傅做的柜子，细节处理得非常到位。强烈推荐给准备装修的朋友！',
    photos: [
      generateSquareImage('Modern minimalist living room with large window, natural light, cozy sofa, green plants', 66),
      generateSquareImage('Custom built-in walk-in closet with organized storage, modern wardrobe design', 67),
      generateSquareImage('Children room interior design, colorful decor, study desk, playful atmosphere', 68),
    ],
    reply: '非常感谢陈先生和刘女士的认可与推荐！"零增项"是我们对每一位业主的郑重承诺。我们的木作师傅都是有15年以上经验的老工匠，手艺值得信赖。祝福二位在新家中生活美满，阖家幸福！',
  },
];

const warrantyTerms: WarrantyTerm[] = [
  { item: '水电改造工程', durationMonths: 60, description: '包含所有给排水管道、强弱电线路的改造工程，因施工质量问题导致的渗漏、短路、断路等故障免费维修及更换材料。' },
  { item: '防水工程', durationMonths: 60, description: '卫生间、厨房、阳台等区域的防水施工，质保期内出现渗漏问题免费返工并承担由此造成的相关损失。' },
  { item: '瓷砖铺贴工程', durationMonths: 36, description: '墙地砖、石材铺贴工程，质保期内出现空鼓、脱落、开裂等非人为因素导致的质量问题免费维修。' },
  { item: '墙面涂装工程', durationMonths: 36, description: '墙面基层处理及乳胶漆、壁纸等饰面工程，质保期内出现起皮、脱落、开裂、变色等问题免费修补。' },
  { item: '木工制作工程', durationMonths: 36, description: '现场制作的家具、吊顶、造型等木作工程，质保期内出现变形、开裂、松动等问题免费维修。' },
  { item: '门窗安装工程', durationMonths: 24, description: '室内外门窗的安装工程，质保期内出现开关不畅、密封不严、五金件损坏等问题免费维修更换。' },
  { item: '整体装修质保', durationMonths: 120, description: '全屋整体装修工程提供十年长期质保服务，质保期内公司提供每年一次免费上门检修服务。' },
];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intro');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (searchParams.get('book') === '1') {
      setShowAppointment(true);
    }
  }, [searchParams]);

  const handleSubmitAppointment = (values: unknown) => {
    console.log('预约信息:', values);
    message.success('预约成功！公司客服将在24小时内联系您确认详情');
    setTimeout(() => {
      navigate('/owner/appointments');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-ivory-50 pb-32">
      <div className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-6 mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-wood-100/60 to-transparent rounded-full -translate-y-20 translate-x-20" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-start gap-5 flex-1">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-ivory-200 bg-ivory-50 shadow-card flex-shrink-0">
                <img src={companyInfo.logo} alt={companyInfo.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="font-serif text-2xl font-bold text-carbon-800">{companyInfo.name}</h1>
                  <span className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold border shadow-sm',
                    qualificationBadge[companyInfo.qualification].bg,
                    qualificationBadge[companyInfo.qualification].className
                  )}>
                    <Award className="w-3 h-3 inline mr-1" />
                    {qualificationBadge[companyInfo.qualification].text}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={companyInfo.rating} size="lg" />
                    <span className="text-2xl font-bold text-amber-600">{companyInfo.rating.toFixed(1)}</span>
                    <span className="text-sm text-ivory-500">({companyInfo.reviewCount}条评价)</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-ivory-600">
                    <Clock className="w-4 h-4 text-wood-500" />
                    <span>服务 <b className="text-carbon-700 font-semibold">{companyInfo.serviceYears}</b> 年</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ivory-600">
                    <Briefcase className="w-4 h-4 text-haze-500" />
                    <span>案例 <b className="text-carbon-700 font-semibold">{companyInfo.caseCount}</b> 套</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ivory-600">
                    <Award className="w-4 h-4 text-terracotta-500" />
                    <span className="text-terracotta-600 font-bold">¥{companyInfo.avgPrice}/㎡起</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ivory-600">
                    <MapPin className="w-4 h-4 text-terracotta-500" />
                    <span>服务 {companyInfo.cities.join('、')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {companyInfo.features.map(f => (
                    <span key={f} className="px-2.5 py-1 rounded-lg bg-wood-50 text-wood-700 text-xs font-medium border border-wood-200">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={cn(
                  'btn-secondary flex-1',
                  isFavorited && 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                )}
              >
                <Heart className={cn('w-4 h-4', isFavorited && 'fill-rose-500 text-rose-500')} />
                {isFavorited ? '已收藏' : '收藏公司'}
              </button>
              <button
                onClick={() => setShowAppointment(true)}
                className="btn-cta flex-1"
              >
                <Calendar className="w-5 h-5" />
                预约量房
              </button>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-0 z-20 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 -mx-4 px-4 mb-6">
          <div className="container -mx-4 px-4 overflow-x-auto scrollbar-thin">
            <div className="flex gap-1 min-w-max py-3">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300',
                      activeTab === tab.key
                        ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/30'
                        : 'text-ivory-600 hover:bg-ivory-100 hover:text-carbon-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pr-0 lg:pr-80">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'intro' && (
                <div className="space-y-6">
                  <div className="card-base p-6">
                    <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-4">公司简介</h3>
                    <div className="text-ivory-700 leading-relaxed whitespace-pre-line">{companyInfo.intro}</div>
                  </div>

                  <div className="card-base p-6">
                    <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-6">公司规模</h3>
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { icon: Palette, label: '设计师', value: companyInfo.scale.designers, color: 'from-haze-400 to-haze-600' },
                        { icon: Users, label: '工组长', value: companyInfo.scale.teamLeaders, color: 'from-wood-400 to-wood-600' },
                        { icon: Hammer, label: '自有工人', value: companyInfo.scale.workers, color: 'from-terracotta-400 to-terracotta-600' },
                      ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${s.color} text-white`}
                          >
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                            <Icon className="w-8 h-8 mb-3" />
                            <p className="text-3xl font-bold font-mono mb-1">{s.value}</p>
                            <p className="text-white/80 text-sm">{s.label}团队</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-base p-6">
                    <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-8">服务流程</h3>
                    <div className="relative">
                      {serviceProcess.map((p, i) => (
                        <div key={p.step} className="relative flex gap-5 pb-8 last:pb-0">
                          {i < serviceProcess.length - 1 && (
                            <div className="absolute left-[21px] top-[46px] w-0.5 h-[calc(100%-46px)] bg-gradient-to-b from-terracotta-300 to-ivory-200" />
                          )}
                          <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-terracotta-500/30">
                            {p.step}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-carbon-800 text-lg">{p.title}</h4>
                              <span className="flex items-center gap-1 text-xs text-ivory-500 bg-ivory-100 px-2.5 py-1 rounded-full">
                                <Clock3 className="w-3 h-3" />
                                {p.duration}
                              </span>
                            </div>
                            <p className="text-ivory-600 text-sm leading-relaxed">{p.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'certs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certDocs.map((cert, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card-hoverable overflow-hidden group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-ivory-50 cursor-pointer"
                        onClick={() => setPreviewImage(cert.img)}>
                        <img
                          src={cert.img}
                          alt={cert.type}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <span className="flex items-center gap-1.5 text-white text-sm">
                            <ZoomIn className="w-4 h-4" />
                            点击查看大图
                          </span>
                        </div>
                        {cert.verified && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/95 text-white text-xs font-medium shadow-lg">
                            <CheckCircle2 className="w-3 h-3" />
                            平台核验通过
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-serif font-semibold text-carbon-800 text-lg">{cert.type}</h4>
                          <FileCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                          {Object.entries(cert.ocr).map(([k, v]) => (
                            <div key={k} className="flex items-start text-sm">
                              <span className="text-ivory-500 w-28 flex-shrink-0">{k}：</span>
                              <span className="text-carbon-700 font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'sites' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {constructionSites.map((site, i) => (
                    <motion.div
                      key={site.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card-hoverable overflow-hidden"
                    >
                      <div className="relative h-48 overflow-hidden group">
                        <img
                          src={site.img}
                          alt={site.community}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onClick={() => setPreviewImage(site.img)}
                        />
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-terracotta-500/95 text-white text-xs font-medium shadow-lg">
                          {site.stage}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-carbon-900/80 to-transparent p-4">
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-white/70 text-xs mb-1">施工进度</div>
                              <div className="text-white font-bold text-xl font-mono">{site.progress}%</div>
                            </div>
                            <div className="text-white/70 text-xs">更新于 {site.updated}</div>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-terracotta-400 to-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${site.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-carbon-800">{site.community}</h4>
                          <span className="text-ivory-500 text-sm flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5" />
                            {site.area}㎡
                          </span>
                        </div>
                        <button className="w-full btn-primary py-2 text-sm">
                          <Eye className="w-4 h-4" />
                          申请看工地
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'cases' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {caseItems.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="card-hoverable overflow-hidden group cursor-pointer"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={c.cover}
                          alt={c.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-carbon-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-white/90 text-xs font-medium text-carbon-700">{c.style}</span>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">{c.title}</h4>
                          <div className="flex items-center justify-between text-white/80 text-xs">
                            <span>{c.type} · {c.area}㎡</span>
                            <span className="text-amber-300 font-semibold">¥{c.price}万</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-carbon-800 text-sm line-clamp-1 mb-1">{c.title}</h4>
                        <div className="flex items-center justify-between text-xs text-ivory-500">
                          <span>{c.type} · {c.area}㎡</span>
                          <span className="text-terracotta-600 font-semibold">¥{c.price}万</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-5">
                  {reviews.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card-base p-6"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-ivory-200 flex-shrink-0">
                          <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-carbon-800">{r.name}</h4>
                            <span className="text-xs text-ivory-500">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={r.rating} />
                            <span className="text-sm font-semibold text-amber-600">{r.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                            {t}
                          </span>
                        ))}
                      </div>

                      <p className="text-carbon-700 leading-relaxed mb-4">{r.content}</p>

                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {r.photos.map((p, pi) => (
                          <div
                            key={pi}
                            className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
                            onClick={() => setPreviewImage(p)}
                          >
                            <img
                              src={p}
                              alt={`验收照片${pi + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-carbon-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="relative pl-5 border-l-2 border-haze-300 bg-haze-50/50 p-4 rounded-r-xl">
                        <div className="absolute -left-[7px] top-4 w-3 h-3 rounded-full bg-haze-400 border-2 border-white" />
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-haze-100 text-haze-700 text-xs font-medium">
                            <Building2 className="w-3 h-3" />
                            商家回复
                          </div>
                        </div>
                        <p className="text-haze-700 text-sm leading-relaxed">{r.reply}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'warranty' && (
                <div className="card-base overflow-hidden">
                  <div className="p-6 border-b border-ivory-200 bg-gradient-to-r from-emerald-50 to-haze-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-carbon-800">筑美装饰质保服务承诺</h3>
                        <p className="text-ivory-600 text-sm">严格执行国家《住宅室内装饰装修管理办法》，提供优于行业标准的质保服务</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-ivory-100/50">
                          <th className="text-left px-6 py-4 text-sm font-semibold text-carbon-700">质保项目</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-carbon-700">质保期限</th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-carbon-700">条款内容</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warrantyTerms.map((t, i) => (
                          <tr key={i} className="border-t border-ivory-100 hover:bg-ivory-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-carbon-800">{t.item}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold',
                                t.durationMonths >= 60
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : t.durationMonths >= 36
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-wood-50 text-wood-700 border border-wood-200'
                              )}>
                                <BadgeCheck className="w-3.5 h-3.5" />
                                {t.durationMonths >= 12 ? `${t.durationMonths / 12}年` : `${t.durationMonths}个月`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-ivory-600 leading-relaxed max-w-md">{t.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed right-4 lg:right-6 bottom-4 lg:top-24 lg:bottom-auto w-[calc(100%-2rem)] lg:w-72 z-30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-base p-5 shadow-xl"
          >
            {!showAppointment ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-carbon-800">快速预约量房</h4>
                    <p className="text-xs text-ivory-500">24小时内响应</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-5 text-sm">
                  {['免费上门量房勘测', '专业设计师1对1服务', '出平面方案+初步预算', '量房后3天内交付方案'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-ivory-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowAppointment(true)} className="w-full btn-cta !text-base">
                  <Phone className="w-4 h-4" />
                  立即预约
                </button>
              </div>
            ) : (
              <Form form={form} layout="vertical" size="large" onFinish={handleSubmitAppointment}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-serif font-semibold text-carbon-800">填写预约信息</h4>
                  </div>
                  <button onClick={() => setShowAppointment(false)} className="p-1 rounded-lg hover:bg-ivory-100 text-ivory-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <Form.Item
                  name="name"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><User className="w-3.5 h-3.5" />您的姓名</span>}
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入您的姓名" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" />联系电话</span>}
                  rules={[{ required: true, message: '请输入手机号' }]}
                >
                  <Input placeholder="请输入手机号码" />
                </Form.Item>

                <Form.Item
                  name="address"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><Home className="w-3.5 h-3.5" />小区名称</span>}
                  rules={[{ required: true, message: '请输入小区名称' }]}
                >
                  <Input placeholder="如：融科橄榄城3期" />
                </Form.Item>

                <Form.Item
                  name="area"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />房屋面积（㎡）</span>}
                  rules={[{ required: true, message: '请输入房屋面积' }]}
                >
                  <Input placeholder="请输入建筑面积" type="number" />
                </Form.Item>

                <Form.Item
                  name="date"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />预约时间</span>}
                  rules={[{ required: true, message: '请选择预约时间' }]}
                >
                  <DatePicker className="w-full" placeholder="选择量房日期" />
                </Form.Item>

                <Form.Item
                  name="remark"
                  label={<span className="text-sm text-carbon-700 font-medium flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />备注信息</span>}
                >
                  <TextArea rows={2} placeholder="如有特殊需求请备注" />
                </Form.Item>

                <Form.Item className="mb-0">
                  <button type="submit" className="w-full btn-cta !text-base">
                    <Send className="w-4 h-4" />
                    提交预约
                  </button>
                </Form.Item>
              </Form>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-carbon-900/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <img src={previewImage} alt="预览" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-carbon-600 hover:bg-ivory-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
