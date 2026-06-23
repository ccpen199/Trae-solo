import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  User,
  Users,
  Sparkles,
  Palette,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Seal } from '@/components/ui/Seal'
import { WuXingPicker } from '@/components/ui/WuXingPicker'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { WuXingElement } from '@/lib/utils'
import { useAppStore } from '@/store'
import { namingApi } from '@/lib/api'
import type { NamingInput } from '@/types'

const SHI_CHEN_OPTIONS: SelectOption[] = [
  { value: '0', label: '子时 (23:00-01:00)' },
  { value: '1', label: '丑时 (01:00-03:00)' },
  { value: '2', label: '寅时 (03:00-05:00)' },
  { value: '3', label: '卯时 (05:00-07:00)' },
  { value: '4', label: '辰时 (07:00-09:00)' },
  { value: '5', label: '巳时 (09:00-11:00)' },
  { value: '6', label: '午时 (11:00-13:00)' },
  { value: '7', label: '未时 (13:00-15:00)' },
  { value: '8', label: '申时 (15:00-17:00)' },
  { value: '9', label: '酉时 (17:00-19:00)' },
  { value: '10', label: '戌时 (19:00-21:00)' },
  { value: '11', label: '亥时 (21:00-23:00)' },
]

const PROVINCE_OPTIONS: SelectOption[] = [
  { value: 'beijing', label: '北京市' },
  { value: 'shanghai', label: '上海市' },
  { value: 'guangdong', label: '广东省' },
  { value: 'jiangsu', label: '江苏省' },
  { value: 'zhejiang', label: '浙江省' },
  { value: 'sichuan', label: '四川省' },
  { value: 'hubei', label: '湖北省' },
  { value: 'hunan', label: '湖南省' },
  { value: 'shandong', label: '山东省' },
  { value: 'henan', label: '河南省' },
]

const CITY_OPTIONS: Record<string, SelectOption[]> = {
  beijing: [{ value: 'beijing', label: '北京市' }],
  shanghai: [{ value: 'shanghai', label: '上海市' }],
  guangdong: [
    { value: 'guangzhou', label: '广州市' },
    { value: 'shenzhen', label: '深圳市' },
    { value: 'dongguan', label: '东莞市' },
    { value: 'foshan', label: '佛山市' },
  ],
  jiangsu: [
    { value: 'nanjing', label: '南京市' },
    { value: 'suzhou', label: '苏州市' },
    { value: 'wuxi', label: '无锡市' },
    { value: 'hangzhou', label: '杭州市' },
  ],
  zhejiang: [
    { value: 'hangzhou', label: '杭州市' },
    { value: 'ningbo', label: '宁波市' },
    { value: 'wenzhou', label: '温州市' },
    { value: 'shaoxing', label: '绍兴市' },
  ],
  sichuan: [
    { value: 'chengdu', label: '成都市' },
    { value: 'mianyang', label: '绵阳市' },
    { value: 'leshan', label: '乐山市' },
  ],
  hubei: [
    { value: 'wuhan', label: '武汉市' },
    { value: 'yichang', label: '宜昌市' },
    { value: 'xiangyang', label: '襄阳市' },
  ],
  hunan: [
    { value: 'changsha', label: '长沙市' },
    { value: 'zhuzhou', label: '株洲市' },
    { value: 'xiangtan', label: '湘潭市' },
  ],
  shandong: [
    { value: 'jinan', label: '济南市' },
    { value: 'qingdao', label: '青岛市' },
    { value: 'yantai', label: '烟台市' },
  ],
  henan: [
    { value: 'zhengzhou', label: '郑州市' },
    { value: 'luoyang', label: '洛阳市' },
    { value: 'kaifeng', label: '开封市' },
  ],
}

const STYLE_OPTIONS = [
  { value: 'classic', label: '经典' },
  { value: 'modern', label: '现代' },
  { value: 'poetic', label: '诗意' },
  { value: 'grand', label: '大气' },
  { value: 'scholarly', label: '儒雅' },
  { value: 'agile', label: '灵动' },
]

const GENDER_OPTIONS = [
  { value: 'male', label: '男', icon: '♂' },
  { value: 'neutral', label: '中性', icon: '⚥' },
  { value: 'female', label: '女', icon: '♀' },
]

const NAME_LENGTH_OPTIONS = [
  { value: 'single', label: '单字' },
  { value: 'double', label: '双字' },
  { value: 'both', label: '不限' },
]

const STEPS = [
  { step: 1, title: '生辰信息', icon: Calendar },
  { step: 2, title: '姓氏辈分', icon: Users },
  { step: 3, title: '五行偏好', icon: Sparkles },
  { step: 4, title: '风格偏好', icon: Palette },
  { step: 5, title: '生成中', icon: Loader2 },
]

const GENERATING_MESSAGES = [
  '正在校正真太阳时...',
  '正在排定四柱八字...',
  '正在匹配汉字文化库...',
  '正在分析音律和谐度...',
  '正在计算多维评分...',
]

export default function NamingWizard() {
  const navigate = useNavigate()
  const { currentInput, setCurrentInput, resetCurrentInput, setIsGenerating, setBaZiResult, setNameProposals } = useAppStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isLunarCalendar, setIsLunarCalendar] = useState(currentInput?.isLunarCalendar ?? false)
  const [birthDate, setBirthDate] = useState(currentInput?.birthDateTime?.split('T')[0] ?? '')
  const [shiChen, setShiChen] = useState('')
  const [province, setProvince] = useState(currentInput?.birthPlace?.province ?? '')
  const [city, setCity] = useState(currentInput?.birthPlace?.city ?? '')

  const [surname, setSurname] = useState(currentInput?.surname ?? '')
  const [secondSurname, setSecondSurname] = useState(currentInput?.secondSurname ?? '')
  const [useGeneration, setUseGeneration] = useState(!!currentInput?.generationCharacter)
  const [generationCharacter, setGenerationCharacter] = useState(currentInput?.generationCharacter ?? '')
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>(currentInput?.gender ?? 'neutral')

  const [selectedElements, setSelectedElements] = useState<WuXingElement[]>(() => {
    const prefs = currentInput?.fiveElementsPreference
    if (!prefs) return []
    return (Object.keys(prefs) as WuXingElement[]).filter((k) => prefs[k] > 50)
  })

  const [selectedStyles, setSelectedStyles] = useState<string[]>(currentInput?.style ?? [])
  const [nameLength, setNameLength] = useState<'single' | 'double' | 'both'>(currentInput?.nameLength ?? 'double')
  const [forbiddenChars, setForbiddenChars] = useState(currentInput?.forbiddenCharacters?.join(',') ?? '')

  const [generatingIndex, setGeneratingIndex] = useState(0)
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false)

  useEffect(() => {
    if (currentStep !== 5) return
    setIsGeneratingLocal(true)
    setIsGenerating(true)

    let idx = 0
    const messageTimer = setInterval(() => {
      idx = (idx + 1) % GENERATING_MESSAGES.length
      setGeneratingIndex(idx)
    }, 1500)

    const runGeneration = async () => {
      try {
        const birthDateTime = `${birthDate} ${getShiChenTime(shiChen)}`
        const input = buildNamingInput()
        const result = await namingApi.generateNames({ input, count: 20 })
        setBaZiResult(result.baZi)
        setNameProposals(result.proposals)
        clearInterval(messageTimer)
        setIsGenerating(false)
        navigate('/naming/results')
      } catch {
        clearInterval(messageTimer)
        setIsGenerating(false)
        setTimeout(() => navigate('/naming/results'), 1000)
      }
    }

    const fallbackTimer = setTimeout(() => {
      setIsGenerating(false)
      navigate('/naming/results')
    }, 10000)

    runGeneration().catch(() => {})

    return () => {
      clearInterval(messageTimer)
      clearTimeout(fallbackTimer)
      setIsGenerating(false)
    }
  }, [currentStep])

  function getShiChenTime(shiChenVal: string): string {
    const hours = ['23:30', '01:30', '03:30', '05:30', '07:30', '09:30', '11:30', '13:30', '15:30', '17:30', '19:30', '21:30']
    return hours[parseInt(shiChenVal, 10)] || '12:00'
  }

  function buildNamingInput() {
    const fiveElementsPreference: Record<WuXingElement, number> = {
      metal: 50,
      wood: 50,
      water: 50,
      fire: 50,
      earth: 50,
    }
    selectedElements.forEach((el) => {
      fiveElementsPreference[el] = 80
    })

    return {
      birthDateTime: `${birthDate}T${getShiChenTime(shiChen)}`,
      isLunarCalendar,
      birthPlace: {
        province,
        city,
        longitude: 116.4,
        latitude: 39.9,
      },
      surname,
      secondSurname: secondSurname || undefined,
      generationCharacter: useGeneration ? generationCharacter : undefined,
      gender,
      fiveElementsPreference,
      forbiddenCharacters: forbiddenChars ? forbiddenChars.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
      style: selectedStyles as NamingInput['style'],
      nameLength,
    }
  }

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!birthDate) newErrors.birthDate = '请选择出生日期'
      if (!shiChen) newErrors.shiChen = '请选择出生时辰'
    }
    if (step === 2) {
      if (!surname.trim()) newErrors.surname = '请输入姓氏'
      if (useGeneration && !generationCharacter.trim()) newErrors.generationCharacter = '请输入辈分字'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function goNext() {
    if (!validateStep(currentStep)) return
    saveToStore()
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  function goPrev() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function goToStep(step: number) {
    if (step < currentStep) {
      saveToStore()
      setCurrentStep(step)
    }
  }

  function saveToStore() {
    setCurrentInput(buildNamingInput())
  }

  const cityOptions = province ? CITY_OPTIONS[province] || [] : []

  return (
    <div className="relative z-10 min-h-screen py-8">
      <div className="container max-w-3xl">
        {/* Step Nav */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-2xl font-bold ink-text-gradient">智能起名向导</h1>
            <span className="text-sm text-ink-500">
              第 {currentStep} 步 / 共 5 步
            </span>
          </div>
          <div className="relative flex items-center gap-1">
            <div className="hidden md:block absolute top-6 left-8 right-8 h-0.5 bg-ink-200" />
            {STEPS.map((s) => {
              const Icon = s.icon
              const isActive = currentStep === s.step
              const isDone = currentStep > s.step
              const clickable = s.step < currentStep
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => goToStep(s.step)}
                  disabled={!clickable}
                  className={cn(
                    'relative z-10 flex-1 flex flex-col items-center gap-2',
                    clickable && 'cursor-pointer hover:opacity-80',
                    !clickable && 'cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                      isActive && 'bg-jade-700 border-jade-700 text-ink-50 shadow-jade-glow',
                      isDone && 'bg-jade-100 border-jade-500 text-jade-700',
                      !isActive && !isDone && 'bg-ink-50 border-ink-300 text-ink-400'
                    )}
                  >
                    {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-jade-700' : isDone ? 'text-ink-700' : 'text-ink-400'
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Seal text="壹" size="sm" />
                  <h2 className="font-serif text-xl font-bold text-ink-800">宝宝生辰信息</h2>
                </div>

                <div className="flex items-center gap-4 p-4 bg-ink-50 rounded-lg">
                  <span className="text-sm font-medium text-ink-700">历法：</span>
                  <div className="flex bg-ink-100 rounded-md p-1">
                    <button
                      type="button"
                      onClick={() => setIsLunarCalendar(false)}
                      className={cn(
                        'px-4 py-1.5 text-sm rounded-sm transition-all',
                        !isLunarCalendar ? 'bg-ink-50 text-jade-700 font-medium shadow-sm' : 'text-ink-500'
                      )}
                    >
                      公历
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLunarCalendar(true)}
                      className={cn(
                        'px-4 py-1.5 text-sm rounded-sm transition-all',
                        isLunarCalendar ? 'bg-ink-50 text-jade-700 font-medium shadow-sm' : 'text-ink-500'
                      )}
                    >
                      农历
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="出生日期"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    error={errors.birthDate}
                    leftIcon={<Calendar className="h-4 w-4" />}
                  />
                  <Select
                    label="出生时辰"
                    value={shiChen}
                    onChange={(e) => setShiChen(e.target.value)}
                    options={SHI_CHEN_OPTIONS}
                    placeholder="请选择时辰"
                    error={errors.shiChen}
                  />
                </div>

                <div className="p-4 bg-jade-50/50 rounded-lg border border-jade-200">
                  <p className="text-sm text-jade-700 font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    出生地（选填，用于真太阳时校正）
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="省份"
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value)
                        setCity('')
                      }}
                      options={PROVINCE_OPTIONS}
                      placeholder="请选择省份"
                    />
                    <Select
                      label="城市"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      options={cityOptions}
                      placeholder="请先选择省份"
                      disabled={!province}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Seal text="贰" size="sm" />
                  <h2 className="font-serif text-xl font-bold text-ink-800">姓氏与辈分</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="姓氏 *"
                    placeholder="例如：李"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    error={errors.surname}
                    maxLength={2}
                    leftIcon={<User className="h-4 w-4" />}
                  />
                  <Input
                    label="第二姓氏（双姓可选）"
                    placeholder="例如：欧阳"
                    value={secondSurname}
                    onChange={(e) => setSecondSurname(e.target.value)}
                    maxLength={2}
                  />
                </div>

                <div className="p-4 bg-ink-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-ink-700">使用辈分字</span>
                    <button
                      type="button"
                      onClick={() => setUseGeneration(!useGeneration)}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-all',
                        useGeneration ? 'bg-jade-600' : 'bg-ink-300'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                          useGeneration ? 'left-6' : 'left-0.5'
                        )}
                      />
                    </button>
                  </div>
                  {useGeneration && (
                    <Input
                      label="辈分字"
                      placeholder="家族辈分用字"
                      value={generationCharacter}
                      onChange={(e) => setGenerationCharacter(e.target.value)}
                      error={errors.generationCharacter}
                      maxLength={1}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-3">宝宝性别</label>
                  <div className="grid grid-cols-3 gap-3">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value as 'male' | 'female' | 'neutral')}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all text-center',
                          gender === opt.value
                            ? 'border-jade-500 bg-jade-50 text-jade-700'
                            : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-ink-300'
                        )}
                      >
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        <div className="text-sm font-medium">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Seal text="叁" size="sm" />
                  <h2 className="font-serif text-xl font-bold text-ink-800">五行偏好</h2>
                </div>

                <div className="p-4 bg-jade-50/50 rounded-lg border border-jade-200 mb-6">
                  <p className="text-sm text-jade-700">
                    选择希望名字补益的五行属性，系统将优先匹配对应五行汉字。可不选，系统将根据八字自动推荐。
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <WuXingPicker
                    value={selectedElements}
                    onChange={setSelectedElements}
                    size="lg"
                    multi
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedElements.length === 0 && (
                      <Badge variant="default">未选择（将根据八字自动推荐）</Badge>
                    )}
                    {selectedElements.map((el) => (
                      <Badge key={el} variant="wuxing" element={el} dot />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Seal text="肆" size="sm" />
                  <h2 className="font-serif text-xl font-bold text-ink-800">风格偏好</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-3">名字风格（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => {
                      const selected = selectedStyles.includes(style.value)
                      return (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setSelectedStyles(selectedStyles.filter((s) => s !== style.value))
                            } else {
                              setSelectedStyles([...selectedStyles, style.value])
                            }
                          }}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                            selected
                              ? 'bg-cinnabar-50 border-cinnabar-500 text-cinnabar-700'
                              : 'bg-ink-50 border-ink-200 text-ink-600 hover:border-ink-300'
                          )}
                        >
                          {style.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-3">名字长度</label>
                  <div className="grid grid-cols-3 gap-3">
                    {NAME_LENGTH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNameLength(opt.value as 'single' | 'double' | 'both')}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-center',
                          nameLength === opt.value
                            ? 'border-jade-500 bg-jade-50 text-jade-700'
                            : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-ink-300'
                        )}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="禁忌字（逗号分隔）"
                  placeholder="例如：伟,芳,强"
                  value={forbiddenChars}
                  onChange={(e) => setForbiddenChars(e.target.value)}
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-fade-in">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '3s' }}>
                    <defs>
                      <linearGradient id="inkSpin" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a3a3a" stopOpacity="0" />
                        <stop offset="50%" stopColor="#3a7a71" />
                        <stop offset="100%" stopColor="#b8860b" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e8ddc9" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#inkSpin)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="150 100"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Seal text="名" size="lg" />
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="font-serif text-xl font-bold text-ink-800">正在为您生成佳名</h3>
                  <div className="flex items-center justify-center gap-2 text-jade-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{GENERATING_MESSAGES[generatingIndex]}</span>
                  </div>
                </div>

                <div className="w-full max-w-md space-y-2">
                  {GENERATING_MESSAGES.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-2 text-sm transition-all',
                        idx <= generatingIndex ? 'text-jade-700' : 'text-ink-300'
                      )}
                    >
                      {idx < generatingIndex ? (
                        <Check className="h-4 w-4" />
                      ) : idx === generatingIndex ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-ink-300" />
                      )}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {currentStep < 5 && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-ink-200">
                <Button
                  variant="ghost"
                  onClick={currentStep === 1 ? () => navigate('/') : goPrev}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  {currentStep === 1 ? '返回首页' : '上一步'}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={goNext}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {currentStep === 4 ? '开始生成' : '下一步'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
