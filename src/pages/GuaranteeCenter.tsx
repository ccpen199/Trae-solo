import { useState } from 'react';
import { Shield, Star, Clock, Scale, FileCheck, Wallet, ArrowRight, CheckCircle, AlertTriangle, Users, Zap, Award, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

const guaranteeSections = [
  {
    id: 'credit',
    icon: Star,
    title: '双向信用评价体系',
    desc: '基于真实交易的评价机制，建立可信的技能服务生态',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    features: [
      '交易完成后双方互评，评价公开透明',
      '累计信用等级，影响订单匹配优先级',
      '虚假评价自动识别并删除',
      '恶意差评可申诉，平台人工复核',
    ],
  },
  {
    id: 'trace',
    icon: Clock,
    title: '服务过程留痕',
    desc: '全流程记录可追溯，保障双方权益',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    features: [
      '订单状态实时更新，时间线清晰展示',
      '沟通记录云端存储，随时可查',
      '服务签到/签出，精确计算服务时长',
      '文件上传留痕，成果物可追溯',
    ],
  },
  {
    id: 'arbitration',
    icon: Scale,
    title: '争议仲裁机制',
    desc: '专业仲裁团队介入，公平公正处理纠纷',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    features: [
      '24小时内响应，快速介入处理',
      '基于服务留痕记录客观判定',
      '支持双方举证，充分听取陈述',
      '仲裁结果可申诉，二次复核机制',
    ],
  },
  {
    id: 'insurance',
    icon: Shield,
    title: '保险对接接口',
    desc: '家政类服务强制投保，全方位保障服务安全',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    features: [
      '家政类服务自动投保服务责任险',
      '保障额度最高50万元',
      '出险快速理赔通道',
      '可选升级保障方案',
    ],
  },
  {
    id: 'settlement',
    icon: Wallet,
    title: '资金分账结算',
    desc: '平台资金托管，服务完成后自动分账',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    features: [
      '定金由平台托管，服务完成后结算',
      '平台收取15%服务费，明码标价',
      '支持税务代缴，合规结算',
      'T+1提现到账，资金安全有保障',
    ],
  },
  {
    id: 'review',
    icon: FileCheck,
    title: '内容合规审核',
    desc: '严格的内容审核机制，保障平台生态健康',
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    features: [
      'AI智能初审 + 人工复审双审核',
      '敏感内容实时拦截',
      '违规内容举报通道',
      '创作者资质认证审核',
    ],
  },
];

const processSteps = [
  { step: 1, title: '发布需求/课程', desc: '需求方发布定制需求或创作者发布课程', icon: FileCheck },
  { step: 2, title: '匹配合约', desc: '系统智能匹配或双方自主选择达成合作', icon: Users },
  { step: 3, title: '支付定金', desc: '定金支付至平台托管账户，锁定服务', icon: Wallet },
  { step: 4, title: '服务履约', desc: '按约定提供服务，全程留痕记录', icon: Zap },
  { step: 5, title: '验收评价', desc: '服务完成后双方验收并互评', icon: Star },
  { step: 6, title: '资金结算', desc: '平台扣除服务费后结算给创作者', icon: Award },
];

const faqItems = [
  {
    q: '如何申请争议仲裁？',
    a: '在订单详情页点击"申请仲裁"按钮，选择争议原因并详细描述情况。平台将在24小时内介入，根据服务留痕记录进行判定。',
  },
  {
    q: '评价可以修改或删除吗？',
    a: '评价提交后不可修改，但如果对方存在恶意评价行为，您可以发起申诉，平台审核后可删除不当评价。',
  },
  {
    q: '家政类保险是强制的吗？',
    a: '是的，家政类服务（如保洁、育儿、护理等）系统会自动投保服务责任险，保障服务过程中的人身和财产安全。',
  },
  {
    q: '资金什么时候结算给创作者？',
    a: '服务完成并经需求方确认后，平台将在T+1个工作日内完成结算。如有争议，资金将冻结至争议解决。',
  },
  {
    q: '平台服务费是多少？',
    a: '平台收取订单金额的15%作为服务费，包含技术支持、客服保障、资金托管、交易担保等服务。',
  },
  {
    q: '创作者如何提现？',
    a: '创作者可在工作台-收益页面申请提现，支持银行卡和支付宝提现，提现金额最低100元，T+1到账。',
  },
];

export default function GuaranteeCenter() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('credit');

  return (
    <div className="min-h-screen bg-zinc-50">
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              平台保障中心
            </h1>
            <p className="text-xl text-white/80 mb-8">
              六大保障体系，让技能交易更安心
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['信用评价', '服务留痕', '争议仲裁', '保险保障', '资金托管', '合规审核'].map((item, i) => (
                <div
                  key={i}
                  className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guaranteeSections.map((section, index) => (
              <div
                key={section.id}
                className={`card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                  activeSection === section.id ? 'ring-2 ring-primary-500' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setActiveSection(section.id)}
              >
                <div className={`w-12 h-12 rounded-2xl ${section.iconBg} flex items-center justify-center mb-4`}>
                  <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">{section.title}</h3>
                <p className="text-zinc-500 mb-4">{section.desc}</p>
                <ul className="space-y-2">
                  {section.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-3">服务流程</h2>
            <p className="text-zinc-500">全流程透明化，每一步都有保障</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 -translate-y-1/2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {processSteps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 relative z-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {step.step}
                    </div>
                    <h4 className="font-semibold text-zinc-900 mb-2">{step.title}</h4>
                    <p className="text-xs text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-zinc-900 mb-3">常见问题</h2>
              <p className="text-zinc-500">有疑问？看看大家都在问什么</p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl overflow-hidden border border-zinc-100 transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-medium text-zinc-900">{item.q}</span>
                    <ArrowRight
                      className={`w-5 h-5 text-zinc-400 transition-transform flex-shrink-0 ${
                        expandedFaq === index ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-5 pb-5 animate-fade-in">
                      <p className="text-zinc-600 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Headphones className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-3">还有其他问题？</h2>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                我们的客服团队随时为您服务，工作日9:00-21:00在线响应
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/orders"
                  className="px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                >
                  立即体验
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#"
                  className="px-8 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                >
                  联系客服
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
