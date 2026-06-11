import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Video, EyeOff, Fingerprint, Scale, Phone } from 'lucide-react';

const floatingBlobs = [
  { size: 120, left: '10%', top: '20%', delay: 0, duration: 6 },
  { size: 80, left: '75%', top: '15%', delay: 1.5, duration: 7 },
  { size: 100, left: '60%', top: '60%', delay: 0.8, duration: 5.5 },
  { size: 60, left: '25%', top: '70%', delay: 2, duration: 8 },
  { size: 90, left: '85%', top: '45%', delay: 0.5, duration: 6.5 },
];

const steps = [
  {
    icon: Shield,
    title: '匿名建档',
    desc: '安全创建你的心理档案，完成专业量表自评',
  },
  {
    icon: Sparkles,
    title: '智能匹配',
    desc: 'AI分析你的需求，精准匹配最适合的咨询师',
  },
  {
    icon: Video,
    title: '安全咨询',
    desc: '全程加密通话，咨询记录脱敏存储',
  },
];

const trustItems = [
  { icon: Shield, text: '端到端加密' },
  { icon: EyeOff, text: '信息脱敏存储' },
  { icon: Fingerprint, text: '匿名身份保护' },
  { icon: Scale, text: '精神卫生法合规' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-lavender-400 to-sky-300">
        {floatingBlobs.map((blob, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10 blur-2xl"
            style={{
              width: blob.size,
              height: blob.size,
              left: blob.left,
              top: blob.top,
            }}
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              delay: blob.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="relative z-10 text-center px-6">
          <motion.h1
            className="font-serif text-6xl font-bold text-white"
            style={{ textShadow: '0 2px 20px rgba(124, 58, 237, 0.3)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            心屿
          </motion.h1>
          <motion.p
            className="mt-4 text-xl text-white/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            你的心事，有处安放
          </motion.p>
          <motion.p
            className="mt-2 text-sm text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            聚焦Z世代心理健康的轻量级咨询平台
          </motion.p>
          <motion.button
            className="mt-10 rounded-full bg-white px-8 py-3 text-lavender-600 font-semibold shadow-lavender hover:shadow-lavender-lg transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/profile')}
          >
            开始匿名自评
          </motion.button>
        </div>
      </section>

      <section className="bg-cream-50 py-20 px-6">
        <div className="container mx-auto">
          <h2 className="font-serif text-3xl text-slate-dark text-center mb-14">
            三步开启你的心灵之旅
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="bg-white rounded-3xl p-8 shadow-soft text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lavender-100 text-lavender-600 mb-5">
                  <step.icon size={28} />
                </div>
                <h3 className="font-semibold text-lg text-slate-dark mb-2">{step.title}</h3>
                <p className="text-sm text-slate-dark-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-lavender-50 py-16 px-6">
        <div className="container mx-auto">
          <h2 className="font-serif text-3xl text-slate-dark text-center mb-12">
            你的安全，我们的承诺
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {trustItems.map((item) => (
              <div key={item.text} className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-600">
                  <item.icon size={22} />
                </div>
                <span className="text-sm text-slate-dark-600">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-coral-50 border border-coral-200 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-coral-500 mb-2">
              <Phone size={18} />
              <span className="font-semibold">24小时心理援助热线：400-161-9995</span>
            </div>
            <p className="text-sm text-coral-400">如果你正处于危机中，请立即寻求帮助</p>
          </div>
        </div>
      </section>
    </div>
  );
}
