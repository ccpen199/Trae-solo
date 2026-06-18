import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { CheckCircle, Clock, Circle, ChevronRight } from 'lucide-react'

const satisfactionData = [
  { subject: '响应速度', 本月: 96.5, 上月: 94.2 },
  { subject: '服务态度', 本月: 98.8, 上月: 98.5 },
  { subject: '流程便捷', 本月: 95.2, 上月: 93.8 },
  { subject: '材料清晰', 本月: 94.8, 上月: 92.6 },
  { subject: '结果满意', 本月: 98.5, 上月: 97.9 },
]

const improvementItems = [
  { id: 1, title: '材料清单模板优化', status: 'done', progress: 100, owner: '业务组-张敏', date: '06-10完成' },
  { id: 2, title: '身份校验人脸识别升级', status: 'doing', progress: 68, owner: '技术组-李强', date: '预计06-25' },
  { id: 3, title: '线上预审环节上线', status: 'doing', progress: 42, owner: '产品组-王磊', date: '预计07-05' },
  { id: 4, title: '智能客服知识库扩充', status: 'todo', progress: 0, owner: '运营组-刘芳', date: '06-20启动' },
  { id: 5, title: '窗口预约系统优化', status: 'todo', progress: 0, owner: '技术组-陈涛', date: '06-28启动' },
]

const statusConfig = {
  done: { label: '已完成', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
  doing: { label: '进行中', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  todo: { label: '待启动', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', bar: 'bg-gray-300' },
} as const

export default function SatisfactionTracking() {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">群众满意度与改进跟踪</h3>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">满意度多维度雷达图</h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary" />本月</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300" />上月</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={satisfactionData} cx="50%" cy="50%" outerRadius={110}>
              <PolarGrid stroke="#E5E6EB" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#4E5969' }} />
              <PolarRadiusAxis angle={30} domain={[80, 100]} tick={{ fontSize: 10, fill: '#86909C' }} axisLine={false} tickCount={5} />
              <Radar name="本月" dataKey="本月" stroke="#165DFF" fill="#165DFF" fillOpacity={0.35} strokeWidth={2} />
              <Radar name="上月" dataKey="上月" stroke="#86909C" fill="#86909C" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}分`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">改进措施跟踪</h4>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} />已完成</span>
              <span className="flex items-center gap-0.5 text-amber-600"><Clock size={10} />进行中</span>
              <span className="flex items-center gap-0.5 text-gray-400"><Circle size={10} />待启动</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {improvementItems.map((item) => {
              const cfg = statusConfig[item.status as keyof typeof statusConfig]
              const Icon = cfg.icon
              return (
                <div key={item.id} className={`p-2.5 rounded-lg border ${cfg.bg} ${cfg.border} hover:shadow-sm transition-all cursor-pointer`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <Icon size={12} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-xs font-medium text-gray-800 truncate">{item.title}</span>
                    </div>
                    <ChevronRight size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className={`text-[10px] font-medium ${cfg.color}`}>{item.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{item.owner}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-green-50">
              <div className="text-lg font-bold text-green-600">{improvementItems.filter((i) => i.status === 'done').length}</div>
              <div className="text-[10px] text-green-600/70">已完成</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50">
              <div className="text-lg font-bold text-amber-600">{improvementItems.filter((i) => i.status === 'doing').length}</div>
              <div className="text-[10px] text-amber-600/70">进行中</div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <div className="text-lg font-bold text-gray-500">{improvementItems.filter((i) => i.status === 'todo').length}</div>
              <div className="text-[10px] text-gray-400">待启动</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
