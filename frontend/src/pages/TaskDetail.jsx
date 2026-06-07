import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_LABELS = {
  survey: '问卷调研',
  video: '视频观看',
  promotion: '地推打卡',
  blessing: '祝福征集',
};

const CATEGORY_COLORS = {
  survey: { bg: 'bg-blue-100', text: 'text-blue-600' },
  video: { bg: 'bg-purple-100', text: 'text-purple-600' },
  promotion: { bg: 'bg-green-100', text: 'text-green-600' },
  blessing: { bg: 'bg-pink-100', text: 'text-pink-600' },
};

const STATUS_LABELS = {
  accepted: '已接取',
  submitted: '待审核',
  completed: '已完成',
  rejected: '已拒绝',
};

const FLOW_STEPS = ['接取任务', '提交完成', 'AI初筛', '人工复核', '赏金释放'];

async function authedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function getFlowStatus(myAccept) {
  if (!myAccept) return { completed: 0, current: 0, failed: false };
  switch (myAccept.status) {
    case 'accepted':
      return { completed: 1, current: 1, failed: false };
    case 'submitted':
      if (myAccept.ai_verified === true)
        return { completed: 3, current: 3, failed: false };
      if (myAccept.ai_verified === false)
        return { completed: 2, current: 2, failed: true };
      return { completed: 2, current: 2, failed: false };
    case 'completed':
      return { completed: 5, current: -1, failed: false };
    case 'rejected':
      return { completed: 3, current: 3, failed: true };
    default:
      return { completed: 0, current: 0, failed: false };
  }
}

function FlowIndicator({ myAccept }) {
  const { completed, current, failed } = getFlowStatus(myAccept);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-6">任务进度</h3>
      <div className="flex items-start justify-between relative">
        {FLOW_STEPS.map((label, i) => {
          const isDone = i < completed;
          const isCurrent = i === current;
          const isFailed = isCurrent && failed;

          return (
            <div key={label} className="flex flex-col items-center flex-1 relative z-10">
              {i > 0 && (
                <div
                  className={`absolute top-4 -left-1/2 w-full h-0.5 ${
                    i <= completed ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                  isDone
                    ? 'bg-blue-500 text-white'
                    : isCurrent && !isFailed
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse'
                    : isFailed
                    ? 'bg-red-500 text-white ring-4 ring-red-200'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : isFailed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs text-center whitespace-nowrap ${
                  isDone
                    ? 'text-blue-600 font-medium'
                    : isCurrent
                    ? isFailed
                      ? 'text-red-600 font-medium'
                      : 'text-blue-600 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionPanel({ task, myAccept, user, onAccept, onSubmit, submission, setSubmission }) {
  if (user && task.publisher_id === user.id) return null;

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <Link
          to="/login"
          className="block w-full bg-blue-600 text-white py-3 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
        >
          登录后接单
        </Link>
      </div>
    );
  }

  if (!user.verified) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">需完成实名认证</p>
          <p className="text-gray-400 text-sm mb-4">接单前请先完成实名认证</p>
          <Link
            to="/profile"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            前往认证
          </Link>
        </div>
      </div>
    );
  }

  if (!myAccept) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <button
          onClick={onAccept}
          disabled={task.remaining_count <= 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {task.remaining_count > 0 ? '立即接单' : '名额已满'}
        </button>
      </div>
    );
  }

  if (myAccept.status === 'accepted') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-600 font-medium text-sm">任务已接取，请完成后提交</span>
        </div>
        {task.requirements && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1 font-medium">提交要求</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.requirements}</p>
          </div>
        )}
        <textarea
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="请输入任务完成内容..."
          className="w-full border border-gray-200 rounded-lg p-4 mb-4 h-32 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={onSubmit}
          disabled={!submission.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          提交任务
        </button>
      </div>
    );
  }

  if (myAccept.status === 'submitted') {
    const aiPass = myAccept.ai_verified === true;
    const aiFail = myAccept.ai_verified === false;
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              aiPass ? 'bg-green-100' : aiFail ? 'bg-red-100' : 'bg-yellow-100'
            }`}
          >
            {aiPass ? (
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : aiFail ? (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
          <div>
            <p className={`font-medium text-sm ${aiPass ? 'text-green-600' : aiFail ? 'text-red-600' : 'text-yellow-600'}`}>
              AI初筛: {aiPass ? '通过' : aiFail ? '未通过' : '检测中...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span>等待人工复核</span>
        </div>
      </div>
    );
  }

  if (myAccept.status === 'completed') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-green-600 font-semibold text-lg mb-1">赏金已释放</p>
          <p className="text-orange-500 text-2xl font-bold mb-3">
            {task.reward} <span className="text-sm font-normal text-orange-400">元</span>
          </p>
          <Link
            to="/profile"
            className="text-blue-600 text-sm hover:underline"
          >
            查看资金明细
          </Link>
        </div>
      </div>
    );
  }

  if (myAccept.status === 'rejected') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">任务已被拒绝</p>
          <p className="text-gray-400 text-sm mt-1">人工复核未通过</p>
        </div>
      </div>
    );
  }

  return null;
}

function PublisherAccepts({ taskId, onConfirm, onReject }) {
  const [accepts, setAccepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccepts();
  }, [taskId]);

  const loadAccepts = async () => {
    try {
      const data = await authedFetch(`/tasks/${taskId}/accepts`);
      setAccepts(data.accepts || data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-gray-400 text-sm py-4">加载中...</div>;
  if (accepts.length === 0) return <div className="text-gray-400 text-sm py-4">暂无接取记录</div>;

  return (
    <div className="space-y-3">
      {accepts.map((accept) => (
        <div key={accept.id} className="border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{accept.worker_name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    accept.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : accept.status === 'rejected'
                      ? 'bg-red-100 text-red-600'
                      : accept.status === 'submitted'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {STATUS_LABELS[accept.status] || accept.status}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {accept.submitted_at || accept.created_at}
              </div>
            </div>
            {accept.status === 'submitted' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onConfirm(accept.worker_id)}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  确认完成
                </button>
                <button
                  onClick={() => onReject(accept.worker_id)}
                  className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DisputeSection({ taskId }) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setSubmitting(true);
    try {
      await api.tasks.dispute(taskId, { reason: disputeReason });
      setDisputeReason('');
      setDisputeOpen(false);
      alert('争议已发起');
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setSubmitting(true);
    try {
      await authedFetch(`/tasks/${taskId}/report`, {
        method: 'POST',
        body: JSON.stringify({ type: 'report', reason: reportReason }),
      });
      setReportReason('');
      setReportOpen(false);
      alert('举报已提交');
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">争议与举报</h3>
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => { setDisputeOpen(!disputeOpen); setReportOpen(false); }}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          发起争议
        </button>
        <button
          onClick={() => { setReportOpen(!reportOpen); setDisputeOpen(false); }}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          举报任务
        </button>
      </div>

      {disputeOpen && (
        <div className="border border-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-2">请描述争议原因</p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="请详细说明争议原因..."
            className="w-full border border-gray-200 rounded-lg p-3 mb-3 h-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleDispute}
            disabled={submitting || !disputeReason.trim()}
            className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
          >
            提交争议
          </button>
        </div>
      )}

      {reportOpen && (
        <div className="border border-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-2">请描述举报原因</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="请详细说明举报原因..."
            className="w-full border border-gray-200 rounded-lg p-3 mb-3 h-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleReport}
            disabled={submitting || !reportReason.trim()}
            className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
          >
            提交举报
          </button>
        </div>
      )}
    </div>
  );
}

function LifecycleSidebar({ task }) {
  const steps = [
    { label: '任务创建', time: task.created_at, done: true },
    { label: '进行中', time: null, done: task.accepted_count > 0, detail: `已接取 ${task.accepted_count} 单` },
    { label: '已完成', time: null, done: task.accepted_count >= task.total_count, detail: `共 ${task.total_count} 单` },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-5">任务生命周期</h3>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mt-1 ${
                  step.done ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-8 ${step.done ? 'bg-blue-500' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {step.detail && (
                <p className="text-xs text-gray-400 mt-0.5">{step.detail}</p>
              )}
              {step.time && (
                <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">总名额</span>
            <span className="text-gray-800 font-medium">{task.total_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">已接取</span>
            <span className="text-gray-800 font-medium">{task.accepted_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">剩余名额</span>
            <span className="text-orange-500 font-medium">{task.remaining_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [myAccept, setMyAccept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState('');

  useEffect(() => {
    loadTask();
  }, [id, user]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const taskData = await api.tasks.get(id);
      setTask(taskData);
      if (user && user.id !== taskData.publisher_id) {
        const myAccepts = await api.tasks.myAccepted();
        const found = myAccepts.find((a) => a.task_id == id);
        setMyAccept(found || null);
      } else {
        setMyAccept(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    try {
      await api.tasks.accept(id);
      loadTask();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim()) return;
    try {
      await api.tasks.submit(id, { submissionData: { content: submission } });
      setSubmission('');
      loadTask();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleConfirm = async (workerId) => {
    try {
      await api.tasks.confirm(id, workerId);
      loadTask();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (workerId) => {
    try {
      await authedFetch(`/tasks/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ workerId }),
      });
      loadTask();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400">加载中...</div>;
  }

  if (!task) {
    return <div className="text-center py-16 text-gray-400">任务不存在</div>;
  }

  const badge = CATEGORY_COLORS[task.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const isPublisher = user && user.id === task.publisher_id;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-0">
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`${badge.bg} ${badge.text} text-xs px-2.5 py-1 rounded-full font-medium`}>
                    {CATEGORY_LABELS[task.category] || task.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>{task.publisher_name}</span>
                    {task.publisher_verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-3xl font-bold text-orange-500">{task.reward}</span>
                  <span className="text-sm text-orange-400">元/单</span>
                </div>
                {task.escrow && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    赏金已托管
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 text-sm mb-2">任务描述</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>

              {task.requirements && (
                <div>
                  <h3 className="font-medium text-gray-800 text-sm mb-2">任务要求</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {task.requirements}
                  </p>
                </div>
              )}

              <div className="flex gap-6 text-sm text-gray-500">
                <span>总名额: {task.total_count}</span>
                <span>剩余名额: {task.remaining_count}</span>
              </div>
            </div>
          </div>

          <FlowIndicator myAccept={myAccept} />

          <ActionPanel
            task={task}
            myAccept={myAccept}
            user={user}
            onAccept={handleAccept}
            onSubmit={handleSubmit}
            submission={submission}
            setSubmission={setSubmission}
          />

          {isPublisher && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">接取记录</h3>
              <PublisherAccepts
                taskId={id}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            </div>
          )}

          {user && !isPublisher && (
            <DisputeSection taskId={id} />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <LifecycleSidebar task={task} />
          </div>
        </div>
      </div>
    </div>
  );
}
