import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type RiskRule, severityConfig, actionLabels } from './data'

interface RuleManagerProps {
  rules: RiskRule[]
  onToggle: (id: string) => void
}

export default function RuleManager({ rules, onToggle }: RuleManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">风控规则</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {rules.map((rule) => {
          const sev = severityConfig[rule.severity]
          const isExpanded = expandedId === rule.id
          return (
            <div key={rule.id}>
              <div className="px-5 py-3 flex items-center gap-3">
                <button
                  onClick={() => toggleExpand(rule.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{rule.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sev.color}`} style={{ backgroundColor: sev.dot === 'bg-danger' ? '#F53F3F10' : sev.dot === 'bg-warning' ? '#FF7D0010' : sev.dot === 'bg-yellow-500' ? '#EAB30810' : '#165DFF10' }}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-gray-400">{rule.code}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{actionLabels[rule.action]}</p>
                </div>
                <button
                  onClick={() => onToggle(rule.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    rule.enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      rule.enabled ? 'left-5.5 translate-x-0' : 'left-0.5'
                    }`}
                    style={{ left: rule.enabled ? '22px' : '2px' }}
                  />
                </button>
              </div>
              {isExpanded && (
                <div className="px-5 pb-3 pl-12">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">规则条件表达式</p>
                    <p className="text-sm text-gray-700 font-mono leading-relaxed">{rule.condition}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
