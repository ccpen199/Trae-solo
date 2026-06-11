import { useState } from 'react'
import { hrTalentPool, demandAlerts } from '../data/mockData'
import { UserCheck, Clock, Bell, TrendingUp, AlertTriangle, ArrowUpRight, Calendar, Tag, MessageSquare, Star, Search, Filter } from 'lucide-react'

function PotentialBadge({ level }) {
  const styles = {
    high: 'bg-accent-50 text-accent-700 border-accent-200',
    medium: 'bg-warn-50 text-warn-700 border-warn-200',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const labels = { high: '高潜力', medium: '中潜力', low: '待观察' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function AlertCard({ alert }) {
  const severityStyles = {
    high: 'border-l-danger-500 bg-danger-50',
    medium: 'border-l-warn-500 bg-warn-50',
    low: 'border-l-primary-500 bg-primary-50',
  }
  const typeIcons = {
    trend_up: TrendingUp,
    skill_shift: ArrowUpRight,
    market_insight: Bell,
  }
  const Icon = typeIcons[alert.type] || Bell

  return (
    <div className={`border-l-4 rounded-xl p-4 ${severityStyles[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-800 text-sm">{alert.title}</h4>
            <span className="text-xs text-gray-400">{alert.date}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">{alert.description}</p>
          <div className="flex gap-2 flex-wrap">
            {alert.affectedRoles.map((role) => (
              <span key={role} className="text-xs bg-white/60 text-gray-600 px-2 py-0.5 rounded">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TalentDetail({ talent }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary-500" /> 标签
        </h4>
        <div className="flex gap-2 flex-wrap">
          {talent.tags.map((tag) => (
            <span key={tag} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg border border-primary-100">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-warn-500" /> 跟进提醒
        </h4>
        <div className="space-y-2">
          {talent.followUpReminders.map((reminder, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-warn-50 border border-warn-100 rounded-lg p-3">
              <Calendar className="w-4 h-4 text-warn-500 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-warn-700">{reminder.date}</span>
                <p className="text-xs text-gray-600 mt-0.5">{reminder.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-500" /> 匹配历史
        </h4>
        {talent.matchHistory.length === 0 ? (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">暂无匹配记录</p>
        ) : (
          <div className="space-y-2">
            {talent.matchHistory.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="text-xs font-medium text-gray-700">{record.position}</span>
                  <span className="text-xs text-gray-400 ml-2">{record.date}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  record.status.includes('面试') ? 'bg-primary-50 text-primary-600' :
                  record.status.includes('婉拒') ? 'bg-danger-50 text-danger-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HRTools() {
  const [selectedTalent, setSelectedTalent] = useState(hrTalentPool[0])
  const [talentFilter, setTalentFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  const filteredTalents = hrTalentPool
    .filter((t) => {
      if (talentFilter === 'high') return t.potential === 'high'
      if (talentFilter === 'follow-up') return t.followUpReminders.length > 0
      return true
    })
    .filter((t) => !searchText || t.name.includes(searchText) || t.currentRole.includes(searchText) || t.skills.some((s) => s.includes(searchText)))

  const upcomingReminders = hrTalentPool
    .flatMap((t) => t.followUpReminders.map((r) => ({ ...r, talentName: t.name, talentId: t.id })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HR 人才池运营工具</h1>
        <p className="text-gray-500 mt-2">潜力人才标记、长期跟进提醒、岗位需求变化预警</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{hrTalentPool.length}</p>
                  <p className="text-xs text-gray-400">人才池总数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{hrTalentPool.filter((t) => t.potential === 'high').length}</p>
                  <p className="text-xs text-gray-400">高潜力人才</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warn-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warn-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{upcomingReminders.length}</p>
                  <p className="text-xs text-gray-400">待跟进提醒</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary-500" /> 人才池
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索人才..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg border-0 text-sm focus:ring-2 focus:ring-primary-300 w-48"
                  />
                </div>
                <div className="flex gap-1">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'high', label: '高潜力' },
                    { key: 'follow-up', label: '有待跟进' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTalentFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        talentFilter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-72 shrink-0 max-h-[480px] overflow-y-auto space-y-2">
                {filteredTalents.map((talent) => (
                  <button
                    key={talent.id}
                    onClick={() => setSelectedTalent(talent)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedTalent.id === talent.id
                        ? 'bg-primary-50 border border-primary-200 shadow-sm'
                        : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        talent.potential === 'high' ? 'bg-accent-100 text-accent-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {talent.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-800 truncate">{talent.name}</span>
                          <PotentialBadge level={talent.potential} />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{talent.currentRole} · {talent.experience}年</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex-1 border-l border-gray-100 pl-4">
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${
                    selectedTalent.potential === 'high' ? 'bg-accent-100 text-accent-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {selectedTalent.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{selectedTalent.name}</h3>
                      <PotentialBadge level={selectedTalent.potential} />
                    </div>
                    <p className="text-sm text-gray-500">{selectedTalent.currentRole} · {selectedTalent.company}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedTalent.experience}年经验 · 最近联系：{selectedTalent.lastContact}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">核心技能</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTalent.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <TalentDetail talent={selectedTalent} />

                <div className="flex gap-3 mt-5">
                  <button className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                    安排面试
                  </button>
                  <button className="flex-1 bg-accent-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-600 transition-colors">
                    添加跟进提醒
                  </button>
                  <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    导出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warn-500" /> 近期待跟进
            </h3>
            <div className="space-y-3">
              {upcomingReminders.map((reminder, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-warn-50/50 rounded-xl">
                  <div className="w-8 h-8 bg-warn-100 rounded-lg flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-warn-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{reminder.talentName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{reminder.note}</p>
                    <p className="text-xs text-warn-600 mt-1 font-medium">{reminder.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" /> 需求变化预警
            </h3>
            <div className="space-y-3">
              {demandAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
