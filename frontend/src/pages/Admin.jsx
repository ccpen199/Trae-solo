import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'overview', label: '数据概览' },
  { key: 'users', label: '用户管理' },
  { key: 'tasks', label: '任务监控' },
  { key: 'withdrawals', label: '提现审核' },
  { key: 'disputes', label: '争议仲裁' },
  { key: 'reports', label: '举报处理' },
  { key: 'audit', label: '资金审计' },
  { key: 'fraud', label: '刷单识别' },
];

const STATUS_MAP = {
  draft: { text: '草稿', cls: 'bg-gray-100 text-gray-600' },
  active: { text: '进行中', cls: 'bg-green-100 text-green-700' },
  completed: { text: '已完成', cls: 'bg-blue-100 text-blue-700' },
  cancelled: { text: '已取消', cls: 'bg-red-100 text-red-700' },
  disputed: { text: '争议中', cls: 'bg-yellow-100 text-yellow-700' },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reports, setReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fraudUsers, setFraudUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview': {
          const data = await api.admin.stats();
          setStats(data);
          break;
        }
        case 'users': {
          const data = await api.admin.users({ page: 1, limit: 50 });
          setUsers(data.users || data);
          break;
        }
        case 'tasks': {
          const data = await api.admin.tasks({ page: 1, limit: 50 });
          setTasks(data.tasks || data);
          break;
        }
        case 'withdrawals': {
          const data = await api.admin.withdrawals({ status: 'pending' });
          setWithdrawals(data.withdrawals || data);
          break;
        }
        case 'disputes': {
          const data = await api.admin.disputes({ status: 'pending' });
          setDisputes(data.disputes || data);
          break;
        }
        case 'reports': {
          const data = await api.admin.reports({ status: 'pending' });
          setReports(data.reports || data);
          break;
        }
        case 'audit': {
          const data = await api.admin.transactions({ page: 1, limit: 50 });
          setTransactions(data.transactions || data);
          break;
        }
        case 'fraud': {
          const data = await api.admin.users({ page: 1, limit: 200 });
          const allUsers = data.users || data;
          setFraudUsers(
            allUsers.filter(
              (u) => (u.risk_score != null && u.risk_score < 50) || (u.transaction_count && u.transaction_count > 50)
            )
          );
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAuditWithdrawal = async (id, status) => {
    try {
      await api.admin.auditWithdrawal(id, status);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleResolveDispute = async (id, winnerId) => {
    try {
      await api.admin.resolveDispute(id, { result: '已处理', winnerId });
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReport = async (id) => {
    try {
      await api.admin.handleReport(id);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  if (!user || !user.is_admin) return null;

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0">
        <div className="bg-white rounded-lg shadow sticky top-6">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">管理后台</h2>
          </div>
          <nav className="py-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab stats={stats} />}
              {activeTab === 'users' && <UsersTab users={users} />}
              {activeTab === 'tasks' && (
                <TasksTab tasks={tasks} expandedTask={expandedTask} setExpandedTask={setExpandedTask} />
              )}
              {activeTab === 'withdrawals' && (
                <WithdrawalsTab withdrawals={withdrawals} onAudit={handleAuditWithdrawal} />
              )}
              {activeTab === 'disputes' && (
                <DisputesTab disputes={disputes} onResolve={handleResolveDispute} />
              )}
              {activeTab === 'reports' && <ReportsTab reports={reports} onHandle={handleReport} />}
              {activeTab === 'audit' && <AuditTab transactions={transactions} />}
              {activeTab === 'fraud' && <FraudTab users={fraudUsers} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats }) {
  const cards = [
    { label: '用户总数', value: stats.userCount || 0, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: '任务总数', value: stats.taskCount || 0, bg: 'bg-green-50', text: 'text-green-600' },
    { label: '完成任务', value: stats.completedTaskCount || 0, bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: '交易总额', value: `¥${(stats.totalAmount || 0).toFixed(2)}`, bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: '待审提现', value: stats.pendingWithdrawals || 0, bg: 'bg-red-50', text: 'text-red-600' },
    { label: '待处理争议', value: stats.pendingDisputes || 0, bg: 'bg-yellow-50', text: 'text-yellow-600' },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">数据概览</h3>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-lg p-5`}>
            <div className="text-sm text-gray-500 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.text}`}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ users }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">用户管理</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-3 font-medium">ID</th>
              <th className="text-left py-3 px-3 font-medium">用户名</th>
              <th className="text-left py-3 px-3 font-medium">手机号</th>
              <th className="text-left py-3 px-3 font-medium">真实姓名</th>
              <th className="text-left py-3 px-3 font-medium">认证</th>
              <th className="text-left py-3 px-3 font-medium">余额</th>
              <th className="text-left py-3 px-3 font-medium">等级</th>
              <th className="text-left py-3 px-3 font-medium">风险分</th>
              <th className="text-left py-3 px-3 font-medium">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-3">{u.id}</td>
                <td className="py-3 px-3">{u.username}</td>
                <td className="py-3 px-3">{u.phone || '-'}</td>
                <td className="py-3 px-3">{u.real_name || '-'}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {u.verified ? '已认证' : '未认证'}
                  </span>
                </td>
                <td className="py-3 px-3">¥{u.balance?.toFixed(2) ?? '0.00'}</td>
                <td className="py-3 px-3">Lv.{u.level ?? 0}</td>
                <td className="py-3 px-3">
                  <span className={u.risk_score != null && u.risk_score < 50 ? 'text-red-600 font-bold' : ''}>
                    {u.risk_score ?? '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500">{u.created_at || '-'}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">
                  暂无用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksTab({ tasks, expandedTask, setExpandedTask }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">任务监控</h3>
      <div className="space-y-3">
        {tasks.map((t) => {
          const st = STATUS_MAP[t.status] || { text: t.status, cls: 'bg-gray-100 text-gray-600' };
          const expanded = expandedTask === t.id;
          return (
            <div key={t.id} className="border rounded-lg">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedTask(expanded ? null : t.id)}
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    发布者: {t.publisher_name} | 赏金: ¥{t.reward}/单 | 已接: {t.accepted_count ?? 0}/{t.total_count}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${st.cls}`}>{st.text}</span>
              </div>
              {expanded && (
                <div className="border-t px-4 py-3 bg-gray-50 text-sm space-y-1">
                  <div>任务ID: {t.id}</div>
                  <div>分类: {t.category || '-'}</div>
                  <div>描述: {t.description || '-'}</div>
                  <div>
                    剩余名额: {t.remaining_count ?? t.total_count} | 完成数: {t.completed_count ?? 0}
                  </div>
                  <div>创建时间: {t.created_at || '-'}</div>
                </div>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && <div className="text-center py-8 text-gray-400">暂无任务数据</div>}
      </div>
    </div>
  );
}

function WithdrawalsTab({ withdrawals, onAudit }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">提现审核</h3>
      {withdrawals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无待审核的提现申请</div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{w.username}</div>
                <div className="text-sm text-gray-500 mt-1">
                  申请金额: ¥{w.amount} | 手续费: ¥{w.fee} | 实际到账: ¥{w.actual_amount}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAudit(w.id, 'approved')}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  通过
                </button>
                <button
                  onClick={() => onAudit(w.id, 'rejected')}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DisputesTab({ disputes, onResolve }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">争议仲裁</h3>
      {disputes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无待处理的争议</div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="border rounded-lg p-4">
              <div className="mb-3">
                <div className="font-medium">{d.task_title || `任务 #${d.task_id}`}</div>
                <div className="text-sm text-gray-500 mt-1">
                  申诉人: {d.complainant_name} | 被申诉人: {d.respondent_name}
                </div>
                <div className="text-sm text-gray-600 mt-1">理由: {d.reason}</div>
                {d.evidence && <div className="text-sm text-gray-500 mt-1">证据: {d.evidence}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onResolve(d.id, d.complainant_id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  判申诉人胜
                </button>
                <button
                  onClick={() => onResolve(d.id, d.respondent_id)}
                  className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
                >
                  判被申诉人胜
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab({ reports, onHandle }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">举报处理</h3>
      {reports.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无待处理的举报</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">
                  举报人: {r.reporter_name} | 目标: {r.target_type || '用户'} #{r.target_id}
                </div>
                <div className="text-sm text-gray-500 mt-1">原因: {r.reason}</div>
              </div>
              <button
                onClick={() => onHandle(r.id)}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                已处理
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ transactions }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">资金审计</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-3 font-medium">用户</th>
              <th className="text-left py-3 px-3 font-medium">类型</th>
              <th className="text-left py-3 px-3 font-medium">金额</th>
              <th className="text-left py-3 px-3 font-medium">变动前余额</th>
              <th className="text-left py-3 px-3 font-medium">变动后余额</th>
              <th className="text-left py-3 px-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={t.id || i} className="border-b hover:bg-gray-50">
                <td className="py-3 px-3">{t.username || `用户#${t.user_id}`}</td>
                <td className="py-3 px-3">{t.type}</td>
                <td className={`py-3 px-3 font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toFixed(2)}
                </td>
                <td className="py-3 px-3">¥{(t.balance_before ?? 0).toFixed(2)}</td>
                <td className="py-3 px-3">¥{(t.balance_after ?? 0).toFixed(2)}</td>
                <td className="py-3 px-3 text-gray-500">{t.created_at || '-'}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  暂无交易记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FraudTab({ users }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">刷单识别</h3>
      <p className="text-sm text-gray-500 mb-4">风险分低于50或交易频率异常的用户</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-3 font-medium">用户</th>
              <th className="text-left py-3 px-3 font-medium">风险分</th>
              <th className="text-left py-3 px-3 font-medium">交易次数</th>
              <th className="text-left py-3 px-3 font-medium">标记状态</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-3">{u.username}</td>
                <td className="py-3 px-3">
                  <span className={u.risk_score != null && u.risk_score < 50 ? 'text-red-600 font-bold' : ''}>
                    {u.risk_score ?? '-'}
                  </span>
                </td>
                <td className="py-3 px-3">{u.transaction_count ?? '-'}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.flagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {u.flagged ? '已标记' : '正常'}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  暂无异常用户
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
