import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Mic,
  MicOff,
  FileText,
  Scale,
  Upload,
  Send,
  MapPin,
  UserCheck,
  Lock,
  FileCheck,
  Sparkles,
  Loader2,
  Target,
  Award,
  ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import EvidenceUpload from '@/components/EvidenceUpload'
import type { UploadedFile } from '@/components/EvidenceUpload'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { LegalCaseType } from '@/types'

type Step = 1 | 2 | 3 | 4

const caseTypeOptions: { value: LegalCaseType; label: string; icon: string; desc: string }[] = [
  { value: 'marriage', label: '婚姻家庭', icon: '💍', desc: '离婚、财产分割、抚养权等' },
  { value: 'labor', label: '劳动纠纷', icon: '💼', desc: '工资、劳动合同、工伤等' },
  { value: 'debt', label: '债务纠纷', icon: '💰', desc: '借款、欠款、合同债务等' },
  { value: 'property', label: '房产纠纷', icon: '🏠', desc: '购房、租房、产权等' },
  { value: 'contract', label: '合同纠纷', icon: '📄', desc: '合同签订、履行、违约等' },
  { value: 'traffic', label: '交通事故', icon: '🚗', desc: '事故责任、赔偿、保险等' },
  { value: 'criminal', label: '刑事辩护', icon: '⚖️', desc: '刑事案件辩护、取保候审等' },
  { value: 'other', label: '其他', icon: '❓', desc: '其他法律问题咨询' },
]

const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
]

const cityMap: Record<string, string[]> = {
  '北京': ['北京市'],
  '天津': ['天津市'],
  '上海': ['上海市'],
  '重庆': ['重庆市'],
  '河北': ['石家庄', '唐山', '秦皇岛', '邯郸', '保定', '张家口', '承德', '廊坊', '沧州', '衡水', '邢台'],
  '山西': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '吉林': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边'],
  '黑龙江': ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭'],
  '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '安徽': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'],
  '福建': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '江西': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '山东': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '莱芜', '临沂', '德州', '聊城', '滨州', '菏泽'],
  '河南': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店'],
  '湖北': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施'],
  '湖南': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西'],
  '广东': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '广西': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  '海南': ['海口', '三亚', '三沙', '儋州'],
  '四川': ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝', '甘孜', '凉山'],
  '贵州': ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南'],
  '云南': ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆'],
  '西藏': ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
  '陕西': ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  '甘肃': ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南'],
  '青海': ['西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西'],
  '宁夏': ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  '新疆': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰'],
  '内蒙古': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布', '兴安', '锡林郭勒', '阿拉善'],
}

const stepTitles = ['问题描述', '上传证据', '选择分类', '确认提交']

export default function Submit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuthStore()
  const createConsultation = useConsultationStore((s) => s.createConsultation)

  const state = location.state as {
    preselectedCase?: string
    preselectedLawyer?: string
  } | null

  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [evidences, setEvidences] = useState<UploadedFile[]>([])
  const [caseType, setCaseType] = useState<LegalCaseType | null>(
    (state?.preselectedCase as LegalCaseType) || null
  )
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [assignedLawyerId] = useState<string | null>(state?.preselectedLawyer || null)
  const [submitting, setSubmitting] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<{ id: string } | null>(null)

  useEffect(() => {
    if (state?.preselectedCase && !caseType) {
      setCaseType(state.preselectedCase as LegalCaseType)
    }
  }, [state, caseType])

  const canNext = () => {
    switch (step) {
      case 1:
        return title.trim().length >= 5 && description.trim().length >= 10
      case 2:
        return true
      case 3:
        return caseType !== null && province !== '' && city !== ''
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  const handlePrev = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!currentUser || !caseType) return
    setSubmitting(true)
    try {
      const result = await createConsultation({
        userId: currentUser.id,
        caseType,
        title: title.trim(),
        description: description.trim(),
        region: province === city ? province : `${province}${city}`,
        assignedLawyerId: assignedLawyerId || undefined,
      })
      if (result) {
        setDispatchResult({ id: result.id })
        setDispatching(true)
        setTimeout(() => {
          navigate(`/consultation/${result.id}`)
        }, 2000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCaseType = caseTypeOptions.find((o) => o.value === caseType)

  if (dispatching) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center bg-slate-50 px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full bg-blue-100 animate-ping opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-slate-800">
            正在为您智能匹配律师...
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            预计30秒内完成分派
          </p>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-left">
            <p className="mb-2 text-xs font-medium text-slate-500">匹配维度</p>
            {[
              { icon: Scale, label: '案由匹配', desc: '匹配对应领域专业律师', color: 'text-blue-500 bg-blue-50' },
              { icon: MapPin, label: '地域匹配', desc: '优先匹配您所在地区律师', color: 'text-emerald-500 bg-emerald-50' },
              { icon: Target, label: '专长标签匹配', desc: '精准匹配专长标签', color: 'text-amber-500 bg-amber-50' },
              { icon: ShieldCheck, label: '信用评分筛选', desc: '高信用评分律师优先', color: 'text-purple-500 bg-purple-50' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', item.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock className="h-3 w-3" />
            <span>您的咨询信息已加密保护</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-slate-50 px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">提交法律咨询</h1>
      </div>

      {(caseType || assignedLawyerId) && (
        <div className="mb-6 rounded-xl border border-scale-200 bg-gradient-to-r from-scale-50 to-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-scale-500">
              <FileCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">咨询信息已预填</p>
              <p className="mt-1 text-xs text-slate-500">
                {caseType && (
                  <span className="mr-3">
                    已选案由：
                    <span className="font-medium text-scale-700">
                      {caseTypeOptions.find(o => o.value === caseType)?.label || caseType}
                    </span>
                  </span>
                )}
                {assignedLawyerId && (
                  <span>
                    已指定律师
                    <span className="ml-1 font-medium text-scale-700">（跳过智能匹配）</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {stepTitles.map((t, i) => {
            const idx = i + 1
            const isActive = step === idx
            const isDone = step > idx
            return (
              <div key={t} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                      isDone && 'bg-emerald-500 text-white',
                      isActive && 'bg-blue-500 text-white shadow-md shadow-blue-500/30',
                      !isDone && !isActive && 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : idx}
                  </div>
                  <span
                    className={cn(
                      'text-xs transition-colors',
                      isActive && 'text-blue-600 font-medium',
                      isDone && 'text-slate-600',
                      !isDone && !isActive && 'text-slate-400'
                    )}
                  >
                    {t}
                  </span>
                </div>
                {i < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1 transition-colors',
                      step > idx ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                咨询标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="请简要描述您的问题（至少5个字）"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-1 text-right text-xs text-slate-400">{title.length}/50</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="请详细描述您遇到的法律问题，包括时间、地点、人物、事件经过等（至少10个字）"
                  rows={6}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    'absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                  title={isRecording ? '停止录音' : '语音录入'}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between">
                {isRecording && (
                  <span className="text-xs text-red-500">正在录音...（模拟功能）</span>
                )}
                {!isRecording && <span />}
                <span className="text-xs text-slate-400">{description.length}/500</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Upload className="h-5 w-5 text-blue-500" />
              <span className="font-medium">上传证据材料</span>
            </div>
            <p className="text-sm text-slate-500">
              上传相关证据材料有助于律师更准确地了解案情，给出更专业的法律建议。支持图片、PDF、Word 等格式。
            </p>
            <EvidenceUpload files={evidences} onChange={setEvidences} />
            {evidences.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <FileText className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">暂无证据材料，可跳过此步</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-700">
                <Scale className="h-5 w-5 text-blue-500" />
                <span className="font-medium">选择案由类型</span>
                <span className="text-red-500">*</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {caseTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCaseType(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                      caseType === opt.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        caseType === opt.value ? 'text-blue-600' : 'text-slate-700'
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-700">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span className="font-medium">选择地区</span>
                <span className="text-red-500">*</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">省份</label>
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value)
                      setCity('')
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">请选择省份</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">城市</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">请选择城市</option>
                    {(cityMap[province] || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            {assignedLawyerId && (
              <div className="rounded-lg border border-scale-200 bg-scale-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-scale-500 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">已指定律师</p>
                    <p className="text-xs text-slate-500">
                      提交后将直接指派给您选择的律师，无需智能匹配
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-700">确认提交信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="w-20 shrink-0 text-slate-400">咨询标题</span>
                  <span className="text-slate-700">{title}</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-20 shrink-0 text-slate-400">详细描述</span>
                  <span className="flex-1 text-slate-700">{description}</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-20 shrink-0 text-slate-400">证据材料</span>
                  <span className="text-slate-700">
                    {evidences.length > 0 ? `${evidences.length} 份文件` : '未上传'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-20 shrink-0 text-slate-400">案由类型</span>
                  <span className="text-slate-700">
                    {selectedCaseType && `${selectedCaseType.icon} ${selectedCaseType.label}`}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-20 shrink-0 text-slate-400">所在地区</span>
                  <span className="text-slate-700">
                    {province === city ? province : `${province} ${city}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-justice-200 bg-gradient-to-br from-justice-50 to-white p-5">
              <h3 className="mb-4 text-sm font-medium text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-justice-500" />
                咨询服务流程
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Sparkles, title: '智能分派', desc: '系统按案由+地域+专长标签匹配最优律师', color: 'bg-justice-500' },
                  { icon: Lock, title: '加密IM会话', desc: '端到端加密，阅后即焚保护隐私', color: 'bg-blue-500' },
                  { icon: FileCheck, title: '法律意见摘要', desc: '结案自动生成专业法律意见书归档', color: 'bg-scale-500' },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {idx < 2 && <div className="w-px h-6 bg-slate-200 my-1" />}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="mb-1 font-medium">提交须知</p>
              <ul className="list-disc space-y-1 pl-5 text-blue-600">
                <li>提交后系统将根据案由和地区为您匹配合适的律师</li>
                <li>您的咨询内容将进行端到端加密保护，证据文件自动添加水印</li>
                <li>律师接单后您可以进入加密即时通讯进行沟通</li>
                <li>会话消息支持阅后即焚，保护您的隐私安全</li>
                <li>结案后系统自动生成《法律意见摘要》并永久归档</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 1 && (
          <button
            onClick={handlePrev}
            className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            上一步
          </button>
        )}
        {step < 4 && (
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className={cn(
              'flex h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-medium transition-all',
              canNext()
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            )}
          >
            下一步
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {step === 4 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all',
              submitting
                ? 'cursor-not-allowed bg-blue-400 text-white'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
            )}
          >
            <Send className="h-4 w-4" />
            {submitting ? '提交中...' : '确认提交'}
          </button>
        )}
      </div>
    </div>
  )
}
