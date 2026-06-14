import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  Ruler,
  Wallet,
  Clock,
  Star,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  MessageCircle,
  User,
  BadgeCheck,
  FileText,
  Boxes,
  Camera,
  LayoutDashboard,
  Lightbulb,
  Droplets,
  Cable,
  Box,
  History,
  Users,
  ClipboardList,
  X,
  ChevronLeft,
  ExternalLink,
  Paintbrush,
  Wrench,
  PenTool,
  HardHat,
  Award,
  GripVertical,
} from 'lucide-react';
import { mockCases, mockDesigners, mockMaterials } from '@/mock/data';
import type { Case, CaseMaterial, AcceptancePhoto, Designer, Material } from '@shared/types';
import { cn } from '@/lib/utils';

type ElectricTab = 'strong' | 'weak' | 'water';
type AcceptanceTab = 'concealed' | 'mud-wood' | 'paint';
type NavSection = 'floorplan' | 'electric' | 'photos' | 'materials' | 'data' | 'evidence';

const navItems: Array<{ id: NavSection; label: string; icon: typeof Home }> = [
  { id: 'floorplan', label: '户型图', icon: LayoutDashboard },
  { id: 'electric', label: '水电点位', icon: Cable },
  { id: 'photos', label: '验收照片', icon: Camera },
  { id: 'materials', label: '建材清单', icon: Boxes },
  { id: 'data', label: '施工数据', icon: FileText },
  { id: 'evidence', label: '证据链', icon: GripVertical },
];

const electricTabs: Array<{ id: ElectricTab; label: string; icon: typeof Cable }> = [
  { id: 'strong', label: '强电', icon: Lightbulb },
  { id: 'weak', label: '弱电', icon: Cable },
  { id: 'water', label: '给排水', icon: Droplets },
];

const acceptanceTabs: Array<{ id: AcceptanceTab; label: string }> = [
  { id: 'concealed', label: '隐蔽工程' },
  { id: 'mud-wood', label: '泥木工程' },
  { id: 'paint', label: '油漆工程' },
];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('floorplan');
  const [electricTab, setElectricTab] = useState<ElectricTab>('strong');
  const [acceptanceTab, setAcceptanceTab] = useState<AcceptanceTab>('concealed');
  const [floorPlanScale, setFloorPlanScale] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<AcceptancePhoto | null>(null);
  const [isCollected, setIsCollected] = useState(false);

  useEffect(() => {
    const found = mockCases.find((c) => c.id === id) || mockCases[0];
    setCaseData(found);
    if (found) {
      const d = mockDesigners.find((x) => x.id === found.designerId) || null;
      setDesigner(d);
    }
  }, [id]);

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const filteredPhotos = caseData.acceptancePhotos?.filter((p) => p.stage === acceptanceTab) || [];

  const getMaterialPrice = (cm: CaseMaterial): number => {
    const m = mockMaterials.find((x) => x.id === cm.materialId);
    if (!m) return 0;
    return m.jdPrice || m.tmallPrice || m.localSuppliers?.[0]?.price || 0;
  };

  const handleFloorPlanZoom = (delta: number) => {
    setFloorPlanScale((s) => Math.min(Math.max(0.5, s + delta), 2));
  };

  const totalMaterialCost = caseData.materials.reduce((sum, m) => {
    return sum + getMaterialPrice(m) * m.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/" className="flex items-center hover:text-primary-700 transition-colors">
              <Home className="w-4 h-4 mr-1" />
              首页
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/" className="hover:text-primary-700 transition-colors">
              装修案例
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{caseData.title}</span>
          </nav>
        </div>
      </div>

      {/* 案例标题区 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 font-heading">
                {caseData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-primary-600" />
                  {caseData.city} · {caseData.district}
                </span>
                <span className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-1 text-primary-600" />
                  {caseData.houseType}
                </span>
                <span className="flex items-center">
                  <Ruler className="w-4 h-4 mr-1 text-primary-600" />
                  {caseData.area}㎡
                </span>
                <span className="flex items-center">
                  <Wallet className="w-4 h-4 mr-1 text-accent-500" />
                  ¥{(caseData.budget / 10000).toFixed(1)}万
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-primary-600" />
                  {caseData.duration}天
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-accent-500 fill-accent-500" />
                  {caseData.qualityScore}分
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {caseData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 设计师卡片 */}
            <div className="lg:w-80 bg-gradient-to-br from-primary-50 to-white rounded-xl p-4 border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <img
                    src={caseData.designerAvatar || designer?.avatar}
                    alt={caseData.designerName}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover bg-gray-200"
                  />
                  {designer?.status === 'approved' && (
                    <BadgeCheck className="absolute -bottom-1 -right-1 w-5 h-5 text-primary-600 fill-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">{caseData.designerName}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {designer?.title || '设计师'} · {designer?.company || '独立设计师'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="flex items-center text-accent-600">
                      <Star className="w-3 h-3 mr-0.5 fill-accent-500" />
                      {designer?.rating || designer?.qualityScore || caseData.qualityScore}
                    </span>
                    <span className="text-gray-500">
                      从业{designer?.experience || designer?.yearsOfExperience || 5}年
                    </span>
                    <span className="text-gray-500">
                      {designer?.completedCases || designer?.totalCases || 0}套案例
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  咨询设计师
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsCollected(!isCollected)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                    isCollected
                      ? 'bg-accent-50 border-accent-200 text-accent-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                  )}
                >
                  <Heart className={cn('w-4 h-4', isCollected && 'fill-accent-500')} />
                  {isCollected ? '已收藏' : '收藏'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 text-sm font-medium rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧粘性导航 */}
          <aside className="lg:w-56 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-6 space-y-2">
              <nav className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all',
                        activeSection === item.id
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/cases/${id}/3d`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-xl shadow-md transition-all"
                >
                  <Box className="w-5 h-5" />
                  3D 预览
                </button>
                <button
                  onClick={() => navigate(`/pdf-delivery/${id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-600 text-gray-700 font-medium rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-5 h-5" />
                  生成 PDF
                </button>
              </div>
            </div>
          </aside>

          {/* 右侧内容区 */}
          <main className="flex-1 min-w-0">
            {/* 户型图 */}
            {activeSection === 'floorplan' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-primary-600" />
                    户型图
                  </h2>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => handleFloorPlanZoom(-0.1)}
                      className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                      title="缩小"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="px-3 text-sm font-medium text-gray-700 w-14 text-center">
                      {Math.round(floorPlanScale * 100)}%
                    </span>
                    <button
                      onClick={() => handleFloorPlanZoom(0.1)}
                      className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                      title="放大"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-auto bg-gray-50 rounded-b-xl">
                  <div
                    className="transition-transform duration-200 ease-out mx-auto"
                    style={{
                      transform: `scale(${floorPlanScale})`,
                      transformOrigin: 'center center',
                      width: 'fit-content',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: caseData.floorPlanSvg || '' }} />
                  </div>
                </div>
              </section>
            )}

            {/* 水电点位 */}
            {activeSection === 'electric' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Cable className="w-5 h-5 text-primary-600" />
                    水电点位图
                  </h2>
                </div>
                <div className="px-5 py-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    {electricTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setElectricTab(tab.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                            electricTab === tab.id
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-6 overflow-auto bg-gray-50 rounded-b-xl">
                  <div className="mx-auto w-fit">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          electricTab === 'water'
                            ? caseData.waterPlanSvg || ''
                            : caseData.electricPlanSvg || '',
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 验收照片 */}
            {activeSection === 'photos' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary-600" />
                    验收节点照片
                  </h2>
                </div>
                <div className="px-5 py-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    {acceptanceTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAcceptanceTab(tab.id)}
                        className={cn(
                          'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                          acceptanceTab === tab.id
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-xl cursor-pointer"
                        onClick={() => setLightboxImage(photo)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.description}
                          className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-white text-sm font-medium">{photo.description}</p>
                            <p className="text-white/70 text-xs mt-1">
                              {new Date(photo.takenAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 建材清单 */}
            {activeSection === 'materials' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-primary-600" />
                    建材清单
                  </h2>
                  <div className="text-sm text-gray-500">
                    预估总费用:
                    <span className="text-accent-600 font-bold ml-1 text-lg">
                      ¥{totalMaterialCost.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-left">
                        <th className="px-5 py-3 font-medium">类别</th>
                        <th className="px-5 py-3 font-medium">品牌型号</th>
                        <th className="px-5 py-3 font-medium">名称</th>
                        <th className="px-5 py-3 font-medium text-center">用量</th>
                        <th className="px-5 py-3 font-medium text-right">单价</th>
                        <th className="px-5 py-3 font-medium text-right">小计</th>
                        <th className="px-5 py-3 font-medium">房间位置</th>
                        <th className="px-5 py-3 font-medium text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {caseData.materials.map((m) => {
                        const unitPrice = getMaterialPrice(m);
                        const subtotal = unitPrice * m.quantity;
                        const material: Material | undefined = mockMaterials.find(
                          (x) => x.id === m.materialId
                        );
                        return (
                          <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md">
                                {material?.category || '其他'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="font-medium text-gray-900">{m.brand}</div>
                              <div className="text-xs text-gray-500">{m.model}</div>
                            </td>
                            <td className="px-5 py-3 text-gray-700">{m.name}</td>
                            <td className="px-5 py-3 text-center text-gray-700">
                              {m.quantity}
                              <span className="text-gray-400 ml-0.5">{m.unit}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-700">
                              ¥{unitPrice.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-accent-600">
                              ¥{subtotal.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-gray-600">{m.roomLocation}</td>
                            <td className="px-5 py-3 text-center">
                              <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded-md transition-colors">
                                <ExternalLink className="w-3 h-3" />
                                去比价
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 证据链时间线 */}
            {activeSection === 'evidence' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <GripVertical className="w-5 h-5 text-primary-600" />
                    施工证据链时间线
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">按施工流程串联各阶段关键证据，确保施工质量可追溯</p>
                </div>
                <div className="p-5">
                  <div className="relative">
                    <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-400" />
                    {[
                      {
                        name: '设计方案',
                        icon: PenTool,
                        status: 'done',
                        desc: '户型设计与3D方案确认',
                        color: 'from-violet-500 to-indigo-600',
                        evidences: [
                          { label: '户型图SVG', action: () => setActiveSection('floorplan'), icon: LayoutDashboard },
                          { label: '3D预览入口', action: () => navigate(`/cases/${id}/3d`), icon: Box },
                        ],
                      },
                      {
                        name: '水电交底',
                        icon: Wrench,
                        status: 'done',
                        desc: '水电点位定位与技术交底',
                        color: 'from-blue-500 to-cyan-600',
                        evidences: [
                          { label: '水电点位图', action: () => setActiveSection('electric'), icon: Cable },
                          { label: '隐蔽工程照片', action: () => { setActiveSection('photos'); setAcceptanceTab('concealed'); }, icon: Camera },
                        ],
                      },
                      {
                        name: '泥木施工',
                        icon: HardHat,
                        status: 'done',
                        desc: '瓦工铺贴与木工制作',
                        color: 'from-orange-500 to-amber-600',
                        evidences: [
                          { label: '泥木阶段验收照片', action: () => { setActiveSection('photos'); setAcceptanceTab('mud-wood'); }, icon: Camera },
                          { label: '对应建材', action: () => setActiveSection('materials'), icon: Boxes },
                        ],
                      },
                      {
                        name: '油漆工程',
                        icon: Paintbrush,
                        status: 'current',
                        desc: '墙面处理与乳胶漆施工',
                        color: 'from-pink-500 to-rose-600',
                        evidences: [
                          { label: '油漆阶段照片', action: () => { setActiveSection('photos'); setAcceptanceTab('paint'); }, icon: Camera },
                          { label: '乳胶漆品牌', action: () => setActiveSection('materials'), icon: Boxes },
                        ],
                      },
                      {
                        name: '竣工验收',
                        icon: Award,
                        status: 'pending',
                        desc: '整体验收与质量评分',
                        color: 'from-emerald-500 to-teal-600',
                        evidences: [
                          { label: '各阶段验收记录', action: () => setActiveSection('data'), icon: ClipboardList },
                          { label: '质量评分', action: () => setActiveSection('data'), icon: Star },
                        ],
                      },
                    ].map((stage, idx) => {
                      const Icon = stage.icon;
                      return (
                        <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                          <div
                            className={cn(
                              'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md',
                              stage.status === 'done' && `bg-gradient-to-br ${stage.color}`,
                              stage.status === 'current' && 'bg-gradient-to-br from-accent-500 to-amber-500 ring-4 ring-accent-100',
                              stage.status === 'pending' && 'bg-gray-300'
                            )}
                          >
                            {stage.status === 'done' ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : stage.status === 'current' ? (
                              <Clock className="w-5 h-5 text-white" />
                            ) : (
                              <Icon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-base">{stage.name}</span>
                              {stage.status === 'done' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  已完成
                                </span>
                              )}
                              {stage.status === 'current' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full font-medium">
                                  <Clock className="w-3 h-3" />
                                  进行中
                                </span>
                              )}
                              {stage.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                                  待开始
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 mb-3">{stage.desc}</p>
                            <div className="flex flex-wrap gap-2">
                              {stage.evidences.map((evidence, eIdx) => {
                                const EvIcon = evidence.icon;
                                return (
                                  <button
                                    key={eIdx}
                                    onClick={evidence.action}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-600 text-xs font-medium rounded-lg transition-all"
                                  >
                                    <EvIcon className="w-3.5 h-3.5" />
                                    {evidence.label}
                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 施工数据 */}
            {activeSection === 'data' && (
              <section className="space-y-6 animate-fade-in">
                {/* 工期时间线 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary-600" />
                      工期时间线
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                      {[
                        { name: '开工交底', date: '第1天', status: 'done', desc: '现场交底、材料进场' },
                        { name: '隐蔽工程', date: '第1-20天', status: 'done', desc: '水电改造、防水施工' },
                        { name: '泥木工程', date: '第21-55天', status: 'done', desc: '瓦工、木工施工' },
                        { name: '油漆工程', date: '第56-80天', status: 'current', desc: '墙面处理、乳胶漆' },
                        { name: '安装阶段', date: '第81-88天', status: 'pending', desc: '橱柜、地板、门窗安装' },
                        { name: '竣工验收', date: '第89-90天', status: 'pending', desc: '整体验收、交付' },
                      ].map((stage, idx) => (
                        <div key={idx} className="relative flex gap-4 pb-5 last:pb-0">
                          <div
                            className={cn(
                              'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              stage.status === 'done' && 'bg-primary-600',
                              stage.status === 'current' && 'bg-accent-500 ring-4 ring-accent-100',
                              stage.status === 'pending' && 'bg-gray-200'
                            )}
                          >
                            {stage.status === 'done' ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : stage.status === 'current' ? (
                              <Clock className="w-5 h-5 text-white" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{stage.name}</span>
                              <span className="text-xs text-gray-500">{stage.date}</span>
                              {stage.status === 'current' && (
                                <span className="px-2 py-0.5 bg-accent-50 text-accent-600 text-xs rounded-full font-medium">
                                  进行中
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{stage.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 施工队信息 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-600" />
                      施工队信息
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { role: '项目经理', name: '王建国', phone: '138****5678', exp: '15年' },
                        { role: '水电工', name: '李师傅', phone: '139****1234', exp: '10年' },
                        { role: '瓦工', name: '张师傅', phone: '137****9876', exp: '12年' },
                        { role: '木工', name: '陈师傅', phone: '136****4321', exp: '8年' },
                      ].map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500">{member.role}</div>
                            <div className="font-medium text-gray-900 truncate">{member.name}</div>
                            <div className="text-xs text-gray-500">
                              从业{member.exp} · {member.phone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 验收记录 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary-600" />
                      各阶段验收记录
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      {[
                        {
                          stage: '隐蔽工程验收',
                          date: '2025-03-15',
                          result: 'pass',
                          items: 12,
                          issues: 0,
                          inspector: '监理·刘工',
                        },
                        {
                          stage: '防水工程验收',
                          date: '2025-03-20',
                          result: 'pass',
                          items: 6,
                          issues: 0,
                          inspector: '监理·刘工',
                        },
                        {
                          stage: '泥木工程验收',
                          date: '2025-04-10',
                          result: 'pass',
                          items: 18,
                          issues: 1,
                          inspector: '监理·刘工',
                        },
                        {
                          stage: '中期验收',
                          date: '2025-04-18',
                          result: 'warning',
                          items: 25,
                          issues: 2,
                          inspector: '监理·刘工',
                        },
                      ].map((record, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                record.result === 'pass' && 'bg-green-50',
                                record.result === 'warning' && 'bg-amber-50'
                              )}
                            >
                              {record.result === 'pass' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{record.stage}</div>
                              <div className="text-sm text-gray-500">
                                {record.inspector} · {record.date}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{record.items}</div>
                              <div className="text-xs text-gray-500">检查项</div>
                            </div>
                            <div className="text-right">
                              <div
                                className={cn(
                                  'font-semibold',
                                  record.issues === 0 ? 'text-green-600' : 'text-amber-600'
                                )}
                              >
                                {record.issues}
                              </div>
                              <div className="text-xs text-gray-500">问题项</div>
                            </div>
                            <div
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                record.result === 'pass'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-amber-50 text-amber-700'
                              )}
                            >
                              {record.result === 'pass' ? '已通过' : '需整改'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* 照片灯箱 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = filteredPhotos.findIndex((p) => p.id === lightboxImage.id);
              const prevIdx = (currentIdx - 1 + filteredPhotos.length) % filteredPhotos.length;
              setLightboxImage(filteredPhotos[prevIdx]);
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = filteredPhotos.findIndex((p) => p.id === lightboxImage.id);
              const nextIdx = (currentIdx + 1) % filteredPhotos.length;
              setLightboxImage(filteredPhotos[nextIdx]);
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div
            className="max-w-5xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.description}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-lg font-medium">{lightboxImage.description}</p>
              <p className="text-white/60 text-sm mt-1">
                {new Date(lightboxImage.takenAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
