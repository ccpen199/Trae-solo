import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const categoryLabels = {
  survey: '问卷调研',
  video: '视频观看',
  promotion: '地推打卡',
  blessing: '祝福征集',
};

const categories = [
  {
    key: 'survey',
    label: '问卷调研',
    desc: '简单填写问卷，轻松赚取赏金',
    color: 'blue',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'video',
    label: '视频观看',
    desc: '观看短视频内容，完成任务领赏',
    color: 'purple',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'promotion',
    label: '地推打卡',
    desc: '线下推广打卡，高额回报等你来',
    color: 'green',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'blessing',
    label: '祝福征集',
    desc: '送出真挚祝福，收获丰厚赏金',
    color: 'pink',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: 'text-blue-600',
    hover: 'hover:border-blue-300 hover:shadow-blue-100',
    badge: 'bg-blue-100 text-blue-700',
    link: 'text-blue-600 hover:text-blue-700',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    icon: 'text-purple-600',
    hover: 'hover:border-purple-300 hover:shadow-purple-100',
    badge: 'bg-purple-100 text-purple-700',
    link: 'text-purple-600 hover:text-purple-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    icon: 'text-green-600',
    hover: 'hover:border-green-300 hover:shadow-green-100',
    badge: 'bg-green-100 text-green-700',
    link: 'text-green-600 hover:text-green-700',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    icon: 'text-pink-600',
    hover: 'hover:border-pink-300 hover:shadow-pink-100',
    badge: 'bg-pink-100 text-pink-700',
    link: 'text-pink-600 hover:text-pink-700',
  },
};

const categoryColorMap = {
  survey: 'blue',
  video: 'purple',
  promotion: 'green',
  blessing: 'pink',
};

const features = [
  {
    title: '资金托管安全',
    desc: '赏金先行托管，任务完成后再放款，保障双方权益',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'AI智能审核',
    desc: '智能识别任务提交质量，快速准确完成审核',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '实名认证保障',
    desc: '所有用户实名认证，确保交易安全可靠',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    title: '争议仲裁机制',
    desc: '公平公正的争议处理流程，维护双方合法权益',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [hotTasks, setHotTasks] = useState([]);
  const [redPackets, setRedPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grabbingId, setGrabbingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, tasksData, packetsData] = await Promise.all([
        api.admin.publicStats().catch(() => null),
        api.tasks.hot(),
        api.activities.redPackets().catch(() => []),
      ]);
      setStats(statsData);
      setHotTasks(tasksData);
      setRedPackets(packetsData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGrabPacket = async (id) => {
    if (!user) {
      return;
    }
    setGrabbingId(id);
    try {
      const result = await api.activities.grabRedPacket(id);
      alert(`恭喜！抢到 ¥${result.amount}`);
      loadData();
    } catch (e) {
      alert(e.message || '抢红包失败');
    }
    setGrabbingId(null);
  };

  const statItems = stats
    ? [
        { label: '用户总数', value: stats.user_count ?? stats.users ?? 0, suffix: '人' },
        { label: '任务总数', value: stats.task_count ?? stats.tasks ?? 0, suffix: '个' },
        { label: '完成任务', value: stats.completed_count ?? stats.completed ?? 0, suffix: '个' },
        { label: '交易总额', value: stats.total_amount ?? stats.amount ?? 0, suffix: '元', prefix: '¥' },
      ]
    : [
        { label: '用户总数', value: '-', suffix: '' },
        { label: '任务总数', value: '-', suffix: '' },
        { label: '完成任务', value: '-', suffix: '' },
        { label: '交易总额', value: '-', suffix: '' },
      ];

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              C2C众包悬赏服务平台
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              发布任务，托管赏金；接单赚钱，安全可靠。连接需求方与执行者，让每一份付出都有回报。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/tasks"
                className="inline-flex items-center px-8 py-3 rounded-lg text-base font-semibold bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-lg shadow-blue-500/25"
              >
                进入任务大厅
              </Link>
              <Link
                to="/publish"
                className="inline-flex items-center px-8 py-3 rounded-lg text-base font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors border border-blue-400"
              >
                发布悬赏赚赏金
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow-md p-5 text-center">
              <div className="text-sm text-gray-500 mb-1">{item.label}</div>
              <div className="text-2xl font-bold text-gray-900">
                {item.prefix || ''}
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{item.suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">任务分类</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const c = colorMap[cat.color];
            return (
              <Link
                key={cat.key}
                to={`/tasks?category=${cat.key}`}
                className={`block rounded-xl border ${c.border} ${c.bg} ${c.hover} p-6 transition-all hover:shadow-lg group`}
              >
                <div className={`${c.icon} mb-3`}>{cat.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{cat.label}</h3>
                <p className="text-sm text-gray-500 mb-3">{cat.desc}</p>
                <span className={`inline-flex items-center text-sm font-medium ${c.link} group-hover:underline`}>
                  查看任务
                  <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">热门任务</h2>
          <Link to="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            查看全部
            <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            <span className="ml-3 text-gray-500">加载中...</span>
          </div>
        ) : hotTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">暂无热门任务</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotTasks.slice(0, 6).map((task) => {
              const catColor = colorMap[categoryColorMap[task.category]] || colorMap.blue;
              return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 pr-2">
                      {task.title}
                    </h3>
                    <span className="shrink-0 text-lg font-bold text-orange-500">
                      ¥{task.reward}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${catColor.badge}`}>
                      {categoryLabels[task.category] || task.category}
                    </span>
                    <span className="text-xs text-gray-400">{task.publisher_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>已接 {task.accepted_count ?? 0}/{task.total_count ?? 0} 单</span>
                    <span>剩余 {task.remaining_count ?? 0} 名额</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {redPackets.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">红包活动</h2>
            <Link to="/red-packet" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
              查看全部
              <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {redPackets.slice(0, 4).map((packet) => (
              <div
                key={packet.id}
                className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 text-center"
              >
                <div className="text-sm text-gray-600 mb-1">{packet.sponsor_name} 发红包</div>
                <div className="text-3xl font-bold text-red-600 mb-1">¥{packet.total_amount}</div>
                <div className="text-xs text-gray-400 mb-4">
                  剩余 {packet.remaining_count}/{packet.count} 个
                </div>
                {user ? (
                  <button
                    onClick={() => handleGrabPacket(packet.id)}
                    disabled={grabbingId === packet.id || packet.remaining_count <= 0}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 text-white hover:bg-red-600"
                  >
                    {grabbingId === packet.id ? '抢夺中...' : packet.remaining_count <= 0 ? '已抢完' : '抢红包'}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block w-full py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors text-center"
                  >
                    登录后抢红包
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">平台保障</h2>
          <p className="text-gray-500 mt-2">多重机制保障您的交易安全</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center hover:shadow-lg hover:border-gray-200 transition-all"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                {feat.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
