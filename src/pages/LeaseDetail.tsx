import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leaseApi } from '../utils/api';
import {
  LEASE_STATUS_MAP, LEASE_STATUS_COLOR,
  formatDate, formatDateTime
} from '../utils/constants';
import {
  ChevronLeft, KeyRound, User, Phone, Building2, CreditCard,
  Wallet, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2
} from 'lucide-react';

const LeaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadDetail(); }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await leaseApi.get(parseInt(id!));
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeduct = async () => {
    if (!confirm('确认执行本期租金自动划扣？')) return;
    setActionLoading(true);
    try {
      const res = await leaseApi.deductPayment(parseInt(id!));
      alert(`租金划扣成功！状态：${res.status === 'paid' ? '按时支付' : '逾期支付'}，信用分变动：${res.creditDelta > 0 ? '+' : ''}${res.creditDelta}`);
      loadDetail();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleTerminate = async () => {
    const reason = prompt('请输入终止原因：');
    if (!reason) return;
    if (!confirm('确认终止此租约？房源状态将变更为上架中。')) return;
    setActionLoading(true);
    try {
      await leaseApi.terminate(parseInt(id!), reason);
      loadDetail();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">租约不存在</div>;

  const { lease, payments, deposit, creditScore } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/leases')} className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">租约详情</h2>
            <span className={`px-3 py-1 text-sm rounded-full ${LEASE_STATUS_COLOR[lease.status]}`}>
              {LEASE_STATUS_MAP[lease.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">租约编号：LS-{lease.id.toString().padStart(6, '0')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTerminate}
            disabled={actionLoading || lease.status !== 'active'}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            终止租约
          </button>
          <button
            onClick={handleDeduct}
            disabled={actionLoading || lease.status !== 'active'}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            租金划扣
          </button>
        </div>
      </div>

      {/* Credit score card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold">{creditScore.zhima}</div>
              <div className="text-blue-200 text-sm">芝麻信用分</div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                creditScore.level === '极好' ? 'bg-green-400/30 text-green-100' :
                creditScore.level === '优秀' ? 'bg-blue-400/30 text-blue-100' :
                creditScore.level === '中等' ? 'bg-yellow-400/30 text-yellow-100' :
                'bg-red-400/30 text-red-100'
              }`}>
                {creditScore.level}
              </div>
            </div>
            <div className="h-20 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold">{creditScore.internal}</div>
              <div className="text-blue-200 text-sm">内部信用分</div>
            </div>
            <div className="h-20 w-px bg-white/20" />
            <div>
              <div className="text-blue-200 text-sm mb-2">支付记录联动</div>
              <div className="text-sm">按时支付：<span className="font-bold text-green-300">+{5} 分/期</span></div>
              <div className="text-sm">逾期支付：<span className="font-bold text-red-300">-{10} 分/次</span></div>
            </div>
          </div>
          <div className="text-right">
            <TrendingUp className="w-10 h-10 text-green-300 mx-auto mb-2" />
            <div className="text-sm text-blue-200">信用联动已启用</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">月租金</div>
          <div className="text-2xl font-bold text-primary-600">¥ {lease.monthly_rent.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">押金金额</div>
          <div className="text-2xl font-bold text-accent-600">¥ {lease.deposit.toLocaleString()}</div>
          <div className={`text-xs mt-1 ${
            deposit.status === 'refunded' ? 'text-green-600' :
            deposit.status === 'deducted' ? 'text-red-600' : 'text-gray-400'
          }`}>
            {({ held: '托管中', partial_refund: '部分退还', refunded: '已退还', deducted: '已扣除' } as any)[deposit.status]}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">租期</div>
          <div className="text-lg font-bold text-gray-800">{formatDate(lease.start_date)}</div>
          <div className="text-lg font-bold text-gray-800">至 {formatDate(lease.end_date)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">支付方式</div>
          <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            {lease.payment_method === 'auto' ? '自动划扣' : '手动支付'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary-600" /> 租金支付记录
            </h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">已支付：{payments.filter((p: any) => p.status === 'paid').length} 期</span>
              <span className="text-gray-500">待支付：{payments.filter((p: any) => p.status === 'pending').length} 期</span>
              <span className="text-red-500">逾期：{payments.filter((p: any) => p.status === 'overdue').length} 期</span>
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">期数</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">应付款日</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">实付日</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any, idx: number) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">第 {idx + 1} 期</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{formatDate(p.due_date)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">¥ {p.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        p.status === 'waived' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {({ pending: '待支付', paid: '已支付', overdue: '已逾期', waived: '已减免' } as any)[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" /> 房源信息
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{lease.property_name}</div>
              <div className="text-gray-500">{lease.property_address}</div>
              <div className="text-gray-500">面积 {lease.property_area} ㎡</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> 租客信息
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{lease.tenant_name}</div>
              <div className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lease.tenant_phone}
              </div>
              <div className="text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 内部信用分 {creditScore.internal}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> 经纪人
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{lease.agent_name}</div>
              <div className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lease.agent_phone}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" /> 押金托管
            </h5>
            <div className="space-y-3">
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    deposit.status === 'refunded' ? 'bg-green-500' :
                    deposit.status === 'deducted' ? 'bg-red-500' :
                    'bg-primary-500'
                  }`}
                  style={{
                    width: `${
                      deposit.status === 'held' ? 100 :
                      deposit.status === 'partial_refund' ? 50 : 0
                    }%`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">托管金额</span>
                <span className="font-bold text-gray-800">¥ {lease.deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">状态</span>
                <span className={`font-medium ${
                  deposit.status === 'refunded' ? 'text-green-600' :
                  deposit.status === 'deducted' ? 'text-red-600' :
                  'text-gray-800'
                }`}>
                  {({ held: '第三方托管中', partial_refund: '部分已退还', refunded: '已全额退还', deducted: '已扣除赔付' } as any)[deposit.status]}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                托管账户：中国工商银行 95599 **** 8821
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseDetail;
