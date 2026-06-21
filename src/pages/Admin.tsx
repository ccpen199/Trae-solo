import { useState, Fragment, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, FileText, Landmark, Users, Check, X, RefreshCw, AlertTriangle, Star, Eye, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Stamp, FileCheck } from 'lucide-react';
type Role = '房源审核员' | '合同备案员' | '资金审计员' | '管理员';
const roleTabs: Record<Role, string[]> = { '房源审核员': ['review'], '合同备案员': ['contract'], '资金审计员': ['audit', 'provider'], '管理员': ['review', 'contract', 'audit', 'provider'] };
const allTabs = [{ key: 'review', label: '房源审核', icon: Shield }, { key: 'contract', label: '合同备案', icon: FileText }, { key: 'audit', label: '资金审计', icon: Landmark }, { key: 'provider', label: '供应商管理', icon: Users }];
const poolTabs = ['CCB自营', '合作运营', '个人房源'];
const sc: Record<string, string> = { '待审核': 'bg-yellow-100 text-yellow-700', '已通过': 'bg-green-100 text-green-700', '已驳回': 'bg-red-100 text-red-700', '待备案': 'bg-yellow-100 text-yellow-700', '已备案': 'bg-green-100 text-green-700', '退回': 'bg-red-100 text-red-700', '正常': 'bg-green-100 text-green-700', '异常': 'bg-red-100 text-red-700' };

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState<Role>('管理员');
  const [tab, setTab] = useState('review');
  const [pool, setPool] = useState(0);
  const [reviews, setReviews] = useState([
    { name: '建融家园·朝阳店201', type: '一居室', time: '2025-05-10', status: '待审核', pool: 0, v: { sys: '直营管理体系', ver: 'V3.2' } },
    { name: '融汇公寓·海淀店305', type: '两居室', time: '2025-05-09', status: '已通过', pool: 1, v: { wl: true, exp: '2026-03-01', con: 'SC-2025-0412', signed: true } },
    { name: '个人房源·西城张先生', type: '三居室', time: '2025-05-08', status: '已驳回', pool: 2, v: { cert: '京西2018-02391', face: '2025-05-07', conf: 98.7 } },
    { name: '建融家园·丰台店102', type: '单间', time: '2025-05-07', status: '待审核', pool: 0, v: { sys: '直营管理体系', ver: 'V3.1' } },
    { name: '合作房源·通州店401', type: '一居室', time: '2025-05-06', status: '待审核', pool: 1, v: { wl: true, exp: '2025-12-31', con: 'SC-2025-0398', signed: false } },
    { name: '个人房源·东城李女士', type: '两居室', time: '2025-05-05', status: '已通过', pool: 2, v: { cert: '京东2019-10582', face: '2025-05-04', conf: 99.2 } },
  ]);
  const [contracts, setContracts] = useState([
    { id: 'HT2025050001', house: '建融家园·朝阳店201', tenant: '王明', date: '2025-05-01', status: '待备案', fn: '', fd: '', cmt: '', rr: '' },
    { id: 'HT2025050002', house: '融汇公寓·海淀店305', tenant: '李华', date: '2025-04-28', status: '已备案', fn: 'BJ-2025-04832', fd: '2025-05-02', cmt: '材料齐全', rr: '' },
    { id: 'HT2025050003', house: '个人房源·西城张先生', tenant: '赵强', date: '2025-04-25', status: '退回', fn: '', fd: '', cmt: '', rr: '产权信息不完整' },
    { id: 'HT2025050004', house: '建融家园·丰台店102', tenant: '孙丽', date: '2025-04-20', status: '已备案', fn: 'BJ-2025-04791', fd: '2025-04-22', cmt: '符合备案要求', rr: '' },
  ]);
  const [trails] = useState([
    { id: 'FL20250510001', time: '2025-05-10 09:30', from: '王明', to: '监管账户', amount: 4500, status: '正常', path: '租户王明 → 建行监管账户 → 房东刘某' },
    { id: 'FL20250509002', time: '2025-05-09 14:20', from: '李华', to: '监管账户', amount: 6800, status: '正常', path: '租户李华 → 建行监管账户 → 物业服务费 → 房东陈某' },
    { id: 'FL20250508003', time: '2025-05-08 11:05', from: '赵强', to: '房东·张某', amount: 12000, status: '异常', path: '租户赵强 → 监管账户(异常跳转) → 房东张某(直付)' },
    { id: 'FL20250507004', time: '2025-05-07 16:45', from: '监管账户', to: '房东·刘某', amount: 4500, status: '正常', path: '建行监管账户 → 房东刘某' },
  ]);
  const [anomalies, setAnomalies] = useState([
    { id: 'FL20250508003', type: '流向异常', desc: '资金绕过监管账户直接支付房东', handled: false },
    { id: 'FL20250506001', type: '金额异常', desc: '单笔支付金额超出合同约定30%', handled: false },
    { id: 'FL20250503002', type: '时间异常', desc: '非工作日大额转账', handled: true },
  ]);
  const [providers] = useState([
    { name: '建信住房服务', rating: 4.8, trend: 'up' as const, count: 326, rate: 98, resp: '2h', score: 95, comp: 'green', evs: [{ i: '维修响应', s: 97 }, { i: '清洁服务', s: 94 }, { i: '租后服务', s: 96 }], sum: '连续6个月评分上升' },
    { name: '融创物业', rating: 4.5, trend: 'up' as const, count: 218, rate: 95, resp: '3h', score: 88, comp: 'yellow', evs: [{ i: '维修响应', s: 90 }, { i: '清洁服务', s: 85 }, { i: '租后服务', s: 89 }], sum: '本月评分有所回升' },
    { name: '安居客运营', rating: 4.2, trend: 'down' as const, count: 154, rate: 92, resp: '4h', score: 82, comp: 'yellow', evs: [{ i: '维修响应', s: 84 }, { i: '清洁服务', s: 78 }, { i: '租后服务', s: 84 }], sum: '近期投诉率上升' },
    { name: '链家管家', rating: 3.9, trend: 'down' as const, count: 97, rate: 88, resp: '5h', score: 75, comp: 'red', evs: [{ i: '维修响应', s: 72 }, { i: '清洁服务', s: 70 }, { i: '租后服务', s: 83 }], sum: '连续3个月评分下降' },
  ]);
  const [expAudit, setExpAudit] = useState<number | null>(null);
  const [expProv, setExpProv] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<number | null>(null);
  const [report, setReport] = useState<number | null>(null);
  const visibleTabs = allTabs.filter(t => roleTabs[role].includes(t.key));
  const filtered = reviews.filter(r => r.pool === pool);
  const mkFn = () => `BJ-2025-${Math.floor(10000 + Math.random() * 89999)}`;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'filing') {
      setTab('contract');
      setRole('合同备案员');
    } else if (tabParam && allTabs.some(t => t.key === tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key: string) => {
    setTab(key);
    setSearchParams({ tab: key });
  };
  const approve = (fi: number) => { const idx = reviews.indexOf(filtered[fi]); setReviews(reviews.map((r, i) => i === idx ? { ...r, status: '已通过' } : r)); };
  const reject = (fi: number) => { const reason = prompt('请输入驳回原因'); if (!reason) return; const idx = reviews.indexOf(filtered[fi]); setReviews(reviews.map((r, i) => i === idx ? { ...r, status: '已驳回' } : r)); };
  const batchFile = () => setContracts(contracts.map(c => c.status === '待备案' ? { ...c, status: '已备案', fn: mkFn(), fd: '2026-06-20', cmt: '批量备案通过' } : c));
  const refile = (i: number) => setContracts(contracts.map((c, j) => j === i ? { ...c, status: '已备案', fn: mkFn(), fd: '2026-06-20', cmt: '重新备案通过', rr: '' } : c));
  const revRecords = [{ date: '2025-05-08', reviewer: '张审计', result: '通过', comment: '资金流向正常' }, { date: '2025-04-22', reviewer: '李审计', result: '异常', comment: '发现1笔异常转账' }, { date: '2025-04-10', reviewer: '王审计', result: '通过', comment: '所有流水正常' }];
  const compDot = (c: string) => c === 'green' ? 'bg-green-500' : c === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
  const compLabel = (c: string) => c === 'green' ? '达标' : c === 'yellow' ? '预警' : '不达标';
  const atypeColor = (t: string) => t === '金额异常' ? 'bg-orange-100 text-orange-700' : t === '流向异常' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="min-h-screen bg-space-50 p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-serif font-bold text-ccb-500">运营管理后台</h1>
        <div className="flex gap-1.5">
          {(['房源审核员', '合同备案员', '资金审计员', '管理员'] as Role[]).map(r => (
            <button key={r} onClick={() => { setRole(r); if (!roleTabs[r].includes(tab)) setTab(roleTabs[r][0]); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${role === r ? 'bg-ccb-500 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              <Shield size={12} />{r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">当前角色:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ccb-100 text-ccb-600 rounded-full text-xs font-medium"><Shield size={11} />{role}</span>
      </div>
      <div className="flex gap-2 mb-6">
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-ccb-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'review' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-2 mb-4">
            {poolTabs.map((p, i) => (
              <button key={p} onClick={() => setPool(i)} className={`px-4 py-1.5 rounded-full text-sm ${pool === i ? 'bg-ccb-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">房源名称</th><th className="text-left">类型</th><th className="text-left">提交时间</th><th className="text-left">状态</th><th className="text-left">验证项</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="text-gray-600">{r.type}</td>
                  <td className="text-gray-500">{r.time}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[r.status]}`}>{r.status}</span></td>
                  <td className="text-xs">
                    {r.pool === 0 && <><span className="text-green-600">✓ {r.v.sys}</span> <span className="text-gray-500">标准版本: {r.v.ver}</span></>}
                    {r.pool === 1 && <><span className="text-green-600">✓ 资质白名单</span> <span className="text-gray-500">到期:{(r.v as any).exp}</span> <span className={`${(r.v as any).signed ? 'text-green-600' : 'text-red-500'}`}>✓ 服务标准契约 {(r.v as any).con} {(r.v as any).signed ? '已签约' : '未签约'}</span></>}
                    {r.pool === 2 && <><span className="text-green-600">✓ 产权核验</span> <span className="text-gray-500">{(r.v as any).cert}</span> <span className="text-green-600">✓ 人脸识别</span> <span className="text-gray-500">{(r.v as any).face} 置信度{(r.v as any).conf}%</span></>}
                  </td>
                  <td className="text-right space-x-2">
                    {r.status === '待审核' && (<><button onClick={() => approve(i)} className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"><Check size={12} className="inline mr-1" />通过</button><button onClick={() => reject(i)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"><X size={12} className="inline mr-1" />驳回</button></>)}
                    {r.status !== '待审核' && <span className="text-gray-400 text-xs">已处理</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'contract' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-3 mb-4">
            <button onClick={batchFile} className="px-4 py-2 bg-ccb-500 text-white rounded-lg text-sm hover:bg-ccb-600"><RefreshCw size={14} className="inline mr-1" />批量备案</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">合同编号</th><th className="text-left">房源</th><th className="text-left">租客</th><th className="text-left">签约日期</th><th className="text-left">状态</th><th className="text-left">备案信息</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {contracts.map((c, i) => (
                <Fragment key={i}>
                  <tr className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-mono text-ccb-500 font-medium">{c.id}</td>
                    <td className="text-gray-800">{c.house}</td>
                    <td className="text-gray-600">{c.tenant}</td>
                    <td className="text-gray-500">{c.date}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[c.status]}`}>{c.status}</span></td>
                    <td className="text-xs">
                      {c.status === '已备案' && <><span className="text-gray-700">{c.fn}</span> <span className="text-gray-400">{c.fd}</span> <span className="text-green-600">{c.cmt}</span></>}
                      {c.status === '退回' && <span className="text-red-500">原因: {c.rr}</span>}
                      {c.status === '待备案' && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="text-right space-x-2">
                      {c.status === '已备案' && <button onClick={() => setReceipt(receipt === i ? null : i)} className="px-2 py-1 bg-ccb-50 text-ccb-600 rounded text-xs hover:bg-ccb-100"><Eye size={12} className="inline mr-1" />回执</button>}
                      {c.status === '退回' && <button onClick={() => refile(i)} className="px-2 py-1 bg-gold-50 text-gold-600 rounded text-xs hover:bg-gold-100"><RefreshCw size={12} className="inline mr-1" />重新备案</button>}
                    </td>
                  </tr>
                  {receipt === i && (
                    <tr><td colSpan={7} className="bg-ccb-50/50 p-4">
                      <div className="border border-ccb-200 rounded-lg p-4 max-w-md mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-3"><Stamp size={20} className="text-ccb-500" /><span className="font-serif font-bold text-ccb-700 text-lg">备案回执</span></div>
                        <div className="text-xs space-y-1 text-left">
                          <p>备案编号: <b>{c.fn}</b></p><p>备案日期: <b>{c.fd}</b></p><p>审核意见: <b>{c.cmt}</b></p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-ccb-200"><span className="text-ccb-600 font-medium text-xs">住房和城乡建设部 · 备案专用章</span></div>
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[{ label: '总资金流水', value: '¥213.6万', color: 'text-ccb-500', bg: 'bg-ccb-50' }, { label: '待划转', value: '¥26.1万', color: 'text-gold-600', bg: 'bg-gold-50' }, { label: '监管余额', value: '¥187.2万', color: 'text-green-600', bg: 'bg-green-50' }, { label: '异常预警', value: String(anomalies.filter(a => !a.handled).length), color: 'text-red-600', bg: 'bg-red-50' }].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-4`}><p className="text-xs text-gray-500 mb-1">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.value}</p></div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-700 mb-3">资金流向</h3>
            <svg viewBox="0 0 320 130" className="w-full h-36">
              <text x={30} y={18} className="text-[9px] font-medium" fill="#003DA5">租户支付</text><rect x={10} y={25} width={40} height={65} rx={4} fill="#003DA5" opacity={0.15} />
              <text x={30} y={62} textAnchor="middle" className="text-[8px]" fill="#003DA5">¥2.13万</text>
              <text x={155} y={18} textAnchor="middle" className="text-[9px] font-medium" fill="#C9A96E">监管账户</text><rect x={135} y={25} width={40} height={65} rx={4} fill="#C9A96E" opacity={0.2} />
              <text x={155} y={62} textAnchor="middle" className="text-[8px]" fill="#92702E">¥1.87万</text>
              <text x={268} y={18} textAnchor="middle" className="text-[9px] font-medium" fill="#003DA5">房东收入</text><rect x={252} y={25} width={40} height={58} rx={4} fill="#003DA5" opacity={0.1} />
              <text x={272} y={58} textAnchor="middle" className="text-[8px]" fill="#003DA5">¥1.62万</text>
              <text x={268} y={98} textAnchor="middle" className="text-[9px] font-medium" fill="#C9A96E">物业/服务</text><rect x={252} y={100} width={40} height={18} rx={4} fill="#C9A96E" opacity={0.1} />
              <text x={272} y={113} textAnchor="middle" className="text-[7px]" fill="#92702E">¥0.25万</text>
              <path d="M 50 40 C 90 40, 95 35, 135 35" fill="none" stroke="#003DA5" strokeWidth={12} opacity={0.3} />
              <path d="M 50 70 C 90 70, 95 78, 135 78" fill="none" stroke="#003DA5" strokeWidth={6} opacity={0.2} />
              <path d="M 175 38 C 215 38, 215 33, 252 33" fill="none" stroke="#C9A96E" strokeWidth={10} opacity={0.4} />
              <path d="M 175 75 C 215 75, 215 75, 252 75" fill="none" stroke="#C9A96E" strokeWidth={5} opacity={0.3} />
              <path d="M 175 85 C 215 85, 230 105, 252 105" fill="none" stroke="#C9A96E" strokeWidth={3} opacity={0.2} />
            </svg>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" />异常预警</h3>
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${a.handled ? 'bg-gray-50' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${atypeColor(a.type)}`}>{a.type}</span>
                    <span className="text-sm text-gray-700">{a.desc}</span>
                    {a.handled && <span className="text-xs text-gray-400">已处理</span>}
                  </div>
                  {!a.handled && <button onClick={() => setAnomalies(anomalies.map((x, j) => j === i ? { ...x, handled: true } : x))} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">标记已处理</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-700 mb-3">审计流水</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">流水号</th><th className="text-left">时间</th><th className="text-left">付款方</th><th className="text-left">收款方</th><th className="text-right">金额</th><th className="text-left">状态</th><th></th></tr></thead>
              <tbody>
                {trails.map((t, i) => (
                  <Fragment key={i}>
                    <tr className={`border-b last:border-0 ${t.status === '异常' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 font-mono text-xs">{t.id}</td>
                      <td className="text-gray-500 text-xs">{t.time}</td>
                      <td className="text-gray-700">{t.from}</td>
                      <td className="text-gray-700">{t.to}</td>
                      <td className="text-right font-medium">¥{t.amount.toLocaleString()}</td>
                      <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[t.status]}`}>{t.status === '异常' && <AlertTriangle size={10} className="inline mr-1" />}{t.status}</span></td>
                      <td><button onClick={() => setExpAudit(expAudit === i ? null : i)} className="text-gray-400 hover:text-ccb-500">{expAudit === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></td>
                    </tr>
                    {expAudit === i && <tr><td colSpan={7} className="bg-gray-50 px-4 py-2"><p className="text-xs text-gray-600">资金流向: {t.path}</p></td></tr>}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-700 mb-3">复查记录</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">复查日期</th><th className="text-left">审计员</th><th className="text-left">结果</th><th className="text-left">备注</th></tr></thead>
              <tbody>
                {revRecords.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">{r.date}</td>
                    <td className="text-gray-700">{r.reviewer}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.result === '通过' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.result}</span></td>
                    <td className="text-gray-500 text-xs">{r.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'provider' && (
        <div className="grid grid-cols-2 gap-4">
          {providers.map((p, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800">{p.name}</h3>
                    <span className={`flex items-center text-xs font-medium ${p.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                      {p.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{p.trend === 'up' ? '上升' : '下降'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= Math.round(p.rating) ? 'fill-gold-500 text-gold-500' : 'text-gray-300'} />)}
                    <span className="text-xs text-gray-500 ml-1">{p.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{p.sum}</p>
                </div>
                <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${compDot(p.comp)}`} title="服务标准契约合规" /><span className="text-xs text-gray-500">契约合规</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="bg-gray-50 rounded-lg py-2"><p className="text-xs text-gray-500">响应时间</p><p className="text-sm font-semibold text-ccb-500">{p.resp}</p></div>
                <div className="bg-gray-50 rounded-lg py-2"><p className="text-xs text-gray-500">完成率</p><p className="text-sm font-semibold text-green-600">{p.rate}%</p></div>
                <div className="bg-gray-50 rounded-lg py-2"><p className="text-xs text-gray-500">综合评分</p><p className="text-sm font-semibold text-gold-600">{p.score}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setExpProv(expProv === i ? null : i)} className="flex-1 px-3 py-1.5 border text-xs rounded hover:bg-gray-50 text-gray-600 flex items-center justify-center gap-1"><FileCheck size={12} />考核评价</button>
                <button onClick={() => setReport(report === i ? null : i)} className="flex-1 px-3 py-1.5 bg-ccb-50 text-ccb-600 text-xs rounded hover:bg-ccb-100 flex items-center justify-center gap-1"><FileText size={12} />考核报告</button>
              </div>
              {expProv === i && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {p.evs.map((e, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{e.i}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${e.s >= 90 ? 'bg-green-500' : e.s >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${e.s}%` }} /></div>
                        <span className="text-xs font-medium w-6 text-right">{e.s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {report === i && (
                <div className="mt-3 pt-3 border-t bg-ccb-50/50 rounded-lg p-3">
                  <h4 className="font-medium text-ccb-700 text-sm mb-2">供应商考核报告</h4>
                  <div className="text-xs space-y-1">
                    <p>供应商: <b>{p.name}</b></p><p>综合评分: <b>{p.score}/100</b></p><p>契约合规: <b>{compLabel(p.comp)}</b></p><p>趋势: <b>{p.trend === 'up' ? '上升' : '下降'}</b></p><p>评价摘要: {p.sum}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
