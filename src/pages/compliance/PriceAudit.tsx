import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, X, Clock, TrendingUp, Zap, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface PriceCheckItem {
  billId: string;
  billMonth: string;
  customerName: string;
  customerType: string;
  totalKwh: number;
  totalAmount: number;
  expectedAmount: number;
  diffAmount: number;
  diffPercent: number;
  status: 'normal' | 'warning' | 'abnormal';
  peakKwh: number;
  valleyKwh: number;
  flatKwh: number;
  peakPrice: number;
  valleyPrice: number;
  flatPrice: number;
  peakAmount: number;
  valleyAmount: number;
  flatAmount: number;
  priceChecks: {
    type: string;
    actual: number;
    standard: number;
    normal: boolean;
  }[];
}

interface AuditSummary {
  totalBills: number;
  normalBills: number;
  warningBills: number;
  abnormalBills: number;
  totalOvercharged: number;
  totalUndercharged: number;
  auditDate: string;
}

const mockSummary: AuditSummary = {
  totalBills: 156,
  normalBills: 142,
  warningBills: 11,
  abnormalBills: 3,
  totalOvercharged: 2856.50,
  totalUndercharged: 1234.80,
  auditDate: dayjs().format('YYYY-MM-DD'),
};

const generateMockData = (): PriceCheckItem[] => {
  const data: PriceCheckItem[] = [];
  const customerNames = ['张三', '李四家庭', 'XX科技有限公司', 'YY产业园', '王五', '赵六家庭', 'ZZ制造公司', 'HH建材集团'];
  const customerTypes = ['individual', 'family', 'enterprise', 'park'];
  const statuses: PriceCheckItem['status'][] = ['normal', 'normal', 'normal', 'normal', 'normal', 'warning', 'abnormal'];

  for (let i = 0; i < 20; i++) {
    const totalKwh = 500 + Math.floor(Math.random() * 8000);
    const peakKwh = Math.floor(totalKwh * 0.4);
    const valleyKwh = Math.floor(totalKwh * 0.3);
    const flatKwh = totalKwh - peakKwh - valleyKwh;
    const peakPrice = 1.2 + Math.random() * 0.1;
    const valleyPrice = 0.4 + Math.random() * 0.05;
    const flatPrice = 0.7 + Math.random() * 0.05;
    const peakAmount = peakKwh * peakPrice;
    const valleyAmount = valleyKwh * valleyPrice;
    const flatAmount = flatKwh * flatPrice;
    const totalAmount = peakAmount + valleyAmount + flatAmount;
    const expectedAmount = peakKwh * 1.2 + valleyKwh * 0.4 + flatKwh * 0.7;
    const diffAmount = parseFloat((totalAmount - expectedAmount).toFixed(2));
    const diffPercent = parseFloat((diffAmount / expectedAmount * 100).toFixed(2));
    const status = diffPercent > 5 ? 'abnormal' : diffPercent > 2 ? 'warning' : 'normal';

    data.push({
      billId: 'B' + (10000 + i),
      billMonth: dayjs().subtract(i % 3, 'month').format('YYYY-MM'),
      customerName: customerNames[i % customerNames.length],
      customerType: customerTypes[i % customerTypes.length],
      totalKwh,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      expectedAmount: parseFloat(expectedAmount.toFixed(2)),
      diffAmount,
      diffPercent,
      status: statuses[i % statuses.length],
      peakKwh,
      valleyKwh,
      flatKwh,
      peakPrice: parseFloat(peakPrice.toFixed(4)),
      valleyPrice: parseFloat(valleyPrice.toFixed(4)),
      flatPrice: parseFloat(flatPrice.toFixed(4)),
      peakAmount: parseFloat(peakAmount.toFixed(2)),
      valleyAmount: parseFloat(valleyAmount.toFixed(2)),
      flatAmount: parseFloat(flatAmount.toFixed(2)),
      priceChecks: [
        { type: 'peak', actual: peakPrice, standard: 1.2, normal: Math.abs(peakPrice - 1.2) < 0.01 },
        { type: 'valley', actual: valleyPrice, standard: 0.4, normal: Math.abs(valleyPrice - 0.4) < 0.01 },
        { type: 'flat', actual: flatPrice, standard: 0.7, normal: Math.abs(flatPrice - 0.7) < 0.01 },
      ],
    });
  }
  return data.sort((a, b) => {
    const order = { abnormal: 0, warning: 1, normal: 2 };
    return order[a.status] - order[b.status];
  });
};

const mockData = generateMockData();

export default function PriceAudit() {
  const [summary, setSummary] = useState<AuditSummary>(mockSummary);
  const [data, setData] = useState<PriceCheckItem[]>(mockData);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PriceCheckItem | null>(null);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ summary: AuditSummary; items: PriceCheckItem[] }>('/compliance/price-audit');
        setSummary(res.summary);
        setData(res.items);
      } catch {
        setSummary(mockSummary);
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      await api.post('/compliance/price-audit/run');
      setTimeout(() => {
        setData(generateMockData());
        setAuditing(false);
      }, 1500);
    } catch {
      setTimeout(() => {
        setData(generateMockData());
        setAuditing(false);
      }, 1500);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'abnormal') return 'badge-red';
    if (s === 'warning') return 'badge-amber';
    return 'badge-green';
  };
  const statusLabel = (s: string) => {
    if (s === 'abnormal') return '异常';
    if (s === 'warning') return '预警';
    return '正常';
  };
  const typeLabel = (t: string) => {
    if (t === 'individual') return '个人';
    if (t === 'family') return '家庭';
    if (t === 'enterprise') return '企业';
    if (t === 'park') return '园区';
    return t;
  };
  const periodLabel = (p: string) => p === 'peak' ? '峰时' : p === 'valley' ? '谷时' : '平时';

  const filteredData = data.filter((d) => {
    const statusMatch = statusFilter === 'all' || d.status === statusFilter;
    const typeMatch = typeFilter === 'all' || d.customerType === typeFilter;
    return statusMatch && typeMatch;
  });

  const normalRate = summary.totalBills > 0 ? Math.round((summary.normalBills / summary.totalBills) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="page-header">
          <ShieldCheck size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">电价执行核查</h1>
            <p className="page-desc">自动核查电价执行准确性，确保计费合规</p>
          </div>
        </div>
        <button onClick={handleRunAudit} disabled={auditing} className="btn-secondary flex items-center gap-1.5">
          <Zap size={16} />
          {auditing ? '核查中...' : '执行核查'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <span className="stat-label">核查账单数</span>
          <span className="stat-value">{summary.totalBills}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">截至 {summary.auditDate}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">正常账单</span>
          <span className="stat-value text-csg-green">{summary.normalBills}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">合格率 {normalRate}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">预警账单</span>
          <span className="stat-value text-csg-amber">{summary.warningBills}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">偏差 2%-5%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">异常账单</span>
          <span className="stat-value text-csg-red">{summary.abnormalBills}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">偏差 &gt;5%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">累计差异</span>
          <span className={`stat-value ${summary.totalOvercharged > summary.totalUndercharged ? 'text-csg-red' : 'text-csg-green'}`}>
            ¥{(summary.totalOvercharged - summary.totalUndercharged).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">多收为正</span>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">核查结果列表</h3>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部状态</option>
              <option value="normal">正常</option>
              <option value="warning">预警</option>
              <option value="abnormal">异常</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部客群</option>
              <option value="individual">个人</option>
              <option value="family">家庭</option>
              <option value="enterprise">企业</option>
              <option value="park">园区</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>账单编号</th>
                <th>账期</th>
                <th>客户名称</th>
                <th>客群类型</th>
                <th>用电量</th>
                <th>实收金额</th>
                <th>应收金额</th>
                <th>差异金额</th>
                <th>差异率</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.billId} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setSelectedItem(item)}>
                  <td className="font-mono text-sm">{item.billId}</td>
                  <td>{item.billMonth}</td>
                  <td className="font-medium">{item.customerName}</td>
                  <td><span className="badge-blue">{typeLabel(item.customerType)}</span></td>
                  <td>{item.totalKwh.toLocaleString()} kWh</td>
                  <td>¥{item.totalAmount.toFixed(2)}</td>
                  <td>¥{item.expectedAmount.toFixed(2)}</td>
                  <td className={`font-medium ${item.diffAmount > 0 ? 'text-csg-red' : item.diffAmount < 0 ? 'text-csg-green' : 'text-gray-600 dark:text-gray-300'}`}>
                    {item.diffAmount > 0 ? '+' : ''}¥{item.diffAmount.toFixed(2)}
                  </td>
                  <td className={`font-medium ${item.diffPercent > 5 ? 'text-csg-red' : item.diffPercent > 2 ? 'text-csg-amber' : 'text-csg-green'}`}>
                    {item.diffPercent > 0 ? '+' : ''}{item.diffPercent.toFixed(2)}%
                  </td>
                  <td>
                    <span className={`flex items-center gap-1 ${statusBadge(item.status)}`}>
                      {item.status === 'abnormal' && <AlertTriangle size={12} />}
                      {item.status === 'normal' && <CheckCircle size={12} />}
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <button className="text-csg-navy hover:text-csg-green text-sm">详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">电价核查详情</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">账单编号</p>
                  <p className="font-mono font-semibold">{selectedItem.billId}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">账期</p>
                  <p className="font-semibold">{selectedItem.billMonth}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">客户</p>
                  <p className="font-semibold truncate">{selectedItem.customerName}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">类型</p>
                  <p className="font-semibold">{typeLabel(selectedItem.customerType)}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                selectedItem.status === 'abnormal' ? 'bg-csg-red/5 dark:bg-csg-red/10 border border-csg-red/20' :
                selectedItem.status === 'warning' ? 'bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20' :
                'bg-csg-green/5 dark:bg-csg-green/10 border border-csg-green/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedItem.status === 'abnormal' ? (
                      <AlertTriangle size={20} className="text-csg-red" />
                    ) : (
                      <CheckCircle size={20} className="text-csg-green" />
                    )}
                    <span className={`font-semibold ${
                      selectedItem.status === 'abnormal' ? 'text-csg-red' :
                      selectedItem.status === 'warning' ? 'text-csg-amber' :
                      'text-csg-green'
                    }`}>
                      核查结论：{statusLabel(selectedItem.status)}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${selectedItem.diffAmount > 0 ? 'text-csg-red' : 'text-csg-green'}`}>
                    差异 {selectedItem.diffAmount > 0 ? '+' : ''}¥{selectedItem.diffAmount.toFixed(2)} ({selectedItem.diffPercent > 0 ? '+' : ''}{selectedItem.diffPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-csg-amber" />
                  分时段电价核查
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 px-2">时段</th>
                        <th className="text-right py-2 px-2">用电量</th>
                        <th className="text-right py-2 px-2">标准电价</th>
                        <th className="text-right py-2 px-2">实际电价</th>
                        <th className="text-right py-2 px-2">实收电费</th>
                        <th className="text-right py-2 px-2">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.priceChecks.map((pc, i) => {
                        const kwh = pc.type === 'peak' ? selectedItem.peakKwh : pc.type === 'valley' ? selectedItem.valleyKwh : selectedItem.flatKwh;
                        const amount = pc.type === 'peak' ? selectedItem.peakAmount : pc.type === 'valley' ? selectedItem.valleyAmount : selectedItem.flatAmount;
                        return (
                          <tr key={pc.type} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <td className="py-2 px-2">{periodLabel(pc.type)}</td>
                            <td className="text-right py-2 px-2">{kwh.toLocaleString()} kWh</td>
                            <td className="text-right py-2 px-2">¥{pc.standard.toFixed(4)}</td>
                            <td className={`text-right py-2 px-2 font-medium ${!pc.normal ? 'text-csg-red' : ''}`}>¥{pc.actual.toFixed(4)}</td>
                            <td className="text-right py-2 px-2">¥{amount.toFixed(2)}</td>
                            <td className="text-right py-2 px-2">
                              {pc.normal ? (
                                <CheckCircle size={14} className="text-csg-green ml-auto" />
                              ) : (
                                <AlertTriangle size={14} className="text-csg-red ml-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-semibold">
                        <td className="py-2 px-2">合计</td>
                        <td className="text-right py-2 px-2">{selectedItem.totalKwh.toLocaleString()} kWh</td>
                        <td className="text-right py-2 px-2">-</td>
                        <td className="text-right py-2 px-2">-</td>
                        <td className="text-right py-2 px-2">¥{selectedItem.totalAmount.toFixed(2)}</td>
                        <td className="text-right py-2 px-2">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-csg-navy/5 dark:bg-csg-navy/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-csg-navy" />
                    <span className="font-medium">应收金额</span>
                  </div>
                  <p className="text-2xl font-bold text-csg-navy dark:text-white">¥{selectedItem.expectedAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">按标准电价计算</p>
                </div>
                <div className={`p-4 rounded-lg ${selectedItem.diffAmount > 0 ? 'bg-csg-red/5 dark:bg-csg-red/10' : 'bg-csg-green/5 dark:bg-csg-green/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className={selectedItem.diffAmount > 0 ? 'text-csg-red' : 'text-csg-green'} />
                    <span className="font-medium">差异金额</span>
                  </div>
                  <p className={`text-2xl font-bold ${selectedItem.diffAmount > 0 ? 'text-csg-red' : 'text-csg-green'}`}>
                    {selectedItem.diffAmount > 0 ? '+' : ''}¥{selectedItem.diffAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    差异率 {selectedItem.diffPercent > 0 ? '+' : ''}{selectedItem.diffPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {selectedItem.status !== 'normal' && (
                <div className="p-4 rounded-lg bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-csg-amber" />
                    处理建议
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• 复核电表读数和计费参数设置</li>
                    <li>• 检查分时时段配置是否正确</li>
                    <li>• 确认客户电价类别是否准确</li>
                    <li>• 如确属多收，及时启动退费流程</li>
                    <li>• 记录核查结果并更新审计档案</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
