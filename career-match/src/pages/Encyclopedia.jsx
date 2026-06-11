import { useState } from 'react'
import { encyclopediaData, entryThresholds } from '../data/mockData'
import { Play, Headphones, BarChart3, Clock, Eye, Filter } from 'lucide-react'

export default function Encyclopedia() {
  const [activeType, setActiveType] = useState('all')
  const [selectedRole, setSelectedRole] = useState(entryThresholds[0].role)

  const filtered = encyclopediaData.filter((item) => {
    if (activeType === 'all') return true
    return item.type === activeType
  })

  const currentThreshold = entryThresholds.find((t) => t.role === selectedRole)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">职业百科</h1>
        <p className="text-gray-500 mt-2">真实工作流视频、从业者访谈音频、入行门槛阶梯图</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部', icon: Filter },
                { key: 'workflow', label: '工作流视频', icon: Play },
                { key: 'interview', label: '从业访谈', icon: Headphones },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveType(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                      {item.type === 'workflow' ? (
                        <Play className="w-6 h-6 text-primary-600 ml-0.5" />
                      ) : (
                        <Headphones className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.duration}
                  </div>
                  <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded font-medium ${
                    item.type === 'workflow' ? 'bg-primary-500 text-white' : 'bg-accent-500 text-white'
                  }`}>
                    {item.type === 'workflow' ? '工作流' : '访谈'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="bg-gray-100 px-2 py-1 rounded">{item.jobRole}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views.toLocaleString()} 次观看</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-8">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              入行门槛阶梯图
            </h3>

            <div className="mb-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm font-medium focus:ring-2 focus:ring-primary-300"
              >
                {entryThresholds.map((t) => (
                  <option key={t.role} value={t.role}>{t.role}</option>
                ))}
              </select>
            </div>

            {currentThreshold && (
              <div className="space-y-4">
                {currentThreshold.levels.map((level, idx) => (
                  <div key={level.label} className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        idx === 0 ? 'bg-accent-500' : idx === 1 ? 'bg-warn-500' : 'bg-primary-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 text-sm">{level.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{level.timeInvestment}</span>
                      </div>
                    </div>
                    <div className="ml-11">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-500">难度</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`w-4 h-2 rounded-full ${i <= level.difficulty ? 'bg-primary-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 leading-relaxed">{level.requirements}</p>
                      </div>
                    </div>
                    {idx < currentThreshold.levels.length - 1 && (
                      <div className="ml-3.5 w-0.5 h-4 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <h4 className="text-sm font-semibold text-primary-700 mb-2">入行小贴士</h4>
              <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
                <li>• 优先掌握核心技能，再逐步拓展加分项</li>
                <li>• 项目经验往往比证书更有说服力</li>
                <li>• 加入相关社区，积累行业人脉</li>
                <li>• 定期复盘，调整学习路线</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
