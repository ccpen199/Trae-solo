const policies = [
  { date: '2026-06-15', title: '关于调整2026年度社会保险缴费基数的通知' },
  { date: '2026-06-10', title: '省人社厅关于进一步优化社保经办服务的意见' },
  { date: '2026-06-05', title: '跨省社保关系转移接续线上办理流程优化公告' },
  { date: '2026-05-28', title: '关于开展灵活就业人员参保登记专项服务的通知' },
]

export default function PolicyAnnouncements() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-xl font-semibold text-gray-900">政策公告</h2>
        </div>
        <button className="text-sm text-gray-400 hover:text-primary">更多&gt;</button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {policies.map((p) => (
          <div key={p.date + p.title} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-1 h-8 bg-danger rounded-full flex-shrink-0" />
            <span className="text-sm text-gray-400 flex-shrink-0">{p.date}</span>
            <span className="text-sm text-gray-700 truncate">{p.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
