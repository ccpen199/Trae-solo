import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Check, X, Coins, Shield, AlertCircle } from 'lucide-react';
import { get, post } from '../../utils/request';

interface WithdrawItem {
  id: string;
  userId: string;
  nickname: string;
  phone: string;
  amount: number;
  method: string;
  account: string;
  status: string;
  reason?: string;
  createdAt: string;
}

const AdminWithdraw = () => {
  const [records, setRecords] = useState<WithdrawItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, [filter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res: any = await get('/admin/withdraw');
      if (res.success) {
        setRecords(res.records);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('确认通过此提现申请？')) return;
    try {
      const res: any = await post(`/admin/withdraw/${id}/approve`);
      if (res.success) {
        loadRecords();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    try {
      const res: any = await post(`/admin/withdraw/${id}/reject`, { reason: reason || '不符合要求' });
      if (res.success) {
        loadRecords();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      alipay: '支付宝',
      wechat: '微信支付',
      bank: '银行卡',
    };
    return map[method] || method;
  };

  const getMethodIcon = (method: string) => {
    const map: Record<string, string> = {
      alipay: '💙',
      wechat: '💚',
      bank: '💳',
    };
    return map[method] || '💰';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredRecords = records.filter(
    (record) =>
      record.nickname.toLowerCase().includes(searchText.toLowerCase()) ||
      record.phone.includes(searchText)
  );

  const pendingCount = records.filter((r) => r.status === 'pending').length;

  return (
    <AdminLayout title="提现管理">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">待审核</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">今日提现金额</p>
            <p className="text-2xl font-bold text-blue-600">
              {records
                .filter((r) => new Date(r.createdAt).toDateString() === new Date().toDateString())
                .reduce((sum, r) => sum + r.amount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">累计通过</p>
            <p className="text-2xl font-bold text-green-600">
              {records.filter((r) => r.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">累计拒绝</p>
            <p className="text-2xl font-bold text-red-600">
              {records.filter((r) => r.status === 'rejected').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索用户..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提现方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    账号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      暂无提现记录
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {record.nickname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{record.nickname}</p>
                            <p className="text-xs text-gray-400">
                              {record.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-600 font-bold">
                          <Coins size={18} />
                          <span>{record.amount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{getMethodIcon(record.method)}</span>
                          <span className="text-sm text-gray-700">{getMethodLabel(record.method)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.account.length > 8
                          ? `${record.account.slice(0, 3)}****${record.account.slice(-4)}`
                          : record.account}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <Check size={14} />
                              通过
                            </button>
                            <button
                              onClick={() => handleReject(record.id)}
                              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                            >
                              <X size={14} />
                              拒绝
                            </button>
                          </div>
                        )}
                        {record.status === 'rejected' && record.reason && (
                          <span className="text-xs text-red-500 flex items-center gap-1 justify-end">
                            <AlertCircle size={12} />
                            {record.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdraw;
