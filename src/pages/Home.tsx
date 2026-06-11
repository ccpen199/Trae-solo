import { Link } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Building2,
  Bot,
  QrCode,
} from 'lucide-react';
import { mockSocialCard, mockUser, mockCityConfigs, mockKnowledgeEntries } from '@/data/mock';
import { getStatusText, getStatusColor } from '@/utils/format';

export default function Home() {
  const sjzConfig = mockCityConfigs.find((c) => c.cityCode === '130100');
  const hotQuestions = mockKnowledgeEntries.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-gov-red to-red-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute right-10 bottom-0 w-40 h-40 bg-white/5 rounded-full -mb-20"></div>
          <div className="relative">
            <p className="text-red-100 text-sm">欢迎回来，{mockUser.name}</p>
            <h2 className="text-2xl font-bold mt-1">您好，让我们为您服务</h2>
            <p className="text-red-100 mt-2 text-sm">
              当前参保地：{mockUser.cityName} · 参保状态：正常参保
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/card"
                className="inline-flex items-center gap-1 bg-white text-gov-red px-5 py-2.5 rounded-md text-sm font-medium hover:bg-red-50 transition"
              >
                <CreditCard className="w-4 h-4" />
                社保卡服务
              </Link>
              <Link
                to="/benefit"
                className="inline-flex items-center gap-1 bg-white/15 text-white border border-white/30 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white/25 transition"
              >
                <FileText className="w-4 h-4" />
                打印权益单
              </Link>
            </div>
          </div>
        </div>

        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">我的社保卡</h3>
            <Link
              to="/card"
              className="text-xs text-gov-red hover:underline flex items-center"
            >
              查看详情 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-xl p-5 text-white relative overflow-hidden">
            <div className="absolute right-3 top-3">
              <span className={`gov-badge bg-white/20 text-white`}>
                {getStatusText(mockSocialCard.status)}
              </span>
            </div>
            <div className="text-xs text-blue-200">社会保障卡号</div>
            <div className="text-lg font-mono tracking-wider mt-1">
              {mockSocialCard.cardNumber}
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-xs text-blue-200">持卡人</div>
                <div className="text-sm font-medium">{mockSocialCard.holderName}</div>
              </div>
              <Building2 className="w-8 h-8 text-blue-300" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Link
              to="/card/progress"
              className="flex items-center gap-2 text-gray-600 hover:text-gov-red"
            >
              <Clock className="w-4 h-4" />
              制卡进度
            </Link>
            <Link
              to="/card"
              className="flex items-center gap-2 text-gray-600 hover:text-gov-red"
            >
              <AlertTriangle className="w-4 h-4" />
              挂失/解挂
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">热门服务</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              label: '社保卡挂失',
              icon: CreditCard,
              color: 'bg-red-50 text-red-600',
              link: '/card',
            },
            {
              label: '制卡进度',
              icon: Clock,
              color: 'bg-blue-50 text-blue-600',
              link: '/card/progress',
            },
            {
              label: '权益单打印',
              icon: FileText,
              color: 'bg-green-50 text-green-600',
              link: '/benefit',
            },
            {
              label: '失业金预检',
              icon: ShieldCheck,
              color: 'bg-yellow-50 text-yellow-600',
              link: '/unemployment',
            },
            {
              label: '智能问答',
              icon: Bot,
              color: 'bg-purple-50 text-purple-600',
              link: '#',
            },
            {
              label: '电子社保卡',
              icon: QrCode,
              color: 'bg-cyan-50 text-cyan-600',
              link: '#',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.link}
                className="gov-card p-4 text-center hover:shadow-md transition group"
              >
                <div
                  className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-700">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {sjzConfig && sjzConfig.localizedServices.filter((s) => s.enabled).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-lg">
              <span className="text-gov-red">{mockUser.cityName}</span>本地化服务
            </h3>
            <span className="text-xs text-gray-400">由地市管理员配置</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sjzConfig.localizedServices
              .filter((s) => s.enabled)
              .map((s) => (
                <a
                  key={s.id}
                  href={s.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gov-card p-5 hover:shadow-md transition flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-gov-red/10 text-gov-red rounded-lg flex items-center justify-center text-xl">
                    {s.icon === 'home' ? '🏠' : s.icon === 'award' ? '🎖️' : '📌'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{s.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                  </div>
                </a>
              ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">政策热点问答</h3>
            <Link to="/admin/knowledge" className="text-xs text-gov-red hover:underline">
              更多 →
            </Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {hotQuestions.map((q, idx) => (
              <li key={q.id} className="py-3 flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0
                      ? 'bg-gov-red text-white'
                      : idx === 1
                      ? 'bg-orange-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 hover:text-gov-red cursor-pointer">
                    {q.question}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    来源：{q.sourceLaw} · 浏览 {q.views.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">数据概览</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '累计缴费月数', value: '456', unit: '个月', color: 'text-blue-600' },
              {
                label: '养老账户余额',
                value: '12.86',
                unit: '万元',
                color: 'text-green-600',
              },
              { label: '医保账户余额', value: '3.25', unit: '万元', color: 'text-cyan-600' },
              {
                label: '失业金可领',
                value: '18',
                unit: '个月',
                color: 'text-yellow-600',
              },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold mt-1">
                  <span className={item.color}>{item.value}</span>
                  <span className="text-sm text-gray-500 font-normal ml-1">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
