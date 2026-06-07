import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, CheckCircle, Clock, DollarSign, Phone, ShieldCheck, Star, Users } from 'lucide-react'

const companies = [
  {
    id: 1,
    name: '东易日盛装饰',
    certificationStatus: 'approved',
    qualificationLevel: '一级资质',
    casesCount: 256,
    rating: 4.9,
    priceRange: '10-50万',
    phone: '400-800-1001',
    description: '中国家装行业知名品牌，专注高品质家装服务20年，设计施工双一级资质。',
    services: ['免费量房', '全案设计', '标准施工', '节点验收', '售后质保'],
  },
  {
    id: 2,
    name: '业之峰装饰',
    certificationStatus: 'approved',
    qualificationLevel: '甲级设计',
    casesCount: 189,
    rating: 4.8,
    priceRange: '8-40万',
    phone: '400-800-1002',
    description: '环保装修领跑者，专注中高端装修，蓝钻工程体系保障施工品质。',
    services: ['环保材料', '报价审核', '工地巡检', '软装搭配', '售后维保'],
  },
  {
    id: 3,
    name: '金螳螂家装',
    certificationStatus: 'approved',
    qualificationLevel: '上市企业',
    casesCount: 342,
    rating: 4.9,
    priceRange: '15-80万',
    phone: '400-800-1003',
    description: '上市公司背景，公装家装双龙头，一站式整装服务。',
    services: ['整装套餐', '主材集采', '工艺交底', '工程监理', '竣工验收'],
  },
  {
    id: 4,
    name: '尚品本色装饰',
    certificationStatus: 'pending',
    qualificationLevel: '二级资质',
    casesCount: 98,
    rating: 4.6,
    priceRange: '6-25万',
    phone: '400-800-1004',
    description: '高性价比之选，套餐式装修，预算透明无增项。',
    services: ['套餐报价', '快速开工', '预算复核', '材料清单', '基础质保'],
  },
  {
    id: 5,
    name: '生活家装饰',
    certificationStatus: 'approved',
    qualificationLevel: '整装专家',
    casesCount: 215,
    rating: 4.7,
    priceRange: '12-45万',
    phone: '400-800-1005',
    description: '健康整装倡导者，全球集采供应链，德系工艺标准。',
    services: ['健康整装', '全球集采', '德系工艺', '软装配套', '长期维保'],
  },
]

export default function RenovationCompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const [notice, setNotice] = useState('')

  const company = companies.find((item) => item.id === Number(id)) || companies[0]
  const isCertified = company.certificationStatus === 'approved'

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/renovation" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mb-6">
          <ArrowLeft size={16} strokeWidth={1.5} />
          返回装修服务
        </Link>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-amber-50 text-3xl font-bold text-teal-600">
                {company.name.charAt(0)}
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                  <span className={isCertified ? 'rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700' : 'rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700'}>
                    {isCertified ? '平台认证' : '认证审核中'}
                  </span>
                </div>
                <p className="text-slate-600">{company.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Award size={16} className="text-teal-600" strokeWidth={1.5} />
                    {company.qualificationLevel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star size={16} className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
                    {company.rating}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={16} className="text-blue-500" strokeWidth={1.5} />
                    {company.casesCount} 个案例
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <DollarSign size={16} className="text-amber-500" strokeWidth={1.5} />
                    {company.priceRange}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-slate-50 p-5 md:w-64">
              <p className="text-sm text-slate-500">咨询电话</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{company.phone}</p>
              <button
                onClick={() => setNotice(`${company.name} 已收到预约需求，设计顾问将在30分钟内联系您`)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Phone size={18} strokeWidth={1.5} />
                预约咨询
              </button>
            </div>
          </div>

          {notice && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
              <CheckCircle size={18} strokeWidth={1.5} />
              {notice}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <ShieldCheck className="mb-3 h-7 w-7 text-teal-600" strokeWidth={1.5} />
              <h3 className="font-semibold text-slate-900">资质核验</h3>
              <p className="mt-2 text-sm text-slate-600">营业执照、施工资质、工地质检记录均可追踪。</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <Clock className="mb-3 h-7 w-7 text-amber-500" strokeWidth={1.5} />
              <h3 className="font-semibold text-slate-900">节点验收</h3>
              <p className="mt-2 text-sm text-slate-600">水电、泥木、油漆、竣工阶段均有验收清单。</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <CheckCircle className="mb-3 h-7 w-7 text-green-500" strokeWidth={1.5} />
              <h3 className="font-semibold text-slate-900">售后保障</h3>
              <p className="mt-2 text-sm text-slate-600">质保、维修和投诉处理流程在平台留痕。</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">服务能力</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {company.services.map((service) => (
                <span key={service} className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
