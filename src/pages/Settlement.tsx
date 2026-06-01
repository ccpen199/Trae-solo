import { useEffect, useMemo, useState } from 'react';
import { Download, Calendar, Filter, User, Building2, FileText, RefreshCw, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Settlement, Doctor, Institution } from '@/types';

const statusMap = {
  pending: { label: '待结算', class: 'border-amber-200 bg-amber-50 text-amber-700' },
  settled: { label: '已结算', class: 'border-green-200 bg-green-50 text-green-700' },
};

export default function SettlementPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'doctor' | 'institution'>('doctor');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [calculating, setCalculating] = useState(false);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const doctorById = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);
  const institutionById = useMemo(
    () => new Map(institutions.map((i) => [i.id, i])),
    [institutions],
  );

  async function loadData() {
    setLoading(true);
    try {
      const [settlementsData, doctorsData, institutionsData] = await Promise.all([
        api.settlements.list({ period: selectedPeriod }),
        api.doctors.list(),
        api.institutions.list(),
      ]);
      setSettlements(settlementsData);
      setDoctors(doctorsData);
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const groupedData = useMemo(() => {
    if (viewMode === 'doctor') {
      const map = new Map<number, Settlement[]>();
      settlements.forEach((s) => {
        const existing = map.get(s.doctorId) || [];
        map.set(s.doctorId, [...existing, s]);
      });
      return map;
    } else {
      const map = new Map<number, Settlement[]>();
      settlements.forEach((s) => {
        const existing = map.get(s.institutionId) || [];
        map.set(s.institutionId, [...existing, s]);
      });
      return map;
    }
  }, [settlements, viewMode]);

  const summary = useMemo(() => {
    const totalVisits = settlements.reduce((sum, s) => sum + s.visitCount, 0);
    const totalIncome = settlements.reduce((sum, s) => sum + s.totalIncome, 0);
    const totalDefaults = settlements.reduce((sum, s) => sum + s.defaultCount, 0);
    const pendingAmount = settlements
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.totalIncome, 0);
    return { totalVisits, totalIncome, totalDefaults, pendingAmount };
  }, [settlements]);

  const getGroupSummary = (items: Settlement[]) => {
    const visitCount = items.reduce((sum, s) => sum + s.visitCount, 0);
    const totalIncome = items.reduce((sum, s) => sum + s.totalIncome, 0);
    const defaultCount = items.reduce((sum, s) => sum + s.defaultCount, 0);
    return { visitCount, totalIncome, defaultCount };
  };

  function handleExport() {
    const exportUrl = api.settlements.export(selectedPeriod);
    window.open(exportUrl, '_blank');
  }

  function handleCalculate() {
    setCalculating(true);
    api.settlements.calculate({ period: selectedPeriod }).then((data) => {
      setSettlements(data);
      showToast('success', '结算核算完成');
    }).catch((err) => {
      showToast('error', err.message || '核算失败');
    }).finally(() => {
      setCalculating(false);
    });
  }

  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
      });
    }
    return options;
  };

  const statCards = [
    { label: '总出诊次数', value: summary.totalVisits, icon: FileText, tone: 'bg-blue-50 text-blue-700' },
    { label: '总收入', value: `¥${summary.totalIncome.toLocaleString()}`, icon: DollarSign, tone: 'bg-green-50 text-green-700' },
    { label: '违约次数', value: summary.totalDefaults, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
    { label: '待结算金额', value: `¥${summary.pendingAmount.toLocaleString()}`, icon: RefreshCw, tone: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <div>
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算报表</h1>
          <p className="mt-1 text-sm text-gray-500">按医生、机构维度核算出诊收入与违约情况</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? '核算中...' : '重新核算'}
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {generatePeriodOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('doctor')}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${
                viewMode === 'doctor' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" />
              按医生
            </button>
            <button
              onClick={() => setViewMode('institution')}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${
                viewMode === 'institution' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-4 w-4" />
              按机构
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <span className={`rounded-lg p-2 ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <strong className="mt-4 block text-2xl font-semibold text-gray-900">{card.value}</strong>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'doctor' ? '医生结算明细' : '机构结算明细'}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-5 py-8 text-center text-gray-500">加载中...</div>
          ) : groupedData.size === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500">暂无结算数据</div>
          ) : (
            Array.from(groupedData.entries()).map(([id, items]) => {
              const entity = viewMode === 'doctor' ? doctorById.get(id) : institutionById.get(id);
              const groupSummary = getGroupSummary(items);
              return (
                <div key={id} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        {viewMode === 'doctor' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{entity?.name || '未知'}</h3>
                        <p className="text-sm text-gray-500">
                          {viewMode === 'doctor' ? (
                            `${(entity as Doctor)?.title || ''} · ${(entity as Doctor)?.specialty || ''}`
                          ) : (
                            (entity as Institution)?.address || ''
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">本期收入</p>
                      <p className="text-xl font-bold text-gray-900">¥{groupSummary.totalIncome.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">出诊次数</p>
                      <p className="text-lg font-semibold text-gray-900">{groupSummary.visitCount}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">违约次数</p>
                      <p className={`text-lg font-semibold ${groupSummary.defaultCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {groupSummary.defaultCount}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">结算状态</p>
                      <span className="inline-flex items-center gap-1 text-sm">
                        {items.every((s) => s.status === 'settled') ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" /> 已完成</>
                        ) : (
                          <><RefreshCw className="h-4 w-4 text-amber-500" /> 待结算</>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">周期</th>
                          <th className="px-3 py-2 font-medium">机构</th>
                          <th className="px-3 py-2 font-medium">出诊数</th>
                          <th className="px-3 py-2 font-medium">收入</th>
                          <th className="px-3 py-2 font-medium">违约</th>
                          <th className="px-3 py-2 font-medium">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.period}</td>
                            <td className="px-3 py-2">{institutionById.get(item.institutionId)?.name || '-'}</td>
                            <td className="px-3 py-2">{item.visitCount}</td>
                            <td className="px-3 py-2 font-medium">¥{item.totalIncome.toLocaleString()}</td>
                            <td className="px-3 py-2">{item.defaultCount}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[item.status].class}`}>
                                {statusMap[item.status].label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
