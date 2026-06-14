import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FolderOpen,
  ArrowRight,
  Layers,
  Sparkles,
  GitBranch,
  GitMerge,
  Workflow,
  Zap,
  FileCheck,
  Users,
  CheckCircle2,
  Circle,
  Play,
} from 'lucide-react'
import { serviceItems, jointServices, jointFlows } from '@/data'
import { cn } from '@/lib/utils'

function findMatchingFlow(serviceName: string) {
  return jointFlows.find((flow) => {
    const shortName = flow.name.replace('联合流程', '').replace('一窗通', '')
    return serviceName.includes(shortName) || shortName.includes(serviceName.replace('一窗通', '').replace('一件事', ''))
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-gov-green text-white border-gov-green'
    case 'running':
      return 'bg-gov-blue text-white border-gov-blue'
    case 'pending':
      return 'bg-gray-100 text-gray-500 border-gray-300'
    case 'error':
      return 'bg-gov-red text-white border-gov-red'
    default:
      return 'bg-gray-100 text-gray-500 border-gray-300'
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-gov-green/10 border-gov-green/30'
    case 'running':
      return 'bg-gov-blue/10 border-gov-blue/30'
    case 'pending':
      return 'bg-gray-50 border-gray-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

function FlowVisualization({ flowName }: { flowName: string }) {
  const flow = findMatchingFlow(flowName)

  if (!flow) return null

  const parallelGroups = useMemo(() => {
    const groups: { nodes: typeof flow.nodes; startId: string }[] = []
    const used = new Set<string>()

    flow.nodes.forEach((node) => {
      if (used.has(node.id)) return
      if (node.parallel) {
        const groupNodes = flow.nodes.filter(
          (n) =>
            n.parallel &&
            n.dependsOn.length === node.dependsOn.length &&
            n.dependsOn.every((d) => node.dependsOn.includes(d))
        )
        if (groupNodes.length > 1) {
          groupNodes.forEach((n) => used.add(n.id))
          groups.push({ nodes: groupNodes, startId: node.dependsOn[0] })
        }
      }
    })

    return groups
  }, [flow])

  const isInParallelGroup = (nodeId: string) => {
    return parallelGroups.some((g) => g.nodes.some((n) => n.id === nodeId))
  }

  const renderNode = (node: typeof flow.nodes[0]) => (
    <div key={node.id} className="flex flex-col items-center">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-medium transition-all',
          getStatusColor(node.status)
        )}
      >
        {node.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : node.status === 'running' ? (
          <Play className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-medium text-gray-700 max-w-20">{node.name}</div>
        <div className="text-[10px] text-gray-400">{node.duration}</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="flex items-center gap-2 text-sm font-medium text-gov-navy">
          <Workflow className="h-4 w-4 text-gov-blue" />
          流程编排
        </h5>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-gov-green"></span>
            已完成
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-gov-blue"></span>
            进行中
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
            待办理
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-max">
          {flow.nodes.map((node, idx) => {
            if (isInParallelGroup(node.id)) {
              const group = parallelGroups.find((g) => g.nodes.some((n) => n.id === node.id))
              if (group && group.nodes[0].id !== node.id) return null

              return (
                <div key={node.id} className="flex items-center gap-2">
                  {idx > 0 && !isInParallelGroup(flow.nodes[idx - 1].id) && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                  <div className="relative">
                    <div
                      className={cn(
                        'rounded-lg border-2 p-3',
                        getStatusBg(group!.nodes[0].status)
                      )}
                    >
                      <div className="mb-2 text-center">
                        <span className="gov-badge gov-badge-blue text-[10px]">
                          <GitBranch className="mr-1 h-3 w-3" />
                          并行办理
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        {group!.nodes.map((n) => renderNode(n))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            const prevNode = flow.nodes[idx - 1]
            const prevInGroup = prevNode && isInParallelGroup(prevNode.id)

            return (
              <div key={node.id} className="flex items-center gap-2">
                {(idx > 0 || prevInGroup) && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                )}
                {renderNode(node)}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
        <span className="text-gray-500">
          总时限: <span className="font-medium text-gov-navy">{flow.totalTime}</span>
        </span>
        <span className="text-gray-500">
          并行节省: <span className="font-medium text-gov-green">{flow.parallelTime}</span>
        </span>
        <span className="flex items-center gap-1 text-gov-gold">
          <Zap className="h-3.5 w-3.5" />
          效率提升显著
        </span>
      </div>
    </div>
  )
}

function UnifiedFormSection({ js }: { js: (typeof jointServices)[0] }) {
  const subServices = js.serviceItems
    .map((sid) => serviceItems.find((s) => s.id === sid))
    .filter(Boolean)

  const allFields = subServices.flatMap((s) => s!.formFields || [])
  const uniqueFieldNames = [...new Set(allFields.map((f) => f.name))]
  const autoFillFields = allFields.filter((f) => f.autoFillSource)
  const uniqueAutoFill = [...new Set(autoFillFields.map((f) => f.name))]

  const sharedFields = uniqueFieldNames.filter((name) => {
    const count = allFields.filter((f) => f.name === name).length
    return count > 1
  })

  const totalFields = allFields.length
  const reducedFields = uniqueFieldNames.length

  if (subServices.length === 0) return null

  return (
    <div className="rounded-lg border border-gov-blue/20 bg-gov-blue/5 p-4">
      <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-gov-blue">
        <FileCheck className="h-4 w-4" />
        一表申请
      </h5>
      <p className="mb-3 text-xs text-gray-600">
        所有服务共享一张申请表单，自动填充重复信息，减少重复填写
      </p>

      <div className="mb-3 flex items-center gap-4 text-xs">
        <div>
          <span className="text-gray-500">原需填写:</span>
          <span className="ml-1 font-medium text-gray-400 line-through">{totalFields}项</span>
        </div>
        <div>
          <span className="text-gray-500">实际填写:</span>
          <span className="ml-1 font-bold text-gov-green">{reducedFields}项</span>
        </div>
        <div>
          <span className="text-gray-500">减少:</span>
          <span className="ml-1 font-bold text-gov-gold">
            {totalFields > 0 ? Math.round(((totalFields - reducedFields) / totalFields) * 100) : 0}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">共享字段（自动填充）:</div>
        <div className="flex flex-wrap gap-1.5">
          {sharedFields.length > 0 ? (
            sharedFields.slice(0, 8).map((name) => {
              const field = allFields.find((f) => f.name === name)
              const isAutoFill = uniqueAutoFill.includes(name)
              return (
                <span
                  key={name}
                  className={cn(
                    'gov-badge text-[10px]',
                    isAutoFill
                      ? 'border-gov-gold/30 bg-gov-gold/10 text-gov-gold'
                      : 'gov-badge-blue'
                  )}
                >
                  {isAutoFill && <Sparkles className="mr-1 h-3 w-3" />}
                  {field?.label || name}
                </span>
              )
            })
          ) : (
            <span className="text-xs text-gray-400">暂无共享字段</span>
          )}
        </div>
      </div>
    </div>
  )
}

function MaterialReuseSection({ js }: { js: (typeof jointServices)[0] }) {
  const subServices = js.serviceItems
    .map((sid) => serviceItems.find((s) => s.id === sid))
    .filter(Boolean)

  const allMaterials = subServices.flatMap((s) => s!.materials)
  const uniqueMaterials = [...new Set(allMaterials.map((m) => m.name))]
  const totalCount = allMaterials.length
  const uniqueCount = uniqueMaterials.length
  const savingsPercent = totalCount > 0 ? Math.round(((totalCount - uniqueCount) / totalCount) * 100) : 0

  if (subServices.length === 0) return null

  return (
    <div className="rounded-lg border border-gov-gold/20 bg-gov-gold/5 p-4">
      <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-gov-gold">
        <Layers className="h-4 w-4" />
        材料复用分析
      </h5>

      <div className="mb-3 flex items-end justify-center gap-8">
        <div className="flex flex-col items-center">
          <div
            className="mb-1 flex w-16 items-end justify-center rounded-t-md bg-gray-300"
            style={{ height: `${Math.max(40, (totalCount / Math.max(totalCount, uniqueCount)) * 80)}px` }}
          >
            <span className="pb-1 text-xs font-bold text-white">{totalCount}</span>
          </div>
          <span className="text-xs text-gray-500">累计材料</span>
        </div>
        <div className="flex flex-col items-center">
          <div
            className="mb-1 flex w-16 items-end justify-center rounded-t-md bg-gov-gold"
            style={{ height: `${Math.max(40, (uniqueCount / Math.max(totalCount, uniqueCount)) * 80)}px` }}
          >
            <span className="pb-1 text-xs font-bold text-white">{uniqueCount}</span>
          </div>
          <span className="text-xs text-gray-500">实际提交</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-2xl font-bold text-gov-gold">{savingsPercent}%</span>
        <span className="ml-1 text-xs text-gray-500">材料精简率</span>
      </div>
    </div>
  )
}

function JointServiceCard({
  js,
  isActive,
  onSelect,
}: {
  js: (typeof jointServices)[0]
  isActive: boolean
  onSelect: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const subServices = js.serviceItems
    .map((sid) => serviceItems.find((s) => s.id === sid))
    .filter(Boolean)

  const allMaterials = subServices.flatMap((s) => s!.materials)
  const sharedMaterialNames = allMaterials
    .filter(
      (m, i, arr) =>
        arr.findIndex((other) => other.name === m.name) !== i
    )
    .map((m) => m.name)
  const uniqueShared = [...new Set(sharedMaterialNames)]

  const flow = findMatchingFlow(js.name)
  const totalNodes = flow?.nodes.length || 0
  const completedNodes = flow?.nodes.filter((n) => n.status === 'completed').length || 0
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0

  return (
    <div className={cn('gov-card overflow-hidden', isActive && 'ring-2 ring-gov-gold')}>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-serif text-xl font-semibold text-gov-navy">{js.name}</h3>
          <span className="ml-3 shrink-0 rounded-md bg-gov-gold/10 px-3 py-1 text-sm font-bold text-gov-gold">
            材料精简 {js.savingsPercent}%
          </span>
        </div>
        <p className="mb-4 text-sm text-gray-500">{js.description}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {js.departments.map((dept) => (
            <span key={dept} className="gov-badge gov-badge-blue">
              {dept.replace('深圳市', '')}
            </span>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            联办时限: <span className="font-medium text-gov-navy">{js.totalTimeLimit}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" />
            关联事项: <span className="font-medium text-gov-navy">{js.serviceItems.length}项</span>
          </span>
        </div>

        {flow && (
          <div className="mb-4 border-t border-gray-100 pt-4">
            <FlowVisualization flowName={js.name} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onSelect}
            className={cn(isActive ? 'gov-btn-gold' : 'gov-btn-primary')}
          >
            {isActive ? '正在配置' : '开始联办'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-gov-blue hover:underline"
          >
            {expanded ? '收起详情' : '查看详情'}
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          {subServices.length > 0 ? (
            <div className="space-y-6">
              {subServices.map((svc) => (
                <div key={svc!.id} className="rounded-lg border border-gray-100 bg-white p-4">
                  <h4 className="mb-3 font-medium text-gray-900">
                    {svc!.name}
                    <span className="ml-2 text-xs text-gray-400">{svc!.department}</span>
                  </h4>
                  <div className="flex items-start gap-2 overflow-x-auto pb-2">
                    {svc!.processSteps.map((step, idx) => (
                      <div key={step.id} className="flex items-start shrink-0">
                        <div className="flex flex-col items-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gov-blue text-white text-xs font-bold">
                            {step.order}
                          </div>
                          <div className="mt-1 text-center">
                            <div className="text-xs font-medium text-gray-700">
                              {step.name}
                            </div>
                            <div className="text-[10px] text-gray-400">{step.duration}</div>
                          </div>
                        </div>
                        {idx < svc!.processSteps.length - 1 && (
                          <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {svc!.materials.map((mat) => {
                      const isShared = uniqueShared.includes(mat.name)
                      return (
                        <span
                          key={mat.id}
                          className={cn(
                            'gov-badge text-[10px]',
                            isShared
                              ? 'border-gov-gold/30 bg-gov-gold/10 text-gov-gold'
                              : 'gov-badge-blue'
                          )}
                        >
                          {isShared && <Sparkles className="mr-1 h-3 w-3" />}
                          {mat.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UnifiedFormSection js={js} />
                <MaterialReuseSection js={js} />
              </div>

              <div className="rounded-lg border border-gov-gold/20 bg-gov-gold/5 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-medium text-gov-gold">
                  <Layers className="h-4 w-4" />
                  联办时序对比
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">串行办理</div>
                    <div className="flex items-center gap-1">
                      {subServices.map((svc, i) => (
                        <div key={svc!.id} className="flex items-center gap-1">
                          <div className="rounded bg-gray-300 px-3 py-1 text-xs text-gray-600">
                            {svc!.name.slice(0, 4)}
                          </div>
                          {i < subServices.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      ))}
                      <span className="ml-2 text-xs text-gray-500">需分别办理</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">联办办理</div>
                    <div className="flex items-center gap-1">
                      <div className="rounded bg-gov-blue/20 px-3 py-1 text-xs font-medium text-gov-blue">
                        一次提交
                      </div>
                      <ArrowRight className="h-3 w-3 text-gov-blue" />
                      <div className="rounded bg-gov-green/20 px-3 py-1 text-xs font-medium text-gov-green">
                        并行审批
                      </div>
                      <ArrowRight className="h-3 w-3 text-gov-green" />
                      <div className="rounded bg-gov-gold/20 px-3 py-1 text-xs font-medium text-gov-gold">
                        统一出证
                      </div>
                    </div>
                  </div>
                  {uniqueShared.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-gov-gold" />
                      <span className="text-gray-600">共享材料:</span>
                      {uniqueShared.map((name) => (
                        <span
                          key={name}
                          className="rounded-md border border-gov-gold/30 bg-gov-gold/10 px-2 py-0.5 font-medium text-gov-gold"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-white p-6 text-center text-sm text-gray-400">
              该联办套餐的子事项详情暂未关联
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function JointService() {
  const navigate = useNavigate()
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)

  const avgSavings = useMemo(() => {
    if (jointServices.length === 0) return 0
    const total = jointServices.reduce((sum, js) => sum + js.savingsPercent, 0)
    return Math.round(total / jointServices.length)
  }, [])

  const avgTimeSaving = useMemo(() => {
    return 60
  }, [])

  const activeService = jointServices.find((js) => js.id === activeServiceId)
  const activeFlow = activeService ? findMatchingFlow(activeService.name) : null
  const totalNodes = activeFlow?.nodes.length || 0
  const completedNodes = activeFlow?.nodes.filter((n) => n.status === 'completed').length || 0
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0

  const handleStart = () => {
    if (activeServiceId) {
      setActiveServiceId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title text-xl">联办编排中心</h2>
        <button
          onClick={() => navigate('/services')}
          className="text-sm text-gov-blue hover:underline"
        >
          ← 返回政务服务
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="gov-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gov-navy/10">
              <GitMerge className="h-6 w-6 text-gov-navy" />
            </div>
            <div>
              <div className="text-sm text-gray-500">联办套餐数</div>
              <div className="gov-stat-number text-gov-navy">{jointServices.length}</div>
            </div>
          </div>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gov-gold/10">
              <Sparkles className="h-6 w-6 text-gov-gold" />
            </div>
            <div>
              <div className="text-sm text-gray-500">平均材料精简率</div>
              <div className="gov-stat-number text-gov-gold">{avgSavings}%</div>
            </div>
          </div>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gov-green/10">
              <Clock className="h-6 w-6 text-gov-green" />
            </div>
            <div>
              <div className="text-sm text-gray-500">平均时限压缩率</div>
              <div className="gov-stat-number text-gov-green">{avgTimeSaving}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {jointServices.map((js) => (
          <JointServiceCard
            key={js.id}
            js={js}
            isActive={activeServiceId === js.id}
            onSelect={() => setActiveServiceId(activeServiceId === js.id ? null : js.id)}
          />
        ))}
      </div>

      {activeService && (
        <div className="sticky bottom-4 z-10 gov-card p-5 border-gov-gold/50">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="font-serif font-semibold text-gov-navy">{activeService.name}</h4>
                <span className="gov-badge gov-badge-blue text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {activeService.departments.length}个部门联办
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gov-gold transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  已完成 <span className="font-bold text-gov-gold">{progressPercent}%</span> / 共 {totalNodes} 个环节
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="gov-btn-secondary">查看办事指南</button>
              <button onClick={handleStart} className="gov-btn-gold text-lg px-8 py-3">
                {progressPercent > 0 ? '继续办理' : '立即开始联办'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
