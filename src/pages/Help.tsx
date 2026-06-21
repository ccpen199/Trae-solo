import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, BookOpen, CreditCard, Shield, MessageSquare, Upload, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: '鉴定服务',
    question: '如何提交在线鉴定申请？',
    answer: '登录鉴真阁账号后，点击"在线鉴定"进入鉴定页面，选择藏品品类，上传清晰的藏品照片（建议多角度、细节特写），填写藏品描述信息后提交。我们会先进行AI初筛，然后分配给对应品类的专家进行专业鉴定。',
  },
  {
    id: '2',
    category: '鉴定服务',
    question: '鉴定需要多长时间？',
    answer: 'AI初筛通常在5-10分钟内完成，专家鉴定时间根据品类和专家排期有所不同：普通鉴定24-48小时，加急鉴定4-8小时。您可以在"我的订单"中实时查看鉴定进度。',
  },
  {
    id: '3',
    category: '鉴定服务',
    question: '上传藏品照片有什么要求？',
    answer: '建议上传以下照片：1）藏品全景正面、背面、侧面各一张；2）重要细节特写（如款识、纹饰、瑕疵等）；3）尺寸参照（可放硬币或尺子对比）。照片要求清晰、光线充足、无反光模糊。单张图片不超过10MB，支持JPG、PNG格式。',
  },
  {
    id: '4',
    category: '鉴定证书',
    question: '电子鉴定证书有法律效力吗？',
    answer: '鉴真阁出具的电子鉴定证书采用区块链存证技术，证书信息存储于国家文物局认可的区块链平台，具有不可篡改性和可追溯性。证书可作为藏品鉴定的专业参考依据，如需法律用途，建议申请纸质鉴定报告并进行公证。',
  },
  {
    id: '5',
    category: '鉴定证书',
    question: '如何验证鉴定证书的真伪？',
    answer: '您可以通过以下方式验证证书：1）在"鉴定证书"页面输入证书编号查询；2）扫描证书上的二维码直接跳转验证页面；3）通过区块链浏览器查询存证哈希值进行校验。',
  },
  {
    id: '6',
    category: '费用支付',
    question: '鉴定费用是如何计算的？',
    answer: '鉴定费用根据品类、鉴定方式（普通/加急）、专家级别综合计算。普通鉴定费用区间：100-500元/件；加急鉴定在此基础上加收50%。平台支持微信支付、支付宝、银行卡等多种支付方式。',
  },
  {
    id: '7',
    category: '费用支付',
    question: '可以申请退款吗？',
    answer: '如鉴定服务尚未开始，您可在订单详情页申请全额退款；如鉴定已进行中，将扣除已产生的服务费用后退还剩余部分；如鉴定已完成，非鉴定结论错误原则上不予退款。如对鉴定结论有异议，可申请专家复核。',
  },
  {
    id: '8',
    category: '账号安全',
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，输入注册手机号接收验证码，即可重置密码。如手机号已不再使用，请联系客服（400-888-8888）进行人工身份核验后重置。',
  },
  {
    id: '9',
    category: '账号安全',
    question: '如何保障我的隐私安全？',
    answer: '我们严格遵守《个人信息保护法》，采用银行级数据加密技术保护您的个人信息。您上传的藏品图片仅用于鉴定服务，鉴定完成后您可选择删除或留存。详见《隐私政策》。',
  },
  {
    id: '10',
    category: '专家入驻',
    question: '如何申请成为鉴真阁专家？',
    answer: '成为鉴真阁认证专家需满足以下条件：1）具有国家级或省级文物鉴定资质；2）从事相关品类鉴定工作10年以上；3）在行业内有良好口碑和影响力。申请请发送个人简历、资质证书到 expert@jianzhenge.com，我们会在5个工作日内审核回复。',
  },
];

const categories = [
  { icon: Upload, label: '鉴定服务', key: '鉴定服务' },
  { icon: Award, label: '鉴定证书', key: '鉴定证书' },
  { icon: CreditCard, label: '费用支付', key: '费用支付' },
  { icon: Shield, label: '账号安全', key: '账号安全' },
  { icon: MessageSquare, label: '专家入驻', key: '专家入驻' },
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || faq.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-16 px-4">
          <div className="container text-center">
            <HelpCircle className="w-12 h-12 text-gold-300 mx-auto mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">帮助中心</h1>
            <p className="text-jade-200 text-lg mb-8">常见问题解答，让您快速了解鉴真阁服务</p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索问题关键词..."
                className="pl-12 py-3 bg-rice-100/10 border-gold-400/30 text-rice-100 placeholder:text-jade-300/60"
              />
            </div>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(isActive ? null : cat.key)}
                  className={`p-4 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-ink-gradient border-gold-400 text-gold-300'
                      : 'bg-white border-gold-200/50 text-jade-600 hover:border-gold-400'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{cat.label}</p>
                </motion.button>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <Card>
                <Card.Content className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-jade-300 mx-auto mb-4" />
                  <p className="text-jade-500">未找到相关问题，请尝试其他关键词或联系客服</p>
                </Card.Content>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <motion.div key={faq.id} layout>
                    <Card>
                      <Card.Content className="!p-0">
                        <button
                          onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                          className="w-full p-5 flex items-center justify-between text-left hover:bg-jade-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Tag variant="outline" className="!py-0.5 !text-xs">
                              {faq.category}
                            </Tag>
                            <span className="font-medium text-jade-700">{faq.question}</span>
                          </div>
                          <motion.span animate={{ rotate: expandedId === faq.id ? 180 : 0 }}>
                            <ChevronDown className="w-5 h-5 text-jade-400" />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {expandedId === faq.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-0 border-t border-gold-100">
                                <p className="text-jade-600 leading-relaxed mt-4">{faq.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card.Content>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-ink-gradient rounded-2xl p-10 text-center"
          >
            <MessageSquare className="w-12 h-12 text-gold-300 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-gold-300 mb-2">没有找到您的问题？</h2>
            <p className="text-jade-200 mb-6">我们的客服团队随时为您提供帮助</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-jade-200">
              <span>客服热线：400-888-8888</span>
              <span>邮箱：support@jianzhenge.com</span>
              <span>服务时间：9:00 - 21:00</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
