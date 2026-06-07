import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'info', label: '个人信息' },
  { key: 'verify', label: '实名认证' },
  { key: 'wallet', label: '资金明细' },
  { key: 'published', label: '我发布的' },
  { key: 'accepted', label: '我接取的' },
  { key: 'withdraw', label: '提现管理' },
];

const typeLabels = {
  recharge: '充值',
  withdraw: '提现',
  reward: '任务奖励',
  escrow: '任务托管',
  red_packet: '发红包',
  red_packet_reward: '抢红包',
  refund: '退款',
};

const taskStatusLabels = {
  accepted: '已接取-待提交',
  submitted: '已提交-待审核',
  completed: '已完成-已结算',
  rejected: '已拒绝',
};

const taskStatusColors = {
  accepted: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const publishedStatusMap = {
  active: { label: '进行中', color: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

const withdrawalStatusMap = {
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
};

function formatFee(amount) {
  if (amount < 50) return (amount * 0.03).toFixed(2);
  if (amount <= 100) return (amount * 0.02).toFixed(2);
  return (amount * 0.01).toFixed(2);
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [transactions, setTransactions] = useState([]);
  const [publishedTasks, setPublishedTasks] = useState([]);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [verifyForm, setVerifyForm] = useState({ realName: '', idCard: '' });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setTabLoading(true);
    try {
      if (activeTab === 'wallet') {
        const data = await api.wallet.transactions({ page: 1, limit: 50 });
        setTransactions(data.transactions || data || []);
      } else if (activeTab === 'published') {
        const data = await api.tasks.myPublished();
        setPublishedTasks(Array.isArray(data) ? data : data.tasks || []);
      } else if (activeTab === 'accepted') {
        const data = await api.tasks.myAccepted();
        setAcceptedTasks(Array.isArray(data) ? data : data.tasks || []);
      } else if (activeTab === 'withdraw') {
        const data = await api.wallet.withdrawals();
        setWithdrawals(Array.isArray(data) ? data : data.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    }
    setTabLoading(false);
  };

  const handleRecharge = async () => {
    const amount = prompt('请输入充值金额：', '100');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      try {
        await api.wallet.recharge(parseFloat(amount));
        await refreshProfile();
        loadData();
        alert('充值成功！');
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyForm.realName.trim() || !verifyForm.idCard.trim()) return;
    setVerifyLoading(true);
    try {
      await api.auth.verify(verifyForm);
      await refreshProfile();
      alert('实名认证提交成功！');
    } catch (e) {
      alert(e.message);
    }
    setVerifyLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效金额');
      return;
    }
    setWithdrawLoading(true);
    try {
      await api.wallet.withdraw({ amount });
      await refreshProfile();
      setWithdrawAmount('');
      loadData();
      alert('提现申请已提交，等待审核！');
    } catch (e) {
      alert(e.message);
    }
    setWithdrawLoading(false);
  };

  const handleSubmitTask = async (taskId) => {
    try {
      await api.tasks.submit(taskId, { submissionData: { content: '已提交' } });
      loadData();
      alert('提交成功，等待审核！');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDispute = async (taskId) => {
    const reason = prompt('请输入争议原因：');
    if (!reason) return;
    try {
      await api.tasks.dispute(taskId, { reason });
      loadData();
      alert('争议已发起！');
    } catch (e) {
      alert(e.message);
    }
  };

  if (!user) return null;

  const balance = user.balance || 0;
  const frozenBalance = user.frozen_balance || 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
            {(user.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold mb-1">{user.username}</h2>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Lv.{user.level || 1}</span>
              {user.verified ? (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">已实名认证</span>
              ) : (
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">未实名认证</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm text-gray-500">账户余额</div>
            <div className="text-2xl font-bold text-blue-600">¥{balance.toFixed(2)}</div>
            <div className="text-sm text-gray-400">冻结: ¥{frozenBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tabLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              {activeTab === 'info' && <InfoTab user={user} />}
              {activeTab === 'verify' && (
                <VerifyTab
                  user={user}
                  verifyForm={verifyForm}
                  setVerifyForm={setVerifyForm}
                  onSubmit={handleVerify}
                  loading={verifyLoading}
                />
              )}
              {activeTab === 'wallet' && (
                <WalletTab
                  transactions={transactions}
                  onRecharge={handleRecharge}
                />
              )}
              {activeTab === 'published' && (
                <PublishedTab tasks={publishedTasks} />
              )}
              {activeTab === 'accepted' && (
                <AcceptedTab
                  tasks={acceptedTasks}
                  onSubmitTask={handleSubmitTask}
                  onDispute={handleDispute}
                />
              )}
              {activeTab === 'withdraw' && (
                <WithdrawTab
                  withdrawals={withdrawals}
                  withdrawAmount={withdrawAmount}
                  setWithdrawAmount={setWithdrawAmount}
                  onSubmit={handleWithdraw}
                  loading={withdrawLoading}
                  balance={balance}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTab({ user }) {
  const fields = [
    { label: '用户名', value: user.username },
    { label: '手机号', value: user.phone || '未设置' },
    { label: '邮箱', value: user.email || '未设置' },
    { label: '经验值', value: `${user.experience || 0}` },
    { label: '等级', value: `Lv.${user.level || 1}` },
    { label: '发布任务数', value: `${user.publishedCount || 0}` },
    { label: '完成任务数', value: `${user.acceptedCount || 0}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="text-gray-500 text-sm">{f.label}</div>
            <div className="text-gray-800 mt-0.5">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifyTab({ user, verifyForm, setVerifyForm, onSubmit, loading }) {
  if (user.verified) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-lg font-medium text-green-700 mb-1">已完成实名认证</div>
        <div className="text-sm text-gray-500">您的身份信息已通过验证</div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="max-w-md mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">真实姓名</label>
          <input
            type="text"
            value={verifyForm.realName}
            onChange={(e) => setVerifyForm({ ...verifyForm, realName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入真实姓名"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">身份证号</label>
          <input
            type="text"
            value={verifyForm.idCard}
            onChange={(e) => setVerifyForm({ ...verifyForm, idCard: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入身份证号"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '提交中...' : '提交认证'}
        </button>
      </form>

      {(user.device_fingerprint || user.risk_score !== undefined) && (
        <div className="border-t pt-6">
          <h3 className="font-medium mb-3">安全信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.device_fingerprint && (
              <div>
                <div className="text-gray-500">设备指纹</div>
                <div className="text-gray-700 mt-0.5 break-all">{user.device_fingerprint}</div>
              </div>
            )}
            {user.risk_score !== undefined && (
              <div>
                <div className="text-gray-500">风险评分</div>
                <div className={`mt-0.5 font-medium ${
                  user.risk_score > 70 ? 'text-red-600' :
                  user.risk_score > 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {user.risk_score}/100
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletTab({ transactions, onRecharge }) {
  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={onRecharge}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          充值
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无交易记录</div>
      ) : (
        <div className="space-y-0">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <div className="font-medium">{typeLabels[tx.type] || tx.type}</div>
                <div className="text-sm text-gray-500">{tx.created_at}</div>
              </div>
              <div className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublishedTab({ tasks }) {
  if (tasks.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无发布的任务</div>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const status = publishedStatusMap[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-700' };
        return (
          <div
            key={task.id}
            onClick={() => navigate_to_task(task.id)}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {task.accepted_count || 0}/{task.total_count} 单 · ¥{task.reward}/单
                </div>
              </div>
              <span className={`ml-3 flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function navigate_to_task(id) {
  window.location.href = `/tasks/${id}`;
}

function AcceptedTab({ tasks, onSubmitTask, onDispute }) {
  if (tasks.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无接取的任务</div>;
  }

  const steps = ['accepted', 'submitted', 'completed'];

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const statusColor = taskStatusColors[task.status] || 'bg-gray-100 text-gray-700';
        const currentStepIndex = steps.indexOf(task.status);

        return (
          <div key={task.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  发布者: {task.publisher_name} · 赏金: ¥{task.reward}
                </div>
              </div>
              <span className={`ml-3 flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                {taskStatusLabels[task.status] || task.status}
              </span>
            </div>

            {task.status !== 'rejected' && (
              <div className="flex items-center mb-3 px-2">
                {steps.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      idx <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${
                        idx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {task.status === 'submitted' && (
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span>
                  AI审核: {task.ai_verified ? (
                    <span className="text-green-600 font-medium">通过</span>
                  ) : (
                    <span className="text-red-600 font-medium">未通过</span>
                  )}
                </span>
                <span>
                  人工复核: {task.manual_reviewed ? (
                    <span className="text-green-600 font-medium">已完成</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">等待中</span>
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {task.status === 'accepted' && (
                <button
                  onClick={() => onSubmitTask(task.task_id || task.id)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  提交任务
                </button>
              )}
              {(task.status === 'submitted' || task.disputed) && (
                <button
                  onClick={() => onDispute(task.task_id || task.id)}
                  className="bg-orange-600 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-700 transition-colors"
                >
                  发起争议
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WithdrawTab({ withdrawals, withdrawAmount, setWithdrawAmount, onSubmit, loading, balance }) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-medium mb-3">提现费率</h3>
        <div className="border rounded-lg overflow-hidden text-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 text-gray-600 font-medium">提现金额</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">手续费率</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">小于50元</td>
                <td className="px-4 py-2">3%</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">50元 - 100元</td>
                <td className="px-4 py-2">2%</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">100元及以上</td>
                <td className="px-4 py-2">1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mb-8">
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-gray-700 font-medium mb-2">提现金额</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入提现金额"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '提交中...' : '申请提现'}
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          可用余额: ¥{balance.toFixed(2)}
          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <span className="ml-3">
              手续费: ¥{formatFee(parseFloat(withdrawAmount))} · 到账: ¥{(parseFloat(withdrawAmount) - parseFloat(formatFee(parseFloat(withdrawAmount)))).toFixed(2)}
            </span>
          )}
        </div>
      </form>

      <h3 className="font-medium mb-3">提现记录</h3>
      {withdrawals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无提现记录</div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const status = withdrawalStatusMap[w.status] || { label: w.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={w.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">¥{Number(w.amount).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      手续费: ¥{Number(w.fee || 0).toFixed(2)} · 到账: ¥{Number(w.actual_amount || w.amount - (w.fee || 0)).toFixed(2)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{w.created_at}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
