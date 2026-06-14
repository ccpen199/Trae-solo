import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket as TicketIcon, AlertTriangle, ShieldCheck, AlertCircle, CreditCard,
  Search, Filter, Plus, ChevronRight, RefreshCw, CheckCircle2, XCircle,
  FileSearch, QrCode, Plane, Hotel as HotelIcon, CircleDollarSign, X, UserRound,
  ChevronDown, ChevronUp, FileText, Receipt, History, BadgeCheck, Clock, FileCheck,
} from 'lucide-react';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/app';
import type { TicketIssue, IssueType, IssueStatus, Language } from '@/shared/types';
import { ISSUE_TYPE_LABEL, ISSUE_STATUS_LABEL, classNames, fmtCny, fmtDate, pickML, pickIssueTypeLabel, pickIssueTypeDesc, pickIssueStatusLabel } from '@/utils/meta';

const TABS: IssueType[] = ['FAKE_TICKET', 'VERIFY_FAIL', 'PAYMENT_ANOMALY', 'NO_TICKET_COMP'];

const TYPE_ICON: Record<IssueType, any> = {
  FAKE_TICKET: FileSearch,
  VERIFY_FAIL: QrCode,
  NO_TICKET_COMP: AlertTriangle,
  PAYMENT_ANOMALY: CircleDollarSign,
};

const AUDIT_LABELS: Record<string, Record<Language, string>> = {
  verifyLog: { zh: '验签复查记录', en: 'Signature Recheck Log', ja: '署名再検証ログ', ko: '서명 재검증 로그' },
  compFlow: { zh: '赔付流转节点', en: 'Compensation Flow', ja: '補償フロー', ko: '보상 흐름' },
  receipt: { zh: '报销材料', en: 'Expense / Receipts', ja: '領収書・証憑', ko: '영수증 · 증빙' },
  closeAudit: { zh: '关闭审计链路', en: 'Close Audit Trail', ja: 'クローズ監査証跡', ko: '종료 감사 추적' },
  details: { zh: '展开详情', en: 'Expand', ja: '詳細を開く', ko: '자세히 보기' },
  collapse: { zh: '收起', en: 'Collapse', ja: '折りたたむ', ko: '접기' },
  id: { zh: '工单编号', en: 'Issue ID', ja: 'チケットID', ko: '티켓 ID' },
  summary: { zh: '工单摘要 / 加密串', en: 'Summary / Crypto', ja: '概要 / 暗号タグ', ko: '요약 / 암호태그' },
  event: { zh: '关联演出 / 票档', en: 'Event / Tier', ja: '公演 / 席種', ko: '공연 / 좌석 등급' },
  created: { zh: '创建时间', en: 'Created', ja: '作成日時', ko: '생성일' },
  comp: { zh: '赔付/损失金额', en: 'Compensation', ja: '補償金額', ko: '보상 금액' },
  status: { zh: '状态', en: 'Status', ja: 'ステータス', ko: '상태' },
  loading: { zh: '加载中...', en: 'Loading...', ja: '読み込み中...', ko: '로딩 중...' },
  noIssue: { zh: '暂无工单 ✓', en: 'No issues ✓', ja: '該当なし ✓', ko: '이슈 없음 ✓' },
  refresh: { zh: '刷新', en: 'Refresh', ja: '更新', ko: '새로고침' },
  tier: { zh: '票档', en: 'Tier', ja: '席種', ko: '좌석 등급' },
  region: { zh: '区域', en: 'Region', ja: '地域', ko: '지역' },
  paid: { zh: '已赔付', en: 'Paid', ja: '支払済', ko: '지급 완료' },
};
const AL = (k: keyof typeof AUDIT_LABELS, lang: Language) => AUDIT_LABELS[k][lang] || AUDIT_LABELS[k].zh;

export default function TicketCenter() {
  const { language, currency } = useAppStore();
  const nav = useNavigate();
  const [issues, setIssues] = useState<TicketIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<IssueType | 'all'>('all');
  const [q, setQ] = useState('');
  const [openAdd, setOpenAdd] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('type', tab);
    if (q) params.set('keyword', q);
    api.get<TicketIssue[]>(`/api/issues${params.toString() ? '?' + params : ''}`).then((r) => {
      setIssues(r); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: issues.length };
    for (const t of TABS) c[t] = 0;
    for (const it of issues) { c[it.type]++; }
    return c;
  }, [issues]);

  const t = {
    zh: {
      title: '票务工单中心',
      desc: '假票溯源 · 线下核验 · 无票赔付 · 跨境支付异常 · 业务闭环',
      all: '全部工单',
      add: '新建工单',
      search: '搜索加密串/订单号/关键词',
      update: '更新状态',
      resolve: '标记已解决',
      close: '关闭',
      submit: '提交工单',
      form: {
        type: '工单类型', order: '关联订单号', crypto: '票加密串', evidence: '证据描述', channel: '支付渠道',
      },
    },
    en: {
      title: 'Ticket Operations Center',
      desc: 'Fake-ticket trace · Offline verify · No-ticket compensation · Cross-border payment issues',
      all: 'All Issues',
      add: 'Create Issue',
      search: 'Search crypto-tag / order / keyword',
      update: 'Update status',
      resolve: 'Mark Resolved',
      close: 'Close',
      submit: 'Submit',
      form: { type: 'Type', order: 'Order ID', crypto: 'Crypto tag', evidence: 'Evidence', channel: 'Channel' },
    },
    ja: { title: 'チケット業務センター', desc: '偽チケット追跡・現地検証・不発券補償・越境決済異常', all: '全件', add: '新規作成', search: '暗号タグ/注文/キーワード', update: '状態更新', resolve: '解決済に', close: '閉じる', submit: '送信', form: { type: '種別', order: '注文ID', crypto: '暗号タグ', evidence: '証拠', channel: '決済' } },
    ko: { title: '티켓 운영 센터', desc: '위조 티켓 추적 · 오프라인 검증 · 미발권 보상 · 크로스보더 결제 이슈', all: '전체', add: '새 작업', search: '암호태그/주문/키워드', update: '상태변경', resolve: '해결', close: '닫기', submit: '제출', form: { type: '유형', order: '주문ID', crypto: '암호태그', evidence: '증거', channel: '결제' } },
  }[language] ?? ({ zh: {} as any }).zh;

  return (
    <div className="space-y-5">
      <section className="card p-5 md:p-6 star-noise relative overflow-hidden">
        <div className="absolute right-[-80px] top-[-80px] w-64 h-64 rounded-full bg-neon-pink/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow"><TicketIcon className="inline w-3.5 h-3.5 mr-1" />TicketOps</p>
            <h1 className="font-display font-black text-3xl md:text-4xl">{t.title}</h1>
            <p className="text-white/55 text-sm mt-1">{t.desc}</p>
          </div>
          <button onClick={() => setOpenAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t.add}
          </button>
        </div>
        <div className="relative mt-5 grid md:grid-cols-5 gap-3">
          <TabCard active={tab === 'all'} onClick={() => setTab('all')}
            count={counts.all} label={t.all} icon={<Filter className="w-4 h-4" />} color="text-white" />
          {TABS.map((tt) => {
            const I = TYPE_ICON[tt];
            const lbl = ISSUE_TYPE_LABEL[tt];
            return (
              <TabCard key={tt} active={tab === tt} onClick={() => setTab(tt)}
                count={counts[tt] || 0}
                label={pickIssueTypeLabel(tt, language)}
                icon={<I className="w-4 h-4" />}
                color={lbl.color}
              />
            );
          })}
        </div>
      </section>

      <section className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder={t.search}
            className="input pl-11 text-sm"
          />
        </div>
        <button onClick={load} className="btn-ghost !py-2 !px-3 !text-sm">
          <RefreshCw className="w-4 h-4" /> {AL('refresh', language)}
        </button>
      </section>

      <section className="card overflow-hidden">
        <div className="grid grid-cols-[auto_1.4fr_1.3fr_0.9fr_0.9fr_0.8fr_0.6fr] items-center px-5 py-3 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40">
          <span>ID</span>
          <span>{AL('summary', language)}</span>
          <span>{AL('event', language)}</span>
          <span>{AL('created', language)}</span>
          <span>{AL('comp', language)}</span>
          <span>{AL('status', language)}</span>
          <span></span>
        </div>
        {loading && <div className="p-10 text-center text-white/50 animate-pulse">{AL('loading', language)}</div>}
        {!loading && issues.length === 0 && <div className="p-10 text-center text-white/50">{AL('noIssue', language)}</div>}
        {issues.map((it) => (
          <IssueRow key={it.id} it={it} t={t} language={language} onUpdate={load} />
        ))}
      </section>

      {openAdd && <AddIssueDialog onClose={() => setOpenAdd(false)} onDone={() => { setOpenAdd(false); load(); }} t={t} language={language} />}
    </div>
  );
}

function TabCard({ active, onClick, count, label, icon, color }: { active: boolean; onClick: () => void; count: number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <button onClick={onClick} className={classNames(
      'rounded-2xl p-4 text-left border transition-all',
      active
        ? 'border-neon-pink/50 bg-neon-pink/5 shadow-glow'
        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20',
    )}>
      <div className={classNames('flex items-center gap-1.5 text-xs font-semibold', color || 'text-white/60')}>
        {icon} {label}
      </div>
      <div className="mt-2 num font-black text-3xl text-white">{count}</div>
    </button>
  );
}

function IssueRow({ it, t, language, onUpdate }: { it: TicketIssue; t: any; language: Language; onUpdate: () => void }) {
  const typeLbl = ISSUE_TYPE_LABEL[it.type];
  const st = ISSUE_STATUS_LABEL[it.status];
  const I = TYPE_ICON[it.type];
  const [open, setOpen] = useState(false);

  const nextStatus = (() => {
    if (it.status === 'OPEN') return 'INVESTIGATING';
    if (it.status === 'INVESTIGATING') return 'RESOLVED';
    if (it.status === 'RESOLVED') return null;
    return 'OPEN';
  })();

  const patch = async (status: IssueStatus) => {
    try {
      await api.patch(`/api/issues/${it.id}`, { status });
      onUpdate();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
      <div className="grid grid-cols-[auto_1.4fr_1.3fr_0.9fr_0.9fr_0.8fr_0.6fr] items-center gap-4 px-5 py-4">
        <span className="num font-mono text-[11px] text-white/50">{it.id.slice(-6).toUpperCase()}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className={classNames('cap', typeLbl.color)}>
              <I className="w-3 h-3" /> {pickIssueTypeLabel(it.type, language)}
            </span>
            <span className="font-semibold truncate">{it.summary}</span>
          </div>
          {it.cryptoTag && (
            <div className="mt-1.5 inline-flex items-center gap-2 text-[11px] font-mono text-white/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <ShieldCheck className="w-3 h-3 text-neon-amber" /> {it.cryptoTag}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium truncate">{pickML(it.eventTitle, language)}</div>
          <div className="text-xs text-white/50 mt-0.5">
            {AL('tier', language)}：{it.tierGrade || '-'} · {AL('region', language)}：{it.region || '-'}
          </div>
        </div>
        <div className="text-sm text-white/70">
          <div>{fmtDate(it.createdAt)}</div>
          <div className="text-[11px] text-white/40 mt-0.5">{it.createdAt.slice(11, 16)}</div>
        </div>
        <div>
          {it.compensationAmount > 0 ? (
            <div className="num font-bold text-neon-amber">¥{fmtCny(it.compensationAmount)}</div>
          ) : (
            <div className="text-white/30 text-xs">—</div>
          )}
          {it.type === 'NO_TICKET_COMP' && it.compensationAmount > 0 && (
            <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50">
              <Plane className="w-3 h-3 text-sky-400" />
              <HotelIcon className="w-3 h-3 text-rose-400" />
              {AL('paid', language)}
            </div>
          )}
        </div>
        <StatusBadge status={it.status} language={language} />
        <div className="flex justify-end gap-1.5">
          <button onClick={() => setOpen((v) => !v)} className="btn-ghost !py-1.5 !px-2.5 !text-xs inline-flex items-center gap-0.5">
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {nextStatus && (
            <button onClick={() => patch(nextStatus)} className="btn-ghost !py-1.5 !px-2.5 !text-xs">
              {it.status === 'RESOLVED' ? '↺' : t.update}
            </button>
          )}
          {it.status !== 'RESOLVED' && it.status !== 'CLOSED' && (
            <button onClick={() => patch('RESOLVED')} className="btn-ghost !py-1.5 !px-2.5 !text-xs text-neon-teal">
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <AuditBlock title={AL('verifyLog', language)} icon={<BadgeCheck className="w-4 h-4 text-neon-amber" />}>
            <Timeline items={[
              { t: it.createdAt.slice(0, 16), text: '初次验签·终端 TM-2041', ok: it.status !== 'OPEN' },
              { t: fmtDate(it.updatedAt), text: '加密串二次复查 HMAC-SHA256', ok: it.status === 'INVESTIGATING' || it.status === 'RESOLVED' },
              { t: it.status === 'RESOLVED' ? fmtDate(it.updatedAt) : '—', text: '风控规则引擎复核通过', ok: it.status === 'RESOLVED' },
            ]} />
          </AuditBlock>
          <AuditBlock title={AL('compFlow', language)} icon={<History className="w-4 h-4 text-neon-pink" />}>
            <Timeline items={[
              { t: it.createdAt.slice(0, 16), text: '受理 · 专员指派', ok: true },
              { t: fmtDate(it.updatedAt), text: it.type === 'FAKE_TICKET' ? '溯源比对数据库' : it.type === 'NO_TICKET_COMP' ? '机酒凭证核验' : '支付渠道对账', ok: it.status !== 'OPEN' },
              { t: it.status === 'RESOLVED' ? fmtDate(it.updatedAt) : '—', text: it.compensationAmount > 0 ? `赔付 ¥${fmtCny(it.compensationAmount)}` : '处理完成', ok: it.status === 'RESOLVED' },
            ]} />
          </AuditBlock>
          <AuditBlock title={AL('receipt', language)} icon={<Receipt className="w-4 h-4 text-neon-teal" />}>
            <div className="space-y-2">
              {[
                { name: '验签快照.png', size: '184 KB', ok: true },
                { name: '现场照片.jpg', size: '2.1 MB', ok: it.status !== 'OPEN' },
                { name: it.type === 'NO_TICKET_COMP' ? '机票行程单.pdf' : it.type === 'PAYMENT_ANOMALY' ? '对账流水.csv' : '用户申诉.pdf', size: it.type === 'NO_TICKET_COMP' ? '68 KB' : '412 KB', ok: it.status === 'INVESTIGATING' || it.status === 'RESOLVED' },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/[0.02]">
                  <FileText className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-sm flex-1 truncate">{f.name}</span>
                  <span className="text-[11px] text-white/40 num">{f.size}</span>
                  {f.ok ? <BadgeCheck className="w-3.5 h-3.5 text-neon-teal" /> : <Clock className="w-3.5 h-3.5 text-white/30" />}
                </div>
              ))}
            </div>
          </AuditBlock>
          <AuditBlock title={AL('closeAudit', language)} icon={<FileCheck className="w-4 h-4 text-neon-violet" />}>
            <div className="space-y-2 text-sm">
              <Row k={language === 'zh' ? '提报人' : 'Reporter'} v="运营台 #ops-01" />
              <Row k={language === 'zh' ? '处理人' : 'Handler'} v={it.status === 'OPEN' ? '待指派' : '专员 Lee'} />
              <Row k={language === 'zh' ? 'SLA 剩余' : 'SLA Left'} v={it.status === 'RESOLVED' ? (language === 'zh' ? '已完成' : 'Done') : '23h 42m'} />
              <Row k={language === 'zh' ? '风控分数' : 'Risk Score'} v={it.status === 'RESOLVED' ? 'A' : it.status === 'INVESTIGATING' ? 'B' : 'C'} />
              <Row k={language === 'zh' ? '复核意见' : 'Review'} v={it.status === 'RESOLVED' ? (language === 'zh' ? '合规可关闭' : 'OK to close') : (language === 'zh' ? '处理中' : 'In progress')} />
            </div>
          </AuditBlock>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/40 text-xs">{k}</span>
      <span className="text-white/80 text-xs font-semibold">{v}</span>
    </div>
  );
}

function AuditBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-3">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Timeline({ items }: { items: { t: string; text: string; ok: boolean }[] }) {
  return (
    <div className="space-y-2">
      {items.map((n, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col items-center pt-0.5">
            <div className={classNames('w-2 h-2 rounded-full', n.ok ? 'bg-neon-teal' : 'bg-white/20')} />
            {i < items.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="text-[11px] num text-white/40">{n.t}</div>
            <div className={classNames('text-xs', n.ok ? 'text-white/80' : 'text-white/40')}>{n.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, language }: { status: IssueStatus; language: Language }) {
  const st = ISSUE_STATUS_LABEL[status];
  const I = status === 'OPEN' ? AlertCircle : status === 'INVESTIGATING' ? RefreshCw : status === 'RESOLVED' ? CheckCircle2 : XCircle;
  return (
    <span className={classNames('chip border inline-flex items-center gap-1 !py-1', st.cls)}>
      <I className="w-3 h-3" /> <span className="text-xs font-semibold">{pickIssueStatusLabel(status, language)}</span>
    </span>
  );
}

function AddIssueDialog({ onClose, onDone, t, language }: { onClose: () => void; onDone: () => void; t: any; language: Language }) {
  const [type, setType] = useState<IssueType>('FAKE_TICKET');
  const [summary, setSummary] = useState('');
  const [orderId, setOrderId] = useState('');
  const [crypto, setCrypto] = useState('');
  const [evidence, setEvidence] = useState('');
  const [comp, setComp] = useState(0);

  const submit = async () => {
    if (!summary) { alert(language === 'zh' ? '请填写工单摘要' : 'Summary required'); return; }
    try {
      await api.post('/api/issues', {
        type, summary, relatedOrderId: orderId || null, cryptoTag: crypto || null, evidence,
        compensationAmount: comp,
      });
      onDone();
    } catch (e: any) { alert(e.message); }
  };

  const TYPE_DESC: Record<IssueType, Record<Language, { ph: string }>> = {
    FAKE_TICKET: { zh: { ph: '描述伪造方式、验签节点、已核验终端ID……' }, en: { ph: 'Describe forgery method, verify node, terminal id...' }, ja: { ph: '偽造方式・検証ノード・端末IDを記入…' }, ko: { ph: '위조 방식, 검증 노드, 단말기 ID...' } },
    VERIFY_FAIL: { zh: { ph: '核验终端、二维码内容、异常类型（重复/过期/签名失败）……' }, en: { ph: 'Terminal, QR content, anomaly type...' }, ja: { ph: '端末・QR内容・異常種別（重複/期限切/署名失敗）…' }, ko: { ph: '단말기, QR 내용, 이상 유형...' } },
    PAYMENT_ANOMALY: { zh: { ph: '支付渠道、扣款/退款情况、对账快照……' }, en: { ph: 'Channel, charge/refund, reconciliation...' }, ja: { ph: '決済チャネル・引落/返金・照合スナップ…' }, ko: { ph: '결제 채널, 충전/환불, 대조...' } },
    NO_TICKET_COMP: { zh: { ph: '未出票原因、机票酒店凭证、用户申诉记录……' }, en: { ph: 'Reason, flight/hotel receipts, user appeal...' }, ja: { ph: '不発券理由・航空券/宿泊証明・ユーザ申告…' }, ko: { ph: '미발권 사유, 항공/숙박 증빙, 사용자 진술...' } },
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="section-eyebrow"><Plus className="inline w-3.5 h-3.5 mr-1" />New Issue</p>
            <h2 className="font-display font-bold text-2xl">{t.add}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost !py-1.5 !px-2"><X className="w-4 h-4" /></button>
        </div>

        <div className="mb-5">
          <div className="label">{t.form.type}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TABS.map((tt) => {
              const lbl = ISSUE_TYPE_LABEL[tt];
              const I = TYPE_ICON[tt];
              return (
                <button
                  key={tt}
                  onClick={() => setType(tt)}
                  className={classNames(
                    'rounded-xl border p-3 text-left transition-all',
                    type === tt ? 'border-neon-pink/50 bg-neon-pink/5 shadow-glow' : 'border-white/10 bg-white/[0.03] hover:bg-white/5',
                  )}
                >
                  <div className={classNames('flex items-center gap-1.5 font-semibold text-sm', lbl.color)}>
                    <I className="w-4 h-4" /> {pickIssueTypeLabel(tt, language)}
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">{pickIssueTypeDesc(tt, language)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label={language === 'zh' ? '工单摘要' : 'Summary'}>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} className="input"
              placeholder={language === 'zh' ? '简短说明事件原委' : 'Brief description'} />
          </Field>
          <Field label={t.form.order}>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} className="input font-mono text-sm"
              placeholder="ord-xxxxxx" />
          </Field>
          <Field label={t.form.crypto}>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-amber" />
              <input value={crypto} onChange={(e) => setCrypto(e.target.value)} className="input font-mono pl-10 text-sm"
                placeholder="SP-XXXXXXXX-XXXX" />
            </div>
          </Field>
          <Field label={t.form.channel}>
            <select className="select">
              {['ALIPAY_PLUS', 'VISA', 'MASTERCARD', 'LINEPAY', 'PAYME', 'GCASH', 'PROMPTPAY'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label={language === 'zh' ? '赔付/补偿金额 (CNY)' : 'Compensation (CNY)'}>
            <input type="number" value={comp} onChange={(e) => setComp(Number(e.target.value))} className="input num font-bold text-neon-amber" />
          </Field>
          <Field label={language === 'zh' ? '提报人' : 'Reporter'}>
            <div className="select flex items-center gap-2"><UserRound className="w-4 h-4 text-white/60" /> <span className="text-sm">{language === 'zh' ? '当前用户（运营台）' : 'Current user (ops)'}</span></div>
          </Field>
          <div className="md:col-span-2">
            <div className="label">{t.form.evidence}</div>
            <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={4}
              className="input leading-relaxed resize-none"
              placeholder={TYPE_DESC[type][language].ph}
            />
          </div>
        </div>

        {/* 工作流节点 */}
        <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="text-xs font-semibold text-white/70 mb-3">{language === 'zh' ? '业务闭环节点' : 'Resolution Flow'}</div>
          <div className="flex items-center flex-wrap gap-2">
            {type === 'FAKE_TICKET' && FlowNode([
              { icon: AlertTriangle, text: language === 'zh' ? '报警收录' : 'Alert received' },
              { icon: FileSearch, text: language === 'zh' ? '加密串溯源' : 'Trace crypto' },
              { icon: QrCode, text: language === 'zh' ? '终端双向验签' : '2-way verify' },
              { icon: CheckCircle2, text: language === 'zh' ? '溯源定责' : 'Responsibility' },
            ])}
            {type === 'VERIFY_FAIL' && FlowNode([
              { icon: QrCode, text: language === 'zh' ? '验票失败' : 'Verify fail' },
              { icon: UserRound, text: language === 'zh' ? '用户联系' : 'Contact user' },
              { icon: RefreshCw, text: language === 'zh' ? '重新出票' : 'Re-issue' },
              { icon: CheckCircle2, text: language === 'zh' ? '核验通过' : 'Resolved' },
            ])}
            {type === 'PAYMENT_ANOMALY' && FlowNode([
              { icon: CreditCard, text: language === 'zh' ? '扣款异常' : 'Charge anomaly' },
              { icon: CircleDollarSign, text: language === 'zh' ? '对账比对' : 'Reconcile' },
              { icon: RefreshCw, text: language === 'zh' ? '退款/调账' : 'Refund' },
              { icon: CheckCircle2, text: language === 'zh' ? '渠道确认' : 'Channel OK' },
            ])}
            {type === 'NO_TICKET_COMP' && FlowNode([
              { icon: AlertTriangle, text: language === 'zh' ? '无票受理' : 'No-ticket' },
              { icon: Plane, text: language === 'zh' ? '机票核验' : 'Flight verify' },
              { icon: HotelIcon, text: language === 'zh' ? '酒店核验' : 'Hotel verify' },
              { icon: CheckCircle2, text: language === 'zh' ? '赔付到账' : 'Paid' },
            ])}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{t.close}</button>
          <button onClick={submit} className="btn-primary"><Plus className="w-4 h-4" /> {t.submit}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function FlowNode(arr: { icon: any; text: string }[]) {
  return (
    <>
      {arr.map((n, i) => {
        const I = n.icon;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs inline-flex items-center gap-1.5 font-medium">
              <I className="w-3.5 h-3.5 text-neon-teal" /> {n.text}
            </span>
            {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
          </span>
        );
      })}
    </>
  );
}
