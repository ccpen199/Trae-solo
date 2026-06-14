import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, Search, Calendar, Building2, FileSpreadsheet,
  Banknote, Wallet, TrendingUp, Users, CheckCircle, Clock, AlertCircle, Download,
  BarChart3, ChevronDown, ChevronUp, FileCheck, XCircle, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpGet } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const FormLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-gov-500' };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

const insuranceOptions = [
  { k: 'pension', label: '养老保险', color: '#165DFF', chartColor: '#165DFF' },
  { k: 'medical', label: '医疗保险', color: '#10B981', chartColor: '#10B981' },
  { k: 'unemployment', label: '失业保险', color: '#E6A23C', chartColor: '#E6A23C' },
  { k: 'injury', label: '工伤保险', color: '#EF4444', chartColor: '#EF4444' },
  { k: 'maternity', label: '生育保险', color: '#EC4899', chartColor: '#EC4899' },
];

const years = ['2026', '2025', '2024', '2023', '2022'];

interface PaymentRecord {
  id: number;
  period: string;
  insuranceType: string;
  insuranceKey: string;
  base: number;
  personal: number;
  company: number;
  status: string;
  receivedDate: string;
  companyName: string;
}

interface SummaryData {
  totalMonths: number;
  personalTotal: number;
  companyTotal: number;
  avgBase: number;
}

interface ExportTask {
  id: string;
  fileName: string;
  recordCount: number;
  status: 'generating' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  operatorName: string;
  errorReason?: string;
}

export default function PaymentQueryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [year, setYear] = useState('2026');
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>(['pension', 'medical', 'unemployment']);
  const [companySearch, setCompanySearch] = useState('');
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalMonths: 0, personalTotal: 0, companyTotal: 0, avgBase: 0 });
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [showExportPanel, setShowExportPanel] = useState(false);

  useEffect(() => { loadData(); }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await httpGet(`/social-insurance/payment-records?userId=${user?.id || 1}&year=${year}`);
      if (resp.code === 0 && resp.data) {
        const data = resp.data as { records: PaymentRecord[]; summary: SummaryData };
        setRecords(data.records || []);
        setSummary(data.summary || summary);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const toggleInsurance = (k: string) => {
    setSelectedInsurances((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedInsurances.length > 0 && !selectedInsurances.includes(r.insuranceKey)) return false;
      if (companySearch && !r.companyName?.includes(companySearch)) return false;
      return true;
    }).sort((a, b) => b.period.localeCompare(a.period));
  }, [records, selectedInsurances, companySearch]);

  const chartData = useMemo(() => {
    const monthMap = new Map<string, { month: string; 养老: number; 医疗: number; 失业: number; 工伤: number; 生育: number }>();
    records.forEach((r) => {
      const m = r.period.slice(0, 7);
      if (!monthMap.has(m)) monthMap.set(m, { month: m, 养老: 0, 医疗: 0, 失业: 0, 工伤: 0, 生育: 0 });
      const keyMap: Record<string, '养老' | '医疗' | '失业' | '工伤' | '生育'> = { pension: '养老', medical: '医疗', unemployment: '失业', injury: '工伤', maternity: '生育' };
      const k = keyMap[r.insuranceKey] || '养老';
      monthMap.get(m)![k] = (monthMap.get(m)![k] || 0) + (r.personal + r.company);
    });
    return Array.from(monthMap.values()).slice(-12).sort((a, b) => a.month.localeCompare(b.month));
  }, [records]);

  const exportExcel = () => {
    if (filteredRecords.length === 0) {
      toast('暂无符合条件的缴费记录，无法导出', 'error');
      const failTask: ExportTask = {
        id: 'EXP-' + Date.now(),
        fileName: '',
        recordCount: 0,
        status: 'failed',
        createdAt: new Date().toLocaleString('zh-CN'),
        operatorName: (user as any)?.realName || user?.name || '当前用户',
        errorReason: '无符合条件的缴费记录',
      };
      setExportTasks((prev) => [failTask, ...prev]);
      setShowExportPanel(true);
      return;
    }

    const taskId = 'EXP-' + Date.now();
    const fileName = `社保缴费明细_${year}_${new Date().toISOString().slice(0, 10)}.csv`;

    const generatingTask: ExportTask = {
      id: taskId,
      fileName,
      recordCount: filteredRecords.length,
      status: 'generating',
      createdAt: new Date().toLocaleString('zh-CN'),
      operatorName: (user as any)?.realName || user?.name || '当前用户',
    };
    setExportTasks((prev) => [generatingTask, ...prev]);
    setShowExportPanel(true);
    toast('正在生成导出文件...', 'info');

    setTimeout(() => {
      try {
        const BOM = '\uFEFF';
        const header = '年月,险种,缴费单位,缴费基数(元),个人缴费(元),单位缴费(元),状态,到账日期';
        const rows = filteredRecords.map((r) =>
          [r.period, r.insuranceType, r.companyName, r.base, r.personal, r.company, r.status, r.receivedDate].join(',')
        );
        const csvContent = BOM + header + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const sizeKB = (blob.size / 1024).toFixed(1);
        setExportTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, completedAt: new Date().toLocaleString('zh-CN'), fileSize: `${sizeKB} KB` }
              : t
          )
        );
        toast(`导出成功：${filteredRecords.length} 条记录，文件 ${sizeKB}KB`, 'success');
      } catch (e: any) {
        setExportTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'failed' as const, errorReason: e?.message || '文件生成异常' }
              : t
          )
        );
        toast('导出失败：文件生成异常', 'error');
      }
    }, 800);
  };

  const StatCard = ({ icon: Icon, label, value, unit, color, trend }: {
    icon: any; label: string; value: number | string; unit?: string; color: string; trend?: string;
  }) => (
    <div className="gov-card p-5 hover:shadow-gov hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-sm', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3" />{trend}</span>}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-bold font-serif text-gray-800 group-hover:text-gov-600 transition-colors">{value}</span>
        {unit && <span className="text-sm text-gray-400 font-medium">{unit}</span>}
      </div>
    </div>
  );

  const statusBadge = (s: string) => {
    const map: Record<string, any> = {
      已到账: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      到账中: { cls: 'bg-gov-50 text-gov-700 border-gov-200', icon: Clock },
      欠费: { cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
      补缴: { cls: 'bg-gold-50 text-gold-700 border-gold-200', icon: AlertCircle },
    };
    const cfg = map[s] || map['已到账'];
    const Ic = cfg.icon;
    return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border', cfg.cls)}><Ic className="w-3 h-3" />{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/social-insurance/payment-query')}>社保服务</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">缴费查询</span>
      </div>

      <div className="gov-card p-5 md:p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-gov-700 flex items-center justify-center shrink-0 shadow-gov">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gov-700 font-serif">社保缴费查询</h1>
            <p className="text-sm text-gray-500 mt-0.5">个人缴费明细查询 · 多险种合并统计 · 可视化走势分析</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <FormLabel>查询年份</FormLabel>
            <div className="relative"><Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={year} onChange={(e) => setYear(e.target.value)} className="gov-input pl-10 appearance-none">
                {years.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
          </div>
          <div className="md:col-span-6">
            <FormLabel>险种筛选</FormLabel>
            <div className="flex flex-wrap gap-2">
              {insuranceOptions.map((ins) => (
                <button
                  key={ins.k} type="button" onClick={() => toggleInsurance(ins.k)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all',
                    selectedInsurances.includes(ins.k)
                      ? 'bg-white text-gray-700 border-gray-300 shadow-sm'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                  )}
                  style={selectedInsurances.includes(ins.k) ? { borderColor: ins.color, color: ins.color } : {}}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: selectedInsurances.includes(ins.k) ? ins.color : '#CBD5E1' }} />
                  {ins.label}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            <FormLabel>单位搜索</FormLabel>
            <div className="relative"><Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} placeholder="输入单位名称..." className="gov-input pl-10" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">共 <span className="font-bold text-gov-600 mx-0.5">{filteredRecords.length}</span> 条缴费记录</div>
          <div className="flex items-center gap-2">
            <button onClick={() => toast('已重置筛选条件', 'info')} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"><Search className="w-4 h-4" />重置</button>
            <button onClick={exportExcel} className="gov-btn !py-2 !px-5 !text-sm inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />导出Excel</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="累计缴费月数" value={summary.totalMonths ?? 0} unit="个月" color="bg-gradient-to-br from-gov-500 to-blue-600" trend={summary.totalMonths ? '+6月' : undefined} />
        <StatCard icon={Wallet} label="个人缴费总额" value={(summary.personalTotal ?? 0).toLocaleString()} unit="元" color="bg-gradient-to-br from-emerald-500 to-teal-600" trend={summary.personalTotal ? '+12.3%' : undefined} />
        <StatCard icon={Banknote} label="单位缴费总额" value={(summary.companyTotal ?? 0).toLocaleString()} unit="元" color="bg-gradient-to-br from-gold-500 to-amber-600" trend={summary.companyTotal ? '+9.8%' : undefined} />
        <StatCard icon={TrendingUp} label="平均缴费基数" value={(summary.avgBase ?? 0).toLocaleString()} unit="元/月" color="bg-gradient-to-br from-violet-500 to-purple-600" trend={summary.avgBase ? '+4.5%' : undefined} />
      </div>

      <div className="gov-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gov-500" />近12个月各险种缴费走势</h3>
          <span className="text-xs text-gray-400">单位：元</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
              />
              <Legend iconType="rect" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Bar dataKey="养老" stackId="a" fill="#165DFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="医疗" stackId="a" fill="#10B981" />
              <Bar dataKey="失业" stackId="a" fill="#E6A23C" />
              <Bar dataKey="工伤" stackId="a" fill="#EF4444" />
              <Bar dataKey="生育" stackId="a" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100 cursor-pointer" onClick={() => setShowTable(!showTable)}>
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-gov-500" />缴费明细列表 {showTable ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</h3>
          <button onClick={(e) => { e.stopPropagation(); exportExcel(); }} className="text-xs text-gov-600 hover:text-gov-700 font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gov-50 transition-colors"><Download className="w-3.5 h-3.5" />导出</button>
        </div>
        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gov-50 via-blue-50/60 to-gov-50">
                <tr className="text-gray-600 text-xs">
                  <th className="text-left px-5 md:px-6 py-3.5 font-semibold whitespace-nowrap">年月</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">险种</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">缴费单位</th>
                  <th className="text-right px-4 py-3.5 font-semibold whitespace-nowrap">缴费基数</th>
                  <th className="text-right px-4 py-3.5 font-semibold whitespace-nowrap">个人缴费</th>
                  <th className="text-right px-4 py-3.5 font-semibold whitespace-nowrap">单位缴费</th>
                  <th className="text-center px-4 py-3.5 font-semibold whitespace-nowrap">状态</th>
                  <th className="text-left px-5 md:px-6 py-3.5 font-semibold whitespace-nowrap">到账日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400"><FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">暂无符合条件的缴费记录</p></td></tr>
                ) : filteredRecords.map((r, idx) => {
                  const ins = insuranceOptions.find((x) => x.k === r.insuranceKey) || insuranceOptions[0];
                  return (
                    <tr key={r.id || idx} className="hover:bg-gov-50/30 transition-colors group">
                      <td className="px-5 md:px-6 py-4 font-mono text-gray-700 font-semibold whitespace-nowrap">{r.period}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: `${ins.color}15`, color: ins.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ins.color }} />{r.insuranceType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600 max-w-[180px] truncate" title={r.companyName}>{r.companyName}</td>
                      <td className="px-4 py-4 text-right font-mono text-gray-700">¥{r.base.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-mono text-emerald-600 font-semibold">¥{r.personal.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-mono text-gov-600 font-semibold">¥{r.company.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">{statusBadge(r.status)}</td>
                      <td className="px-5 md:px-6 py-4 font-mono text-gray-500 text-xs whitespace-nowrap">{r.receivedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredRecords.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gov-100">
                  <tr>
                    <td colSpan={3} className="px-5 md:px-6 py-4 font-semibold text-gray-700 text-sm">合计（{filteredRecords.length}条）</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-700 font-bold">—</td>
                    <td className="px-4 py-4 text-right font-mono text-emerald-700 font-bold text-base">¥{filteredRecords.reduce((s, r) => s + r.personal, 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-mono text-gov-700 font-bold text-base">¥{filteredRecords.reduce((s, r) => s + r.company, 0).toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {exportTasks.length > 0 && (
        <div className="gov-card overflow-hidden">
          <div
            className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100 cursor-pointer"
            onClick={() => setShowExportPanel(!showExportPanel)}
          >
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-gov-500" />
              导出任务与经办留痕
              <span className="text-xs font-normal text-gray-400 ml-1">({exportTasks.length}次)</span>
              {showExportPanel ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </h3>
            <div className="flex items-center gap-2">
              {exportTasks.some((t) => t.status === 'completed') && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Download className="w-3 h-3" /> 可下载
                </span>
              )}
            </div>
          </div>
          {showExportPanel && (
            <div className="divide-y divide-gray-50">
              {exportTasks.map((task) => (
                <div key={task.id} className="px-5 md:px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        task.status === 'completed' ? 'bg-emerald-100' :
                        task.status === 'generating' ? 'bg-gov-100' :
                        'bg-red-100'
                      )}>
                        {task.status === 'completed' ? <FileCheck className="w-5 h-5 text-emerald-600" /> :
                         task.status === 'generating' ? <Clock className="w-5 h-5 text-gov-600 animate-spin" /> :
                         <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-800">{task.fileName || '导出失败'}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            task.status === 'generating' ? 'bg-gov-50 text-gov-700 border-gov-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          )}>
                            {task.status === 'completed' ? '已完成' :
                             task.status === 'generating' ? '生成中' : '失败'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 任务号：{task.id}</span>
                          <span>记录数：{task.recordCount}条</span>
                          {task.fileSize && <span>文件大小：{task.fileSize}</span>}
                          <span>经办人：{task.operatorName}</span>
                          <span>发起时间：{task.createdAt}</span>
                          {task.completedAt && <span>完成时间：{task.completedAt}</span>}
                        </div>
                        {task.errorReason && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> 失败原因：{task.errorReason}
                          </p>
                        )}
                      </div>
                    </div>
                    {task.status === 'completed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); exportExcel(); }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 border border-gov-200 hover:bg-gov-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> 再次导出
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
