import { useState } from 'react';
import { Shield, FileText, Landmark, Users, Check, X, Download, RefreshCw, AlertTriangle, Star } from 'lucide-react';

const tabs = [
  { key: 'review', label: '房源审核', icon: Shield },
  { key: 'contract', label: '合同备案', icon: FileText },
  { key: 'audit', label: '资金审计', icon: Landmark },
  { key: 'provider', label: '供应商管理', icon: Users },
];

const poolTabs = ['CCB自营', '合作运营', '个人房源'];

const reviewData = [
  { name: '建融家园·朝阳店201', type: '一居室', time: '2025-05-10', status: '待审核', pool: 0 },
  { name: '融汇公寓·海淀店305', type: '两居室', time: '2025-05-09', status: '已通过', pool: 1 },
  { name: '个人房源·西城张先生', type: '三居室', time: '2025-05-08', status: '已驳回', pool: 2 },
  { name: '建融家园·丰台店102', type: '单间', time: '2025-05-07', status: '待审核', pool: 0 },
  { name: '合作房源·通州店401', type: '一居室', time: '2025-05-06', status: '待审核', pool: 1 },
  { name: '个人房源·东城李女士', type: '两居室', time: '2025-05-05', status: '已通过', pool: 2 },
];

const contractData = [
  { id: 'HT2025050001', house: '建融家园·朝阳店201', tenant: '王明', date: '2025-05-01', status: '待备案', filingNo: '' },
  { id: 'HT2025050002', house: '融汇公寓·海淀店305', tenant: '李华', date: '2025-04-28', status: '已备案', filingNo: 'BJ-2025-04832' },
  { id: 'HT2025050003', house: '个人房源·西城张先生', tenant: '赵强', date: '2025-04-25', status: '退回', filingNo: '' },
  { id: 'HT2025050004', house: '建融家园·丰台店102', tenant: '孙丽', date: '2025-04-20', status: '已备案', filingNo: 'BJ-2025-04791' },
];

const auditData = [
  { id: 'FL20250510001', time: '2025-05-10 09:30', from: '王明', to: '监管账户', amount: 4500, status: '正常' },
  { id: 'FL20250509002', time: '2025-05-09 14:20', from: '李华', to: '监管账户', amount: 6800, status: '正常' },
  { id: 'FL20250508003', time: '2025-05-08 11:05', from: '赵强', to: '房东·张某', amount: 12000, status: '异常' },
  { id: 'FL20250507004', time: '2025-05-07 16:45', from: '监管账户', to: '房东·刘某', amount: 4500, status: '正常' },
];

const providerData = [
  { name: '建信住房服务', rating: 4.8, count: 326, rate: 98, resp: '2h', score: 95 },
  { name: '融创物业', rating: 4.5, count: 218, rate: 95, resp: '3h', score: 88 },
  { name: '安居客运营', rating: 4.2, count: 154, rate: 92, resp: '4h', score: 82 },
  { name: '链家管家', rating: 3.9, count: 97, rate: 88, resp: '5h', score: 75 },
];

const statusColor: Record<string, string> = {
  '待审核': 'bg-yellow-100 text-yellow-700',
  '已通过': 'bg-green-100 text-green-700',
  '已驳回': 'bg-red-100 text-red-700',
  '待备案': 'bg-yellow-100 text-yellow-700',
  '已备案': 'bg-green-100 text-green-700',
  '退回': 'bg-red-100 text-red-700',
  '正常': 'bg-green-100 text-green-700',
  '异常': 'bg-red-100 text-red-700',
};

export default function Admin() {
  const [tab, setTab] = useState('review');
  const [pool, setPool] = useState(0);

  const filtered = reviewData.filter((r) => r.pool === pool);

  const gauge = (score: number) => {
    const angle = (score / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const r = 40;
    const cx = 50;
    const cy = 50;
    const x = cx + r * Math.cos(Math.PI - rad);
    const y = cy - r * Math.sin(rad);
    return (
      <svg viewBox="0 0 100 55" className="w-20 h-10">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#E5E7EB" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`} fill="none" stroke={score >= 90 ? '#16a34a' : score >= 70 ? '#C9A96E' : '#dc2626'} strokeWidth="8" strokeLinecap="round" />
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-[10px] font-bold" fill="#1f2937">{score}</text>
      </svg>
    );
  };

  const sankey = () => (
    <svg viewBox="0 0 300 120" className="w-full h-32">
      <text x={30} y={18} className="text-[9px] font-medium" fill="#003DA5">租客</text>
      <rect x={10} y={25} width={40} height={60} rx={4} fill="#003DA5" opacity={0.15} />
      <text x={30} y={60} textAnchor="middle" className="text-[8px]" fill="#003DA5">¥2.13万</text>
      <text x={150} y={18} textAnchor="middle" className="text-[9px] font-medium" fill="#C9A96E">监管账户</text>
      <rect x={130} y={25} width={40} height={60} rx={4} fill="#C9A96E" opacity={0.2} />
      <text x={150} y={60} textAnchor="middle" className="text-[8px]" fill="#92702E">¥1.87万</text>
      <text x={265} y={18} className="text-[9px] font-medium" fill="#003DA5">房东</text>
      <rect x={250} y={25} width={40} height={55} rx={4} fill="#003DA5" opacity={0.1} />
      <text x={270} y={58} textAnchor="middle" className="text-[8px]" fill="#003DA5">¥1.62万</text>
      <path d="M 50 40 C 90 40, 90 35, 130 35" fill="none" stroke="#003DA5" strokeWidth={12} opacity={0.3} />
      <path d="M 50 65 C 90 65, 90 70, 130 70" fill="none" stroke="#003DA5" strokeWidth={8} opacity={0.2} />
      <path d="M 170 38 C 210 38, 210 33, 250 33" fill="none" stroke="#C9A96E" strokeWidth={10} opacity={0.4} />
      <path d="M 170 72 C 210 72, 210 72, 250 72" fill="none" stroke="#C9A96E" strokeWidth={6} opacity={0.3} />
    </svg>
  );

  return (
    <div className="min-h-screen bg-space-50 p-6">
      <h1 className="text-2xl font-serif font-bold text-ccb-500 mb-6">运营管理后台</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-ccb-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'review' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-2 mb-4">
            {poolTabs.map((p, i) => (
              <button key={p} onClick={() => setPool(i)}
                className={`px-4 py-1.5 rounded-full text-sm ${pool === i ? 'bg-ccb-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">房源名称</th><th className="text-left">类型</th><th className="text-left">提交时间</th><th className="text-left">审核状态</th><th className="text-left">验证项</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="text-gray-600">{r.type}</td>
                  <td className="text-gray-500">{r.time}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>{r.status}</span></td>
                  <td className="text-xs text-gray-500">
                    {r.pool === 2 && <><span className="text-green-600">产权验证✓</span> <span className="text-green-600">人脸识别✓</span></>}
                    {r.pool === 1 && <><span className="text-green-600">资质白名单✓</span> <span className="text-green-600">服务标准契约✓</span></>}
                    {r.pool === 0 && '—'}
                  </td>
                  <td className="text-right space-x-2">
                    {r.status === '待审核' && (<><button className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"><Check size={12} className="inline mr-1" />通过</button><button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"><X size={12} className="inline mr-1" />驳回</button></>)}
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
            <button className="px-4 py-2 bg-ccb-500 text-white rounded-lg text-sm hover:bg-ccb-600"><RefreshCw size={14} className="inline mr-1" />批量备案</button>
            <button className="px-4 py-2 bg-gold-500 text-white rounded-lg text-sm hover:bg-gold-600"><Download size={14} className="inline mr-1" />同步住建部</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">合同编号</th><th className="text-left">房源</th><th className="text-left">租客</th><th className="text-left">签约日期</th><th className="text-left">备案状态</th><th className="text-left">备案号</th></tr></thead>
            <tbody>
              {contractData.map((c, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-mono text-ccb-500 font-medium">{c.id}</td>
                  <td className="text-gray-800">{c.house}</td>
                  <td className="text-gray-600">{c.tenant}</td>
                  <td className="text-gray-500">{c.date}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span></td>
                  <td className="text-gray-500 text-xs">{c.filingNo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '总资金流水', value: '¥213.6万', color: 'text-ccb-500', bg: 'bg-ccb-50' },
              { label: '待划转', value: '¥26.1万', color: 'text-gold-600', bg: 'bg-gold-50' },
              { label: '监管余额', value: '¥187.2万', color: 'text-green-600', bg: 'bg-green-50' },
              { label: '异常预警', value: '3', color: 'text-red-600', bg: 'bg-red-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-4`}>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-700 mb-3">资金流向</h3>
            {sankey()}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700">审计流水</h3>
              <button className="px-3 py-1.5 border border-ccb-500 text-ccb-500 rounded text-xs hover:bg-ccb-50"><Download size={12} className="inline mr-1" />导出审计报告</button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500"><th className="py-2 text-left">流水号</th><th className="text-left">支付时间</th><th className="text-left">付款方</th><th className="text-left">收款方</th><th className="text-right">金额</th><th className="text-left">状态</th></tr></thead>
              <tbody>
                {auditData.map((a, i) => (
                  <tr key={i} className={`border-b last:border-0 ${a.status === '异常' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 font-mono text-xs">{a.id}</td>
                    <td className="text-gray-500 text-xs">{a.time}</td>
                    <td className="text-gray-700">{a.from}</td>
                    <td className="text-gray-700">{a.to}</td>
                    <td className="text-right font-medium">¥{a.amount.toLocaleString()}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[a.status]}`}>{a.status === '异常' && <AlertTriangle size={10} className="inline mr-1" />}{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'provider' && (
        <div className="grid grid-cols-2 gap-4">
          {providerData.map((p, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-800">{p.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={12} className={s <= Math.round(p.rating) ? 'fill-gold-500 text-gold-500' : 'text-gray-300'} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{p.rating}</span>
                  </div>
                </div>
                {gauge(p.score)}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg py-2">
                  <p className="text-xs text-gray-500">响应时间</p>
                  <p className="text-sm font-semibold text-ccb-500">{p.resp}</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2">
                  <p className="text-xs text-gray-500">完成率</p>
                  <p className="text-sm font-semibold text-green-600">{p.rate}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2">
                  <p className="text-xs text-gray-500">评价分数</p>
                  <p className="text-sm font-semibold text-gold-600">{p.score}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span>服务次数: <b className="text-gray-700">{p.count}</b></span>
                <span className="text-green-500">● 达标</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
