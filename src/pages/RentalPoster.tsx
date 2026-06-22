import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit3,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  Phone,
  MapPin,
  Maximize2,
  Home,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/store';
import NotFound from './NotFound';
import { exportDOMAsImage } from '@/utils/calculator';
import { formatCurrency } from '@/utils/calculator';
import dayjs from 'dayjs';

export default function RentalPoster() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const properties = useAppStore((s) => s.properties);
  if (!propertyId) return <NotFound />;
  const prop = properties.find((p) => p.id === propertyId);
  if (!prop) return <NotFound />;
  const propRef = prop;

  const posterRef = useRef<HTMLDivElement>(null);
  const [landlordName, setLandlordName] = useState('房东先生');
  const [phone, setPhone] = useState(prop.landlordPhone ?? '138-0000-0001');
  const [highlights, setHighlights] = useState(
    `近地铁 · 拎包入住 · 精装修
采光通风好 · 南北通透
配套齐全 · 押一付三 · 长租可议`
  );
  const [watermark, setWatermark] = useState('房掌柜 · 非转租 仅供招租');
  const [accent, setAccent] = useState<'teal' | 'blue' | 'rose' | 'amber'>('teal');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const ACCENT_MAP = {
    teal: {
      primary: '#0F766E',
      primaryLight: 'rgba(15,118,110,0.1)',
      gradient: 'from-teal-500 via-teal-600 to-emerald-700',
      text: 'text-teal-700',
      ring: 'ring-teal-200',
    },
    blue: {
      primary: '#1D4ED8',
      primaryLight: 'rgba(29,78,216,0.1)',
      gradient: 'from-sky-500 via-blue-600 to-indigo-700',
      text: 'text-blue-700',
      ring: 'ring-blue-200',
    },
    rose: {
      primary: '#BE123C',
      primaryLight: 'rgba(190,18,60,0.08)',
      gradient: 'from-rose-500 via-rose-600 to-pink-700',
      text: 'text-rose-700',
      ring: 'ring-rose-200',
    },
    amber: {
      primary: '#B45309',
      primaryLight: 'rgba(180,83,9,0.1)',
      gradient: 'from-amber-500 via-orange-600 to-amber-700',
      text: 'text-amber-700',
      ring: 'ring-amber-200',
    },
  } as const;
  type AccentKey = keyof typeof ACCENT_MAP;
  const accentMap = ACCENT_MAP[accent];

  async function handleExport() {
    if (!posterRef.current) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 300));
    const p = propRef;
    const res = await exportDOMAsImage(posterRef.current, `招租海报_${p.title}.png`);
    if (res) {
      useAppStore.getState().log({
        module: 'lease',
        action: 'export',
        operator: '房东（管理员）',
        targetId: p.id,
        targetName: p.title,
        summary: `导出招租海报：${p.title}，含联系方式水印`,
      });
    }
    setTimeout(() => setExporting(false), 500);
  }

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone.replace(/-/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('复制失败');
    }
  }

  const today = dayjs().format('YYYY.MM.DD');

  return (
    <div className="animate-fade-in-up max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            返回租约中心
          </button>
          <div>
            <div className="kicker mb-1">海报 · 一键导出</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">{prop.title} · 招租海报</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/properties/${prop.id}`} className="btn-secondary btn-sm">
            <Eye className="w-3.5 h-3.5" />
            房源详情
          </Link>
          <button
            className={'btn-primary ' + (exporting ? 'opacity-80 pointer-events-none' : '')}
            onClick={handleExport}
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在生成…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出海报 (PNG)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-5">
        {/* 控制面板 */}
        <aside className="card p-5 rounded-2xl h-fit sticky top-20 space-y-5">
          <h3 className="section-title text-sm">
            <Edit3 className="w-4 h-4 text-brand-700" />
            海报编辑
          </h3>
          <div>
            <label className="label">联系人姓名</label>
            <input
              className="input"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">联系电话</label>
            <div className="flex gap-1.5">
              <input className="input flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button
                className="btn-secondary btn-sm shrink-0"
                onClick={copyPhone}
                title="复制号码"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">亮点描述（每行一条）</label>
            <textarea
              rows={5}
              className="input leading-relaxed"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
            />
          </div>
          <div>
            <label className="label">水印文字（斜向铺满）</label>
            <input
              className="input"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
            />
          </div>
          <div>
            <label className="label">配色方案</label>
            <div className="grid grid-cols-4 gap-2">
              {(['teal', 'blue', 'rose', 'amber'] as const).map((c) => {
                const m = ACCENT_MAP[c];
                return (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    className={
                      'aspect-square rounded-xl border-2 transition-all bg-gradient-to-br ' +
                      m.gradient +
                      ' ' +
                      (accent === c ? 'ring-4 scale-105 ' + m.ring : 'opacity-70 hover:opacity-100')
                    }
                    title={c}
                  />
                );
              })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              生成说明
            </div>
            <div>· 海报采用竖版A4比例 (210×297mm)，打印清晰</div>
            <div>· 导出后斜向水印可防止盗用</div>
            <div>· 二维码为占位，可替换为个人微信</div>
            <div>· 建议张贴至小区公告栏/中介门店</div>
          </div>
        </aside>

        {/* 海报预览 */}
        <div className="flex items-start justify-center">
          <div className="relative w-full max-w-[460px]">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-slate-200 via-slate-100 to-white blur-lg opacity-60" />
            <div
              ref={posterRef}
              className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ aspectRatio: '210 / 297' }}
            >
              {/* 顶部主视觉 */}
              <div className={`relative h-[38%] bg-gradient-to-br ${accentMap.gradient} overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.6),transparent_50%)]" />
                <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,white_0,white_1px,transparent_1px,transparent_12px)]" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold">
                      <Home className="w-3.5 h-3.5" />
                      个人房源 · 房东直租
                    </div>
                    <div className="bg-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md" style={{ color: accentMap.primary }}>
                      {today}
                    </div>
                  </div>
                  <div>
                    <h1 className="font-serif text-3xl lg:text-4xl font-bold leading-tight mb-2 drop-shadow-sm">
                      {prop.title}
                    </h1>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{prop.address}</span>
                    </div>
                  </div>
                </div>
                {/* 租金卡片 */}
                <div className="absolute -bottom-10 left-6 right-6 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-between px-6 border border-slate-100">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">月租金</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-serif font-bold text-4xl" style={{ color: accentMap.primary }}>
                        {prop.monthlyRent.toLocaleString()}
                      </span>
                      <span className="text-sm text-slate-400 mb-1.5">元/月</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-right text-[11px]">
                    <InfoChip label="户型" value={prop.layout} primary={accentMap.primary} />
                    <InfoChip label="面积" value={`${prop.area}㎡`} primary={accentMap.primary} />
                  </div>
                </div>
              </div>

              {/* 中部核心信息 */}
              <div className="px-6 pt-16 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Cell label="户型" value={prop.layout} primary={accentMap.primary} />
                  <Cell label="面积" value={`${prop.area}㎡`} primary={accentMap.primary} />
                  <Cell label="楼层" value={prop.floor} primary={accentMap.primary} />
                  <Cell label="装修" value={prop.decoration} primary={accentMap.primary} />
                  <Cell label="配套" value="齐 全" primary={accentMap.primary} />
                  <Cell label="朝向" value="南 北" primary={accentMap.primary} />
                </div>

                <div
                  className="rounded-2xl p-4 border-2 border-dashed"
                  style={{ borderColor: accentMap.primary + '40', backgroundColor: accentMap.primaryLight }}
                >
                  <div className="flex items-center gap-1.5 mb-3 text-sm font-semibold" style={{ color: accentMap.primary }}>
                    <Sparkles className="w-4 h-4" />
                    房源亮点
                  </div>
                  <ul className="space-y-1.5">
                    {highlights.split('\n').filter(Boolean).map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span
                          className="mt-0.5 w-4 h-4 shrink-0 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: accentMap.primary }}
                        >
                          {i + 1}
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {prop.meters.length > 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 mb-1">表计配置</div>
                      <div className="text-sm font-semibold text-slate-800">
                        {prop.meters.map((m, i) => (
                          <span key={m.id}>
                            {i > 0 && ' / '}
                            {m.type === 'water' ? '水' : m.type === 'electricity' ? '电' : '燃气'}
                          </span>
                        ))}
                        {' '}表齐全
                      </div>
                    </div>
                  ) : null}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 mb-1">押金标准</div>
                    <div className="text-sm font-semibold text-slate-800">
                      押一付三 · ≤ 月租20%
                      <span className="ml-1 text-[10px] font-normal text-slate-400">(民法典合规)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 联系区域 */}
              <div
                className="mx-6 mb-6 rounded-2xl p-4 text-white flex items-center gap-4 shadow-xl relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${accentMap.primary}, ${accentMap.primary}dd)` }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -right-16 bottom-0 w-40 h-40 rounded-full bg-white/5" />
                <div className="relative w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-inner shrink-0">
                  <QrCode className="w-16 h-16 text-slate-800" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 rounded-sm bg-white" style={{ border: `2px solid ${accentMap.primary}` }} />
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="text-[11px] opacity-80 mb-1">长按识别 / 电话联系</div>
                  <div className="font-serif text-xl font-bold mb-1">
                    {landlordName}
                    <span className="ml-2 text-[11px] opacity-80">(房东直租)</span>
                  </div>
                  <a
                    href={`tel:${phone}`}
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-sm font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {phone}
                  </a>
                </div>
              </div>

              {/* 页脚 */}
              <div className="px-6 pb-6 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: accentMap.primary }}>
                    <Home className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-serif font-bold" style={{ color: accentMap.primary }}>
                    房掌柜
                  </span>
                  <span>· 个人房源管理系统</span>
                </div>
                <span>打印日期 {today}</span>
              </div>

              {/* 斜向水印 */}
              {watermark && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]"
                  aria-hidden
                >
                  <div
                    className="absolute whitespace-nowrap font-bold text-3xl uppercase tracking-widest"
                    style={{
                      top: '30%',
                      left: '-10%',
                      transform: 'rotate(-22deg)',
                      color: accentMap.primary,
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="mr-10">
                        {watermark}
                      </span>
                    ))}
                  </div>
                  <div
                    className="absolute whitespace-nowrap font-bold text-3xl uppercase tracking-widest"
                    style={{
                      top: '60%',
                      left: '-5%',
                      transform: 'rotate(-22deg)',
                      color: accentMap.primary,
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="mr-10">
                        {watermark}
                      </span>
                    ))}
                  </div>
                  <div
                    className="absolute whitespace-nowrap font-bold text-3xl uppercase tracking-widest"
                    style={{
                      top: '90%',
                      left: '-15%',
                      transform: 'rotate(-22deg)',
                      color: accentMap.primary,
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="mr-10">
                        {watermark}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Maximize2 className="w-3 h-3" />
              竖版 A4 比例 · 分辨率 2x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary: string;
}) {
  return (
    <div className="py-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className="text-sm font-bold" style={{ color: primary }}>
        {value}
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-slate-400">{label}</span>
      <span
        className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
        style={{ color: primary, backgroundColor: primary + '14' }}
      >
        {value}
      </span>
    </div>
  );
}
