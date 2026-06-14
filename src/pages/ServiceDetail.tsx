import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight,
  FileText,
  Info,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileCheck,
  Building2,
  Star,
  ArrowLeft,
  Zap,
  Layers,
  Play,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { serviceItems, certificates } from '@/data'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const workflowSteps = [
  { key: 'guide', label: '办事指南', icon: FileText, step: 1 },
  { key: 'precheck', label: '材料预检', icon: CheckCircle, step: 2 },
  { key: 'fill', label: '自动填充', icon: Zap, step: 3 },
  { key: 'joint', label: '联办服务', icon: Layers, step: 4 },
]

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setActiveServiceWorkflow, activeServiceWorkflowId, workflowStepStatus } = useStore()

  const service = serviceItems.find((item) => item.id === id)

  const handleStartWorkflow = () => {
    if (id) {
      setActiveServiceWorkflow(id)
      navigate('/services')
    }
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-gray-500">未找到该服务事项</p>
        <Link to="/services" className="text-gov-blue hover:underline">
          返回政务服务
        </Link>
      </div>
    )
  }

  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      'sc_1_1': '户籍登记',
      'sc_1_2': '居住证办理',
      'sc_1_3': '身份证明',
      'sc_2_1': '社保参保',
      'sc_2_2': '社保转移',
      'sc_2_3': '医保服务',
      'sc_3_1': '公积金业务',
      'sc_3_2': '不动产登记',
      'sc_3_3': '保障性住房',
      'sc_4_1': '企业注册',
      'sc_4_2': '资质许可',
      'sc_4_3': '变更注销',
      'sc_5_1': '驾驶证业务',
      'sc_5_2': '车辆登记',
      'sc_5_3': '违章处理',
    }
    return categories[categoryId] || '其他'
  }

  const getCertName = (certId: string) => {
    const cert = certificates.find((c) => c.id === certId)
    return cert ? cert.name : ''
  }

  const standardFields = [
    { label: '事项编码', value: service.guangdongStandard.itemCode, icon: Info },
    { label: '实施编码', value: service.guangdongStandard.implementCode, icon: FileText },
    { label: '办件类型', value: service.guangdongStandard.serviceType, icon: FileCheck },
    { label: '权力来源', value: service.guangdongStandard.powerSource, icon: Shield },
    { label: '法定依据', value: service.guangdongStandard.legalBasis, icon: FileText },
    { label: '实施主体', value: service.guangdongStandard.handlingDepartment, icon: Building2 },
    { label: '办理机构', value: service.guangdongStandard.undertakingInstitution, icon: Building2 },
    { label: '咨询电话', value: service.guangdongStandard.consultationPhone, icon: Phone },
    { label: '投诉电话', value: service.guangdongStandard.complaintPhone, icon: Phone },
    { label: '办理方式', value: service.guangdongStandard.handlingMethod, icon: FileCheck },
    { label: '办件数量限制', value: service.guangdongStandard.quantityLimit, icon: Info },
    { label: '审批等级', value: service.guangdongStandard.approvalLevel, icon: Shield },
    { label: '结果类型', value: service.guangdongStandard.resultType, icon: FileText },
  ]

  const materialStatusIcon = (status: string) => {
    if (status === 'auto_filled')
      return <CheckCircle className="h-5 w-5 text-gov-green" />
    if (status === 'provided')
      return <CheckCircle className="h-5 w-5 text-gov-blue" />
    if (status === 'missing') return <XCircle className="h-5 w-5 text-gov-red" />
    return <AlertTriangle className="h-5 w-5 text-amber-500" />
  }

  const materialStatusText = (status: string) => {
    if (status === 'auto_filled') return '电子证照自动填充'
    if (status === 'provided') return '已提供'
    if (status === 'missing') return '缺失'
    return ''
  }

  const materialTypeText = (type: string) => {
    if (type === 'required') return '必需'
    if (type === 'conditional') return '条件提供'
    if (type === 'optional') return '可选'
    return ''
  }

  return (
    <div className="space-y-6 pb-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/services" className="hover:text-gov-blue">
          政务服务
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/services" className="hover:text-gov-blue">
          {getCategoryName(service.category)}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-800">{service.name}</span>
      </nav>

      <div className="gov-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gov-navy font-serif">
                {service.name}
              </h1>
              <span className="gov-badge gov-badge-blue">
                {service.guangdongStandard.serviceType}
              </span>
              {service.onlineRate >= 80 && (
                <span className="gov-badge gov-badge-green">
                  在线办理
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{service.department}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gov-blue"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">办理流程</h3>
            <span className="text-xs text-gray-500">共 4 个步骤</span>
          </div>
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              const status = activeServiceWorkflowId === id ? workflowStepStatus[step.key as keyof typeof workflowStepStatus] : 'pending'
              const isActive = status === 'current'
              const isCompleted = status === 'completed'

              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  <div className="relative flex items-center w-full">
                    <div className="flex flex-col items-center relative z-10">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                        isCompleted
                          ? 'border-gov-green bg-gov-green text-white'
                          : isActive
                          ? 'border-gov-blue bg-gov-blue text-white animate-pulse'
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={cn(
                        'mt-2 text-xs font-medium',
                        isCompleted ? 'text-gov-green' : isActive ? 'text-gov-blue' : 'text-gray-500'
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className={cn(
                        'absolute left-1/2 right-0 top-6 h-0.5 -translate-y-1/2',
                        isCompleted ? 'bg-gov-green' : 'bg-gray-200'
                      )} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-6">广东省政务服务标准信息</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {standardFields.map((field, index) => {
            const Icon = field.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gov-blue/10 text-gov-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">{field.label}</div>
                  <div className="mt-1 truncate text-sm font-medium text-gray-800" title={field.value}>
                    {field.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-6">办理流程</h3>
        <div className="flex items-start overflow-x-auto pb-4">
          {service.processSteps.map((step, index) => (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0
                      ? 'bg-gov-blue text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.order}
                </div>
                <div className="mt-3 w-24 text-center sm:w-28 lg:w-32">
                  <div className="text-sm font-medium text-gray-800">{step.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{step.duration}</div>
                </div>
              </div>
              {index < service.processSteps.length - 1 && (
                <div
                  className={`mt-6 h-0.5 w-12 sm:w-16 lg:w-20 ${
                    index === 0 ? 'bg-gov-blue/30' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">材料清单</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">序号</th>
                <th className="px-4 py-3 font-medium">材料名称</th>
                <th className="px-4 py-3 font-medium">材料类型</th>
                <th className="px-4 py-3 font-medium">形式要求</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">来源说明</th>
              </tr>
            </thead>
            <tbody>
              {service.materials.map((mat, index) => (
                <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{mat.name}</span>
                      {mat.certLinked && (
                        <span className="gov-badge gov-badge-green text-[10px]">
                          关联证照：{getCertName(mat.certLinked)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`gov-badge ${
                        mat.type === 'required'
                          ? 'gov-badge-red'
                          : mat.type === 'conditional'
                          ? 'gov-badge-yellow'
                          : 'gov-badge-blue'
                      }`}
                    >
                      {materialTypeText(mat.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{mat.format}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {materialStatusIcon(mat.status)}
                      <span
                        className={`${
                          mat.status === 'auto_filled'
                            ? 'text-gov-green'
                            : mat.status === 'provided'
                            ? 'text-gov-blue'
                            : 'text-gov-red'
                        }`}
                      >
                        {materialStatusText(mat.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {mat.status === 'auto_filled' && mat.certLinked
                      ? `来自${getCertName(mat.certLinked)}`
                      : mat.status === 'provided'
                      ? '申请人提交'
                      : '需申请人提供'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-6">表单预览</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {service.formFields.map((field) => {
            const isAutoFill = !!field.autoFillSource
            const certName = field.autoFillSource
              ? getCertName(field.autoFillSource)
              : ''
            return (
              <div
                key={field.name}
                className={`rounded-md border p-4 ${
                  isAutoFill
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="ml-1 text-gov-red">*</span>}
                  </label>
                  {isAutoFill && (
                    <span className="gov-badge gov-badge-green text-[10px]">
                      自动填充
                    </span>
                  )}
                </div>
                <div
                  className={`h-10 rounded-md border px-3 text-sm ${
                    isAutoFill
                      ? 'border-gray-200 bg-gray-100 text-gray-500'
                      : 'border-gray-300 bg-white text-gray-400'
                  } flex items-center`}
                >
                  {isAutoFill ? (
                    <span className="truncate">{field.placeholder || '自动填充'}</span>
                  ) : (
                    <span className="text-gray-400">{field.placeholder || '请输入'}</span>
                  )}
                </div>
                {isAutoFill && certName && (
                  <div className="mt-2 text-xs text-gray-500">
                    来源：{certName}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-6 rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-gov-green shrink-0" />
            <p className="text-sm text-green-800">
              表单将自动填充以上 {service.formFields.filter((f) => !!f.autoFillSource).length} 项字段
            </p>
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-6">办理地点与时间</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gov-blue/10 text-gov-blue">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">办理地点</div>
                <div className="mt-1 text-sm text-gray-600">
                  {service.guangdongStandard.windowAddress}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gov-blue/10 text-gov-blue">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">办公时间</div>
                <div className="mt-1 text-sm text-gray-600">
                  周一至周五 9:00-12:00，14:00-17:30
                </div>
                <div className="text-sm text-gray-600">
                  （法定节假日除外）
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gov-blue/10 text-gov-blue">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">咨询电话</div>
                <div className="mt-1 text-sm text-gray-600">
                  {service.guangdongStandard.consultationPhone}
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100">
            <div className="text-center text-gray-400">
              <MapPin className="mx-auto mb-2 h-8 w-8" />
              <div className="text-sm">地图位置</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 -mb-8 bg-white/95 px-6 py-4 backdrop-blur-sm border-t border-gray-100">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleStartWorkflow}
            className="gov-btn-gold px-10 py-3 text-base flex items-center gap-2"
          >
            <Play className="h-5 w-5" />
            开始办理
          </button>
          <button
            onClick={handleStartWorkflow}
            className="gov-btn-primary px-8 py-3 text-base flex items-center gap-2"
          >
            <Zap className="h-5 w-5" />
            一键预检
          </button>
          <button className="flex items-center gap-2 border border-gray-300 bg-white px-6 py-3 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <Star className="h-5 w-5" />
            收藏
          </button>
        </div>
      </div>
    </div>
  )
}
