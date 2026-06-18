import { Building2, Users, UserCircle } from 'lucide-react'

const identities = [
  {
    icon: Building2,
    title: '企业职工',
    desc: '在职职工社保服务',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    icon: Users,
    title: '灵活就业',
    desc: '自主参保灵活缴费',
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
  {
    icon: UserCircle,
    title: '城乡居民',
    desc: '居民养老医保服务',
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
]

export default function IdentitySelector() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-xl font-semibold text-gray-900">选择您的身份类型，进入专属服务</h2>
      </div>
      <div className="grid grid-cols-3 gap-5 mb-4">
        {identities.map((item) => (
          <button
            key={item.title}
            className="bg-white border border-gray-100 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary group"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4`}>
              <item.icon size={28} className="text-white" />
            </div>
            <div className="font-semibold text-gray-900 text-lg mb-1">{item.title}</div>
            <div className="text-sm text-gray-500 mb-4">{item.desc}</div>
            <span className={`inline-flex items-center text-sm font-medium ${item.text} group-hover:translate-x-1 transition-transform`}>
              立即体验
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-400">不同身份享受不同服务套餐，可随时切换</p>
    </div>
  )
}
