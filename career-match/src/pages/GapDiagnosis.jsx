import { useState } from 'react'
import { competencyModels, currentUserProfile } from '../data/mockData'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, BookOpen } from 'lucide-react'

export default function GapDiagnosis() {
  const [targetRole, setTargetRole] = useState(currentUserProfile.targetRole)
  const selectedModel = competencyModels.find((m) => m.title === targetRole) || competencyModels[0]

  const hardSkillGap = selectedModel.hardSkills.map((skill) => {
    const current = currentUserProfile.skills[skill.name] || 0
    return {
      name: skill.name.length > 8 ? skill.name.slice(0, 8) + '…' : skill.name,
      fullName: skill.name,
      current,
      required: skill.level,
      gap: Math.max(0, skill.level - current),
    }
  })

  const softSkillGap = selectedModel.softSkills.map((skill) => {
    const current = currentUserProfile.softSkills[skill.name] || 0
    return {
      name: skill.name,
      current,
      required: skill.weight,
      gap: Math.max(0, skill.weight - current),
    }
  })

  const radarData = selectedModel.hardSkills.map((skill) => ({
    name: skill.name.length > 6 ? skill.name.slice(0, 6) + '…' : skill.name,
    当前水平: currentUserProfile.skills[skill.name] || 0,
    目标要求: skill.level,
  }))

  const totalGap = hardSkillGap.reduce((s, sk) => s + sk.gap, 0) + softSkillGap.reduce((s, sk) => s + sk.gap, 0)
  const totalRequired = hardSkillGap.reduce((s, sk) => s + sk.required, 0) + softSkillGap.reduce((s, sk) => s + sk.required, 0)
  const overallScore = Math.round(((totalRequired - totalGap) / totalRequired) * 100)

  const criticalGaps = hardSkillGap.filter((s) => s.gap >= 2).sort((a, b) => b.gap - a.gap)

  const suggestions = criticalGaps.map((gap) => {
    const tips = {
      '性能优化': '阅读《高性能网站建设指南》，参与Lighthouse评分优化项目',
      '单元测试(Jest/Cypress)': '系统学习Jest+Testing Library，目标：为现有项目补充测试覆盖率达到80%',
      'Web 安全(XSS/CSRF)': '完成OWASP Top 10安全培训，在项目中实践CSP、SameSite等防护策略',
      'Webpack/Vite 构建工具': '深入理解构建工具原理，尝试手写简易bundler，优化项目构建速度',
      'Node.js': '通过Express/Koa构建完整后端服务，理解Event Loop和流机制',
    }
    return {
      skill: gap.fullName,
      gap: gap.gap,
      timeline: gap.gap >= 3 ? '3-6个月' : gap.gap >= 2 ? '1-3个月' : '2-4周',
      tip: tips[gap.fullName] || `制定${gap.fullName}专项提升计划，通过实战项目巩固`,
    }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">能力差距诊断</h1>
        <p className="text-gray-500 mt-2">输入你的职业目标，自动生成能力差距报告，精准定位提升方向</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">当前职位：</span>
            <span className="font-medium text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
              {currentUserProfile.currentRole}
            </span>
          </div>
          <ArrowUpRight className="w-5 h-5 text-primary-400" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">目标职位：</span>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="font-medium text-primary-700 bg-primary-50 px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-primary-300"
            >
              {competencyModels.map((m) => (
                <option key={m.id} value={m.title}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">综合匹配度</span>
            <span className={`text-3xl font-bold ${overallScore >= 75 ? 'text-accent-500' : overallScore >= 50 ? 'text-warn-500' : 'text-danger-500'}`}>
              {overallScore}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">硬技能雷达图</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar name="目标要求" dataKey="目标要求" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="当前水平" dataKey="当前水平" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary-500 rounded" /> 目标要求</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent-500 rounded" /> 当前水平</div>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">硬技能差距详情</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hardSkillGap} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(value, name) => [value, name === 'current' ? '当前水平' : '目标要求']}
                labelFormatter={(label) => hardSkillGap.find(s => s.name === label)?.fullName || label}
              />
              <Bar dataKey="current" name="当前水平" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="required" name="目标要求" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">关键差距项</h3>
          {criticalGaps.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-accent-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">恭喜！你的硬技能已满足目标岗位要求</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalGaps.map((gap) => (
                <div key={gap.fullName} className="flex items-center gap-4 bg-danger-50 border border-danger-100 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-danger-500 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{gap.fullName}</span>
                      <span className="text-danger-600 font-bold text-sm">差距 {gap.gap} 级</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">当前 L{gap.current}</span>
                      <ArrowUpRight className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-primary-600">目标 L{gap.required}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="font-semibold text-gray-700 mt-6 mb-4">软技能评估</h3>
          <div className="space-y-3">
            {softSkillGap.map((skill) => (
              <div key={skill.name} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-28 shrink-0">{skill.name}</span>
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-3 flex-1 rounded-full ${
                        i <= skill.current ? 'bg-accent-500' : i <= skill.required ? 'bg-primary-200' : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-semibold w-14 text-right ${skill.gap > 0 ? 'text-warn-600' : 'text-accent-600'}`}>
                  {skill.gap > 0 ? `+${skill.gap} 待提升` : '已达标'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            提升建议与行动路线
          </h3>
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-accent-500 mx-auto mb-3" />
              <p className="text-gray-600">继续保持，向更高目标迈进！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((s, idx) => (
                <div key={s.skill} className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{s.skill}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.gap >= 3 ? 'bg-danger-50 text-danger-600' : 'bg-warn-50 text-warn-600'
                    }`}>
                      差距 {s.gap} 级
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 pl-9">{s.tip}</p>
                  <div className="flex items-center gap-2 pl-9 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>预计提升周期：{s.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-primary-50 rounded-xl">
            <h4 className="font-semibold text-primary-700 text-sm mb-2">认证建议</h4>
            <div className="flex flex-wrap gap-2">
              {selectedModel.certifications.map((cert) => (
                <span key={cert} className="text-xs bg-white text-primary-600 px-3 py-1.5 rounded-lg border border-primary-200">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
