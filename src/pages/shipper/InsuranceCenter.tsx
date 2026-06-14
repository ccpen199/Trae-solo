import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  FileQuestion,
  FolderKanban,
  Phone,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader,
  ArrowRight,
  Building2,
  Award,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/common/StatCard';
import { formatMoney, formatDateTime, formatWeight, formatVolume, minutesAgo } from '@/utils/format';
import type { CargoOrder, InsuranceInfo } from '@/types';

type TabKey = 'ACTIVE' | 'CLAIMS' | 'POLICIES';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'ACTIVE', label: '在保订单', icon: ShieldCheck },
  { key: 'CLAIMS', label: '理赔记录', icon: FileCheck2 },
  { key: 'POLICIES', label: '保单管理', icon: FolderKanban },
];

const CLAIM_STEPS = [
  { step: 1, title: '报险登记', desc: '拨打专线或在线提交', icon: Phone, color: 'orange' },
  { step: 2, title: '提交材料', desc: '上传凭证与证明文件', icon: FileText, color: 'cyan' },
  { step: 3, title: '审核核验', desc: '保险公司专业审核', icon: Eye, color: 'blue' },
  { step: 4, title: '赔付到账', desc: '保险金快速打款', icon: CheckCircle2, color: 'green' },
];

const TERM_SECTIONS = [
  {
    id: 'scope',
    title: '一、保险责任范围',
    content:
      '本保险承担货物在运输过程中因自然灾害、意外事故、碰撞、倾覆、火灾、爆炸、盗窃抢劫以及因包装不善、装卸过失导致的货物损失。每次运输最高保额人民币500万元整，单票货物保额不得超过货值申报金额的120%。对于贵重物品、易碎品、危险品等特殊货物，请在投保时特别声明并按约定附加条款执行。',
  },
  {
    id: 'exclusion',
    title: '二、责任免除条款',
    content:
      '因下列原因造成的损失，本公司不承担赔偿责任：(1) 战争、军事行动、罢工、暴乱；(2) 核辐射、核污染及放射性污染；(3) 货物本身缺陷、自然损耗、本质缺陷；(4) 投保人、被保险人的故意行为或违法犯罪；(5) 未经申报的违禁品、危险品；(6) 无驾驶员从业资格或酒后驾驶；(7) 货物被盗但未及时报案（超过12小时）。',
  },
  {
    id: 'process',
    title: '三、理赔流程说明',
    content:
      '保险事故发生后，被保险人应在24小时内拨打专线 400-888-95518 报案，同时保护现场并收集证据。需提交的材料包括：保险单或凭证、运输合同、发货单/提货单、货物发票、损失清单、事故证明（交警/消防/公安出具）、现场照片、索赔申请书。材料齐全后，普通案件5个工作日内完成审核，复杂案件不超过30个工作日。',
  },
  {
    id: 'premium',
    title: '四、保费与费率说明',
    content:
      '基础费率按货物类别分级：普通货物0.15%，冷链货物0.20%，高值货物0.25%，特殊精密设备0.35%。单笔保费最低收取2元人民币。年投保累计金额超过500万元的VIP客户，可享受阶梯费率折扣：500万-1000万区间享9折，1000万以上享8折优惠。保费可在订单发布时同步支付，也可选择月结方式。',
  },
  {
    id: 'special',
    title: '五、特别约定条款',
    content:
      '1. 每次事故绝对免赔额为人民币500元或损失金额的5%，二者以高者为准；\n2. 货物出险后残值由双方协商处理，保险公司有权收回残值物资；\n3. 本保单适用中华人民共和国法律，争议解决地为保险人所在地人民法院；\n4. 投保人应如实告知货物信息，隐瞒重要事实导致的损失保险人有权拒赔；\n5. 同一货物多份保单的情况下按比例分摊赔付，累计赔付不超过实际损失。',
  },
];

interface InsuredOrderItemProps {
  order: CargoOrder;
  onView: () => void;
  onDownload: () => void;
}

function InsuredOrderItem({ order, onView, onDownload }: InsuredOrderItemProps) {
  const ins: InsuranceInfo = order.insurance;
  const statusCfg = {
    PENDING: { text: '待出单', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10', dot: 'bg-signal-yellow' },
    ISSUED: { text: '已承保', color: 'text-signal-green', bg: 'bg-signal-green/10', dot: 'bg-signal-green animate-pulse' },
    CLAIMED: { text: '理赔中', color: 'text-signal-red', bg: 'bg-signal-red/10', dot: 'bg-signal-red animate-pulse' },
    SETTLED: { text: '已理赔', color: 'text-signal-blue', bg: 'bg-signal-blue/10', dot: 'bg-signal-blue' },
  } as const;
  const s = statusCfg[ins.status];

  return (
    <div className="industrial-card corner-brackets p-5 hover:border-orange-500/30 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="flex-1 min-w-0 lg:border-r lg:border-ink-600/60 lg:pr-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display font-bold text-lg text-orange-400 tracking-tight">{order.orderNo}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold ${s.bg} ${s.color}`}>
              <span className={`status-dot ${s.dot}`} />
              {s.text}
            </span>
            <span className="hex-tag">{minutesAgo(order.createdAt)}</span>
          </div>
          <div className="mb-4">
            <div className="text-sm font-semibold text-white mb-2">{order.cargoName}</div>
            <div className="flex flex-wrap gap-2">
              <span className="hex-tag">体积 {formatVolume(order.volume)}</span>
              <span className="hex-tag">重量 {formatWeight(order.weight)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">申报货值</div>
              <div className="text-slate-200 font-display">{formatMoney(order.cargoValue)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">保费</div>
              <div className="text-orange-400 font-display">{formatMoney(ins.premium)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">保额</div>
              <div className="text-signal-green font-display">¥{ins.coverage.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">保单号</div>
              <div className="text-slate-200 font-mono text-xs truncate">{ins.policyNo || '待生成'}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-56 shrink-0">
          <div className="text-[11px] font-mono text-slate-500">
            <span className="text-slate-600">投保时间</span>
            <br />
            {formatDateTime(order.createdAt)}
          </div>
          {ins.status === 'CLAIMED' && (
            <div className="p-2.5 rounded-sm bg-signal-red/10 border border-signal-red/20">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-signal-red">
                <AlertTriangle className="w-3 h-3" />
                理赔审核中
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">预计 3-5 工作日</div>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={onView}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-colors rounded-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              查看保单
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onDownload}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-ink-600/70 text-slate-300 hover:bg-white/5 transition-colors rounded-sm"
              >
                <Download className="w-3 h-3" />
                下载
              </button>
              {ins.status === 'ISSUED' && (
                <button className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-signal-red/40 text-signal-red hover:bg-signal-red/10 transition-colors rounded-sm">
                  <Phone className="w-3 h-3" />
                  报险
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ClaimRecord {
  id: string;
  orderNo: string;
  cargoName: string;
  amount: number;
  claimedAmount: number;
  status: 'REPORTED' | 'REVIEWING' | 'APPROVED' | 'PAID' | 'REJECTED';
  reportedAt: string;
  reason: string;
  policyNo: string;
}

function ClaimsList() {
  const records: ClaimRecord[] = useMemo(
    () => [
      {
        id: 'CLM202506120001',
        orderNo: 'HY20250612143204521',
        cargoName: '精密医疗设备×3',
        amount: 480000,
        claimedAmount: 38400,
        status: 'REVIEWING',
        reportedAt: '2025-06-12T09:15:00Z',
        reason: '货物跌落导致外壳变形',
        policyNo: 'PICC2025112000128832',
      },
      {
        id: 'CLM202506080027',
        orderNo: 'HY20250608081509981',
        cargoName: '进口生鲜牛肉·3吨',
        amount: 168000,
        claimedAmount: 25200,
        status: 'APPROVED',
        reportedAt: '2025-06-08T16:42:00Z',
        reason: '冷链温控异常部分变质',
        policyNo: 'PICC2025111998721005',
      },
      {
        id: 'CLM202505280115',
        orderNo: 'HY20250528110200876',
        cargoName: '办公家具·12套',
        amount: 56000,
        claimedAmount: 8400,
        status: 'PAID',
        reportedAt: '2025-05-28T11:20:00Z',
        reason: '运输途中轻微划痕',
        policyNo: 'PICC2025111887612291',
      },
      {
        id: 'CLM202505150042',
        orderNo: 'HY20250515164812389',
        cargoName: '电子产品散件',
        amount: 220000,
        claimedAmount: 0,
        status: 'REJECTED',
        reportedAt: '2025-05-15T14:08:00Z',
        reason: '无法提供有效损失凭证',
        policyNo: 'PICC2025111776231009',
      },
    ],
    []
  );

  const statusCfg = {
    REPORTED: { text: '已报险', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10', icon: Clock },
    REVIEWING: { text: '审核中', color: 'text-signal-blue', bg: 'bg-signal-blue/10', icon: Loader },
    APPROVED: { text: '已批准', color: 'text-signal-green', bg: 'bg-signal-green/10', icon: CheckCircle2 },
    PAID: { text: '已赔付', color: 'text-signal-green', bg: 'bg-signal-green/10', icon: CheckCircle2 },
    REJECTED: { text: '已拒赔', color: 'text-signal-red', bg: 'bg-signal-red/10', icon: AlertCircle },
  } as const;

  return (
    <div className="space-y-4">
      {records.map((r) => {
        const s = statusCfg[r.status];
        const SIcon = s.icon;
        return (
          <div key={r.id} className="industrial-card corner-brackets p-5">
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-display font-bold text-sm text-orange-400">{r.id}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold ${s.bg} ${s.color}`}>
                    <SIcon className="w-3 h-3" />
                    {s.text}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    关联 {r.orderNo}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">标的货物</div>
                    <div className="text-sm text-slate-200">{r.cargoName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">报险原因</div>
                    <div className="text-sm text-slate-200">{r.reason}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">报险时间</div>
                    <div className="text-xs font-mono text-slate-300">{formatDateTime(r.reportedAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">保单号</div>
                    <div className="text-xs font-mono text-slate-300 truncate">{r.policyNo}</div>
                  </div>
                </div>
              </div>
              <div className="lg:w-52 shrink-0 lg:border-l lg:border-ink-600/60 lg:pl-5 space-y-3">
                <div className="p-3 rounded-sm bg-ink-900/60 border border-ink-600/60">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">申报损失</div>
                  <div className="text-sm font-display text-slate-200">{formatMoney(r.amount)}</div>
                  <div className="divider-dashed my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">理赔金额</span>
                    <span className={`font-display font-bold ${r.claimedAmount > 0 ? 'text-signal-green' : 'text-slate-500'}`}>
                      {r.claimedAmount > 0 ? formatMoney(r.claimedAmount) : '--'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-ink-600/70 text-slate-300 hover:bg-white/5 transition-colors rounded-sm">
                    <Eye className="w-3.5 h-3.5" />
                    详情
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-ink-600/70 text-slate-300 hover:bg-white/5 transition-colors rounded-sm">
                    <Download className="w-3.5 h-3.5" />
                    凭证
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PoliciesList() {
  const policies = useMemo(
    () => [
      {
        policyNo: 'PICC-Y2025-0001',
        name: '企业年度货物运输预约保险·综合版',
        insurer: 'PICC 中国人民保险',
        effectiveDate: '2025-01-01T00:00:00Z',
        expiryDate: '2025-12-31T23:59:59Z',
        totalCoverage: 50000000,
        usedCoverage: 18720000,
        premium: 58000,
        status: 'ACTIVE',
        orders: 124,
        claims: 3,
      },
      {
        policyNo: 'PICC-Y2024-1588',
        name: '冷链专项货物保险·附加温控条款',
        insurer: 'PICC 中国人民保险',
        effectiveDate: '2024-09-15T00:00:00Z',
        expiryDate: '2025-09-14T23:59:59Z',
        totalCoverage: 20000000,
        usedCoverage: 14280000,
        premium: 32000,
        status: 'ACTIVE',
        orders: 87,
        claims: 1,
      },
      {
        policyNo: 'PICC-Y2023-9912',
        name: '普通货物基础运输保险',
        insurer: 'PICC 中国人民保险',
        effectiveDate: '2023-06-01T00:00:00Z',
        expiryDate: '2024-05-31T23:59:59Z',
        totalCoverage: 15000000,
        usedCoverage: 15000000,
        premium: 24000,
        status: 'EXPIRED',
        orders: 216,
        claims: 2,
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {policies.map((p) => {
        const usage = (p.usedCoverage / p.totalCoverage) * 100;
        const expired = p.status === 'EXPIRED';
        return (
          <div key={p.policyNo} className={`industrial-card corner-brackets p-5 ${expired ? 'opacity-70' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 ${expired ? 'bg-slate-500/10' : 'bg-signal-green/15 border border-signal-green/30'}`}>
                    <Building2 className={`w-6 h-6 ${expired ? 'text-slate-500' : 'text-signal-green'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h4 className="text-base font-semibold text-white">{p.name}</h4>
                      {expired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
                          已过期
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-signal-green/10 text-signal-green">
                          <span className="status-dot bg-signal-green animate-pulse" />
                          保障中
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-4">
                      <span>保单号 <span className="text-slate-400">{p.policyNo}</span></span>
                      <span>承保 {p.insurer}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">生效日期</div>
                    <div className="text-xs font-mono text-slate-300">{formatDateTime(p.effectiveDate).split(' ')[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">到期日期</div>
                    <div className={`text-xs font-mono ${expired ? 'text-signal-red' : 'text-slate-300'}`}>
                      {formatDateTime(p.expiryDate).split(' ')[0]}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">承保订单</div>
                    <div className="text-sm font-display text-signal-cyan">{p.orders} 单</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">出险次数</div>
                    <div className="text-sm font-display text-signal-yellow">{p.claims} 次</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-mono">额度使用</span>
                    <span className="font-display">
                      <span className={expired ? 'text-slate-500' : 'text-signal-green'}>¥{(p.usedCoverage / 10000).toFixed(0)}万</span>
                      <span className="text-slate-600"> / ¥{(p.totalCoverage / 10000).toFixed(0)}万</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-sm bg-ink-700 overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${expired ? 'bg-slate-500' : usage > 80 ? 'bg-signal-red' : usage > 60 ? 'bg-signal-yellow' : 'bg-signal-green'}`}
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:w-52 shrink-0 lg:border-l lg:border-ink-600/60 lg:pl-5 space-y-3">
                <div className="p-3 rounded-sm bg-gradient-to-br from-orange-500/15 to-transparent border border-orange-500/30">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">年度保费</div>
                  <div className="text-xl font-display font-extrabold text-orange-400">{formatMoney(p.premium)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-colors rounded-sm">
                    <Eye className="w-3.5 h-3.5" />
                    查看详情
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-ink-600/70 text-slate-300 hover:bg-white/5 transition-colors rounded-sm">
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                    {expired ? (
                      <button className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold bg-orange-500/10 border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-colors rounded-sm">
                        <Plus className="w-3 h-3" />
                        续保
                      </button>
                    ) : (
                      <button className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-ink-600/70 text-slate-300 hover:bg-white/5 transition-colors rounded-sm">
                        <FileText className="w-3 h-3" />
                        发票
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClaimSteps() {
  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">理赔流程指南</h3>
        </div>
        <span className="hex-tag">4 步快速理赔</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {CLAIM_STEPS.map((s, i) => {
          const SIcon = s.icon;
          const color = {
            orange: 'from-orange-500/25 to-orange-500/5 text-orange-400 border-orange-500/40',
            cyan: 'from-signal-cyan/25 to-signal-cyan/5 text-signal-cyan border-signal-cyan/40',
            blue: 'from-signal-blue/25 to-signal-blue/5 text-signal-blue border-signal-blue/40',
            green: 'from-signal-green/25 to-signal-green/5 text-signal-green border-signal-green/40',
          }[s.color];
          const ringColor = {
            orange: 'bg-orange-500/30',
            cyan: 'bg-signal-cyan/30',
            blue: 'bg-signal-blue/30',
            green: 'bg-signal-green/30',
          }[s.color];
          return (
            <div key={s.step} className="relative">
              <div className={`p-4 rounded-sm border bg-gradient-to-br ${color} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-12 h-12 -mt-4 -mr-4 rounded-full opacity-20" style={{ background: `currentColor` }} />
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center mb-3 ${ringColor} relative z-10`}>
                  <SIcon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-mono opacity-60 mb-1">STEP {String(s.step).padStart(2, '0')}</div>
                <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                <div className="text-[11px] opacity-75 leading-relaxed">{s.desc}</div>
              </div>
              {i < CLAIM_STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 text-slate-600 z-10" />
              )}
            </div>
          );
        })}
      </div>
      <div className="p-4 rounded-sm bg-gradient-to-r from-orange-500/12 via-signal-yellow/8 to-transparent border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-orange-500/20 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">PICC 人保 7×24 小时理赔专线</div>
            <div className="text-xl font-display font-bold text-orange-400 tracking-wide">400-888-95518</div>
          </div>
        </div>
        <button className="btn-primary sm:w-auto w-full whitespace-nowrap">
          <Send className="w-4 h-4 mr-1.5" />
          在线提交理赔
        </button>
      </div>
    </div>
  );
}

function TermsPanel() {
  const [openId, setOpenId] = useState<string | null>('scope');

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileQuestion className="w-4 h-4 text-signal-cyan" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">保险条款说明</h3>
      </div>
      <div className="space-y-2">
        {TERM_SECTIONS.map((sec) => {
          const open = openId === sec.id;
          return (
            <div key={sec.id} className="border border-ink-600/60 rounded-sm overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : sec.id)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-200">{sec.title}</span>
                {open ? (
                  <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-ink-600/60 pt-3">
                  <pre className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-sans">
                    {sec.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InsuranceCenter() {
  const { init, orders } = useOrderStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('ACTIVE');

  useEffect(() => { init(); }, [init]);

  const shipperId = user?.id ?? 'shipper_demo';

  const overview = useMemo(() => {
    const myOrders = orders.filter((o) => o.shipperId === shipperId);
    const insured = myOrders.filter((o) => o.insurance.enabled);
    const totalPolicies = insured.length;
    const totalPremium = insured.reduce((s, o) => s + o.insurance.premium, 0);
    const totalCoverage = insured.reduce((s, o) => s + o.insurance.coverage, 0);
    const claimsCount = insured.filter((o) => o.insurance.status === 'CLAIMED' || o.insurance.status === 'SETTLED').length;
    return { totalPolicies, totalPremium, totalCoverage, claimsCount };
  }, [orders, shipperId]);

  const activeOrders = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.shipperId === shipperId &&
            o.insurance.enabled &&
            ['PENDING', 'ISSUED', 'CLAIMED'].includes(o.insurance.status)
        )
        .slice(0, 8),
    [orders, shipperId]
  );

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="industrial-card corner-brackets overflow-hidden relative"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(16,185,129,0.12) 0%, transparent 45%),
            linear-gradient(225deg, rgba(249,115,22,0.15) 0%, transparent 50%),
            linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(11,18,32,1) 100%)
          `,
        }}
      >
        <div className="absolute inset-0 data-grid opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-glow-orange opacity-60 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-signal-green/25 to-orange-500/25 border-2 border-signal-green/40 flex items-center justify-center shrink-0 backdrop-blur-sm shadow-glow-green-sm">
                <Building2 className="w-9 h-9 text-signal-green" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    PICC 人保财险 · 运输保险中心
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-green/15 border border-signal-green/30">
                    <Award className="w-3.5 h-3.5 text-signal-green" />
                    <span className="text-[11px] font-semibold text-signal-green">官方合作</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3 max-w-2xl leading-relaxed">
                  中国人民财产保险股份有限公司官方战略合作。保障全程货物运输安全，
                  <span className="text-orange-400">0.15%起超低费率</span>、
                  <span className="text-signal-cyan">500万高额保额</span>、
                  <span className="text-signal-green">5工作日快速理赔</span>
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                    全程覆盖 · 提货到送达
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                    智能报价 · 按单计费
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                    一键投保 · 即时出单
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button className="btn-primary sm:w-auto">
                <Plus className="w-4 h-4 mr-1.5" />
                为新单投保
              </button>
              <button className="btn-ghost sm:w-auto">
                <FileText className="w-4 h-4 mr-1.5" />
                保费计算器
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="累计投保单数"
          value={Math.max(overview.totalPolicies, 218)}
          unit="单"
          icon={FileCheck2}
          color="orange"
          change={24.6}
        />
        <StatCard
          label="累计保费支出"
          value={formatMoney(Math.max(overview.totalPremium, 68420))}
          icon={ShieldCheck}
          color="green"
          change={18.2}
        />
        <StatCard
          label="累计保障额度"
          value={`¥${(Math.max(overview.totalCoverage, 48600000) / 10000).toFixed(0)}万`}
          icon={Building2}
          color="cyan"
          change={31.8}
        />
        <StatCard
          label="历史理赔次数"
          value={Math.max(overview.claimsCount, 6)}
          unit="次"
          icon={AlertTriangle}
          color="orange"
          change={-12.5}
        />
      </div>

      <div className="industrial-card overflow-hidden">
        <div className="flex items-center border-b border-ink-600/60 px-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const TIcon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-5 py-4 flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TIcon className="w-4 h-4" />
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {tab === 'ACTIVE' && (
          activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.map((o) => (
                <InsuredOrderItem
                  key={o.id}
                  order={o}
                  onView={() => {}}
                  onDownload={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="industrial-card corner-brackets p-16 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-30 text-slate-500" />
              <div className="text-lg font-semibold text-slate-400 mb-2">暂无在保订单</div>
              <div className="text-sm text-slate-600 font-mono mb-5">发布货源时勾选「运输保险」即可投保</div>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                发布新货源
              </button>
            </div>
          )
        )}
        {tab === 'CLAIMS' && <ClaimsList />}
        {tab === 'POLICIES' && <PoliciesList />}
      </div>

      <ClaimSteps />
      <TermsPanel />
    </div>
  );
}
