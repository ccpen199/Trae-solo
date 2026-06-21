import { useState } from 'react'
import { useAppStore } from '@/store'
import {
  Send,
  Save,
  FileSpreadsheet,
  Link2,
  Thermometer,
  Package,
  MapPin,
  Calendar,
  Phone,
  User,
  AlertTriangle,
  Paperclip,
  Sparkles,
  CheckCircle2,
  Truck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const defaultTempRequirement = {
  need: false,
  min: 0,
  max: 25,
  unit: '℃',
}

export default function CargoPublish() {
  const navigate = useNavigate()
  const { addCargoOrder, currentUser, capacities } = useAppStore()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    cargoName: '',
    cargoType: '电子产品',
    weight: 0,
    volume: 0,
    quantity: 0,
    declaredValue: 0,
    originProvince: '广东省',
    originCity: '深圳市',
    originAddress: '',
    originContact: '',
    originPhone: '',
    destProvince: '浙江省',
    destCity: '杭州市',
    destAddress: '',
    destContact: '',
    destPhone: '',
    pickupTime: '',
    deliveryTime: '',
    temp: { ...defaultTempRequirement },
    specialRequirements: [] as string[],
    assignedCapacityId: '',
    insurance: true,
  })

  const update = (k: string, v: any) => setFormData((p) => ({ ...p, [k]: v }))
  const goldCapacities = capacities.filter((c) => c.level === 'gold')

  const toggleReq = (item: string) => {
    update(
      'specialRequirements',
      formData.specialRequirements.includes(item)
        ? formData.specialRequirements.filter((x) => x !== item)
        : [...formData.specialRequirements, item]
    )
  }

  const submit = (saveAsDraft: boolean) => {
    const newOrder: any = {
      id: 'co-' + Math.random().toString(36).slice(2, 8),
      orderNo: 'HY' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(Math.floor(Math.random() * 9000) + 1000),
      enterpriseId: currentUser.id,
      enterpriseName: currentUser.company.split(' ')[0],
      cargoName: formData.cargoName,
      cargoType: formData.cargoType,
      weight: formData.weight,
      volume: formData.volume,
      quantity: formData.quantity,
      declaredValue: formData.declaredValue,
      origin: {
        province: formData.originProvince,
        city: formData.originCity,
        address: formData.originAddress,
        contact: formData.originContact,
        phone: formData.originPhone,
      },
      destination: {
        province: formData.destProvince,
        city: formData.destCity,
        address: formData.destAddress,
        contact: formData.destContact,
        phone: formData.destPhone,
      },
      pickupTime: formData.pickupTime,
      deliveryTime: formData.deliveryTime,
      status: saveAsDraft ? 'draft' : 'published',
      specialRequirements: formData.specialRequirements,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    if (formData.temp.need) {
      newOrder.temperatureRequired = { min: formData.temp.min, max: formData.temp.max, unit: formData.temp.unit }
    }
    if (formData.assignedCapacityId) {
      const cap = capacities.find((c) => c.id === formData.assignedCapacityId)
      newOrder.assignedCapacity = cap
        ? { id: cap.id, name: cap.name, type: cap.type, level: cap.level }
        : undefined
      newOrder.status = saveAsDraft ? 'draft' : 'assigned'
    }
    addCargoOrder(newOrder)
    navigate('/cargo')
  }

  return (
    <div className="space-y-6">
      {/* 步骤条 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {[
            { n: 1, t: '货物信息' },
            { n: 2, t: '收发地址' },
            { n: 3, t: '运输要求' },
            { n: 4, t: '确认发布' },
          ].map((s, idx, arr) => (
            <div key={s.n} className="flex items-center gap-2 md:gap-4 flex-1 max-w-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.n
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-slate2-100 text-slate2-400'
                  }`}
                >
                  {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                </div>
                <span className={`hidden md:block text-sm font-medium ${step >= s.n ? 'text-slate2-800' : 'text-slate2-400'}`}>{s.t}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${step > s.n ? 'bg-gradient-to-r from-primary-500 to-success-500' : 'bg-slate2-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 主表单区 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 步骤1: 货物信息 */}
          {step === 1 && (
            <div className="card-base p-6 space-y-6 animate-fadeInUp">
              <div className="flex items-center gap-3 pb-4 border-b border-slate2-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate2-800">货物信息</h2>
                  <p className="text-xs text-slate2-400">请准确填写货物详细信息，以便系统智能匹配最合适的运力</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <FormField label="货物名称" required>
                  <input
                    value={formData.cargoName}
                    onChange={(e) => update('cargoName', e.target.value)}
                    placeholder="如：5G基站设备、冷链生鲜等"
                    className="form-input"
                  />
                </FormField>
                <FormField label="货物类型" required>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => update('cargoType', e.target.value)}
                    className="form-input"
                  >
                    <option>电子产品</option>
                    <option>汽车零部件</option>
                    <option>机械设备</option>
                    <option>化工原料</option>
                    <option>冷链食品</option>
                    <option>医药产品</option>
                    <option>家电产品</option>
                    <option>纺织服装</option>
                    <option>其他</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <FormField label="货物重量 (吨)" required>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => update('weight', Number(e.target.value))}
                    placeholder="0.00"
                    className="form-input"
                  />
                </FormField>
                <FormField label="货物体积 (m³)" required>
                  <input
                    type="number"
                    value={formData.volume || ''}
                    onChange={(e) => update('volume', Number(e.target.value))}
                    placeholder="0.00"
                    className="form-input"
                  />
                </FormField>
                <FormField label="货物件数" required>
                  <input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => update('quantity', Number(e.target.value))}
                    placeholder="件"
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField label="货物申报价值 (元)" required hint="用于保费计算与理赔核算">
                <input
                  type="number"
                  value={formData.declaredValue || ''}
                  onChange={(e) => update('declaredValue', Number(e.target.value))}
                  placeholder="0"
                  className="form-input text-lg font-mono font-bold"
                />
              </FormField>
            </div>
          )}

          {/* 步骤2: 收发地址 */}
          {step === 2 && (
            <div className="card-base p-6 space-y-8 animate-fadeInUp">
              <div className="flex items-center gap-3 pb-4 border-b border-slate2-100">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-success-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate2-800">收发地址与时间</h2>
                  <p className="text-xs text-slate2-400">精确的地址信息与时间要求可提升运力匹配效率</p>
                </div>
              </div>

              <div className="relative pl-4">
                <div className="absolute left-[11px] top-10 bottom-10 w-px bg-gradient-to-b from-success-400 via-primary-300 to-accent-400" />

                <div className="relative bg-gradient-to-r from-success-50 to-transparent border border-success-100 rounded-xl p-5 mb-8">
                  <div className="absolute -left-1 top-5 w-5 h-5 rounded-full bg-success-500 border-4 border-white shadow-lg" />
                  <h3 className="font-bold text-success-700 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-success-500 text-white text-xs flex items-center justify-center">装</span>
                    装货地址
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="省份" required>
                      <input value={formData.originProvince} onChange={(e) => update('originProvince', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="城市" required>
                      <input value={formData.originCity} onChange={(e) => update('originCity', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="详细地址" required colSpan={2}>
                      <input value={formData.originAddress} onChange={(e) => update('originAddress', e.target.value)} placeholder="街道、门牌号等详细地址" className="form-input" />
                    </FormField>
                    <FormField label="联系人" required icon={<User className="w-3.5 h-3.5" />}>
                      <input value={formData.originContact} onChange={(e) => update('originContact', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="联系电话" required icon={<Phone className="w-3.5 h-3.5" />}>
                      <input value={formData.originPhone} onChange={(e) => update('originPhone', e.target.value)} className="form-input font-mono" />
                    </FormField>
                    <FormField label="装货时间" required colSpan={2} icon={<Calendar className="w-3.5 h-3.5" />}>
                      <input
                        type="datetime-local"
                        value={formData.pickupTime}
                        onChange={(e) => update('pickupTime', e.target.value.replace('T', ' '))}
                        className="form-input font-mono"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="relative bg-gradient-to-r from-accent-50 to-transparent border border-accent-100 rounded-xl p-5">
                  <div className="absolute -left-1 top-5 w-5 h-5 rounded-full bg-accent-500 border-4 border-white shadow-lg" />
                  <h3 className="font-bold text-accent-700 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-accent-500 text-white text-xs flex items-center justify-center">卸</span>
                    卸货地址
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="省份" required>
                      <input value={formData.destProvince} onChange={(e) => update('destProvince', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="城市" required>
                      <input value={formData.destCity} onChange={(e) => update('destCity', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="详细地址" required colSpan={2}>
                      <input value={formData.destAddress} onChange={(e) => update('destAddress', e.target.value)} placeholder="街道、门牌号等详细地址" className="form-input" />
                    </FormField>
                    <FormField label="联系人" required icon={<User className="w-3.5 h-3.5" />}>
                      <input value={formData.destContact} onChange={(e) => update('destContact', e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="联系电话" required icon={<Phone className="w-3.5 h-3.5" />}>
                      <input value={formData.destPhone} onChange={(e) => update('destPhone', e.target.value)} className="form-input font-mono" />
                    </FormField>
                    <FormField label="送达时间" required colSpan={2} icon={<Calendar className="w-3.5 h-3.5" />}>
                      <input
                        type="datetime-local"
                        value={formData.deliveryTime}
                        onChange={(e) => update('deliveryTime', e.target.value.replace('T', ' '))}
                        className="form-input font-mono"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤3: 运输要求 */}
          {step === 3 && (
            <div className="card-base p-6 space-y-6 animate-fadeInUp">
              <div className="flex items-center gap-3 pb-4 border-b border-slate2-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate2-800">特殊运输要求</h2>
                  <p className="text-xs text-slate2-400">根据货物属性选择相应的运输要求，系统将为您匹配符合条件的运力</p>
                </div>
              </div>

              {/* 温控要求 */}
              <div className={`rounded-xl border p-5 transition-all ${
                formData.temp.need
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                  : 'bg-white border-slate2-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formData.temp.need ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate2-800">温控运输要求</div>
                      <div className="text-xs text-slate2-400">适用于冷链食品、医药产品等对温度敏感的货物</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.temp.need}
                      onChange={(e) => update('temp', { ...formData.temp, need: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate2-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                {formData.temp.need && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-100 animate-fadeInUp">
                    <FormField label="最低温度">
                      <input
                        type="number"
                        value={formData.temp.min}
                        onChange={(e) => update('temp', { ...formData.temp, min: Number(e.target.value) })}
                        className="form-input font-mono"
                      />
                    </FormField>
                    <FormField label="最高温度">
                      <input
                        type="number"
                        value={formData.temp.max}
                        onChange={(e) => update('temp', { ...formData.temp, max: Number(e.target.value) })}
                        className="form-input font-mono"
                      />
                    </FormField>
                    <FormField label="单位">
                      <select
                        value={formData.temp.unit}
                        onChange={(e) => update('temp', { ...formData.temp, unit: e.target.value })}
                        className="form-input"
                      >
                        <option value="℃">摄氏度 ℃</option>
                        <option value="℉">华氏度 ℉</option>
                      </select>
                    </FormField>
                  </div>
                )}
              </div>

              {/* 特殊要求标签 */}
              <div>
                <label className="block text-sm font-semibold text-slate2-700 mb-3">特殊运输要求</label>
                <div className="flex flex-wrap gap-2">
                  {['轻放', '防雨', '防潮', '防晒', '直立放置', '不可倒置', '防静电', '危险品', '夜间运输', '全程视频监控', '需押运', '加固捆绑'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleReq(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        formData.specialRequirements.includes(item)
                          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                          : 'bg-slate2-50 text-slate2-600 border border-slate2-100 hover:border-primary-200 hover:text-primary-600'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 指定运力 */}
              <div>
                <label className="block text-sm font-semibold text-slate2-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary-500" />
                  指定金牌运力（可选，跳过则由系统智能匹配）
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => update('assignedCapacityId', '')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !formData.assignedCapacityId
                        ? 'border-primary-300 bg-primary-50 shadow-sm'
                        : 'border-slate2-100 bg-white hover:border-slate2-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate2-800">AI智能匹配</div>
                        <div className="text-[11px] text-slate2-400">系统自动匹配最优运力</div>
                      </div>
                    </div>
                  </button>
                  {goldCapacities.slice(0, 3).map((cap) => (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => update('assignedCapacityId', cap.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.assignedCapacityId === cap.id
                          ? 'border-amber-300 bg-amber-50 shadow-sm'
                          : 'border-slate2-100 bg-white hover:border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white flex items-center justify-center font-bold text-lg">
                          {cap.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate2-800 truncate">{cap.name}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400 text-white font-bold">金</span>
                          </div>
                          <div className="text-[11px] text-slate2-400 flex items-center gap-2">
                            <span>履约率 {cap.fulfillmentRate}%</span>
                            <span className="text-slate2-200">·</span>
                            <span>{cap.totalOrders}单</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 附件上传 */}
              <div className="rounded-xl border-2 border-dashed border-slate2-200 p-6 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
                <Paperclip className="w-10 h-10 mx-auto mb-2 text-slate2-300" />
                <p className="text-sm font-medium text-slate2-600">点击上传或拖拽文件到此处</p>
                <p className="text-xs text-slate2-400 mt-1">支持PDF、Excel、图片等格式，单文件不超过20MB</p>
              </div>
            </div>
          )}

          {/* 步骤4: 确认预览 */}
          {step === 4 && (
            <div className="card-base p-6 animate-fadeInUp">
              <div className="flex items-center gap-3 pb-4 border-b border-slate2-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate2-800">信息确认与发布</h2>
                  <p className="text-xs text-slate2-400">请确认以下货源信息是否准确，提交后将进入运力匹配流程</p>
                </div>
              </div>

              <div className="space-y-6">
                <PreviewSection title="货物信息" icon={<Package className="w-4 h-4" />} items={[
                  ['货物名称', formData.cargoName || '—'],
                  ['货物类型', formData.cargoType],
                  ['重量/体积/件数', `${formData.weight}吨 / ${formData.volume}m³ / ${formData.quantity}件`],
                  ['申报价值', `¥${formData.declaredValue.toLocaleString()}`],
                ]} />

                <PreviewSection title="装卸货路线" icon={<MapPin className="w-4 h-4" />} items={[
                  ['装货地址', `${formData.originProvince}${formData.originCity} ${formData.originAddress}`],
                  ['装货联系人', `${formData.originContact} ${formData.originPhone}`],
                  ['装货时间', formData.pickupTime],
                  ['卸货地址', `${formData.destProvince}${formData.destCity} ${formData.destAddress}`],
                  ['卸货联系人', `${formData.destContact} ${formData.destPhone}`],
                  ['要求送达', formData.deliveryTime],
                ]} />

                {formData.specialRequirements.length > 0 && (
                  <PreviewSection title="特殊要求" icon={<AlertTriangle className="w-4 h-4" />} items={[
                    ['运输要求', formData.specialRequirements.join('、')],
                    formData.temp.need ? ['温控范围', `${formData.temp.min}~${formData.temp.max}${formData.temp.unit}`] : null,
                  ].filter(Boolean) as any} />
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 rounded-lg border border-slate2-200 text-slate2-600 text-sm font-medium hover:bg-white transition-colors"
              >
                ← 上一步
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step < 4 ? (
                <button
                  onClick={() => submit(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate2-200 text-slate2-600 text-sm font-medium hover:bg-white transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存草稿
                </button>
              ) : (
                <button
                  onClick={() => submit(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate2-200 text-slate2-600 text-sm font-medium hover:bg-white transition-colors"
                >
                  <Save className="w-4 h-4" />
                  仅保存草稿
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all-smooth"
                >
                  下一步 →
                </button>
              ) : (
                <button
                  onClick={() => submit(false)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-medium hover:from-success-600 hover:to-success-700 hover:shadow-lg hover:shadow-success-500/20 transition-all-smooth"
                >
                  <Send className="w-4 h-4" />
                  确认发布货源
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧信息栏 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* AI智能提示 */}
          <div className="card-base p-5 bg-gradient-to-br from-violet-50 via-white to-primary-50 card-hover">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-primary-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate2-800 text-sm">AI智能推荐</h3>
                <p className="text-[10px] text-slate2-400">根据历史数据分析</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/80 border border-violet-100">
                <div className="text-[11px] text-violet-500 font-medium mb-1">预计运费</div>
                <div className="text-xl font-extrabold font-mono text-slate2-800">¥ 8,650 <span className="text-xs font-normal text-slate2-400">~ ¥9,800</span></div>
                <div className="text-[10px] text-slate2-400 mt-0.5">基于同线路同类型货物历史均价</div>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-primary-100">
                <div className="text-[11px] text-primary-500 font-medium mb-1">预计运力匹配时间</div>
                <div className="text-lg font-extrabold font-mono text-slate2-800">15~30 <span className="text-xs font-normal">分钟</span></div>
                <div className="text-[10px] text-slate2-400 mt-0.5">金牌运力响应率高达 94%</div>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-success-100">
                <div className="text-[11px] text-success-600 font-medium mb-1">预计中国人保保费</div>
                <div className="text-lg font-extrabold font-mono text-slate2-800">¥ 1,140</div>
                <div className="text-[10px] text-slate2-400 mt-0.5">综合险，费率 0.12% (自动关联)</div>
              </div>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="card-base p-5 card-hover">
            <h3 className="font-bold text-slate2-800 text-sm mb-4">批量导入</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate2-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate2-100">
                  <FileSpreadsheet className="w-5 h-5 text-success-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate2-800">Excel 批量导入</div>
                  <div className="text-[11px] text-slate2-400">下载模板批量上传订单</div>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate2-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate2-100">
                  <Link2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate2-800">启用 ERP 自动同步</div>
                  <div className="text-[11px] text-slate2-400">SAP / 用友 / 金蝶 一键对接</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border-radius: 10px;
          background-color: #F8F9FA;
          border: 1px solid #ECEEF1;
          font-size: 14px;
          color: #1A1A2E;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          background-color: white;
          border-color: #597BB3;
          box-shadow: 0 0 0 3px rgba(15, 52, 96, 0.08);
        }
        .form-input::placeholder {
          color: #AEB7C2;
        }
      `}</style>
    </div>
  )
}

function FormField({
  label,
  children,
  required,
  hint,
  icon,
  colSpan,
}: {
  label: string
  children: any
  required?: boolean
  hint?: string
  icon?: any
  colSpan?: number
}) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate2-600 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-accent-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-slate2-400">{hint}</p>}
    </div>
  )
}

function PreviewSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: any
  items: [string, string][]
}) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate2-700 mb-3 text-primary-600">
        <span className="w-6 h-6 rounded bg-primary-50 flex items-center justify-center text-primary-500">{icon}</span>
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-8">
        {items.map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] text-slate2-400 mb-0.5">{k}</div>
            <div className="text-sm text-slate2-800 font-medium">{v || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
