import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ArrowRight, Sparkles, Star, CheckCircle, Users, Clock, Palette, ShoppingCart, Scale, Hammer, FileCheck, Home } from 'lucide-react'
import StepNav from '@/components/StepNav'
import RenovationCompanyCard from '@/components/RenovationCompanyCard'
import { stableImageUrl } from '@/lib/media'

const demoCompanies = [
  { id: 1, name: '东易日盛装饰', certificationStatus: 'approved', qualificationLevel: '一级资质', casesCount: 256, rating: 4.9, priceRange: '10-50万', description: '中国家装行业知名品牌，专注高品质家装服务20年，设计施工双一级资质。' },
  { id: 2, name: '业之峰装饰', certificationStatus: 'approved', qualificationLevel: '甲级设计', casesCount: 189, rating: 4.8, priceRange: '8-40万', description: '环保装修领跑者，专注中高端装修，蓝钻工程体系保障施工品质。' },
  { id: 3, name: '金螳螂家装', certificationStatus: 'approved', qualificationLevel: '上市企业', casesCount: 342, rating: 4.9, priceRange: '15-80万', description: '上市公司背景，公装家装双龙头，一站式整装服务。' },
  { id: 4, name: '尚品本色装饰', certificationStatus: 'pending', qualificationLevel: '二级资质', casesCount: 98, rating: 4.6, priceRange: '6-25万', description: '高性价比之选，套餐式装修，预算透明无增项。' },
  { id: 5, name: '生活家装饰', certificationStatus: 'approved', qualificationLevel: '整装专家', casesCount: 215, rating: 4.7, priceRange: '12-45万', description: '健康整装倡导者，全球集采供应链，德系工艺标准。' },
]

const demoDesigners = [
  { id: 1, name: '王设计师', title: '首席设计师', style: '现代简约、北欧', experience: '10年', rating: 4.9, cases: 56, avatar: 'https://picsum.photos/seed/designer1/100/100' },
  { id: 2, name: '李设计师', title: '资深设计师', style: '新中式、美式', experience: '8年', rating: 4.8, cases: 42, avatar: 'https://picsum.photos/seed/designer2/100/100' },
  { id: 3, name: '张设计师', title: '设计总监', style: '轻奢、法式', experience: '12年', rating: 5.0, cases: 78, avatar: 'https://picsum.photos/seed/designer3/100/100' },
  { id: 4, name: '陈设计师', title: '主创设计师', style: '工业风、日式', experience: '6年', rating: 4.7, cases: 34, avatar: 'https://picsum.photos/seed/designer4/100/100' },
]

const serviceSteps = [
  { step: 1, title: '设计', desc: '免费量房，方案设计', icon: Sparkles },
  { step: 2, title: '选材', desc: '全球集采，品质保障', icon: Sparkles },
  { step: 3, title: '施工', desc: '标准工艺，全程监控', icon: Sparkles },
  { step: 4, title: '监理', desc: '节点验收，质量保障', icon: CheckCircle },
  { step: 5, title: '验收', desc: '整体验收，售后无忧', icon: CheckCircle },
]

export default function Renovation() {
  const [activeStep, setActiveStep] = useState(1)
  const [notice, setNotice] = useState('')

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 5000)
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-600 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.3),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">装修服务</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            从设计到入住，一站式装修服务，让您的家更美好
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <StepNav activeStep={activeStep} onStepClick={setActiveStep} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.2),transparent_50%)]" />
          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">开始您的装修之旅</h2>
              <p className="text-white/80 text-lg">5步闭环流程，从方案设计到验收交付，全程透明可追溯</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: 1, title: '方案设计', icon: Palette, desc: '免费量房，专属设计', to: '#design', color: 'from-rose-500 to-pink-500' },
                { step: 2, title: '建材选购', icon: ShoppingCart, desc: '全球集采，工厂直供', to: '/materials', color: 'from-amber-500 to-orange-500' },
                { step: 3, title: '报价对比', icon: Scale, desc: '智能分析，省钱避坑', to: '/renovation/quote-compare', color: 'from-blue-500 to-indigo-500' },
                { step: 4, title: '施工监理', icon: Hammer, desc: '节点验收，全程监控', to: '#construction', color: 'from-emerald-500 to-teal-500' },
                { step: 5, title: '验收交付', icon: FileCheck, desc: '节点验收，售后保障', to: '#acceptance', color: 'from-purple-500 to-violet-500' },
              ].map((item) => (
                <Link
                  key={item.step}
                  to={item.to}
                  onClick={(e) => {
                    if (item.to.startsWith('#')) {
                      e.preventDefault()
                      setActiveStep(item.step)
                      showNotice(`已进入${item.title}环节，${item.desc}`)
                    }
                  }}
                  className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center hover:bg-white/20 transition-all border border-white/20 hover:border-white/40"
                >
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon size={28} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-white/70">{item.desc}</p>
                  <div className="mt-3 text-white/60 text-xs flex items-center justify-center gap-1 group-hover:text-white transition-colors">
                    立即开始 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {notice && (
          <div className="mb-8 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700 shadow-sm">
            <CheckCircle size={18} strokeWidth={1.5} />
            {notice}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
          {serviceSteps.map((item) => (
            <div key={item.step} className="bg-white rounded-xl p-5 shadow-md text-center card-hover">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${item.step <= activeStep ? 'bg-teal-100' : 'bg-slate-100'}`}>
                <item.icon size={24} className={item.step <= activeStep ? 'text-teal-600' : 'text-slate-400'} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-6 bg-teal-600 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">认证装修公司</h2>
              </div>
              <p className="text-slate-500 ml-3">严选优质装修公司，平台认证，品质保障</p>
            </div>
          </div>

          <div className="space-y-4">
            {demoCompanies.map((company) => (
              <RenovationCompanyCard key={company.id} {...company} />
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">专业设计师团队</h2>
              </div>
              <p className="text-slate-500 ml-3">资深设计师一对一服务，打造专属理想家</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoDesigners.map((designer) => (
              <div key={designer.id} className="bg-white rounded-xl p-5 shadow-md card-hover text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-teal-100">
                  <img src={stableImageUrl(designer.avatar, designer.name)} alt={designer.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{designer.name}</h3>
                <p className="text-sm text-teal-600 mb-2">{designer.title}</p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Star size={14} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
                  <span className="font-medium text-sm">{designer.rating}</span>
                  <span className="text-xs text-slate-400">· {designer.experience}经验</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">擅长风格：{designer.style}</p>
                <p className="text-xs text-slate-500 mb-4">完成案例：{designer.cases}套</p>
                <button
                  onClick={() => showNotice(`${designer.name}的预约咨询已提交，设计助理将回电确认量房时间`)}
                  className="w-full py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                >
                  预约咨询
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">装修报价对比</h2>
              </div>
              <p className="text-slate-500 ml-3">上传多家报价单，智能对比分析，帮您省钱避坑</p>
            </div>
            <Link to="/renovation/quote-compare" className="btn-primary flex items-center gap-2">
              立即使用
              <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-amber-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-2xl flex items-center justify-center">
                  <Users size={28} className="text-teal-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">多公司报价</h3>
                <p className="text-sm text-slate-500">支持上传3-5家装修公司报价单进行横向对比</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-amber-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">智能分析</h3>
                <p className="text-sm text-slate-500">自动识别漏项、增项、价格差异，生成对比报告</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Clock size={28} className="text-emerald-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">省钱省心</h3>
                <p className="text-sm text-slate-500">平均帮用户节省15-20%装修预算，避免套路</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">建材选购</h2>
              </div>
              <p className="text-slate-500 ml-3">严选全球建材品牌，工厂直供，品质有保障</p>
            </div>
            <Link to="/materials" className="btn-primary flex items-center gap-2">
              浏览建材
              <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-md card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-rose-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🪵</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">地板瓷砖</h3>
              <p className="text-sm text-slate-500">木地板/瓷砖/石材</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🚪</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">门窗定制</h3>
              <p className="text-sm text-slate-500">室内门/防盗门/窗户</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🧱</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">厨房卫浴</h3>
              <p className="text-sm text-slate-500">橱柜/洁具/五金</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">灯具开关</h3>
              <p className="text-sm text-slate-500">灯饰/开关/插座</p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900">施工进度追踪</h2>
              </div>
              <p className="text-slate-500 ml-3">全程可视化监控，节点验收可复查，保障施工质量</p>
            </div>
            <button
              onClick={() => showNotice('正在为您加载施工进度看板，监理将上传每日施工日志')}
              className="btn-primary flex items-center gap-2"
            >
              查看进度
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">当前施工阶段</p>
                  <p className="text-white font-bold text-lg">泥瓦工阶段 · 第12天</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">总进度</p>
                  <p className="text-white font-bold text-2xl">65%</p>
                </div>
              </div>
              <div className="w-full bg-blue-400/30 rounded-full h-2 mt-3">
                <div className="bg-white h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { status: 'done', title: '拆改工程', date: '1月5日-1月8日', desc: '墙体拆除、新建完成，验收通过' },
                  { status: 'done', title: '水电改造', date: '1月9日-1月15日', desc: '水电布管完成，打压测试合格' },
                  { status: 'current', title: '泥瓦工程', date: '1月16日-1月25日', desc: '墙地面找平、瓷砖铺贴中，每日上传施工日志' },
                  { status: 'pending', title: '木工工程', date: '1月26日-2月2日', desc: '吊顶、柜体制作，待材料进场' },
                  { status: 'pending', title: '油漆工程', date: '2月3日-2月10日', desc: '墙面批灰、乳胶漆涂刷' },
                  { status: 'pending', title: '竣工验收', date: '2月11日', desc: '整体验收、空气质量检测、交付' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.status === 'done' ? 'bg-teal-100 text-teal-600' :
                        item.status === 'current' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {item.status === 'done' ? <CheckCircle size={20} strokeWidth={1.5} /> :
                         item.status === 'current' ? <Clock size={20} strokeWidth={1.5} /> :
                         <span className="text-sm font-medium">{index + 1}</span>}
                      </div>
                      {index < 5 && (
                        <div className={`w-0.5 flex-1 ${item.status === 'done' ? 'bg-teal-200' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${item.status === 'current' ? 'text-blue-600' : 'text-slate-900'}`}>
                          {item.title}
                        </h4>
                        <span className="text-xs text-slate-400">{item.date}</span>
                      </div>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                      {item.status === 'current' && (
                        <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                          查看施工日志 & photos →
                        </button>
                      )}
                      {item.status === 'done' && (
                        <button className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium">
                          查看验收记录 →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好开始您的装修之旅了吗？</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            立即发布装修需求，免费获取3家装修公司报价和设计方案
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => showNotice('装修需求已提交，系统将匹配3家认证公司并生成报价跟进任务')}
              className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-lg flex items-center gap-2"
            >
              发布装修需求
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
            <Link
              to="/renovation/quote-compare"
              className="px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
            >
              对比装修报价
              <ChevronRight size={20} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
