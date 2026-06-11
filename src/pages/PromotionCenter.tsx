import { useState } from "react";
import {
  Gift,
  Plus,
  Percent,
  Wallet,
  Dices,
  Search,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Settings,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface Promotion {
  id: string;
  name: string;
  type: "discount" | "redpacket" | "lottery";
  status: "draft" | "active" | "paused" | "ended";
  startDate: string;
  endDate: string;
  budget: number;
  used: number;
  participants: number;
  roi: number;
  rules: {
    threshold?: number;
    discount?: number;
    amount?: number;
    count?: number;
  };
}

const TYPE_META: Record<string, { l: string; icon: typeof Gift; color: string; bg: string }> = {
  discount: { l: "满减", icon: Percent, color: "text-rose-600", bg: "bg-rose-50" },
  redpacket: { l: "红包", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
  lottery: { l: "抽奖", icon: Dices, color: "text-violet-600", bg: "bg-violet-50" },
};

const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  draft: { l: "草稿", c: "tag" },
  active: { l: "进行中", c: "tag-success" },
  paused: { l: "已暂停", c: "tag-warning" },
  ended: { l: "已结束", c: "tag-danger" },
};

const PRIZES = [
  { name: "一等奖：iPhone 15 Pro", count: 1, prob: 0.0001 },
  { name: "二等奖：888元红包", count: 10, prob: 0.001 },
  { name: "三等奖：50元红包", count: 1000, prob: 0.1 },
  { name: "四等奖：5元红包", count: 10000, prob: 0.4 },
  { name: "谢谢参与", count: 999999, prob: 0.4989 },
];

export default function PromotionCenter() {
  const [tab, setTab] = useState<"list" | "create" | "stats">("list");
  const [type, setType] = useState<Promotion["type"]>("discount");
  const { data: activities } = useApi<Promotion[]>("/api/promotion/activities");
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { k: "list", l: "活动列表", icon: Gift },
            { k: "create", l: "创建活动", icon: Plus },
            { k: "stats", l: "效果追踪", icon: TrendingUp },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k as typeof tab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                  tab === t.k ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-500"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.l}
              </button>
            );
          })}
        </div>
        <button onClick={() => setTab("create")} className="btn-primary">
          <Plus className="w-4 h-4" /> 新建活动
        </button>
      </div>

      {tab === "list" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { l: "进行中活动", v: 8, icon: Play, c: "from-emerald-500 to-emerald-700" },
              { l: "累计参与人次", v: 125680, icon: Users, c: "from-brand-500 to-brand-700" },
              { l: "优惠核销金额", v: 586420, icon: DollarSign, c: "from-gold-500 to-gold-600" },
              { l: "综合ROI", v: "1 : 3.8", icon: Target, c: "from-violet-500 to-violet-700" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className={`bg-gradient-to-br ${s.c} text-white rounded-xl2 p-5 shadow-card`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm opacity-90">{s.l}</div>
                      <div className="text-2xl font-bold mt-1">{typeof s.v === "number" ? s.v.toLocaleString() : s.v}</div>
                    </div>
                    <Icon className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex gap-1">
                {["全部", "满减", "红包", "抽奖"].map((f) => (
                  <button key={f} className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-600 transition">
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 w-56" placeholder="搜索活动名称" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {(activities || []).map((a) => {
                const meta = TYPE_META[a.type];
                const Icon = meta.icon;
                const st = STATUS_LABEL[a.status];
                const usedPct = (a.used / a.budget) * 100;
                return (
                  <div key={a.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-card-hover transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-brand-700">{a.name}</div>
                          <div className="text-xs text-slate-500">{meta.l}活动</div>
                        </div>
                      </div>
                      <span className={st.c}>{st.l}</span>
                    </div>

                    <div className="space-y-1.5 text-sm py-3 border-y border-slate-100 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">活动周期</span>
                        <span className="text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(a.startDate, "MM-DD")} ~ {formatDate(a.endDate, "MM-DD")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">参与人次</span>
                        <span className="font-semibold">{a.participants.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">预算使用</span>
                        <span className="font-semibold text-rose-600">{formatMoney(a.used)} / {formatMoney(a.budget)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full" style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gold-600 font-semibold">ROI 1:{a.roi}</span>
                      <div className="flex items-center gap-1">
                        {a.status === "active" && (
                          <button className="p-1.5 rounded hover:bg-slate-100 text-amber-600" title="暂停">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {a.status === "paused" && (
                          <button className="p-1.5 rounded hover:bg-slate-100 text-emerald-600" title="启动">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded hover:bg-slate-100 text-brand-500" title="查看数据">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="设置">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "create" && (
        <div className="card">
          <h3 className="section-title">
            <Settings className="w-5 h-5" /> 活动类型选择
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(["discount", "redpacket", "lottery"] as const).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <div
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition ${
                    type === t ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-brand-200"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${meta.color}`} />
                  </div>
                  <div className="font-bold text-lg text-brand-700">
                    {t === "discount" && "满减活动"}
                    {t === "redpacket" && "红包活动"}
                    {t === "lottery" && "抽奖活动"}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {t === "discount" && "设置消费门槛和减免金额，适用于提升客单价"}
                    {t === "redpacket" && "发放固定或随机金额红包，刺激用户消费"}
                    {t === "lottery" && "设置多级奖品和中奖概率，提升用户活跃度"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="input-label">活动名称</label>
              <input className="input" placeholder="例如：夏日缴费节满减活动" />
            </div>
            <div>
              <label className="input-label">活动预算（元）</label>
              <input type="number" className="input" placeholder="请输入活动总预算" />
            </div>
            <div>
              <label className="input-label">开始时间</label>
              <input type="datetime-local" className="input" />
            </div>
            <div>
              <label className="input-label">结束时间</label>
              <input type="datetime-local" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">适用缴费项目</label>
              <div className="grid grid-cols-3 gap-2">
                {["水费", "电费", "燃气费", "暖气费", "通讯费", "社保"].map((c) => (
                  <label key={c} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:border-brand-300">
                    <input type="checkbox" className="accent-brand-500" />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {type === "discount" && (
            <div className="mt-6 p-5 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-brand-700 flex items-center gap-2">
                  <Percent className="w-4 h-4" /> 满减规则（可视化编排）
                </h4>
                <button onClick={() => setShowBuilder(true)} className="btn-secondary text-sm">
                  <Plus className="w-4 h-4" /> 添加规则
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { t: 100, d: 10 },
                  { t: 200, d: 25 },
                  { t: 500, d: 80 },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2 text-sm">
                      <span className="text-slate-500">满</span>
                      <span className="font-mono font-bold text-brand-600">¥{r.t}</span>
                      <span className="text-slate-500">减</span>
                      <span className="font-mono font-bold text-rose-600">¥{r.d}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </div>
                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === "redpacket" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="input-label">红包总数量</label>
                <input type="number" className="input" placeholder="例如 10000" />
              </div>
              <div>
                <label className="input-label">单个金额（元）</label>
                <select className="input">
                  <option value="fixed">固定金额</option>
                  <option value="random">随机金额</option>
                </select>
              </div>
              <div>
                <label className="input-label">金额范围</label>
                <input className="input" placeholder="1-888 元" />
              </div>
              <div>
                <label className="input-label">使用门槛</label>
                <input type="number" className="input" placeholder="满多少元可用" />
              </div>
              <div>
                <label className="input-label">有效期（天）</label>
                <input type="number" className="input" placeholder="例如 7" defaultValue={7} />
              </div>
              <div>
                <label className="input-label">每人限领</label>
                <input type="number" className="input" placeholder="例如 1" defaultValue={1} />
              </div>
            </div>
          )}

          {type === "lottery" && (
            <div className="mt-6">
              <h4 className="font-semibold text-brand-700 mb-3 flex items-center gap-2">
                <Dices className="w-4 h-4" /> 奖品配置
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-medium">奖品等级</th>
                      <th className="text-left py-2.5 px-4 font-medium">奖品名称</th>
                      <th className="text-right py-2.5 px-4 font-medium">数量</th>
                      <th className="text-right py-2.5 px-4 font-medium">中奖概率</th>
                      <th className="text-left py-2.5 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRIZES.map((p, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2.5 px-4">
                          <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                            i < 3 ? "bg-gold-gradient text-brand-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-brand-700">{p.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{p.count.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{(p.prob * 100).toFixed(4)}%</td>
                        <td className="py-2.5 px-4">
                          <button className="btn-ghost text-xs px-2 py-1 text-brand-500">
                            <Settings className="w-3.5 h-3.5" /> 编辑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">概率合计：<span className="font-semibold text-emerald-600">100.00%</span></span>
                <button className="btn-secondary text-sm"><Plus className="w-4 h-4" /> 添加奖品</button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button className="btn-secondary">保存草稿</button>
            <button className="btn-primary px-8">
              <CheckCircle2 className="w-4 h-4" /> 发布活动
            </button>
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="section-title">
              <TrendingUp className="w-5 h-5" /> 活动效果漏斗
            </h3>
            <div className="grid grid-cols-5 gap-2 py-6">
              {[
                { l: "曝光", v: 586420, c: "from-brand-400 to-brand-500" },
                { l: "点击", v: 125680, c: "from-brand-500 to-brand-600" },
                { l: "参与", v: 48520, c: "from-violet-500 to-violet-600" },
                { l: "核销", v: 18960, c: "from-gold-500 to-gold-600" },
                { l: "复购", v: 6280, c: "from-emerald-500 to-emerald-600" },
              ].map((s, i) => (
                <div key={s.l} className="text-center">
                  <div
                    className={`bg-gradient-to-br ${s.c} text-white rounded-t-lg py-6 shadow-md mx-${i === 0 || i === 4 ? "0" : i === 1 || i === 3 ? "4" : "8"}`}
                    style={{ marginLeft: `${i * 8}px`, marginRight: `${(4 - i) * 8}px` }}
                  >
                    <div className="text-xs opacity-80">{s.l}</div>
                    <div className="text-xl font-bold mt-1">{s.v.toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    转化率 {i === 0 ? "100%" : `${((s.v / [586420, 125680, 48520, 18960, 6280][i - 1]) * 100).toFixed(1)}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">
              <DollarSign className="w-5 h-5" /> ROI 排行榜
            </h3>
            <div className="space-y-3">
              {[
                { n: "新客专享满100减20", r: 5.8, p: 156 },
                { n: "水电燃气联合红包", r: 4.2, p: 89 },
                { n: "夏日抽奖狂欢节", r: 3.8, p: 68 },
                { n: "社保缴费立减活动", r: 3.1, p: 42 },
                { n: "通讯费月末满减", r: 2.6, p: 28 },
              ].map((a, i) => (
                <div key={a.n} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? "bg-gold-gradient text-brand-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-brand-700 truncate">{a.n}</div>
                    <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full" style={{ width: `${(a.r / 6) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gold-600">1:{a.r}</div>
                    <div className="text-xs text-slate-500">{a.p}万参与</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">
              <Users className="w-5 h-5" /> 用户参与分析
            </h3>
            <div className="space-y-4">
              {[
                { l: "新用户参与", v: 28650, p: 59 },
                { l: "老用户复购", v: 19870, p: 41 },
                { l: "分享裂变", v: 6420, p: 13 },
                { l: "渠道A来源", v: 35200, p: 72 },
                { l: "渠道B来源", v: 13320, p: 28 },
              ].map((s) => (
                <div key={s.l}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{s.l}</span>
                    <span className="font-semibold">{s.v.toLocaleString()} <span className="text-slate-400">({s.p}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${s.p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBuilder(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-brand-700">添加满减规则</h3>
              <button onClick={() => setShowBuilder(false)} className="p-1.5 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="input-label">门槛金额（元）</label>
                <input type="number" className="input" placeholder="例如 100" />
              </div>
              <div>
                <label className="input-label">减免金额（元）</label>
                <input type="number" className="input" placeholder="例如 10" />
              </div>
              <div>
                <label className="input-label">是否叠加</label>
                <select className="input">
                  <option>可与其他优惠叠加</option>
                  <option>不可叠加</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowBuilder(false)}>取消</button>
              <button className="btn-primary" onClick={() => setShowBuilder(false)}>
                <CheckCircle2 className="w-4 h-4" /> 确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
