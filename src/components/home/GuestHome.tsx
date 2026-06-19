import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Users,
  Target,
  Activity,
  Briefcase,
  Award,
  Bell,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  UserCheck,
  BarChart3,
  TrendingUp,
  Network,
  Layers,
  Video,
  Mic,
  Play,
  ChevronRight,
  Rocket,
  Shield,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { staggerContainer, fadeInUp, scaleIn, fadeIn, ParticleBackground } from './shared';

function RoleTabSwitcher({
  activeRole,
  onChange,
}: {
  activeRole: 'jobseeker' | 'hr';
  onChange: (role: 'jobseeker' | 'hr') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative z-10 flex items-center bg-white/70 backdrop-blur-xl rounded-full p-1.5 shadow-xl shadow-lavender-200/40 border border-white/60"
    >
      <button
        onClick={() => onChange('jobseeker')}
        className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          activeRole === 'jobseeker'
            ? 'text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {activeRole === 'jobseeker' && (
          <motion.div
            layoutId="roleTabBg"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-lg shadow-emerald-300/50"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <User className="w-4 h-4" />
          求职者
        </span>
      </button>
      <button
        onClick={() => onChange('hr')}
        className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          activeRole === 'hr'
            ? 'text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {activeRole === 'hr' && (
          <motion.div
            layoutId="roleTabBg"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-purple-500 shadow-lg shadow-lavender-300/50"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Users className="w-4 h-4" />
          HR招聘者
        </span>
      </button>
    </motion.div>
  );
}

function JobseekerPreviewCard() {
  const navigate = useNavigate();
  const features = [
    { icon: Target, title: '设定职业目标', desc: '明确方向与期望', gradient: 'from-emerald-400 to-teal-500' },
    { icon: Activity, title: '能力诊断报告', desc: 'AI多维度分析', gradient: 'from-space-indigo-400 to-blue-500' },
    { icon: Briefcase, title: '智能职位匹配', desc: '高成长性岗位', gradient: 'from-lavender-400 to-purple-500' },
    { icon: Award, title: '个人成长档案', desc: '追踪职业进步', gradient: 'from-amber-gold-400 to-orange-500' },
  ];

  return (
    <motion.div variants={scaleIn} className="group relative">
      <Card
        variant="glass"
        className="p-8 h-full overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-200/40 transition-all duration-500 border-emerald-100/60"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-300/50">
              <User className="w-6 h-6 text-white" />
            </div>
            <Badge variant="emerald" size="md" withDot>
              <Sparkles className="w-3 h-3 mr-1" />
              面向个人
            </Badge>
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight mb-2 text-slate-900">
            我是求职者
          </h2>
          <p className="text-slate-600 mb-6 text-lg">规划职业路径，洞察能力差距</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-4 rounded-xl bg-white/70 border border-white/80 hover:border-emerald-200 hover:shadow-md transition-all duration-300 cursor-default"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-2.5 shadow-sm`}>
                  <f.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{f.title}</h3>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/login?role=jobseeker')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="!bg-gradient-to-r !from-emerald-500 !via-emerald-400 !to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            登录开始职业诊断
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function HRPreviewCard() {
  const navigate = useNavigate();
  const features = [
    { icon: Users, title: '人才池运营', desc: '分层标签管理', gradient: 'from-space-indigo-400 to-blue-500' },
    { icon: UserCheck, title: '潜力人才标记', desc: 'AI智能评估', gradient: 'from-lavender-400 to-purple-500' },
    { icon: Bell, title: '长期跟进提醒', desc: '候选人关系维护', gradient: 'from-emerald-400 to-teal-500' },
    { icon: AlertTriangle, title: '岗位需求预警', desc: '招聘风险感知', gradient: 'from-amber-gold-400 to-orange-500' },
  ];

  return (
    <motion.div variants={scaleIn} className="group relative">
      <Card
        variant="glass"
        className="p-8 h-full overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-lavender-200/40 transition-all duration-500 border-lavender-100/60"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-lavender-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-space-indigo-500 via-lavender-500 to-purple-600 flex items-center justify-center shadow-lg shadow-lavender-300/50">
              <Users className="w-6 h-6 text-white" />
            </div>
            <Badge variant="indigo" size="md" withDot>
              <BarChart3 className="w-3 h-3 mr-1" />
              面向企业
            </Badge>
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight mb-2 text-slate-900">
            我是HR招聘者
          </h2>
          <p className="text-slate-600 mb-6 text-lg">发现高潜人才，运营招聘效率</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-4 rounded-xl bg-white/70 border border-white/80 hover:border-lavender-200 hover:shadow-md transition-all duration-300 cursor-default"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-2.5 shadow-sm`}>
                  <f.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{f.title}</h3>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/login?role=hr')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="!bg-gradient-to-r !from-space-indigo-500 !via-lavender-500 !to-purple-500 shadow-lg shadow-lavender-500/30 hover:shadow-xl hover:shadow-lavender-500/40"
          >
            登录进入HR控制台
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function AnimatePresenceWrapper({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return <div className="hidden lg:block" />;
  return <>{children}</>;
}

function HeroSection() {
  const { role: storeRole, switchRole } = useAppStore();
  const [activeRole, setActiveRole] = useState<'jobseeker' | 'hr'>(storeRole);

  const handleRoleChange = (newRole: 'jobseeker' | 'hr') => {
    setActiveRole(newRole);
    switchRole(newRole);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center pt-8 pb-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lavender-50" />
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-32 right-0 w-[550px] h-[550px] rounded-full bg-lavender-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-space-indigo-200/30 blur-3xl" />
      </div>
      <ParticleBackground />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="text-center mb-10"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge variant="purple" size="md" withDot className="mb-0">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI驱动的职业发展与招聘智能平台
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-4"
          >
            选择你的<span className="gradient-text">职业角色</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            无论是规划职业人生，还是招募高潜人才，我们都为你提供科学决策支持
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-10"
        >
          <RoleTabSwitcher activeRole={activeRole} onChange={handleRoleChange} />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          <AnimatePresenceWrapper show={activeRole === 'jobseeker'}>
            <JobseekerPreviewCard />
          </AnimatePresenceWrapper>
          <AnimatePresenceWrapper show={activeRole === 'hr'}>
            <HRPreviewCard />
          </AnimatePresenceWrapper>
        </motion.div>
      </div>
    </section>
  );
}

function CompetencySection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lavender-50/40 to-transparent" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="emerald" size="md" withDot className="mb-4">
              <Network className="w-3.5 h-3.5 mr-1" />
              职业能力图谱
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          >
            300+岗位<span className="gradient-text">职业能力图谱</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-slate-600 max-w-2xl mx-auto">
            覆盖8大行业，每个岗位含硬技能树/软技能维度/认证要求/晋升路径
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          <Card variant="glass" className="p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 flex-shrink-0">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">完整能力图谱中心</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  浏览300+岗位的完整胜任力模型，包括技能树、能力雷达、认证要求、晋升路径与薪资分布，助你精准规划职业方向。
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/encyclopedia')}
              className="w-full"
            >
              查看完整能力图谱中心
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function HotJobsSection() {
  const navigate = useNavigate();
  const hotJobs = [
    { id: 'job_fe_01', name: '前端工程师' },
    { id: 'job_pm_01', name: '产品经理' },
    { id: 'job_ui_01', name: 'UI设计师' },
    { id: 'job_be_01', name: 'Java工程师' },
    { id: 'job_da_01', name: '数据分析师' },
    { id: 'job_ai_01', name: '算法工程师' },
    { id: 'job_gr_01', name: '运营经理' },
    { id: 'job_mc_01', name: '战略咨询顾问' },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="gold" size="md" withDot className="mb-4">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              职业百科
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          >
            热门岗位 · <span className="gradient-text">一键探索</span>
          </motion.h2>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            热门岗位
          </p>
          <div className="flex flex-wrap gap-2">
            {hotJobs.map((job, i) => (
              <motion.button
                key={job.id}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/encyclopedia/${job.id}`)}
                className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 text-sm font-medium text-slate-700 hover:text-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {job.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Video, title: '真实工作流', jobName: '前端工程师的一天', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', tag: '视频' },
            { icon: Mic, title: '从业者访谈', jobName: '李明 · 字节高级产品经理', gradient: 'from-lavender-500 via-purple-500 to-fuchsia-500', tag: '音频' },
            { icon: Layers, title: '入行阶梯', jobName: '数据分析师成长路径', gradient: 'from-amber-gold-500 via-orange-500 to-rose-500', tag: '阶梯图' },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              onClick={() => navigate('/encyclopedia')}
            >
              <Card variant="default" glowOnHover hoverable className="h-full overflow-hidden group">
                <div className={`relative h-40 bg-gradient-to-br ${card.gradient} overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.08 }}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </motion.div>
                  <div className="absolute top-4 left-4">
                    <Badge variant="default" className="bg-black/30 text-white border-white/25 backdrop-blur-sm">
                      <card.icon className="w-3 h-3 mr-1" />
                      {card.tag}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-heading text-lg font-bold text-white">{card.title}</h3>
                    <p className="text-sm text-white/80">{card.jobName}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all duration-300">
                    <span>深入了解</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden p-12 lg:p-16"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 25%, #8B5CF6 60%, #3A5FA8 100%)',
            boxShadow: '0 30px 80px -20px rgba(139,92,246,0.5)',
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <div className="mb-6">
                <Badge variant="default" size="md" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Rocket className="w-3.5 h-3.5 mr-1" />
                  开启你的职业加速
                </Badge>
              </div>
              <h2 className="font-heading text-4xl lg:text-5xl font-bold leading-tight mb-4">
                今天，<br />就开启职业人生的<br />科学规划之旅
              </h2>
              <p className="text-lg text-white/80 leading-relaxed max-w-xl">
                5分钟完成AI诊断，获取你的专属能力雷达、成长路径与精准岗位推荐。
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:justify-self-end">
              <Button
                size="xl"
                className="!bg-white !text-space-indigo-700 hover:!bg-white/95 shadow-2xl w-full lg:w-auto"
                onClick={() => navigate('/login?role=jobseeker')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                免费开始职业诊断
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="!border-white/50 !text-white hover:!bg-white/10 w-full lg:w-auto"
                onClick={() => navigate('/login?role=hr')}
              >
                我是HR，进入控制台
              </Button>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  信息加密保护
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  覆盖300+城市
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function GuestHome() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <CompetencySection />
      <HotJobsSection />
      <CTASection />
    </div>
  );
}
