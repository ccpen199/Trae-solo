import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { ArrowLeft, Save, Upload, X, Plus, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2
type StrategyType = '人群包' | '地理围栏' | '满减触发'
type TriggerCondition = '进入围栏' | '离开围栏' | '停留超过N分钟'

const PREDEFINED_GROUPS = ['低收入人群', '老年群体', '文化旅游爱好者', '社区居民', '供暖补贴对象']
const CATEGORIES = ['餐饮美食', '零售购物', '生活服务', '文旅休闲', '医疗健康']

interface FormState {
  name: string
  type: CouponActivity_type
  faceValue: string
  totalCount: string
  budget: string
  startDate: string
  endDate: string
  strategyType: StrategyType
  groupName: string
  groupIds: string[]
  targetDesc: string
  predefinedGroup: string
  lat: string
  lng: string
  geoRadius: string
  triggerCondition: TriggerCondition
  stayMinutes: string
  thresholdAmount: string
  categories: string[]
  autoLimitPerDay: string
  effectiveStartHour: string
  effectiveEndHour: string
}

type CouponActivity_type = '政务补贴' | '民生优惠' | '商业促销'

const initialForm: FormState = {
  name: '', type: '政务补贴', faceValue: '', totalCount: '', budget: '',
  startDate: '', endDate: '', strategyType: '人群包',
  groupName: '', groupIds: [], targetDesc: '', predefinedGroup: '',
  lat: '', lng: '', geoRadius: '', triggerCondition: '进入围栏', stayMinutes: '',
  thresholdAmount: '', categories: [], autoLimitPerDay: '', effectiveStartHour: '', effectiveEndHour: '',
}

export default function CouponCreate() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { couponActivities, addCouponActivity, updateCouponActivity, changeCouponStatus, addAuditLog, showToast } = useStore()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(initialForm)
  const [groupIdInput, setGroupIdInput] = useState('')

  useEffect(() => {
    if (!id) return
    const activity = couponActivities.find((a) => a.id === id)
    if (!activity) return
    const cfg = activity.strategyConfig || {}
    setForm({
      name: activity.name, type: activity.type, faceValue: String(activity.faceValue),
      totalCount: String(activity.totalCount), budget: String(activity.budget),
      startDate: activity.startDate, endDate: activity.endDate, strategyType: activity.strategy,
      groupName: '', groupIds: cfg.groupIds || [], targetDesc: '', predefinedGroup: '',
      lat: cfg.geoFence ? String(cfg.geoFence.lat) : '',
      lng: cfg.geoFence ? String(cfg.geoFence.lng) : '',
      geoRadius: cfg.geoFence ? String(cfg.geoFence.radius) : '',
      triggerCondition: '进入围栏', stayMinutes: '',
      thresholdAmount: cfg.thresholdAmount ? String(cfg.thresholdAmount) : '',
      categories: [], autoLimitPerDay: '', effectiveStartHour: '', effectiveEndHour: '',
    })
  }, [id, couponActivities])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const addGroupId = () => {
    const trimmed = groupIdInput.trim()
    if (trimmed && !form.groupIds.includes(trimmed)) {
      update('groupIds', [...form.groupIds, trimmed])
      setGroupIdInput('')
    }
  }
  const removeGroupId = (gid: string) => update('groupIds', form.groupIds.filter((g) => g !== gid))

  const toggleCategory = (cat: string) => {
    update('categories', form.categories.includes(cat) ? form.categories.filter((c) => c !== cat) : [...form.categories, cat])
  }

  const buildStrategyConfig = () => {
    if (form.strategyType === '人群包') return { groupIds: form.groupIds }
    if (form.strategyType === '地理围栏') return { geoFence: { lat: Number(form.lat) || 0, lng: Number(form.lng) || 0, radius: Number(form.geoRadius) || 0 } }
    return { thresholdAmount: Number(form.thresholdAmount) || 0 }
  }

  const buildActivity = (status: CouponActivity_status): CouponActivity_full => ({
    id: id || `ca${Date.now()}`, name: form.name, type: form.type,
    faceValue: Number(form.faceValue) || 0, totalCount: Number(form.totalCount) || 0,
    usedCount: 0, status, strategy: form.strategyType,
    startDate: form.startDate, endDate: form.endDate,
    budget: Number(form.budget) || 0, budgetUsed: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    strategyConfig: buildStrategyConfig(),
  })

  type CouponActivity_status = 'draft' | 'active' | 'paused' | 'expired'
  type CouponActivity_full = { id: string; name: string; type: CouponActivity_type; faceValue: number; totalCount: number; usedCount: number; status: CouponActivity_status; strategy: StrategyType; startDate: string; endDate: string; budget: number; budgetUsed: number; createdAt: string; strategyConfig: ReturnType<typeof buildStrategyConfig> }

  const handleSaveDraft = () => {
    const activity = buildActivity('draft')
    if (isEdit) {
      updateCouponActivity(id!, { ...activity, id: id! })
    } else {
      addCouponActivity(activity)
    }
    addAuditLog({ targetId: activity.id, targetType: 'coupon_activity', action: 'save_draft', operator: '管理员张明', operatorRole: 'admin', detail: `${isEdit ? '编辑' : '创建'}草稿: ${form.name}` })
    showToast('success', '草稿已保存')
    navigate('/coupon/list')
  }

  const handleSubmit = () => {
    const activity = buildActivity('draft')
    if (isEdit) {
      updateCouponActivity(id!, { ...activity, id: id! })
    } else {
      addCouponActivity(activity)
    }
    changeCouponStatus(activity.id, 'active', '管理员张明', `提交审批: ${form.name}`)
    showToast('success', '已提交审批')
    navigate('/coupon/list')
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white'
  const labelCls = 'block text-sm font-medium text-primary mb-1.5'

  return (
    <div>
      <PageHeader
        title={isEdit ? '编辑券活动' : '创建券活动'}
        description="配置活动基本信息与发放策略"
        actions={
          <button onClick={() => navigate('/coupon/list')} className="flex items-center gap-1.5 text-sm text-[#6B7A99] hover:text-primary transition-colors">
            <ArrowLeft size={16} /> 返回列表
          </button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', step >= s ? 'bg-accent text-white' : 'bg-border text-[#6B7A99]')}>{s}</div>
            <span className={cn('text-sm', step >= s ? 'text-primary font-medium' : 'text-[#6B7A99]')}>{s === 1 ? '基本信息' : '策略配置'}</span>
            {s < 2 && <div className={cn('w-16 h-0.5', step > s ? 'bg-accent' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelCls}>活动名称</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} placeholder="请输入活动名称" />
            </div>
            <div>
              <label className={labelCls}>活动类型</label>
              <select value={form.type} onChange={(e) => update('type', e.target.value as CouponActivity_type)} className={inputCls}>
                <option value="政务补贴">政务补贴</option><option value="民生优惠">民生优惠</option><option value="商业促销">商业促销</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>面额（元）</label>
              <input type="number" value={form.faceValue} onChange={(e) => update('faceValue', e.target.value)} className={inputCls} placeholder="请输入面额" />
            </div>
            <div>
              <label className={labelCls}>发放总量</label>
              <input type="number" value={form.totalCount} onChange={(e) => update('totalCount', e.target.value)} className={inputCls} placeholder="请输入总量" />
            </div>
            <div>
              <label className={labelCls}>预算金额（元）</label>
              <input type="number" value={form.budget} onChange={(e) => update('budget', e.target.value)} className={inputCls} placeholder="请输入预算" />
            </div>
            <div>
              <label className={labelCls}>开始日期</label>
              <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>结束日期</label>
              <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className={inputCls} />
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <label className={labelCls}>策略类型</label>
          <div className="flex gap-4 mb-5">
            {(['人群包', '地理围栏', '满减触发'] as StrategyType[]).map((s) => (
              <label key={s} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors', form.strategyType === s ? 'border-accent bg-accent/5 text-primary' : 'border-border text-[#6B7A99] hover:border-accent/40')}>
                <input type="radio" name="strategy" checked={form.strategyType === s} onChange={() => update('strategyType', s)} className="accent-accent" />
                <span className="text-sm font-medium">{s}</span>
              </label>
            ))}
          </div>

          {form.strategyType === '人群包' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>人群包名称</label>
                <input value={form.groupName} onChange={(e) => update('groupName', e.target.value)} className={inputCls} placeholder="请输入人群包名称" />
              </div>
              <div>
                <label className={labelCls}>人群包ID标签</label>
                <div className="flex gap-2 mb-2">
                  <input value={groupIdInput} onChange={(e) => setGroupIdInput(e.target.value)} className={cn(inputCls, 'flex-1')} placeholder="输入ID后回车添加" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGroupId())} />
                  <button onClick={addGroupId} className="px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"><Plus size={14} /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.groupIds.map((gid) => (
                    <span key={gid} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-accent/10 text-accent rounded-full">
                      {gid}
                      <button onClick={() => removeGroupId(gid)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>目标人群描述</label>
                <textarea value={form.targetDesc} onChange={(e) => update('targetDesc', e.target.value)} className={cn(inputCls, 'min-h-[80px]')} placeholder="描述目标人群特征..." />
              </div>
              <div>
                <label className={labelCls}>预定义人群包</label>
                <select value={form.predefinedGroup} onChange={(e) => update('predefinedGroup', e.target.value)} className={inputCls}>
                  <option value="">请选择预定义人群包</option>
                  {PREDEFINED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          )}

          {form.strategyType === '地理围栏' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>中心纬度</label><input type="number" value={form.lat} onChange={(e) => update('lat', e.target.value)} className={inputCls} placeholder="如 39.9042" step="0.0001" /></div>
                <div><label className={labelCls}>中心经度</label><input type="number" value={form.lng} onChange={(e) => update('lng', e.target.value)} className={inputCls} placeholder="如 116.4074" step="0.0001" /></div>
              </div>
              <div>
                <label className={labelCls}>围栏半径（米）</label>
                <input type="number" value={form.geoRadius} onChange={(e) => update('geoRadius', e.target.value)} className={inputCls} placeholder="请输入围栏半径" />
              </div>
              <div className="flex items-center justify-center w-full h-40 bg-gray-50 rounded-lg border border-border relative">
                <MapPin size={20} className="text-accent absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' }} />
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-accent/40 flex items-center justify-center">
                  <span className="text-xs text-accent font-medium">{form.geoRadius || 0}m</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>触发条件</label>
                <select value={form.triggerCondition} onChange={(e) => update('triggerCondition', e.target.value as TriggerCondition)} className={inputCls}>
                  <option value="进入围栏">进入围栏</option>
                  <option value="离开围栏">离开围栏</option>
                  <option value="停留超过N分钟">停留超过N分钟</option>
                </select>
              </div>
              {form.triggerCondition === '停留超过N分钟' && (
                <div>
                  <label className={labelCls}>停留时长（分钟）</label>
                  <input type="number" value={form.stayMinutes} onChange={(e) => update('stayMinutes', e.target.value)} className={inputCls} placeholder="请输入停留分钟数" />
                </div>
              )}
            </div>
          )}

          {form.strategyType === '满减触发' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>消费满额（元）</label>
                <input type="number" value={form.thresholdAmount} onChange={(e) => update('thresholdAmount', e.target.value)} className={inputCls} placeholder="请输入触发金额" />
              </div>
              <div>
                <label className={labelCls}>适用品类</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => toggleCategory(cat)} className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors', form.categories.includes(cat) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-[#6B7A99] hover:border-accent/40')}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>每人每日自动发放上限</label>
                <input type="number" value={form.autoLimitPerDay} onChange={(e) => update('autoLimitPerDay', e.target.value)} className={inputCls} placeholder="请输入每日上限" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>生效起始时间</label><input type="time" value={form.effectiveStartHour} onChange={(e) => update('effectiveStartHour', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>生效截止时间</label><input type="time" value={form.effectiveEndHour} onChange={(e) => update('effectiveEndHour', e.target.value)} className={inputCls} /></div>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between mt-6">
        <div>
          {step > 1 && <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[#6B7A99] border border-border rounded-lg hover:bg-bg transition-colors">上一步</button>}
        </div>
        <div className="flex gap-3">
          <button onClick={handleSaveDraft} className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#6B7A99] border border-border rounded-lg hover:bg-bg transition-colors">
            <Save size={14} /> 保存草稿
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-light transition-colors">下一步</button>
          ) : (
            <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-light transition-colors">
              <Upload size={14} /> 提交创建
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
