import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Video, LayoutTemplate, Check, ArrowLeft, Upload, Camera, X } from 'lucide-react'
import { useStore } from '@/store'
import { townships } from '@/data'
import { cn } from '@/lib/utils'

type TemplateType = 'article' | 'video' | 'structured'
type StructuredSub = 'job' | 'housing'

const templates: { type: TemplateType; icon: typeof FileText; label: string; desc: string }[] = [
  { type: 'article', icon: FileText, label: '图文发布', desc: '图片+文字，分享本地生活' },
  { type: 'video', icon: Video, label: '短视频发布', desc: '拍摄短视频，记录身边事' },
  { type: 'structured', icon: LayoutTemplate, label: '结构化模板', desc: '招聘、房屋等结构化信息' },
]

export default function Publish() {
  const { currentTownship } = useStore()
  const [selectedType, setSelectedType] = useState<TemplateType | null>(null)
  const [structuredSub, setStructuredSub] = useState<StructuredSub | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [township, setTownship] = useState(currentTownship)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [jobForm, setJobForm] = useState({ position: '', salary: '', company: '', requirements: '', contact: '' })
  const [housingForm, setHousingForm] = useState({ title: '', price: '', area: '', deposit: '', furniture: '', contact: '' })

  const handleBack = () => {
    if (structuredSub) {
      setStructuredSub(null)
      setErrors({})
    } else {
      setSelectedType(null)
      setErrors({})
    }
  }

  const addTags = (val: string) => {
    const parts = val.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    const newTags = [...new Set([...tags, ...parts])]
    setTags(newTags)
    setTagInput('')
  }

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

  const validateArticle = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '请输入标题'
    if (!content.trim()) e.content = '请输入内容'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateJob = () => {
    const e: Record<string, string> = {}
    if (!jobForm.position.trim()) e.position = '请输入职位名称'
    if (!jobForm.salary.trim()) e.salary = '请输入薪资待遇'
    if (!jobForm.company.trim()) e.company = '请输入公司名称'
    if (!jobForm.contact.trim()) e.contact = '请输入联系方式'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateHousing = () => {
    const e: Record<string, string> = {}
    if (!housingForm.title.trim()) e.title = '请输入标题'
    if (!housingForm.price.trim()) e.price = '请输入价格'
    if (!housingForm.area.trim()) e.area = '请输入面积'
    if (!housingForm.contact.trim()) e.contact = '请输入联系方式'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    let valid = false
    if (selectedType === 'article') valid = validateArticle()
    else if (selectedType === 'structured' && structuredSub === 'job') valid = validateJob()
    else if (selectedType === 'structured' && structuredSub === 'housing') valid = validateHousing()
    if (valid) setShowSuccess(true)
  }

  const renderField = (label: string, required: boolean, field: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-rock-900 mb-1">
        {required && <span className="text-ember-400 mr-1">*</span>}{label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors',
          errors[field] ? 'border-ember-400 bg-ember-50' : 'border-rock-200 focus:border-jade-500'
        )}
      />
      {errors[field] && <p className="text-ember-400 text-xs mt-1">{errors[field]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-rock-50 pb-8">
      <AnimatePresence mode="wait">
        {!selectedType ? (
          <motion.div key="templates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 pt-6">
            <h1 className="text-xl font-serif font-semibold text-rock-900 mb-1">选择发布模板</h1>
            <p className="text-sm text-rock-500 mb-6">选择适合的模板，快速发布信息</p>
            <div className="space-y-4">
              {templates.map((t, i) => (
                <motion.button
                  key={t.type}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedType(t.type)}
                  className="w-full relative flex items-center gap-4 p-5 rounded-2xl border-2 border-rock-200 bg-white hover:border-jade-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-jade-50 flex items-center justify-center">
                    <t.icon className="w-6 h-6 text-jade-500" />
                  </div>
                  <div>
                    <p className="font-medium text-rock-900">{t.label}</p>
                    <p className="text-sm text-rock-500">{t.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="px-4 pt-4">
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-rock-500 mb-4 hover:text-jade-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回选择
            </button>

            {selectedType === 'article' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">
                    <span className="text-ember-400 mr-1">*</span>标题
                  </label>
                  <input
                    value={title} onChange={e => setTitle(e.target.value.slice(0, 50))} maxLength={50}
                    placeholder="请输入标题"
                    className={cn('w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors', errors.title ? 'border-ember-400 bg-ember-50' : 'border-rock-200 focus:border-jade-500')}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.title && <p className="text-ember-400 text-xs">{errors.title}</p>}
                    <p className="text-xs text-rock-400 ml-auto">{title.length}/50</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">
                    <span className="text-ember-400 mr-1">*</span>内容
                  </label>
                  <textarea
                    value={content} onChange={e => setContent(e.target.value.slice(0, 500))} maxLength={500}
                    placeholder="请输入内容" rows={4}
                    className={cn('w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none', errors.content ? 'border-ember-400 bg-ember-50' : 'border-rock-200 focus:border-jade-500')}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.content && <p className="text-ember-400 text-xs">{errors.content}</p>}
                    <p className="text-xs text-rock-400 ml-auto">{content.length}/500</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">图片</label>
                  <div className="border-2 border-dashed border-rock-300 rounded-xl p-6 flex flex-col items-center justify-center text-rock-400 hover:border-jade-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mb-2" />
                    <p className="text-sm">点击上传图片</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">标签</label>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTags(tagInput) } }}
                    onBlur={() => addTags(tagInput)}
                    placeholder="输入标签，逗号分隔"
                    className="w-full px-3 py-2 rounded-lg border border-rock-200 text-sm outline-none focus:border-jade-500 transition-colors"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-jade-50 text-jade-700 text-xs border border-jade-200">
                          {t}
                          <button onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">乡镇</label>
                  <select value={township} onChange={e => setTownship(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-rock-200 text-sm outline-none focus:border-jade-500 transition-colors bg-white">
                    {townships.map(t => <option key={t.code} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {selectedType === 'video' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="border-2 border-dashed border-rock-300 rounded-2xl p-10 flex flex-col items-center justify-center text-rock-400 hover:border-jade-400 transition-colors cursor-pointer">
                  <Video className="w-12 h-12 mb-3" />
                  <p className="text-sm">点击拍摄或上传短视频</p>
                  <p className="text-xs mt-1">支持 MP4、MOV 格式</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-rock-900 mb-1">乡镇</label>
                  <select value={township} onChange={e => setTownship(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-rock-200 text-sm outline-none focus:border-jade-500 transition-colors bg-white">
                    {townships.map(t => <option key={t.code} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {selectedType === 'structured' && !structuredSub && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-lg font-serif font-semibold text-rock-900">选择信息类型</h2>
                {([{ key: 'job' as const, label: '招聘信息', desc: '发布招聘职位，找到合适人才' }, { key: 'housing' as const, label: '房屋租售', desc: '发布租房售房信息' }]).map((s, i) => (
                  <motion.button
                    key={s.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setStructuredSub(s.key)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-rock-200 bg-white hover:border-jade-500 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-jade-50 flex items-center justify-center">
                      {s.key === 'job' ? <FileText className="w-5 h-5 text-jade-500" /> : <LayoutTemplate className="w-5 h-5 text-jade-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-rock-900">{s.label}</p>
                      <p className="text-sm text-rock-500">{s.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {selectedType === 'structured' && structuredSub === 'job' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-lg font-serif font-semibold text-rock-900">招聘信息</h2>
                {renderField('职位名称', true, 'position', jobForm.position, v => setJobForm({ ...jobForm, position: v }), '如：收银员、瓦工')}
                {renderField('薪资待遇', true, 'salary', jobForm.salary, v => setJobForm({ ...jobForm, salary: v }), '如：3000-5000元/月')}
                {renderField('公司名称', true, 'company', jobForm.company, v => setJobForm({ ...jobForm, company: v }), '请输入公司名称')}
                {renderField('任职要求', false, 'requirements', jobForm.requirements, v => setJobForm({ ...jobForm, requirements: v }), '请输入任职要求')}
                {renderField('联系方式', true, 'contact', jobForm.contact, v => setJobForm({ ...jobForm, contact: v }), '手机号或微信号')}
                <div className="border-2 border-dashed border-rock-300 rounded-xl p-4 flex flex-col items-center justify-center text-rock-400 hover:border-jade-400 transition-colors cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <p className="text-sm">上传证件照</p>
                </div>
              </motion.div>
            )}

            {selectedType === 'structured' && structuredSub === 'housing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-lg font-serif font-semibold text-rock-900">房屋租售</h2>
                {renderField('标题', true, 'title', housingForm.title, v => setHousingForm({ ...housingForm, title: v }), '如：精装两室一厅出租')}
                {renderField('价格', true, 'price', housingForm.price, v => setHousingForm({ ...housingForm, price: v }), '如：1200元/月')}
                {renderField('面积', true, 'area', housingForm.area, v => setHousingForm({ ...housingForm, area: v }), '如：78平方米')}
                {renderField('押金方式', false, 'deposit', housingForm.deposit, v => setHousingForm({ ...housingForm, deposit: v }), '如：押一付三')}
                {renderField('家具配套', false, 'furniture', housingForm.furniture, v => setHousingForm({ ...housingForm, furniture: v }), '如：空调、洗衣机、冰箱')}
                {renderField('联系方式', true, 'contact', housingForm.contact, v => setHousingForm({ ...housingForm, contact: v }), '手机号或微信号')}
                <div className="border-2 border-dashed border-rock-300 rounded-xl p-4 flex flex-col items-center justify-center text-rock-400 hover:border-jade-400 transition-colors cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <p className="text-sm">上传证件照</p>
                </div>
              </motion.div>
            )}

            {selectedType !== 'structured' || structuredSub ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleSubmit}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-jade-500 to-jade-600 text-white font-medium shadow-lg shadow-jade-500/25 active:scale-[0.98] transition-transform"
              >
                发布
              </motion.button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => { setShowSuccess(false); setSelectedType(null); setStructuredSub(null); setTitle(''); setContent(''); setTags([]); setJobForm({ position: '', salary: '', company: '', requirements: '', contact: '' }); setHousingForm({ title: '', price: '', area: '', deposit: '', furniture: '', contact: '' }); setErrors({}) }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl mx-4"
            >
              <div className="w-16 h-16 rounded-full bg-jade-50 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-jade-500" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-rock-900 mb-1">发布成功</h3>
              <p className="text-sm text-rock-500 mb-6">您的信息已提交审核</p>
              <button
                onClick={() => { setShowSuccess(false); setSelectedType(null); setStructuredSub(null); setTitle(''); setContent(''); setTags([]); setJobForm({ position: '', salary: '', company: '', requirements: '', contact: '' }); setHousingForm({ title: '', price: '', area: '', deposit: '', furniture: '', contact: '' }); setErrors({}) }}
                className="px-8 py-2 rounded-xl bg-jade-500 text-white text-sm font-medium"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
