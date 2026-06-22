import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Bus,
  Ticket,
  Building2,
  Briefcase,
  Gift,
  Users,
  Calendar,
  Flower2,
  ChevronRight,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { mockCircles } from '@/data/mockCircles';
import { mockActivities } from '@/data/mockActivities';
import BaoliaoCard from '@/components/business/BaoliaoCard';
import CircleCard from '@/components/business/CircleCard';
import ActivityCard from '@/components/business/ActivityCard';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

const bannerImages = [
  {
    url: 'https://picsum.photos/seed/xihu-banner/1200/500',
    title: '惠州西湖',
    subtitle: '一城山色半城湖'
  },
  {
    url: 'https://picsum.photos/seed/luofu-banner/1200/500',
    title: '罗浮山',
    subtitle: '岭南第一山'
  },
  {
    url: 'https://picsum.photos/seed/xunliao-banner/1200/500',
    title: '巽寮湾',
    subtitle: '中国马尔代夫'
  },
  {
    url: 'https://picsum.photos/seed/shuangyue-banner/1200/500',
    title: '双月湾',
    subtitle: '东方夏威夷'
  }
];

const quickEntries = [
  { icon: Megaphone, name: '发布爆料', color: 'from-westlake-400 to-westlake-600', path: '/baoliao/publish' },
  { icon: Bus, name: '客运查询', color: 'from-honghua-400 to-honghua-600', path: '/transport' },
  { icon: Ticket, name: '影院购票', color: 'from-chaojing-400 to-chaojing-600', path: '/cinema' },
  { icon: Building2, name: '政务预约', color: 'from-purple-400 to-purple-600', path: '/government' },
  { icon: Briefcase, name: '招聘求职', color: 'from-pink-400 to-pink-600', path: '/jobs' },
  { icon: Gift, name: '积分商城', color: 'from-orange-400 to-orange-600', path: '/mall' },
  { icon: Users, name: '兴趣圈子', color: 'from-teal-400 to-teal-600', path: '/circles' },
  { icon: Calendar, name: '活动报名', color: 'from-indigo-400 to-indigo-600', path: '/activities' }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const navigate = useNavigate();
  const { user, isLoggedIn, signIn } = useUserStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const handleSignIn = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSignInLoading(true);
    const result = await signIn();
    setSignInLoading(false);
    if (result.signedIn) {
      setSignInSuccess(true);
      setTimeout(() => setSignInSuccess(false), 2000);
    }
  };

  const handleQuickEntry = (path: string) => {
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="container-page pb-20">
        <motion.div
          ref={(el) => { sectionRefs.current['banner'] = el; }}
          id="banner"
          className="relative h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden mb-6 shadow-lg"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={bannerImages[currentSlide].url}
                alt={bannerImages[currentSlide].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-4xl font-bold text-white mb-2"
                >
                  {bannerImages[currentSlide].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-sm md:text-base"
                >
                  {bannerImages[currentSlide].subtitle}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 right-4 flex gap-2">
            {bannerImages.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                )}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={(el) => { sectionRefs.current['profile'] = el; }}
          id="profile"
          variants={staggerContainer}
          initial="hidden"
          animate={visibleSections['profile'] ? 'visible' : 'hidden'}
          className="mb-6"
        >
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isLoggedIn && user ? (
                  <>
                    <Avatar size="lg" src={user.avatar} name={user.nickname} />
                    <div>
                      <motion.h3 variants={fadeInUp} className="font-bold text-neutral-800 text-lg">
                        {user.nickname}
                      </motion.h3>
                      <motion.div variants={fadeInUp} className="flex items-center gap-2 mt-1">
                        <Flower2 className="w-4 h-4 text-chaojing-500" />
                        <span className="text-sm text-neutral-600">
                          <span className="font-semibold text-chaojing-600">{user.points}</span> 小红花
                        </span>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <motion.div variants={fadeInUp} className="flex items-center gap-4">
                    <Avatar size="lg" />
                    <div>
                      <h3 className="font-bold text-neutral-800 text-lg">欢迎来到惠州生活圈</h3>
                      <p className="text-sm text-neutral-500 mt-1">登录后解锁更多功能</p>
                    </div>
                  </motion.div>
                )}
              </div>
              <motion.div variants={fadeInUp}>
                {isLoggedIn && user ? (
                  <AnimatePresence mode="wait">
                    {signInSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-2 bg-honghua-50 text-honghua-600 rounded-button font-medium"
                      >
                        <Flower2 className="w-4 h-4" />
                        <span>签到成功 +10</span>
                      </motion.div>
                    ) : user.isSignedInToday ? (
                      <Button variant="outline" size="md" disabled>
                        已签到
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSignIn}
                        loading={signInLoading}
                        leftIcon={<Flower2 className="w-4 h-4" />}
                      >
                        每日签到
                      </Button>
                    )}
                  </AnimatePresence>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/login')}
                    leftIcon={<LogIn className="w-4 h-4" />}
                  >
                    登录
                  </Button>
                )}
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          ref={(el) => { sectionRefs.current['quick'] = el; }}
          id="quick"
          variants={staggerContainer}
          initial="hidden"
          animate={visibleSections['quick'] ? 'visible' : 'hidden'}
          className="mb-6"
        >
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-4 gap-4 md:gap-6">
              {quickEntries.map((entry, index) => (
                <motion.button
                  key={entry.name}
                  variants={fadeInUp}
                  onClick={() => handleQuickEntry(entry.path)}
                  className="flex flex-col items-center gap-2 group"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className={cn(
                      'w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
                      entry.color
                    )}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <entry.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    <motion.div
                      className="absolute inset-0 bg-white/30 rounded-full scale-0"
                      whileTap={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.div>
                  <span className="text-xs md:text-sm text-neutral-700 font-medium group-hover:text-westlake-600 transition-colors">
                    {entry.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          ref={(el) => { sectionRefs.current['baoliao'] = el; }}
          id="baoliao"
          variants={staggerContainer}
          initial="hidden"
          animate={visibleSections['baoliao'] ? 'visible' : 'hidden'}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.h2 variants={fadeInUp} className="section-title flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-westlake-500" />
              热门爆料
            </motion.h2>
            <motion.button
              variants={fadeInUp}
              onClick={() => navigate('/baoliao')}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-westlake-600 transition-colors"
            >
              查看更多
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="space-y-4">
            {mockBaoliaos.slice(0, 4).map((baoliao, index) => (
              <motion.div key={baoliao.id} variants={fadeInUp} custom={index}>
                <BaoliaoCard baoliao={baoliao} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={(el) => { sectionRefs.current['circles'] = el; }}
          id="circles"
          variants={staggerContainer}
          initial="hidden"
          animate={visibleSections['circles'] ? 'visible' : 'hidden'}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.h2 variants={fadeInUp} className="section-title flex items-center gap-2">
              <Users className="w-6 h-6 text-honghua-500" />
              加入兴趣圈子
            </motion.h2>
            <motion.button
              variants={fadeInUp}
              onClick={() => navigate('/circles')}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-westlake-600 transition-colors"
            >
              更多圈子
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockCircles.slice(0, 4).map((circle, index) => (
              <motion.div key={circle.id} variants={fadeInUp} custom={index}>
                <CircleCard circle={circle} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={(el) => { sectionRefs.current['activities'] = el; }}
          id="activities"
          variants={staggerContainer}
          initial="hidden"
          animate={visibleSections['activities'] ? 'visible' : 'hidden'}
        >
          <div className="flex items-center justify-between mb-4">
            <motion.h2 variants={fadeInUp} className="section-title flex items-center gap-2">
              <Calendar className="w-6 h-6 text-chaojing-500" />
              近期活动
            </motion.h2>
            <motion.button
              variants={fadeInUp}
              onClick={() => navigate('/activities')}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-westlake-600 transition-colors"
            >
              更多活动
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockActivities.filter(a => a.status === 'upcoming').slice(0, 3).map((activity, index) => (
              <motion.div key={activity.id} variants={fadeInUp} custom={index}>
                <ActivityCard activity={activity} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
