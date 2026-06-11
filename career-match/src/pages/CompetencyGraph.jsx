import { useState } from 'react'
import { competencyModels } from '../data/mockData'
import { ChevronRight, Award, TrendingUp, Star, CheckCircle, Lock } from 'lucide-react'

export default function CompetencyGraph() {
  const [selectedModel, setSelectedModel] = useState(competencyModels[0])
  const [activeTab, setActiveTab] = useState('hardSkills')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">职业能力图谱</h1>
        <p className="text-gray-500 mt-2">覆盖300+岗位的胜任力模型，含硬技能树、软技能维度、行业认证要求与典型晋升路径</p>
      </div>

      <div className="flex gap-6">
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">岗位列表</h3>
            </div>
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
              {competencyModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-3 ${
                    selectedModel.id === model.id
                      ? 'bg-primary-50 border-l-primary-600 text-primary-700'
                      : 'border-l-transparent hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{model.title}</div>
                    <div className="text-xs text-gray-400">{model.category}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedModel.title}</h2>
                <p className="text-sm text-gray-400">{selectedModel.category}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {[
                { key: 'hardSkills', label: '硬技能树' },
                { key: 'softSkills', label: '软技能维度' },
                { key: 'certifications', label: '行业认证' },
                { key: 'promotionPath', label: '晋升路径' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'hardSkills' && (
              <div className="space-y-3">
                {selectedModel.hardSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center gap-4 group">
                    <div className="w-44 shrink-0 flex items-center gap-2">
                      {skill.required ? (
                        <CheckCircle className="w-4 h-4 text-accent-500 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                      <span className={`text-sm ${skill.required ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {skill.name}
                      </span>
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-8 text-right">L{skill.level}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-accent-500" /> 必需技能
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-300" /> 加分技能
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'softSkills' && (
              <div className="space-y-4">
                {selectedModel.softSkills.map((skill) => (
                  <div key={skill.name} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{skill.name}</span>
                      <span className="text-sm text-primary-600 font-semibold">权重 {skill.weight}/5</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i <= skill.weight ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'certifications' && (
              <div className="grid grid-cols-2 gap-4">
                {selectedModel.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-3 bg-warn-50 border border-warn-100 rounded-xl p-4">
                    <Award className="w-6 h-6 text-warn-500 shrink-0" />
                    <span className="font-medium text-gray-800 text-sm">{cert}</span>
                  </div>
                ))}
                {selectedModel.certifications.length === 0 && (
                  <p className="text-gray-400 col-span-2 text-center py-8">该岗位暂无推荐认证</p>
                )}
              </div>
            )}

            {activeTab === 'promotionPath' && (
              <div className="relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-primary-200" />
                <div className="space-y-6">
                  {selectedModel.promotionPath.map((step, idx) => (
                    <div key={step.level} className="flex items-start gap-5 relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        idx === 0 ? 'bg-accent-500 text-white' : 'bg-primary-100 text-primary-600'
                      }`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl p-4 flex-1 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900">{step.level}</h4>
                          <span className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full">
                            {step.years}年经验
                          </span>
                        </div>
                        <p className="text-accent-600 font-semibold text-sm">{step.salary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
