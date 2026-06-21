import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, TrendingUp, Target, Briefcase, Send, CheckCircle, DollarSign, Clock, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';

export default function Join() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: '',
    years: '',
    qualification: '',
    intro: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('申请已提交，我们会在5个工作日内审核并联系您');
  };

  const benefits = [
    {
      icon: DollarSign,
      title: '丰厚收益',
      desc: '市场化定价机制，优质专家单件鉴定收入可达数千元',
    },
    {
      icon: TrendingUp,
      title: '个人品牌',
      desc: '平台多渠道曝光，帮助您打造个人IP，提升行业影响力',
    },
    {
      icon: Clock,
      title: '灵活自由',
      desc: '自主选择接单时间和品类，不受地点限制，工作生活平衡',
    },
    {
      icon: Shield,
      title: '权益保障',
      desc: '完善的纠纷处理机制，为您的专业声誉保驾护航',
    },
  ];

  const requirements = [
    '具有国家级或省级文物鉴定资质证书',
    '从事相关品类鉴定工作10年以上',
    '在行业内具有良好口碑和影响力',
    '熟悉文玩艺术品市场行情',
    '能够熟练使用智能手机和电脑进行线上操作',
    '遵守鉴真阁专家服务规范，接受平台考核监督',
  ];

  const categories = [
    { value: '', label: '请选择擅长品类' },
    { value: 'ceramic', label: '陶瓷' },
    { value: 'jade', label: '玉器' },
    { value: 'calligraphy_painting', label: '书画' },
    { value: 'bronze', label: '青铜器' },
    { value: 'coin', label: '钱币' },
    { value: 'miscellaneous', label: '杂项' },
    { value: 'wood', label: '木器' },
    { value: 'lacquer', label: '漆器' },
    { value: 'textile', label: '织绣' },
    { value: 'stationery', label: '文房' },
    { value: 'seal', label: '印章' },
    { value: 'zisha', label: '紫砂' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-20 px-4">
          <div className="container text-center">
            <Tag variant="gold" className="mb-4">诚邀入驻</Tag>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">
              加入鉴真阁专家团队
            </h1>
            <p className="text-jade-200 text-lg max-w-2xl mx-auto">
              汇聚行业精英，共筑可信鉴定生态。我们诚挚邀请有实力、有情怀的鉴定专家加入鉴真阁。
            </p>
          </div>
        </div>

        <div className="container py-16">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4">专家专属权益</h2>
              <div className="w-16 h-0.5 bg-gold-gradient mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hoverable className="h-full">
                      <Card.Content>
                        <div className="w-14 h-14 rounded-full bg-ink-gradient flex items-center justify-center mb-4 border-2 border-gold-400">
                          <Icon className="w-7 h-7 text-gold-300" />
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">{benefit.title}</h3>
                        <p className="text-jade-500 text-sm leading-relaxed">{benefit.desc}</p>
                      </Card.Content>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.section
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4 flex items-center gap-2">
                  <Target className="w-7 h-7 text-gold-500" />
                  入驻条件
                </h2>
                <div className="w-16 h-0.5 bg-gold-gradient" />
              </div>
              <Card>
                <Card.Content>
                  <ul className="space-y-4">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-jade-500 mt-0.5 shrink-0" />
                        <span className="text-jade-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Content>
              </Card>

              <div className="mt-8">
                <h3 className="font-serif text-xl font-semibold text-jade-700 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold-500" />
                  专家分级体系
                </h3>
                <div className="space-y-3">
                  {[
                    { level: '国家级专家', color: 'bg-cinnabar-400', desc: '具有国家级文物鉴定资质，从业30年以上，行业泰斗级人物' },
                    { level: '省级专家', color: 'bg-gold-500', desc: '具有省级文物鉴定资质，从业20年以上，在细分领域有深厚造诣' },
                    { level: '资深专家', color: 'bg-jade-500', desc: '具有丰富实践经验，从业10年以上，藏友认可度高' },
                  ].map((item) => (
                    <div key={item.level} className="flex items-start gap-4 p-4 rounded-lg border border-gold-200/50 bg-white">
                      <span className={`${item.color} text-white text-xs px-2 py-1 rounded font-medium shrink-0 mt-0.5`}>
                        {item.level}
                      </span>
                      <p className="text-jade-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4 flex items-center gap-2">
                  <Briefcase className="w-7 h-7 text-gold-500" />
                  申请入驻
                </h2>
                <div className="w-16 h-0.5 bg-gold-gradient" />
              </div>
              <Card>
                <Card.Content>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">
                          真实姓名 <span className="text-cinnabar-500">*</span>
                        </label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="请输入真实姓名"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">
                          联系电话 <span className="text-cinnabar-500">*</span>
                        </label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="请输入手机号"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jade-700 mb-2">电子邮箱</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">
                          擅长品类 <span className="text-cinnabar-500">*</span>
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-md border border-gold-300/50 bg-rice-50 text-jade-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">
                          从业年限 <span className="text-cinnabar-500">*</span>
                        </label>
                        <Input
                          value={form.years}
                          onChange={(e) => setForm({ ...form, years: e.target.value })}
                          placeholder="如：15年"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jade-700 mb-2">
                        专业资质 <span className="text-cinnabar-500">*</span>
                      </label>
                      <Input
                        value={form.qualification}
                        onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                        placeholder="请详细描述您的资质证书、获奖经历等"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jade-700 mb-2">
                        个人简介 <span className="text-cinnabar-500">*</span>
                      </label>
                      <textarea
                        value={form.intro}
                        onChange={(e) => setForm({ ...form, intro: e.target.value })}
                        placeholder="请介绍您的从业经历、擅长领域、学术成果等（200字以上）..."
                        required
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-md border border-gold-300/50 bg-rice-50 text-jade-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" size="lg" className="w-full" rightIcon={<Send className="w-4 h-4" />}>
                        提交入驻申请
                      </Button>
                    </div>
                    <p className="text-xs text-jade-400 text-center">
                      提交申请即表示您同意《鉴真阁专家服务协议》，我们将严格保密您的信息
                    </p>
                  </form>
                </Card.Content>
              </Card>
            </motion.section>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-ink-gradient rounded-2xl p-10 md:p-16 text-center"
          >
            <Users className="w-16 h-16 text-gold-300 mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gold-300 mb-4">
              已有 320+ 位专家加入鉴真阁
            </h2>
            <p className="text-jade-200 text-lg mb-8 max-w-2xl mx-auto">
              其中包含 45 位国家级专家、98 位省级专家，覆盖陶瓷、玉器、书画等 12 大文玩品类
            </p>
            <p className="text-gold-300 font-medium">
              咨询电话：expert@jianzhenge.com / 400-888-8888（专家专线）
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
