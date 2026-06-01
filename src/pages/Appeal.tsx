import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Appeal() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [appealType, setAppealType] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadAppeals();
  }, [token, navigate]);

  const loadAppeals = async () => {
    try {
      const result = await api.appeal.list();
      if (result.success) {
        setAppeals(result.data || []);
      }
    } catch (e) {
      console.error('Load appeals failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!appealType || !appealReason) {
      alert('请填写申诉类型和原因');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.appeal.create({
        appealType,
        reason: appealReason,
      });

      if (result.success) {
        alert('申诉提交成功！');
        setShowCreateModal(false);
        setAppealType('');
        setAppealReason('');
        loadAppeals();
      } else {
        alert(result.error || '提交失败');
      }
    } catch (e) {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id: number) => {
    if (!confirm('确认撤回该申诉？')) return;

    try {
      const result = await api.appeal.withdraw(id);
      if (result.success) {
        alert('申诉已撤回');
        loadAppeals();
      } else {
        alert(result.error || '撤回失败');
      }
    } catch (e) {
      alert('撤回失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      approved: '已通过',
      rejected: '已驳回',
      withdrawn: '已撤回',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-gray-100 text-gray-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800">异议申诉</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + 发起申诉
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {appeals.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-gray-500 mb-4">暂无申诉记录</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              发起第一笔申诉 →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{appeal.appeal_type}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                        {getStatusText(appeal.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{appeal.reason}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>提交时间：{appeal.created_at}</span>
                      {appeal.processor_note && (
                        <span>处理意见：{appeal.processor_note}</span>
                      )}
                    </div>
                  </div>
                  {appeal.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(appeal.id)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      撤回
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">发起异议申诉</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申诉类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={appealType}
                  onChange={(e) => setAppealType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">请选择申诉类型</option>
                  <option value="收入异议">收入明细异议</option>
                  <option value="扣除异议">专项附加扣除异议</option>
                  <option value="税额异议">应纳税额异议</option>
                  <option value="退税异议">退税进度异议</option>
                  <option value="其他">其他问题</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申诉原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="请详细描述您的申诉原因和诉求..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-xs text-yellow-700">
                  <span className="font-medium">温馨提示：</span>
                  请确保申诉内容真实有效，虚假申诉将影响您的纳税信用。
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setAppealType('');
                  setAppealReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交申诉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
