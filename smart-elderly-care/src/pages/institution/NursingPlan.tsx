import { useState } from 'react'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight, User, Calendar, Repeat, Clock3 } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { nursingPlans as initialPlans } from '../../data/mockData'
import type { NursingPlan, NursingTask } from '../../types'

export default function NursingPlanPage() {
  const [plans, setPlans] = useState<NursingPlan[]>(initialPlans)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['NP001']))

  const activePlans = plans.filter((p) => p.status === 'active').length
  const todayPending = plans.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'pending').length, 0)
  const todayCompleted = plans.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'completed').length, 0)
  const missedTasks = plans.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'missed').length, 0)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTaskStatus = (planId: string, taskId: string) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          tasks: plan.tasks.map((task) => {
            if (task.id !== taskId) return task
            const newStatus: NursingTask['status'] = task.status === 'completed' ? 'pending' : 'completed'
            return { ...task, status: newStatus }
          }),
        }
      })
    )
  }

  const getProgress = (plan: NursingPlan) => {
    const completed = plan.tasks.filter((t) => t.status === 'completed').length
    return Math.round((completed / plan.tasks.length) * 100)
  }

  const taskStatusBadge = (status: NursingTask['status']) => {
    const config = {
      completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
      pending: { label: '待执行', color: 'bg-yellow-100 text-yellow-700' },
      missed: { label: '漏执行', color: 'bg-red-100 text-red-700' },
    }
    const c = config[status]
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">护理计划数字化执行</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="活跃方案数" value={activePlans} icon={<ClipboardList className="w-5 h-5" />} color="blue" />
        <StatCard title="今日待执行任务" value={todayPending} icon={<Clock className="w-5 h-5" />} color="orange" />
        <StatCard title="今日已完成任务" value={todayCompleted} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
        <StatCard title="漏执行任务" value={missedTasks} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const progress = getProgress(plan)
          const isExpanded = expandedIds.has(plan.id)
          const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length

          return (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div
                onClick={() => toggleExpand(plan.id)}
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{plan.planName}</h3>
                        <StatusBadge status={plan.status} type="plan" />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{plan.elderName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.startDate} ~ {plan.endDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-500">{completedTasks}/{plan.tasks.length} 任务</div>
                      <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${progress >= 80 ? 'text-green-600' : progress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="divide-y divide-slate-50">
                    {plan.tasks.map((task) => (
                      <div key={task.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-25">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleTaskStatus(plan.id, task.id)
                              }}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                task.status === 'completed'
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-slate-300 hover:border-primary-400'
                              }`}
                            >
                              {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <span className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.content}
                            </span>
                            {taskStatusBadge(task.status)}
                          </div>
                          <div className="flex items-center gap-4 ml-8 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Repeat className="w-3 h-3" />{task.frequency}</span>
                            <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{task.timeSlot}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignedTo}</span>
                          </div>
                          {task.completedDates.length > 0 && (
                            <div className="ml-8 mt-1 flex items-center gap-1">
                              {task.completedDates.map((d) => (
                                <span key={d} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                                  <CheckCircle2 className="w-3 h-3" />{d.slice(5)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleTaskStatus(plan.id, task.id)
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            task.status === 'completed'
                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              : 'bg-primary-500 text-white hover:bg-primary-600'
                          }`}
                        >
                          {task.status === 'completed' ? '撤销完成' : '标记完成'}
                        </button>
                      </div>
                    ))}
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
