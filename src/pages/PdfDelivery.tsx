import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Mail,
  Share2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  AlertTriangle,
  Ruler,
  Package,
  Home,
  ChevronDown,
  ChevronUp,
  Check,
  Square,
  Copy,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  LayoutDashboard,
  Hammer,
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { mockCases, mockDesigners, mockMaterials } from '@/mock/data';
import type { Case, CaseMaterial, Material, Designer } from '@shared/types';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type PageKey = 'cover' | 'toc' | 'floorplan' | 'design' | 'notes' | 'materials';

const PAGE_LIST: Array<{ key: PageKey; title: string; icon: typeof FileText }> = [
  { key: 'cover', title: '封面', icon: FileText },
  { key: 'toc', title: '目录', icon: FileSpreadsheet },
  { key: 'floorplan', title: '户型图', icon: LayoutDashboard },
  { key: 'design', title: '设计方案说明', icon: FileText },
  { key: 'notes', title: '施工注意事项', icon: Hammer },
  { key: 'materials', title: '材料用量表', icon: Package },
];

type DeliveryKey = 'drawings' | 'construction' | 'materials' | 'acceptance' | 'notes';

const DELIVERY_OPTIONS: Array<{ key: DeliveryKey; label: string }> = [
  { key: 'drawings', label: '设计图' },
  { key: 'construction', label: '施工图' },
  { key: 'materials', label: '材料表' },
  { key: 'acceptance', label: '验收标准' },
  { key: 'notes', label: '注意事项' },
];

const CONCEALED_NOTES = [
  '水电改造前必须弹线定位，明确管线走向',
  '强电弱电间距不小于30cm，同槽需做屏蔽处理',
  '水管走顶优先，便于后期检修',
  '防水施工需做24小时闭水试验，验收后方可进行下一道工序',
  '所有接头必须做烫锡处理，线头缠绕不少于5圈',
];

const MUDWOOD_NOTES = [
  '瓷砖铺贴前需浸泡2小时以上，阴干后使用',
  '地砖铺贴完成后24小时内禁止踩踏',
  '木制品必须做防潮处理，背面刷清漆',
  '吊顶龙骨间距不大于40cm，主龙骨必须用膨胀螺丝固定',
  '柜体垂直度误差不超过2mm，平整度误差不超过1mm',
];

const PAINT_NOTES = [
  '墙面腻子需批刮两遍，每遍干透后方可进行下一道',
  '打磨砂纸不低于320目，确保墙面光滑无砂眼',
  '乳胶漆需兑水比例不超过20%，搅拌均匀后使用',
  '阴雨天湿度超过85%时禁止施工',
  '涂刷完成后需开窗通风，避免阳光直射',
];

export default function PdfDelivery() {
  const { id } = useParams<{ id: string }>();
  const pdfRef = useRef<HTMLDivElement>(null);

  const caseData: Case = useMemo(
    () => mockCases.find((c: Case) => c.id === id) || mockCases[0],
    [id]
  );

  const designer: Designer | null = useMemo(() => {
    return mockDesigners.find((d) => d.id === caseData.designerId) || null;
  }, [caseData]);

  const [currentPage, setCurrentPage] = useState<PageKey>('cover');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('筑家数据 仅供参考 CONFIDENTIAL');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState<Record<string, boolean>>({
    concealed: true,
    mudwood: false,
    paint: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [deliverySelection, setDeliverySelection] = useState<Record<DeliveryKey, boolean>>({
    drawings: true,
    construction: true,
    materials: true,
    acceptance: true,
    notes: true,
  });

  const currentIndex = PAGE_LIST.findIndex((p) => p.key === currentPage);

  const totalPages = PAGE_LIST.length;

  const generatedAt = useMemo(() => {
    const d = new Date();
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getMaterialPrice = (cm: CaseMaterial): number => {
    const m: Material | undefined = mockMaterials.find((x) => x.id === cm.materialId);
    if (!m) return 0;
    return m.jdPrice || m.tmallPrice || m.localSuppliers?.[0]?.price || 0;
  };

  const totalMaterialCost = caseData.materials.reduce((sum, m) => {
    return sum + getMaterialPrice(m) * m.quantity;
  }, 0);

  const handlePrevPage = () => {
    if (currentIndex > 0) {
      setCurrentPage(PAGE_LIST[currentIndex - 1].key);
    }
  };

  const handleNextPage = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentPage(PAGE_LIST[currentIndex + 1].key);
    }
  };

  const toggleDelivery = (key: DeliveryKey) => {
    setDeliverySelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShareLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${caseData.title}-设计方案交付包.pdf`);
    } catch (err) {
      console.error('PDF生成失败', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleNotes = (key: string) => {
    setNotesExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const WatermarkOverlay = () => {
    if (!watermarkEnabled) return null;
    const items = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 4; col++) {
        items.push(
          <div
            key={`${row}-${col}`}
            className="absolute text-gray-900 select-none pointer-events-none whitespace-nowrap text-sm font-semibold"
            style={{
              top: `${row * 14 + 4}%`,
              left: `${col * 28 - 4}%`,
              transform: 'rotate(-20deg)',
              opacity: 0.08,
            }}
          >
            {watermarkText || '筑家数据 仅供参考 CONFIDENTIAL'}
          </div>
        );
      }
    }
    return <div className="absolute inset-0 overflow-hidden pointer-events-none">{items}</div>;
  };

  const PaperShell = ({ children }: { children: React.ReactNode }) => (
    <div
      ref={pdfRef}
      className="relative bg-white mx-auto"
      style={{
        width: '100%',
        aspectRatio: '210 / 297',
        maxWidth: '620px',
        boxShadow:
          '0 1px 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.06), 0 4px 4px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.06)',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23f8fafc' fill-opacity='0.6' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E\")",
        backgroundSize: '4px 4px',
      }}
    >
      <WatermarkOverlay />
      <div className="relative z-10 h-full w-full p-10 flex flex-col">{children}</div>
    </div>
  );

  const renderCover = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 text-primary-700 text-sm mb-4">
        <FileText className="w-4 h-4" />
        <span className="tracking-widest">ZHUJIA DESIGN</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-1 bg-primary-600 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 font-heading leading-tight mb-3">
          {caseData.title}
        </h1>
        <p className="text-gray-500 text-sm mb-8">{caseData.description}</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
          <div>
            <div className="text-xs text-gray-400 mb-1">城市</div>
            <div className="text-gray-900 font-medium">
              {caseData.city} · {caseData.district}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">户型</div>
            <div className="text-gray-900 font-medium">{caseData.houseType}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">建筑面积</div>
            <div className="text-gray-900 font-medium flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-primary-600" />
              {caseData.area}㎡
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">设计风格</div>
            <div className="text-gray-900 font-medium">{caseData.style}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">预算</div>
            <div className="text-gray-900 font-medium">¥{(caseData.budget / 10000).toFixed(1)}万</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">工期</div>
            <div className="text-gray-900 font-medium">{caseData.duration}天</div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={caseData.designerAvatar || designer?.avatar}
            alt={caseData.designerName}
            className="w-10 h-10 rounded-full bg-gray-200 object-cover"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">{caseData.designerName}</div>
            <div className="text-xs text-gray-500">
              {designer?.title || '设计师'} · {designer?.company || '筑家设计'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">生成时间</div>
          <div className="text-xs text-gray-600">{generatedAt}</div>
        </div>
      </div>
    </div>
  );

  const renderToc = () => (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="text-xs text-primary-700 tracking-widest mb-1">CONTENTS</div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading">目录</h2>
        <div className="w-10 h-1 bg-primary-600 mt-3" />
      </div>
      <div className="flex-1">
        <div className="space-y-0">
          {PAGE_LIST.map((page, idx) => {
            const Icon = page.icon;
            return (
              <div
                key={page.key}
                className="flex items-center py-3 border-b border-gray-100 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center mr-4">
                  <Icon className="w-4 h-4 text-primary-700" />
                </div>
                <div className="flex-1 text-gray-700 font-medium">
                  {String(idx + 1).padStart(2, '0')}. {page.title}
                </div>
                <div className="flex-1 mx-4 border-b border-dashed border-gray-300 translate-y-1" />
                <div className="text-gray-400 font-mono text-sm">{idx + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pt-4 mt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary-700">{totalPages}</div>
            <div className="text-xs text-gray-500">总页数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary-700">{caseData.materials.length}</div>
            <div className="text-xs text-gray-500">材料种类</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary-700">{caseData.qualityScore}</div>
            <div className="text-xs text-gray-500">质量评分</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFloorplan = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="text-xs text-primary-700 tracking-widest mb-1">CHAPTER 03</div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">户型图</h2>
        <div className="w-10 h-1 bg-primary-600 mt-2" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: caseData.floorPlanSvg || '' }}
        />
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-4">
          <span>户型：{caseData.houseType}</span>
          <span>建筑面积：{caseData.area}㎡</span>
          <span>城市：{caseData.city}</span>
        </div>
        <div>注：本户型图仅供参考，具体以实际测量为准</div>
      </div>
    </div>
  );

  const renderDesign = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="text-xs text-primary-700 tracking-widest mb-1">CHAPTER 04</div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">设计方案说明</h2>
        <div className="w-10 h-1 bg-primary-600 mt-2" />
      </div>
      <div className="flex-1 space-y-4 text-sm text-gray-700 leading-relaxed overflow-auto">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-600" />
            设计理念
          </h3>
          <p>{caseData.description}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-600" />
            风格定位
          </h3>
          <p>
            本案采用{caseData.style}风格，注重
            {caseData.style.includes('北欧') || caseData.style.includes('日式')
              ? '自然材质与温暖色调的搭配，营造舒适宜居的生活氛围'
              : caseData.style.includes('新中式')
                ? '传统文化意境与现代生活方式的融合，打造雅致有格调的空间'
                : caseData.style.includes('美式') || caseData.style.includes('法式')
                  ? '古典元素与现代工艺的结合，展现优雅大气的生活品质'
                  : caseData.style.includes('工业')
                    ? '原始材质与个性表达，打造独特的空间美学'
                    : '简洁线条与功能性设计，最大化利用空间价值'}
            。
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-600" />
            空间布局
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary-50/50 rounded border border-primary-100/50">
              <div className="text-xs text-primary-700 mb-1">客餐厅</div>
              <div className="text-xs text-gray-600">开放式布局，增强空间通透感</div>
            </div>
            <div className="p-3 bg-primary-50/50 rounded border border-primary-100/50">
              <div className="text-xs text-primary-700 mb-1">主卧</div>
              <div className="text-xs text-gray-600">独立更衣区，满足收纳需求</div>
            </div>
            <div className="p-3 bg-primary-50/50 rounded border border-primary-100/50">
              <div className="text-xs text-primary-700 mb-1">厨房</div>
              <div className="text-xs text-gray-600">U型操作台，动线流畅高效</div>
            </div>
            <div className="p-3 bg-primary-50/50 rounded border border-primary-100/50">
              <div className="text-xs text-primary-700 mb-1">卫生间</div>
              <div className="text-xs text-gray-600">干湿分区，提升使用效率</div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-600" />
            色彩方案
          </h3>
          <div className="flex gap-2">
            {['#fafaf9', '#f5f5f4', '#e7e5e4', '#0f766e', '#f97316'].map((color) => (
              <div
                key={color}
                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="text-xs text-primary-700 tracking-widest mb-1">CHAPTER 05</div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">施工注意事项</h2>
        <div className="w-10 h-1 bg-primary-600 mt-2" />
      </div>
      <div className="flex-1 space-y-3 overflow-auto text-sm">
        <div className="p-3 border border-amber-100 bg-amber-50/50 rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
            <AlertTriangle className="w-4 h-4" />
            隐蔽工程
          </div>
          <ul className="space-y-1.5 text-amber-900/80 text-xs">
            {CONCEALED_NOTES.slice(0, 3).map((note, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600 font-mono">{i + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 border border-orange-100 bg-orange-50/50 rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-orange-800 mb-2">
            <Hammer className="w-4 h-4" />
            泥木工程
          </div>
          <ul className="space-y-1.5 text-orange-900/80 text-xs">
            {MUDWOOD_NOTES.slice(0, 3).map((note, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-orange-600 font-mono">{i + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 border border-blue-100 bg-blue-50/50 rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
            <FileText className="w-4 h-4" />
            油漆工程
          </div>
          <ul className="space-y-1.5 text-blue-900/80 text-xs">
            {PAINT_NOTES.slice(0, 3).map((note, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-600 font-mono">{i + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        更多详细注意事项请查阅文档底部
      </div>
    </div>
  );

  const renderMaterials = () => (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-xs text-primary-700 tracking-widest mb-1">CHAPTER 06</div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">材料用量表</h2>
        <div className="w-10 h-1 bg-primary-600 mt-2" />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="py-2 px-2 text-left font-medium border-b border-gray-200">材料</th>
              <th className="py-2 px-2 text-center font-medium border-b border-gray-200">用量</th>
              <th className="py-2 px-2 text-right font-medium border-b border-gray-200">单价</th>
              <th className="py-2 px-2 text-right font-medium border-b border-gray-200">小计</th>
            </tr>
          </thead>
          <tbody>
            {caseData.materials.slice(0, 8).map((m) => {
              const unitPrice = getMaterialPrice(m);
              const subtotal = unitPrice * m.quantity;
              const material: Material | undefined = mockMaterials.find(
                (x) => x.id === m.materialId
              );
              return (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-900">{m.brand} {m.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {material?.category || '其他'} · {m.model}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-gray-700">
                    {m.quantity}
                    <span className="text-gray-400 ml-0.5">{m.unit}</span>
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700">¥{unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-semibold text-primary-700">
                    ¥{subtotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-primary-50/50">
              <td colSpan={3} className="py-2 px-2 text-right text-xs text-gray-600">
                计算公式：小计 = 单价 × 用量
              </td>
              <td className="py-2 px-2 text-right font-bold text-primary-700">
                ¥{totalMaterialCost.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="pt-3 mt-2 border-t border-gray-100 text-[11px] text-gray-500">
        注：以上价格为参考价，实际以采购时市场价格为准；材料用量含5%损耗预估。
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'cover':
        return renderCover();
      case 'toc':
        return renderToc();
      case 'floorplan':
        return renderFloorplan();
      case 'design':
        return renderDesign();
      case 'notes':
        return renderNotes();
      case 'materials':
        return renderMaterials();
      default:
        return renderCover();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="container py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/" className="flex items-center hover:text-primary-700 transition-colors">
              <Home className="w-4 h-4 mr-1" />
              首页
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/cases" className="hover:text-primary-700 transition-colors">
              案例库
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/cases/${id}`} className="hover:text-primary-700 transition-colors truncate max-w-xs">
              {caseData.title}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">设计方案交付包</span>
          </nav>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-700" />
              设计方案交付包
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {caseData.title} · {caseData.city} · {caseData.area}㎡
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[70%] min-w-0">
            <div className="bg-gray-100/60 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-700 hover:bg-white rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {showThumbnails ? '隐藏缩略图' : '显示缩略图'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-primary-700 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {currentIndex + 1} / {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentIndex === totalPages - 1}
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-primary-700 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {showThumbnails && (
                  <div className="w-32 flex-shrink-0 space-y-2">
                    {PAGE_LIST.map((page, idx) => {
                      const Icon = page.icon;
                      const isActive = page.key === currentPage;
                      return (
                        <button
                          key={page.key}
                          onClick={() => setCurrentPage(page.key)}
                          className={cn(
                            'w-full aspect-[210/297] rounded-lg border-2 bg-white flex flex-col items-center justify-center gap-1 transition-all',
                            isActive
                              ? 'border-primary-600 shadow-md'
                              : 'border-gray-200 hover:border-primary-300'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5',
                              isActive ? 'text-primary-700' : 'text-gray-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-[10px]',
                              isActive ? 'text-primary-700 font-medium' : 'text-gray-500'
                            )}
                          >
                            {idx + 1}. {page.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex-1">
                  <PaperShell>{renderCurrentPage()}</PaperShell>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  施工注意事项详细列表
                </h2>
                <span className="text-xs text-gray-500">共 {CONCEALED_NOTES.length + MUDWOOD_NOTES.length + PAINT_NOTES.length} 项</span>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { key: 'concealed', title: '隐蔽工程', icon: AlertTriangle, color: 'amber', items: CONCEALED_NOTES },
                  { key: 'mudwood', title: '泥木工程', icon: Hammer, color: 'orange', items: MUDWOOD_NOTES },
                  { key: 'paint', title: '油漆工程', icon: FileText, color: 'blue', items: PAINT_NOTES },
                ].map((section) => {
                  const Icon = section.icon;
                  const expanded = notesExpanded[section.key];
                  const colorClasses: Record<string, string> = {
                    amber: 'text-amber-700 bg-amber-50 border-amber-200',
                    orange: 'text-orange-700 bg-orange-50 border-orange-200',
                    blue: 'text-blue-700 bg-blue-50 border-blue-200',
                  };
                  return (
                    <div key={section.key}>
                      <button
                        onClick={() => toggleNotes(section.key)}
                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', colorClasses[section.color])}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900">{section.title}</span>
                          <span className="text-xs text-gray-500">{section.items.length}项要点</span>
                        </div>
                        {expanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {expanded && (
                        <div className="px-5 pb-4">
                          <ul className="space-y-2 pl-11">
                            {section.items.map((item, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-gray-700">
                                <span className="text-gray-400 font-mono text-xs mt-0.5">{idx + 1}.</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:w-[30%] min-w-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-700" />
                文档信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    生成时间
                  </span>
                  <span className="text-gray-900 text-xs">{generatedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    版本号
                  </span>
                  <span className="text-gray-900 font-mono text-xs">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    页数
                  </span>
                  <span className="text-gray-900">{totalPages} 页</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    文件大小
                  </span>
                  <span className="text-gray-900">约 8.5 MB</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {watermarkEnabled ? (
                    <Eye className="w-4 h-4 text-primary-700" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  水印设置
                </span>
                <button
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors',
                    watermarkEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                      watermarkEnabled ? 'left-[18px]' : 'left-0.5'
                    )}
                  />
                </button>
              </h3>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">水印文字</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  disabled={!watermarkEnabled}
                  placeholder="输入水印文字"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary-700" />
                交付内容
              </h3>
              <div className="space-y-2.5">
                {DELIVERY_OPTIONS.map((opt) => {
                  const checked = deliverySelection[opt.key];
                  return (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDelivery(opt.key)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          checked
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 group-hover:border-primary-400'
                        )}
                      >
                        {checked ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Square className="w-3 h-3 text-transparent" />
                        )}
                      </button>
                      <span className={cn('text-sm', checked ? 'text-gray-900' : 'text-gray-500')}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isGenerating ? '正在生成...' : '下载 PDF'}
            </button>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-700" />
                发送到邮箱
              </h3>
              <form onSubmit={handleSendEmail} className="space-y-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={emailSent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-primary-200 text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-70"
                >
                  {emailSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      已发送
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      发送
                    </>
                  )}
                </button>
              </form>
              {emailSent && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  已发送至您的邮箱
                </p>
              )}
            </div>

            <button
              onClick={handleShareLink}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  链接已复制
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  分享链接
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
