import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  ImagePlus,
  DollarSign,
  Calendar,
  Scissors,
  Check,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Tag from '../../components/ui/Tag'
import { getSkills } from '../../services/common.api'
import { publishLabor, PublishLaborData } from '../../services/employer.api'
import { SKILLS } from '../../constants'

interface LaborFormData {
  pricingMode: 'hourly' | 'task'
  skillIds: string[]
  workerCount: number
  startTime: string
  duration?: number
  budget: number
  description: string
  address: string
  enableSplit: boolean
  subTasks?: { title: string; count: number; budget: number }[]
}

export default function PublishLabor() {
  const navigate = useNavigate()
  const [showSplitConfig, setShowSplitConfig] = useState(false)

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LaborFormData>({
    defaultValues: {
      pricingMode: 'hourly',
      skillIds: [],
      workerCount: 1,
      startTime: '',
      duration: 4,
      budget: 200,
      description: '',
      address: '',
      enableSplit: false,
      subTasks: [{ title: '', count: 1, budget: 100 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subTasks',
  })

  const pricingMode = watch('pricingMode')
  const skillIds = watch('skillIds')
  const enableSplit = watch('enableSplit')
  const workerCount = watch('workerCount')

  const { data: skills = SKILLS } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
    initialData: SKILLS,
  })

  const marketPrice = pricingMode === 'hourly' ? 50 * workerCount * (watch('duration') || 4) : 300

  const toggleSkill = (skillId: string) => {
    const current = skillIds || []
    if (current.includes(skillId)) {
      setValue('skillIds', current.filter((id) => id !== skillId), { shouldValidate: true })
    } else {
      setValue('skillIds', [...current, skillId], { shouldValidate: true })
    }
  }

  const publishMutation = useMutation({
    mutationFn: (data: PublishLaborData) => publishLabor(data),
    onSuccess: () => {
      navigate('/orders')
    },
  })

  const onSubmit = (data: LaborFormData) => {
    publishMutation.mutate({
      title: skills.find((s) => s.id === data.skillIds[0])?.name || '用工服务',
      description: data.description,
      skillIds: data.skillIds,
      startTime: data.startTime,
      address: data.address,
      lat: 22.5431,
      lng: 114.0579,
      budget: data.budget,
      workerCount: data.workerCount,
    })
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, typeof SKILLS>)

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">发布用工</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">计价模式</h2>
          </div>
          <Controller
            name="pricingMode"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'hourly', label: '按小时', desc: '按时计费' },
                  { value: 'task', label: '按任务', desc: '整包一口价' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => field.onChange(mode.value)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all text-left
                      ${field.value === mode.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                      }
                    `}
                  >
                    {field.value === mode.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-sm font-bold text-gray-800">{mode.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            )}
          />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">所需技能</h2>
            {skillIds.length > 0 && (
              <Tag color="blue" size="sm">已选 {skillIds.length} 项</Tag>
            )}
          </div>
          <div className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <p className="text-xs text-gray-500 mb-2 font-medium">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => {
                    const selected = skillIds.includes(skill.id)
                    return (
                      <motion.button
                        key={skill.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSkill(skill.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-sm font-medium transition-all
                          ${selected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {skill.name}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {errors.skillIds && (
            <p className="mt-2 text-sm text-red-500">请选择至少一项技能</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">用工信息</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用工人数</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setValue('workerCount', Math.max(1, workerCount - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">{workerCount}</span>
                <button
                  type="button"
                  onClick={() => setValue('workerCount', Math.min(20, workerCount + 1))}
                  className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">人</span>
              </div>
            </div>

            <Controller
              name="startTime"
              control={control}
              rules={{ required: '请选择开始时间' }}
              render={({ field }) => (
                <Input
                  label="开始时间"
                  type="datetime-local"
                  icon={<Calendar className="w-4 h-4" />}
                  error={errors.startTime?.message}
                  {...field}
                />
              )}
            />

            {pricingMode === 'hourly' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">预计工期</label>
                  <span className="text-sm font-bold text-blue-600">{watch('duration') || 4} 小时</span>
                </div>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="range"
                      min={1}
                      max={24}
                      value={field.value || 4}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  )}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1小时</span>
                  <span>24小时</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">雇主出价</h2>
          </div>
          <Controller
            name="budget"
            control={control}
            rules={{ required: '请输入出价', min: { value: 1, message: '出价不能为0' } }}
            render={({ field }) => (
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">¥</span>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full py-4 pl-12 pr-4 text-4xl font-bold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Tag color="green" size="sm">
                    市场价约 ¥{marketPrice}
                  </Tag>
                  <span className="text-xs text-gray-500">价格越高，接单越快</span>
                </div>
                {errors.budget && (
                  <p className="mt-2 text-sm text-red-500">{errors.budget.message}</p>
                )}
              </div>
            )}
          />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">工作描述</h2>
          </div>
          <Controller
            name="description"
            control={control}
            rules={{ required: '请填写工作描述', minLength: { value: 10, message: '描述不少于10个字' } }}
            render={({ field }) => (
              <div>
                <textarea
                  {...field}
                  rows={4}
                  placeholder="请详细描述工作内容、要求、注意事项等..."
                  className="w-full p-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-between mt-2">
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{field.value.length}/500</span>
                </div>
              </div>
            )}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">现场图片（选填）</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-6 h-6 mb-1" />
                  <span className="text-xs">添加</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">工作地点</h2>
          </div>
          <Controller
            name="address"
            control={control}
            rules={{ required: '请填写工作地址' }}
            render={({ field }) => (
              <div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...field}
                    type="text"
                    placeholder="请输入或选择工作地址"
                    className="w-full py-3.5 pl-12 pr-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mt-3 h-32 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-1 text-blue-400" />
                    <span className="text-sm">点击选择地图位置</span>
                  </div>
                </div>
                {errors.address && (
                  <p className="mt-2 text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            )}
          />
        </Card>

        <Card>
          <button
            type="button"
            onClick={() => setShowSplitConfig(!showSplitConfig)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-gray-900">拆单分派</h2>
              <Tag color="purple" size="sm">智能</Tag>
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="enableSplit"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      relative w-12 h-7 rounded-full transition-colors
                      ${field.value ? 'bg-blue-600' : 'bg-gray-300'}
                    `}
                  >
                    <motion.div
                      animate={{ x: field.value ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                )}
              />
              {showSplitConfig ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {enableSplit && showSplitConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs text-gray-500">系统将自动拆分任务并分派给合适的工人</p>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">子任务 {index + 1}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-xs text-red-500"
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <Controller
                        name={`subTasks.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="子任务名称"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Controller
                          name={`subTasks.${index}.count`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              placeholder="人数"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        />
                        <Controller
                          name={`subTasks.${index}.budget`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              placeholder="预算"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({ title: '', count: 1, budget: 100 })}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    + 添加子任务
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </form>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-gray-500">预计费用</span>
            <div className="text-xl font-bold text-blue-600">¥{watch('budget') || 0}</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>预计10分钟内接单</span>
          </div>
        </div>
        <Button
          type="submit"
          variant="cta"
          size="lg"
          fullWidth
          loading={publishMutation.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          立即发布
        </Button>
      </div>
    </div>
  )
}
