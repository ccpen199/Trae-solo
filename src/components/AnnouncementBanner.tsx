import { Shield, Bell, FileText } from 'lucide-react'

const announcements = [
  {
    id: 1,
    type: '政策',
    icon: Shield,
    iconColor: 'text-secondary',
    title: '《宠物饲养管理条例》最新修订版已发布',
    date: '2024-03-15',
  },
  {
    id: 2,
    type: '备案',
    icon: FileText,
    iconColor: 'text-primary',
    title: '2024年度犬类养殖备案登记工作已启动',
    date: '2024-03-10',
  },
  {
    id: 3,
    type: '通知',
    icon: Bell,
    iconColor: 'text-blue-500',
    title: '春季宠物疫苗接种公益活动中',
    date: '2024-03-05',
  },
]

export default function AnnouncementBanner() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="heading-font text-2xl font-bold text-text-primary mb-6">公告通知</h2>
      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center shrink-0 ${item.iconColor}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-text-secondary rounded">
                  {item.type}
                </span>
                <span className="text-xs text-text-secondary">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
