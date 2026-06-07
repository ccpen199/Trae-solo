import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '../utils/api';
import {
  TRANSACTION_STATUS_MAP, TRANSACTION_STATUS_COLOR,
  formatDate
} from '../utils/constants';
import { FileSignature, Eye, ChevronRight, Building2, User, DollarSign } from 'lucide-react';

const TransactionList: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTransactions(); }, [page, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await transactionApi.list(params);
      setTransactions(res.list);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = [
    { label: '总交易数', value: total, color: 'text-primary-600', bg: 'bg-primary-50', icon: FileSignature },
    { label: '洽谈中', value: transactions.filter(t => t.status === 'negotiating').length, color: 'text-gray-600', bg: 'bg-gray-50', icon: Building2 },
    { label: '过户中', value: transactions.filter(t => t.status === 'transferring').length, color: 'text-accent-600', bg: 'bg-accent-50', icon: User },
    { label: '已完成', value: transactions.filter(t => t.status === 'completed').length, color: 'text-green-600', bg: 'bg-green-50', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">交易管理</h2>
          <p className="text-sm text-gray-500">买房交易全流程跟踪，佣金五折计费</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">状态筛选：</span>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!statusFilter ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                全部
              </button>
              {Object.entries(TRANSACTION_STATUS_MAP).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setStatusFilter(k)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === k ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(t => (
              <div
                key={t.id}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/transactions/${t.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-800">{t.property_name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${TRANSACTION_STATUS_COLOR[t.status]}`}>
                        {TRANSACTION_STATUS_MAP[t.status]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${t.fund_status === 'deposited' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        资金：{({ pending: '待存入', deposited: '已存入', released: '已划转', refunded: '已退回' } as any)[t.fund_status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2 truncate">{t.property_address}</div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-500">买家：<span className="text-gray-800">{t.buyer_name}</span></span>
                      <span className="text-gray-500">卖家：<span className="text-gray-800">{t.seller_name}</span></span>
                      <span className="text-gray-500">经纪人：<span className="text-gray-800">{t.agent_name}</span></span>
                      <span className="text-gray-500">创建时间：<span className="text-gray-800">{formatDate(t.created_at)}</span></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary-600">¥ {(t.price / 10000).toFixed(2)} 万</div>
                    <div className="text-sm text-green-600">佣金：¥ {(t.commission_amount / 10000).toFixed(2)} 万</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      查看详情 <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="p-12 text-center text-gray-500">暂无交易记录</div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
