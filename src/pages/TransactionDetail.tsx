import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionApi } from '../utils/api';
import {
  TRANSACTION_STATUS_MAP, TRANSACTION_STATUS_COLOR,
  formatDate, formatDateTime
} from '../utils/constants';
import {
  ChevronLeft, Building2, User, Phone, DollarSign, Banknote,
  CheckCircle2, Clock, Circle, Play
} from 'lucide-react';

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [commission, setCommission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadDetail(); }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [detail, comm] = await Promise.all([
        transactionApi.get(parseInt(id!)),
        transactionApi.commission(parseInt(id!))
      ]);
      setData(detail);
      setCommission(comm.commission);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateNodeStatus = async (nodeId: number, status: string) => {
    setActionLoading(true);
    try {
      await transactionApi.updateNode(parseInt(id!), nodeId, status);
      loadDetail();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">交易不存在</div>;

  const { transaction, nodes, fundAccount } = data;

  const getNodeIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'processing') return <Play className="w-5 h-5 text-accent-500" />;
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/transactions')} className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">交易详情</h2>
            <span className={`px-3 py-1 text-sm rounded-full ${TRANSACTION_STATUS_COLOR[transaction.status]}`}>
              {TRANSACTION_STATUS_MAP[transaction.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">交易编号：TX-{transaction.id.toString().padStart(6, '0')}</p>
        </div>
      </div>

      {/* Header summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">成交总价</div>
          <div className="text-2xl font-bold text-primary-600">¥ {(transaction.price / 10000).toFixed(2)} 万</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">佣金 (五折后)</div>
          <div className="text-2xl font-bold text-green-600">¥ {(transaction.commission_amount / 10000).toFixed(4)} 万</div>
          {commission && <div className="text-xs text-gray-400 line-through">原价 ¥ {(commission.originalCommission / 10000).toFixed(4)} 万</div>}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">佣金费率</div>
          <div className="text-2xl font-bold text-accent-600">{(transaction.commission_rate * 100).toFixed(2)}%</div>
          {commission && <div className="text-xs text-gray-400">原价 {(commission.baseRate * 100).toFixed(2)}% × 5折</div>}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">资金监管</div>
          <div className={`text-xl font-bold ${transaction.fund_status === 'deposited' ? 'text-green-600' : 'text-gray-600'}`}>
            {({ pending: '待存入', deposited: '已存入', released: '已划转', refunded: '已退回' } as any)[transaction.fund_status]}
          </div>
          <div className="text-xs text-gray-400">监管账户：{fundAccount.accountNo}</div>
        </div>
      </div>

      {/* Commission discount info */}
      {commission && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-800 mb-1">🎉 佣金五折优惠已享受</h4>
              <p className="text-sm text-green-700">
                原佣金 ¥ {commission.originalCommission.toLocaleString()} 元（{(commission.baseRate * 100).toFixed(2)}%），
                优惠后 ¥ {commission.commissionAmount.toLocaleString()} 元，
                <span className="font-bold"> 为您节省 ¥ {commission.saved.toLocaleString()} 元！</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">过户进度节点</h4>
          <div className="space-y-4">
            {nodes.map((node: any) => (
              <div key={node.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getNodeIcon(node.status)}
                  {node.sort_order < nodes.length && (
                    <div className={`w-0.5 flex-1 mt-2 ${node.status === 'completed' ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${node.status === 'completed' ? 'text-gray-800' : node.status === 'processing' ? 'text-accent-600' : 'text-gray-500'}`}>
                      {node.node_name}
                    </span>
                    {node.completed_at && (
                      <span className="text-xs text-gray-400">{formatDateTime(node.completed_at)}</span>
                    )}
                  </div>
                  {node.status === 'pending' && (
                    <button
                      onClick={() => updateNodeStatus(node.id, 'processing')}
                      disabled={actionLoading}
                      className="text-xs px-3 py-1 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      标记为处理中
                    </button>
                  )}
                  {node.status === 'processing' && (
                    <button
                      onClick={() => updateNodeStatus(node.id, 'completed')}
                      disabled={actionLoading}
                      className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      标记为完成
                    </button>
                  )}
                  {node.status === 'completed' && (
                    <span className="text-xs text-green-600">✓ 已完成</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" /> 房源信息
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{transaction.property_name}</div>
              <div className="text-gray-500">{transaction.property_address}</div>
              <div className="text-gray-500">建筑面积 {transaction.property_area} ㎡</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> 交易双方
            </h5>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-500 mb-1">买家</div>
                <div className="font-medium text-gray-800">{transaction.buyer_name}</div>
                <div className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {transaction.buyer_phone}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-500 mb-1">卖家</div>
                <div className="font-medium text-gray-800">{transaction.seller_name}</div>
                <div className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {transaction.seller_phone}
                </div>
              </div>
              <div className="p-3 bg-accent-50 rounded-lg">
                <div className="text-xs text-accent-600 mb-1">经纪人</div>
                <div className="font-medium text-gray-800">{transaction.agent_name}</div>
                <div className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {transaction.agent_phone}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-600" /> 资金监管账户
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">开户行</span>
                <span className="font-medium text-gray-800">{fundAccount.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">账号</span>
                <span className="font-medium text-gray-800 font-mono">{fundAccount.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">监管金额</span>
                <span className="font-bold text-primary-600">¥ {(fundAccount.amount / 10000).toFixed(2)} 万</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
