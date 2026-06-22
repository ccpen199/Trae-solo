import { motion } from 'framer-motion'
import {
  Shield, Landmark, HeartPulse, Droplets, Zap, Flame,
  Building2, IdCard, Car, Phone, ChevronRight
} from 'lucide-react'

const serviceGroups = [
  {
    title: '社保公积金',
    items: [
      { name: '社保查询', icon: Shield, subtitle: '云南社保在线查询' },
      { name: '公积金查询', icon: Landmark, subtitle: '住房公积金查询' },
      { name: '医保查询', icon: HeartPulse, subtitle: '医保余额与报销查询' },
    ],
  },
  {
    title: '生活缴费',
    items: [
      { name: '水费缴纳', icon: Droplets, subtitle: '自来水在线缴费' },
      { name: '电费缴纳', icon: Zap, subtitle: '南方电网在线缴费' },
      { name: '燃气缴费', icon: Flame, subtitle: '燃气费在线缴纳' },
    ],
  },
  {
    title: '政务便民',
    items: [
      { name: '政务服务', icon: Building2, subtitle: '云南政务服务网' },
      { name: '户籍办理', icon: IdCard, subtitle: '户籍业务在线办理' },
      { name: '交通违章', icon: Car, subtitle: '车辆违章查询处理' },
    ],
  },
]

const phoneNumbers = [
  { name: '镇雄县人民医院', number: '0870-3120120' },
  { name: '急救电话', number: '120' },
  { name: '报警电话', number: '110' },
  { name: '火警电话', number: '119' },
  { name: '镇雄县政务中心', number: '0870-3123456' },
  { name: '消费者投诉', number: '12315' },
  { name: '劳动保障热线', number: '12333' },
]

export default function Services() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pattern-bg min-h-screen pb-8"
    >
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-serif text-2xl font-bold text-rock-900">民生服务</h1>
        <p className="text-rock-400 text-sm mt-1">便捷生活，触手可及</p>
      </div>

      {serviceGroups.map((group) => (
        <section key={group.title} className="px-4 mt-5">
          <h2 className="font-serif text-lg font-semibold text-rock-800 mb-3">{group.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((item) => (
              <a
                key={item.name}
                href="#"
                className="card-hover flex items-center gap-4 bg-white rounded-xl p-4 border border-rock-100"
              >
                <div className="w-12 h-12 rounded-full bg-jade-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-jade-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-rock-900">{item.name}</p>
                  <p className="text-xs text-rock-400 mt-0.5">{item.subtitle}</p>
                </div>
                <ChevronRight size={18} className="text-rock-300 flex-shrink-0" />
              </a>
            ))}
          </div>
        </section>
      ))}

      <section className="px-4 mt-6">
        <h2 className="font-serif text-lg font-semibold text-rock-800 mb-3">便民电话</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {phoneNumbers.map((item) => (
            <a
              key={item.name}
              href={`tel:${item.number}`}
              className="card-hover flex items-center gap-3 bg-white rounded-xl p-4 border border-rock-100"
            >
              <div className="w-10 h-10 rounded-lg bg-ember-400/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-ember-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rock-900">{item.name}</p>
                <p className="font-number text-lg font-semibold text-ember-500">{item.number}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
