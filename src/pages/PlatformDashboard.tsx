import {
  BarChart3,
  Users,
  Stethoscope,
  Building2,
  Store,
  TrendingUp,
  DollarSign,
  Heart,
  Search,
  FileCheck2,
  AlertTriangle,
  Eye,
  MessageSquare,
  Star,
  PawPrint,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const stats = [
  { label: '日活跃用户', value: '8,265', Icon: Users, color: 'from-sky-400 to-cyan-600', growth: '+15.8%' },
  { label: '问诊转化率', value: '34.2%', Icon: Stethoscope, color: 'from-forest-400 to-emerald-600', growth: '+2.1%' },
  { label: '商城复购率', value: '68.9%', Icon: ShoppingBag, color: 'from-violet-400 to-indigo-600', growth: '+4.3%' },
  { label: '平台营收', value: '¥186K', Icon: DollarSign, color: 'from-orange-400 to-amber-600', growth: '+28.5%' },
];

const contentQueue = [
  { type: 'post', user: '张小明', content: '紧急求助！我家金毛突然抽搐，有没有类似经历的铲屎官...', tags: ['求助', '健康'], likes: 23, status: 'pending' },
  { type: 'task', user: '李小红', content: '寻宠启事：白色英短「咪咪」海淀区中关村附近走失', reward: 1500, status: 'approved' },
  { type: 'post', user: '王小刚', content: '无良商家！买的狗粮有质量问题，狗狗吃了拉肚子...', tags: ['曝光', '质量'], likes: 156, status: 'pending' },
  { type: 'task', user: '赵小美', content: '领养申请：希望给流浪的小橘猫一个温暖的家', level: 'verified', status: 'approved' },
];

const hotTopics = [
  { tag: '疫苗接种指南', count: 2386, trend: '+32%' },
  { tag: '夏季驱虫攻略', count: 1892, trend: '+25%' },
  { tag: '老年犬护理', count: 1203, trend: '+18%' },
  { tag: '处方粮测评', count: 876, trend: '+44%' },
  { tag: '新手养猫必看', count: 2156, trend: '+29%' },
];

export default function PlatformDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-200 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '平台运营'} 工作台</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              商家入驻审核 · 反作弊监控 · 内容审核 · 运营报表
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索商家/内容/用户..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color, growth }) => (
          <div key={label} className="card !p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">
                {growth}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左：内容审核队列 */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" /> 社区 & 公益 · 内容审核队列
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-warm-100 text-warm-700 font-semibold">待审核 {contentQueue.filter(c => c.status === 'pending').length}</span>
              <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-700 font-semibold">已通过 {contentQueue.filter(c => c.status === 'approved').length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {contentQueue.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all hover:shadow-sm ${
                  item.status === 'pending'
                    ? 'border-warm-200 bg-warm-50/40'
                    : 'border-forest-200 bg-forest-50/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'task' ? 'bg-purple-100 text-purple-600' : 'bg-sky-100 text-sky-600'
                  }`}>
                    {item.type === 'task' ? <Heart className="w-4 h-4" /> : <PawPrint className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{item.user}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.type === 'task' ? '寻宠公益' : '社区帖子'}
                      </span>
                      {item.tags && item.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                      {item.reward && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                          悬赏 ¥{item.reward}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.content}</p>
                    {item.likes !== undefined && (
                      <div className="mt-2 text-[11px] text-gray-400">
                        <Star className="w-3 h-3 inline text-warm-400 mr-0.5" />
                        热度 {item.likes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.status === 'pending' ? (
                      <>
                        <button className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 下架
                        </button>
                        <button className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-md transition-all text-xs font-medium inline-flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" /> 放行
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-forest-100 text-forest-700">
                        ✓ 已通过
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右：热门话题 + 商家入驻 */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" /> 社区热门话题
            </h2>
            <div className="space-y-2">
              {hotTopics.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-orange-500 text-white'
                    : i === 1 ? 'bg-warm-400 text-white'
                    : i === 2 ? 'bg-forest-400 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">#{t.tag}</span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{t.count}</span>
                  <span className="text-[10px] font-semibold text-forest-600 shrink-0">{t.trend}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3 bg-gradient-to-br from-violet-50 to-sky-50 border-violet-100">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-violet-600" />
              <h2 className="font-display font-bold text-base text-violet-900">商家入驻审核</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/80">
                <div className="text-lg font-bold text-violet-700">12</div>
                <div className="text-[10px] text-gray-500">待审核</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80">
                <div className="text-lg font-bold text-forest-600">86</div>
                <div className="text-[10px] text-gray-500">本月通过</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80">
                <div className="text-lg font-bold text-orange-600">96</div>
                <div className="text-[10px] text-gray-500">活跃商家</div>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-violet-100/50">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span className="text-gray-700 truncate">瑞鹏集团旗舰店</span>
                </div>
                <span className="text-violet-600 font-semibold shrink-0">待审</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="text-gray-700 truncate">美联宠物医疗</span>
                </div>
                <span className="text-sky-600 font-semibold shrink-0">待审</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 反作弊与运营报表 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warm-500" /> 反作弊监控 · 今日异常
          </h2>
          <div className="space-y-2.5">
            {[
              { category: '医院评价刷单', count: 6, severity: 'high', desc: '同IP短时间批量刷评' },
              { category: '处方药异常订单', count: 3, severity: 'medium', desc: '处方编号重复使用' },
              { category: '领养意向恶意申请', count: 12, severity: 'low', desc: '批量提交领养申请' },
              { category: '寻宠虚假线索', count: 8, severity: 'medium', desc: 'LBS定位与描述不符' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-white hover:shadow-sm transition-all">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  a.severity === 'high' ? 'bg-red-100 text-red-600'
                  : a.severity === 'medium' ? 'bg-warm-100 text-warm-600'
                  : 'bg-sky-100 text-sky-600'
                }`}>
                  {a.severity === 'high' ? '高危' : a.severity === 'medium' ? '中危' : '低危'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{a.category} <span className="text-warm-600 font-bold">{a.count}</span> 起</div>
                  <div className="text-[11px] text-gray-500 truncate">{a.desc}</div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shrink-0">
                  处理
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-forest-500" /> 核心业务转化漏斗
          </h2>
          <div className="space-y-3">
            {[
              { step: '访客注册', value: 28465, percent: 100, color: 'from-sky-400 to-cyan-500' },
              { step: '宠物档案建立', value: 22156, percent: 78, color: 'from-violet-400 to-indigo-500' },
              { step: '首次问诊/购买', value: 14824, percent: 52, color: 'from-forest-400 to-emerald-500' },
              { step: '复诊/复购', value: 9896, percent: 35, color: 'from-orange-400 to-amber-500' },
              { step: '月活留存', value: 8265, percent: 29, color: 'from-rose-400 to-pink-500' },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-600">{s.step}</span>
                  <span className="text-gray-800 font-mono font-bold">{s.value.toLocaleString()} <span className="text-gray-400">({s.percent}%)</span></span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all`} style={{ width: `${s.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-1 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>基于近 30 天数据分析</span>
            <span className="text-forest-600 font-semibold">转化路径健康 ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
