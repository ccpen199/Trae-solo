import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  FileText,
  Gavel,
  ClipboardList,
  Search,
  Filter,
  Download,
  Eye,
  ChevronRight,
  Clock,
  Shield,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Stethoscope,
  Building2,
  AlertTriangle,
  FileSignature,
  Lock,
} from 'lucide-react';
import { mockDocuments } from '@/mock/data';
import { formatDate, cn } from '@/utils';

const services = [
  {
    icon: FileCheck,
    title: '产权尽调报告',
    desc: '全面核查产权状态、抵押、查封、租赁等信息',
    price: '¥1,999起',
    features: ['产权信息核查', '抵押查封查询', '租赁关系排查', '欠费情况调查', '专业律师审核'],
    color: 'primary',
  },
  {
    icon: Building2,
    title: '房屋实地勘察',
    desc: '专业团队上门拍照、测量、核实房屋实际状况',
    price: '¥2,999起',
    features: ['实地拍照录像', 'VR全景制作', '户型图绘制', '装修状况评估', '周边配套调研'],
    color: 'gold',
  },
  {
    icon: Gavel,
    title: '全程代拍服务',
    desc: '专业顾问一对一服务，全程协助参与竞拍',
    price: '成交价1%',
    features: ['标的筛选推荐', '出价策略指导', '竞价全程代办', '保证金代缴', '过户手续代办'],
    color: 'success',
  },
  {
    icon: FileSignature,
    title: '电子签约存证',
    desc: '司法认可的电子签名服务，交易文件安全存证',
    price: '¥599/次',
    features: ['CA数字证书', '司法存证认可', '文件加密存储', '签署时间戳', '区块链存证'],
    color: 'primary',
  },
];

const docTypes = [
  { value: 'all', label: '全部文档' },
  { value: 'report', label: '调查报告' },
  { value: 'assessment', label: '评估报告' },
  { value: 'notice', label: '公告文书' },
  { value: 'verdict', label: '法律文书' },
];

const faqs = [
  {
    q: '什么是司法拍卖房产？',
    a: '司法拍卖房产是指人民法院在民事案件强制执行程序中，按程序自行进行或委托拍卖公司公开处理债务人的房产，以清偿债权人债权。',
  },
  {
    q: '法拍房有什么风险？',
    a: '法拍房可能存在的风险包括：产权不清、有抵押查封、有长期租约、户口无法迁出、欠缴税费物业费、无法实际交付等。建议竞拍前做好充分尽调。',
  },
  {
    q: '购买法拍房可以贷款吗？',
    a: '大部分法拍房需要全款支付，部分城市和银行合作提供法拍房按揭贷款服务。具体需咨询银行或平台工作人员。',
  },
  {
    q: '竞拍成功后多久可以过户？',
    a: '通常在支付全部尾款后，法院会出具协助执行通知书和裁定书，凭此可到不动产登记中心办理过户。整个过程大约需要1-3个月。',
  },
  {
    q: '尽调报告的有效期是多久？',
    a: '尽调报告的有效期一般为30天，因为房产的产权状态、欠费情况等可能随时变化。建议在竞拍前再次确认关键信息。',
  },
];

export default function DueDiligence() {
  const [activeDocType, setActiveDocType] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredDocs = mockDocuments.filter((doc) => {
    if (activeDocType !== 'all' && doc.type !== activeDocType) return false;
    if (searchKeyword && !doc.title.includes(searchKeyword)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 bg-gold-500/20 text-gold-300 text-sm font-medium rounded-full mb-6 border border-gold-500/30">
              <Shield className="w-4 h-4 inline mr-1" />
              专业尽调 · 透明交易 · 安全保障
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
              专业<span className="text-gradient-gold">尽调服务</span>
              <br />
              让法拍更安心
            </h1>
            <p className="text-lg text-primary-200 mb-10">
              资深律师团队 + 房产专业人士，提供全方位深度尽调，
              <br className="hidden md:block" />
              帮您全面把控风险，放心参与每一次竞拍
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-gold w-full sm:w-auto justify-center">
                立即预约尽调
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button className="px-6 py-2.5 border-2 border-white/30 text-white font-medium rounded-md hover:bg-white/10 transition-colors w-full sm:w-auto">
                查看服务介绍
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 -mt-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '3,000+', label: '累计尽调项目', icon: FileCheck },
              { value: '50+', label: '合作法院', icon: Gavel },
              { value: '98.5%', label: '客户满意度', icon: Award },
              { value: '100+', label: '专业团队', icon: Users },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-ink-100"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-ink-900 font-serif mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-ink-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">尽调服务</h2>
            <p className="section-subtitle mb-0">多维度专业服务，满足您的不同需求</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-ink-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                      service.color === 'primary' && 'bg-primary-100',
                      service.color === 'gold' && 'bg-gold-100',
                      service.color === 'success' && 'bg-success-100'
                    )}>
                      <Icon className={cn(
                        'w-7 h-7',
                        service.color === 'primary' && 'text-primary-600',
                        service.color === 'gold' && 'text-gold-600',
                        service.color === 'success' && 'text-success-600'
                      )} />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-ink-500 mb-4">{service.desc}</p>
                    <div className="text-2xl font-bold text-primary-600 font-serif mb-4">
                      {service.price}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, i) => (
                        <li key={i} className="text-sm text-ink-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pb-6">
                    <button className={cn(
                      'w-full py-2.5 rounded-lg font-medium transition-colors',
                      service.color === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
                      service.color === 'gold' && 'bg-gold-500 text-white hover:bg-gold-600',
                      service.color === 'success' && 'bg-success-600 text-white hover:bg-success-700'
                    )}>
                      立即预约
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Document Library */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="section-title">尽调文档库</h2>
              <p className="section-subtitle mb-0">查看各类尽调报告和法律文书样本</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="搜索文档..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-ink-50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                />
              </div>
              {/* Filter */}
              <div className="flex gap-1 bg-ink-50 rounded-lg p-1">
                {docTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setActiveDocType(type.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-md transition-colors',
                      activeDocType === type.value
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-ink-600 hover:text-ink-800'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-ink-50 rounded-xl p-5 hover:bg-ink-100 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {doc.typeLabel}
                    </span>
                  </div>
                </div>
                <h4 className="font-medium text-ink-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>{doc.issuer.slice(0, 8)}...</span>
                  <span>{doc.fileSize}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-200">
                  <span className="text-xs text-ink-400">{formatDate(doc.issueDate)}</span>
                  <button className="text-xs text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700">
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-16 text-ink-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-ink-300" />
              暂无匹配的文档
            </div>
          )}
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-ink-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">服务流程</h2>
            <p className="section-subtitle mb-0">规范的服务流程，确保尽调质量</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-gold-300 to-primary-200"></div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { step: '01', title: '咨询预约', desc: '联系顾问确认需求' },
                { step: '02', title: '签署协议', desc: '签订服务协议付费' },
                { step: '03', title: '启动尽调', desc: '专业团队全面核查' },
                { step: '04', title: '出具报告', desc: '详细报告律师审核' },
                { step: '05', title: '后续服务', desc: '答疑及过户协助' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-serif font-bold text-xl relative z-10 shadow-lg shadow-primary-500/30">
                    {item.step}
                  </div>
                  <h3 className="font-serif font-bold text-ink-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-ink-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="section-title">常见问题</h2>
            <p className="section-subtitle mb-0">关于法拍房和尽调服务的常见疑问</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-xl border border-ink-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-ink-50 transition-colors"
                >
                  <span className="font-medium text-ink-900 flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      Q
                    </span>
                    {faq.q}
                  </span>
                  <ChevronRight className={cn(
                    'w-5 h-5 text-ink-400 flex-shrink-0 transition-transform',
                    expandedFaq === index && 'rotate-90'
                  )} />
                </button>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <div className="pl-9 text-sm text-ink-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-gradient">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            专业尽调，安心置业
          </h2>
          <p className="text-primary-200 mb-8 max-w-xl mx-auto">
            让专业团队为您的法拍投资保驾护航，规避风险，安心竞拍
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-gold w-full sm:w-auto justify-center">
              预约专业顾问
            </button>
            <button className="px-6 py-2.5 border-2 border-white/30 text-white font-medium rounded-md hover:bg-white/10 transition-colors w-full sm:w-auto">
              在线咨询
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
