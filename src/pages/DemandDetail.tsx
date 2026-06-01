import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { ArrowLeft, Send, Check, X, FileText, Clock, MapPin, Building2 } from 'lucide-react';

export default function DemandDetail() {
  const { id } = useParams<{ id: string }>();
  const [demand, setDemand] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: '', delivery_days: '', remark: '' });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadDemand();
      loadQuotes();
    }
  }, [id]);

  const loadDemand = async () => {
    try {
      const res = await api.demands.get(Number(id));
      setDemand(res.data);
    } catch (err) {
      console.error('加载需求失败', err);
    }
  };

  const loadQuotes = async () => {
    if (user?.role === 'buyer') {
      try {
        const res = await api.quotes.received({ demand_id: id, limit: 20 });
        setQuotes(res.data?.list || []);
      } catch (err) {
        console.error('加载报价失败', err);
      }
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.price) {
      alert('请填写报价金额');
      return;
    }

    setLoading(true);
    try {
      await api.quotes.create({
        demand_id: Number(id),
        price: Number(quoteForm.price),
        delivery_days: quoteForm.delivery_days ? Number(quoteForm.delivery_days) : null,
        remark: quoteForm.remark,
      });
      alert('报价提交成功！');
      setShowQuoteForm(false);
      setQuoteForm({ price: '', delivery_days: '', remark: '' });
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    if (!confirm('确定接受此报价吗？接受后将自动创建订单。')) return;

    try {
      await api.quotes.accept(quoteId);
      alert('已接受报价，订单已创建！');
      loadQuotes();
      navigate('/orders');
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleRejectQuote = async (quoteId: number) => {
    if (!confirm('确定拒绝此报价吗？')) return;

    try {
      await api.quotes.reject(quoteId);
      alert('已拒绝报价');
      loadQuotes();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    published: { label: '已发布', color: 'bg-blue-100 text-blue-600' },
    quoted: { label: '已报价', color: 'bg-purple-100 text-purple-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  };

  const quoteStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-600' },
    accepted: { label: '已接受', color: 'bg-green-100 text-green-600' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-600' },
  };

  if (!demand) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const status = statusMap[demand.status] || statusMap.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">需求详情</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{demand.title}</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{demand.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">所属行业</p>
              <p className="font-medium text-gray-900">{demand.industry || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">所在地区</p>
              <p className="font-medium text-gray-900">{demand.region || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">采购数量</p>
              <p className="font-medium text-gray-900">
                {demand.quantity ? `${demand.quantity} ${demand.unit || ''}` : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">预算范围</p>
              <p className="font-medium text-gray-900">
                {demand.budget_min && demand.budget_max
                  ? `¥${demand.budget_min.toLocaleString()} - ¥${demand.budget_max.toLocaleString()}`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'supplier' && demand.status === 'published' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">提交报价</h3>
            <button
              onClick={() => setShowQuoteForm(!showQuoteForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              {showQuoteForm ? '收起' : '我要报价'}
            </button>
          </div>

          {showQuoteForm && (
            <form onSubmit={handleSubmitQuote} className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    报价金额（元）*
                  </label>
                  <input
                    type="number"
                    value={quoteForm.price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入报价金额"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交货周期（天）
                  </label>
                  <input
                    type="number"
                    value={quoteForm.delivery_days}
                    onChange={(e) => setQuoteForm({ ...quoteForm, delivery_days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入交货周期"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={quoteForm.remark}
                  onChange={(e) => setQuoteForm({ ...quoteForm, remark: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="请输入报价说明或其他备注信息"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交报价'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {user?.role === 'buyer' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            收到的报价 ({quotes.length})
          </h3>

          {quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无收到的报价
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => {
                const qStatus = quoteStatusMap[quote.status] || quoteStatusMap.pending;
                return (
                  <div
                    key={quote.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {quote.enterprise_name || '供应商'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${qStatus.color}`}>
                            {qStatus.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">报价金额：</span>
                            <span className="font-medium text-blue-600">¥{Number(quote.price).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">交货周期：</span>
                            <span>{quote.delivery_days ? `${quote.delivery_days} 天` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">提交时间：</span>
                            <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {quote.remark && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            备注：{quote.remark}
                          </p>
                        )}
                      </div>
                      {quote.status === 'pending' && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleAcceptQuote(quote.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            <Check size={14} />
                            接受并下单
                          </button>
                          <button
                            onClick={() => handleRejectQuote(quote.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                          >
                            <X size={14} />
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
