import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { studentApi } from '@/lib/api.ts';
import { formatMoney, formatVolume, formatDateTime, shortHash, exportToCSV } from '@/utils/format.ts';
import { Receipt, Calendar, Download, ShieldCheck, ChevronDown, ChevronUp, Droplets, BarChart3 } from 'lucide-react';
import type { WaterTransaction, SemesterSummary } from '../../../shared/types.js';

export default function StudentBills() {
  const [transactions, setTransactions] = useState<WaterTransaction[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [summary, setSummary] = useState<SemesterSummary | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [txRes, semRes] = await Promise.all([
          studentApi.transactions(50),
          studentApi.semesters(),
        ]);
        setTransactions(txRes.transactions);
        setSemesters(semRes);
        if (semRes.length > 0) {
          setSelectedSemester(semRes[0]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    studentApi.summary(selectedSemester).then(setSummary);
  }, [selectedSemester]);

  const handleExport = () => {
    const rows = transactions.map((tx) => ({
      '账单编号': tx.id,
      '设备名称': tx.deviceName || '',
      '设备位置': tx.deviceLocation || '',
      '开始时间': formatDateTime(tx.startTime),
      '结束时间': tx.endTime ? formatDateTime(tx.endTime) : '',
      '用水量(L)': tx.volume.toFixed(2),
      '金额(元)': tx.amount.toFixed(2),
      '同步一卡通': tx.syncedToCampus ? '是' : '否',
      '哈希值': tx.hash,
    }));
    exportToCSV(rows, `用水账单_${selectedSemester || '全部'}.csv`);
  };

  const handleExportSummary = () => {
    if (!summary) return;
    const rows = summary.monthlyBreakdown.map((m) => ({
      '月份': m.month,
      '用水量(L)': m.volume.toFixed(2),
      '金额(元)': m.amount.toFixed(2),
    }));
    rows.push({
      '月份': '合计',
      '用水量(L)': summary.totalVolume.toFixed(2),
      '金额(元)': summary.totalAmount.toFixed(2),
    });
    exportToCSV(rows, `学期消费汇总_${summary.semester}.csv`);
  };

  return (
    <AppLayout role="student">
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-graphite-800">账单中心</h2>
            <p className="text-sm text-graphite-500 mt-1 flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-600" />
              所有账单均采用 SHA-256 哈希链存储，不可篡改
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 !py-2.5 !px-4 text-sm">
            <Download size={16} />导出账单
          </button>
        </div>

        {summary && (
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full p-5 flex items-center justify-between hover:bg-graphite-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-deep-blue-600 to-aqua-500 flex items-center justify-center">
                  <BarChart3 size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-graphite-800">{summary.semester} 消费汇总</h3>
                  <p className="text-sm text-graphite-500">共 {summary.transactionCount} 笔用水记录</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-graphite-500">总用水量</p>
                    <p className="font-bold text-deep-blue-700">{formatVolume(summary.totalVolume)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-graphite-500">总金额</p>
                    <p className="font-bold text-vibrant-orange-600">{formatMoney(summary.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-graphite-500">平均每笔</p>
                    <p className="font-bold text-graphite-700">{formatMoney(summary.averagePerTransaction)}</p>
                  </div>
                </div>
                {showSummary ? <ChevronUp size={20} className="text-graphite-400" /> : <ChevronDown size={20} className="text-graphite-400" />}
              </div>
            </button>
            {showSummary && (
              <div className="p-5 pt-0 border-t border-graphite-100">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {semesters.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSemester(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedSemester === s
                            ? 'bg-gradient-to-r from-deep-blue-700 to-aqua-500 text-white shadow-md'
                            : 'bg-graphite-100 text-graphite-600 hover:bg-graphite-200'
                        }`}
                      >
                        <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                        {s}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleExportSummary} className="text-sm text-aqua-600 hover:text-aqua-700 flex items-center gap-1">
                    <Download size={14} />导出汇总
                  </button>
                </div>
                <div className="space-y-2">
                  {summary.monthlyBreakdown.map((m) => {
                    const maxAmount = Math.max(...summary.monthlyBreakdown.map((x) => x.amount), 1);
                    const percent = (m.amount / maxAmount) * 100;
                    return (
                      <div key={m.month} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-graphite-600 font-medium">{m.month}</span>
                        <div className="flex-1 h-8 rounded-lg bg-graphite-100 overflow-hidden relative">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-aqua-400 to-deep-blue-600 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm font-semibold text-deep-blue-700">{formatVolume(m.volume)}</span>
                        <span className="w-20 text-right text-sm font-bold text-vibrant-orange-600">{formatMoney(m.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-lg font-display font-semibold text-graphite-800 mb-4 flex items-center gap-2">
            <Receipt size={20} />用水明细
          </h3>
          {loading ? (
            <div className="glass-card p-8 text-center text-graphite-500">加载中...</div>
          ) : transactions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Receipt size={40} className="mx-auto mb-3 text-graphite-300" />
              <p className="text-graphite-500">暂无用水记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-graphite-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aqua-100 to-deep-blue-100 flex items-center justify-center shrink-0">
                        <Droplets size={22} className="text-deep-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-graphite-800 truncate">{tx.deviceName || '热水设备'}</div>
                        <div className="text-xs text-graphite-500 truncate">{tx.deviceLocation || ''}</div>
                        <div className="text-xs text-graphite-400 mt-0.5">{formatDateTime(tx.startTime)}</div>
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="font-bold text-vibrant-orange-600">-{formatMoney(tx.amount)}</div>
                      <div className="text-xs text-graphite-500">{formatVolume(tx.volume)}</div>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5 justify-end">
                        <ShieldCheck size={12} />已存证
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-graphite-400 ml-2 transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === tx.id && (
                    <div className="px-4 pb-4 border-t border-graphite-100">
                      <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-graphite-500 text-xs mb-1">账单编号</p>
                          <p className="font-mono text-graphite-700 text-xs">{tx.id}</p>
                        </div>
                        <div>
                          <p className="text-graphite-500 text-xs mb-1">设备 ID</p>
                          <p className="font-mono text-graphite-700 text-xs">{tx.deviceId}</p>
                        </div>
                        <div>
                          <p className="text-graphite-500 text-xs mb-1">结束时间</p>
                          <p className="text-graphite-700 text-xs">{tx.endTime ? formatDateTime(tx.endTime) : '进行中'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-graphite-500 text-xs mb-1 flex items-center gap-1">
                            <ShieldCheck size={12} className="text-green-600" />
                            交易哈希 (SHA-256，不可篡改)
                          </p>
                          <p className="font-mono text-graphite-700 text-xs bg-graphite-50 p-2 rounded-lg break-all">
                            {tx.hash}
                          </p>
                          {tx.prevHash && (
                            <p className="text-graphite-400 text-xs mt-1">上一区块：{shortHash(tx.prevHash)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
