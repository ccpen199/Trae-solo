import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Mail, Clock, MapPin, Send, HelpCircle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function Support() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('您的问题已提交，我们会在24小时内回复您');
    setForm({ name: '', phone: '', email: '', category: '', message: '' });
  };

  const contactChannels = [
    {
      icon: Phone,
      title: '客服热线',
      content: '400-888-8888',
      desc: '工作日 9:00-21:00 / 节假日 10:00-18:00',
    },
    {
      icon: Mail,
      title: '电子邮件',
      content: 'support@jianzhenge.com',
      desc: '通常在24小时内回复',
    },
    {
      icon: MessageCircle,
      title: '在线客服',
      content: '立即咨询',
      desc: '点击右下方浮动图标开始对话',
    },
    {
      icon: MapPin,
      title: '线下地址',
      content: '北京市东城区琉璃厂文化街',
      desc: '欢迎预约参观线下鉴定中心',
    },
  ];

  const categories = [
    { value: '', label: '请选择咨询类型' },
    { value: 'appraise', label: '鉴定服务咨询' },
    { value: 'certificate', label: '鉴定证书问题' },
    { value: 'payment', label: '支付与退款' },
    { value: 'account', label: '账号相关' },
    { value: 'expert', label: '专家入驻咨询' },
    { value: 'cooperation', label: '商务合作' },
    { value: 'other', label: '其他问题' },
  ];

  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-16 px-4">
          <div className="container text-center">
            <MessageCircle className="w-12 h-12 text-gold-300 mx-auto mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">联系客服</h1>
            <p className="text-jade-200 text-lg">专业的客服团队，随时为您答疑解惑</p>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={channel.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card hoverable className="h-full">
                    <Card.Content>
                      <div className="w-12 h-12 rounded-lg bg-ink-gradient flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-gold-300" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-jade-700 mb-1">{channel.title}</h3>
                      <p className="text-gold-600 font-medium mb-2">{channel.content}</p>
                      <p className="text-sm text-jade-500">{channel.desc}</p>
                    </Card.Content>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <Card.Content>
                  <h2 className="font-serif text-2xl font-bold text-jade-700 mb-2">提交工单</h2>
                  <p className="text-jade-500 mb-6">描述您的问题，我们将尽快与您联系</p>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">
                          您的姓名 <span className="text-cinnabar-500">*</span>
                        </label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="请输入姓名"
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
                        placeholder="请输入邮箱（选填）"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jade-700 mb-2">
                        咨询类型 <span className="text-cinnabar-500">*</span>
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
                        问题描述 <span className="text-cinnabar-500">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="请详细描述您遇到的问题，如有订单号请一并提供..."
                        required
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-md border border-gold-300/50 bg-rice-50 text-jade-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" size="lg" rightIcon={<Send className="w-4 h-4" />}>
                        提交工单
                      </Button>
                    </div>
                  </form>
                </Card.Content>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <Card.Content>
                  <h3 className="font-serif text-xl font-semibold text-jade-700 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold-500" />
                    服务时间
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between">
                      <span className="text-jade-500">工作日（周一至周五）</span>
                      <span className="text-jade-700 font-medium">9:00 - 21:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-jade-500">周末及节假日</span>
                      <span className="text-jade-700 font-medium">10:00 - 18:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-jade-500">AI 智能客服</span>
                      <span className="text-jade-700 font-medium">7×24 小时</span>
                    </li>
                  </ul>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content>
                  <h3 className="font-serif text-xl font-semibold text-jade-700 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-gold-500" />
                    常见问题
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="/help" className="text-jade-600 hover:text-gold-600 text-sm flex items-center gap-1">
                        <span className="text-gold-500">›</span> 如何提交鉴定申请？
                      </a>
                    </li>
                    <li>
                      <a href="/help" className="text-jade-600 hover:text-gold-600 text-sm flex items-center gap-1">
                        <span className="text-gold-500">›</span> 鉴定费用是多少？
                      </a>
                    </li>
                    <li>
                      <a href="/help" className="text-jade-600 hover:text-gold-600 text-sm flex items-center gap-1">
                        <span className="text-gold-500">›</span> 如何验证鉴定证书？
                      </a>
                    </li>
                    <li>
                      <a href="/help" className="text-jade-600 hover:text-gold-600 text-sm flex items-center gap-1">
                        <span className="text-gold-500">›</span> 忘记密码怎么办？
                      </a>
                    </li>
                  </ul>
                  <a
                    href="/help"
                    className="mt-4 inline-flex items-center gap-1 text-sm text-gold-600 font-medium hover:text-gold-700"
                  >
                    查看更多帮助
                    <FileText className="w-4 h-4" />
                  </a>
                </Card.Content>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
