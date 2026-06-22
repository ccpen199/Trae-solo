import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flower2,
  HeartHandshake,
  Users,
  Coins,
  Target,
  Check,
  Share2,
  Download,
  X,
  MessageSquare,
  EyeOff,
  Award,
  Calendar,
  Loader2,
  LogIn,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePointStore } from '@/stores/usePointStore';
import { useUserStore } from '@/stores/useUserStore';
import type { PointRecord } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import Empty from '@/components/common/Empty';

interface DonationProject {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  targetPoints: number;
  currentPoints: number;
  donorCount: number;
  category: 'education' | 'medical' | 'environment' | 'other';
}

interface DonationRecord {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  message?: string;
  anonymous: boolean;
  certificate?: string;
  createdAt: Date;
}

const mockProjects: DonationProject[] = [
  {
    id: 'dp001',
    name: '山区儿童助学计划',
    description: '为惠州偏远山区的孩子们提供学习用品、营养餐和助学金，帮助他们完成学业。',
    coverImage: 'https://picsum.photos/seed/donate1/600/400',
    targetPoints: 100000,
    currentPoints: 68500,
    donorCount: 2341,
    category: 'education'
  },
  {
    id: 'dp002',
    name: '乡村医疗援助',
    description: '为乡村卫生院配备基础医疗设备，组织义诊活动，让村民享受更好的医疗服务。',
    coverImage: 'https://picsum.photos/seed/donate2/600/400',
    targetPoints: 150000,
    currentPoints: 42300,
    donorCount: 1256,
    category: 'medical'
  },
  {
    id: 'dp003',
    name: '东江生态保护',
    description: '保护东江母亲河，开展河道清理、植树造林活动，守护我们共同的家园。',
    coverImage: 'https://picsum.photos/seed/donate3/600/400',
    targetPoints: 80000,
    currentPoints: 75600,
    donorCount: 3189,
    category: 'environment'
  },
  {
    id: 'dp004',
    name: '留守儿童关爱',
    description: '为留守儿童提供心理辅导、兴趣培养和节日慰问，让他们感受社会的温暖。',
    coverImage: 'https://picsum.photos/seed/donate4/600/400',
    targetPoints: 120000,
    currentPoints: 51200,
    donorCount: 1872,
    category: 'other'
  }
];

const mockDonationRecords: DonationRecord[] = [
  {
    id: 'dr001',
    projectId: 'dp001',
    projectName: '山区儿童助学计划',
    amount: 500,
    message: '希望孩子们能够好好学习，改变命运！',
    anonymous: false,
    certificate: 'CERT-20260615-001',
    createdAt: new Date('2026-06-15')
  },
  {
    id: 'dr002',
    projectId: 'dp003',
    projectName: '东江生态保护',
    amount: 100,
    anonymous: true,
    certificate: 'CERT-20260610-002',
    createdAt: new Date('2026-06-10')
  },
  {
    id: 'dr003',
    projectId: 'dp002',
    projectName: '乡村医疗援助',
    amount: 1000,
    message: '支持乡村医疗事业发展',
    anonymous: false,
    certificate: 'CERT-20260601-003',
    createdAt: new Date('2026-06-01')
  }
];

const quickAmounts = [10, 50, 100, 500];

type TabType = 'projects' | 'records';

export default function Donate() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updatePoints } = useUserStore();
  const { pointRecords, donatePoints, fetchPointRecords } = usePointStore();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedProject, setSelectedProject] = useState<DonationProject | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationMessage, setDonationMessage] = useState('');
  const [donationLoading, setDonationLoading] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<DonationRecord | null>(null);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [animationPoints, setAnimationPoints] = useState(0);
  const [projects] = useState<DonationProject[]>(mockProjects);
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>(mockDonationRecords);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPointRecords();
    }
  }, [isLoggedIn, fetchPointRecords]);

  useEffect(() => {
    if (user) {
      setDisplayPoints(user.points);
    }
  }, [user?.points]);

  const totalStats = useMemo(() => {
    const totalDonors = projects.reduce((sum, p) => sum + p.donorCount, 0);
    const totalPoints = projects.reduce((sum, p) => sum + p.currentPoints, 0);
    return { totalDonors, totalPoints };
  }, [projects]);

  const myDonationRecords = useMemo(() => {
    return donationRecords.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [donationRecords]);

  const handleProjectClick = (project: DonationProject) => {
    setSelectedProject(project);
    setDonationAmount(10);
    setCustomAmount('');
    setIsAnonymous(false);
    setDonationMessage('');
    setShowDonationModal(true);
  };

  const handleQuickAmount = (amount: number) => {
    setDonationAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomAmount(value);
      setDonationAmount(numValue);
    } else if (value === '') {
      setCustomAmount('');
      setDonationAmount(0);
    }
  };

  const handleDonate = async () => {
    if (!selectedProject || !user || donationAmount <= 0) return;
    if (user.points < donationAmount) return;

    setDonationLoading(true);
    const result = await donatePoints(donationAmount, selectedProject.id);
    setDonationLoading(false);

    if (result.success && result.certificate) {
      setAnimationPoints(donationAmount);
      setShowPointAnimation(true);
      updatePoints(-donationAmount);
      setTimeout(() => setShowPointAnimation(false), 2000);

      const newRecord: DonationRecord = {
        id: 'dr' + Date.now(),
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        amount: donationAmount,
        message: donationMessage || undefined,
        anonymous: isAnonymous,
        certificate: result.certificate,
        createdAt: new Date()
      };

      setDonationRecords(prev => [newRecord, ...prev]);
      setCurrentCertificate(newRecord);
      setShowDonationModal(false);
      setShowCertificateModal(true);
    }
  };

  const handleViewCertificate = (record: DonationRecord) => {
    setCurrentCertificate(record);
    setShowCertificateModal(true);
  };

  const handleShareCertificate = () => {
    if (navigator.share && currentCertificate) {
      navigator.share({
        title: '我的公益捐赠证书',
        text: `我在小红花公益计划捐赠了 ${currentCertificate.amount} 积分，一起来参与吧！`,
        url: window.location.href
      });
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const generateCertificateCode = () => {
    if (!currentCertificate) return '';
    return currentCertificate.certificate || `CERT-${Date.now()}`;
  };

  if (!isLoggedIn || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-neutral-50 flex items-center justify-center"
      >
        <Card className="p-8 text-center max-w-sm mx-4">
          <div className="w-20 h-20 rounded-full bg-honghua-100 flex items-center justify-center mx-auto mb-4">
            <HeartHandshake className="w-10 h-10 text-honghua-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">登录后参与公益</h2>
          <p className="text-neutral-500 mb-6">登录即可用小红花积分参与公益捐赠，传递温暖</p>
          <Button
            variant="success"
            size="lg"
            onClick={() => navigate('/login', { state: { from: '/points/donate' } })}
            className="w-full"
            leftIcon={<LogIn className="w-5 h-5" />}
          >
            立即登录
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      <div className="bg-gradient-to-br from-honghua-500 via-honghua-600 to-honghua-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/15"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 28 + 14}px`,
              }}
              animate={{
                y: [0, -25, 0],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: Math.random() * 4 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              🌸
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showPointAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="flex items-center gap-2 text-white text-2xl font-bold">
                <Sparkles className="w-6 h-6" />
                -{animationPoints}
                <Flower2 className="w-6 h-6" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container-page pt-8 pb-12 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              className="inline-block mb-4"
            >
              <Flower2 className="w-16 h-16 text-white mx-auto" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">小红花公益计划</h1>
            <p className="text-white/80 text-lg mb-6">用每一朵小红花，点亮一份希望</p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 gap-4 max-w-md mx-auto"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  总捐赠人次
                </div>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="text-3xl font-bold text-white"
                >
                  {totalStats.totalDonors.toLocaleString()}
                </motion.div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-1">
                  <Flower2 className="w-4 h-4" />
                  总捐赠红花
                </div>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className="text-3xl font-bold text-white"
                >
                  {totalStats.totalPoints.toLocaleString()}
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/70 text-sm mt-6 max-w-md mx-auto"
            >
              "每一朵小红花都是爱的传递，让我们一起用积分点亮更多人的生活"
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container-page -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('projects')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium transition-all',
                  activeTab === 'projects'
                    ? 'bg-gradient-to-r from-honghua-500 to-honghua-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                <HeartHandshake className="w-4 h-4 inline mr-2" />
                公益项目
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium transition-all',
                  activeTab === 'records'
                    ? 'bg-gradient-to-r from-honghua-500 to-honghua-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                <Award className="w-4 h-4 inline mr-2" />
                我的捐赠
              </button>
            </div>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'projects' ? (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card
                    className="p-0 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="relative h-40">
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg mb-1">{project.name}</h3>
                        <p className="text-white/80 text-sm line-clamp-1">{project.description}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-4">
                          <span className="text-neutral-500 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {project.donorCount} 人
                          </span>
                          <span className="text-neutral-500 flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            目标 {project.targetPoints.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-honghua-600 font-medium">
                          {Math.round((project.currentPoints / project.targetPoints) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(project.currentPoints / project.targetPoints) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-honghua-400 to-honghua-600 rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins className="w-5 h-5 text-honghua-500" />
                          <span className="font-medium">
                            已筹 <span className="text-honghua-600 font-bold">{project.currentPoints.toLocaleString()}</span> 积分
                          </span>
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(project);
                          }}
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                        >
                          立即捐赠
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="records"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {myDonationRecords.length > 0 ? (
                <div className="space-y-4">
                  {myDonationRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-neutral-800">{record.projectName}</h4>
                            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(record.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-honghua-600 font-bold text-lg">-{record.amount}</p>
                            <p className="text-xs text-neutral-400">积分</p>
                          </div>
                        </div>
                        {record.message && (
                          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 mb-3">
                            💬 {record.message}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {record.anonymous ? (
                              <span className="text-neutral-400 flex items-center gap-1">
                                <EyeOff className="w-4 h-4" />
                                匿名捐赠
                              </span>
                            ) : (
                              <span className="text-neutral-400 flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                实名捐赠
                              </span>
                            )}
                            {record.certificate && (
                              <span className="text-chaojing-600 flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                已获证书
                              </span>
                            )}
                          </div>
                          {record.certificate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCertificate(record)}
                              leftIcon={<Award className="w-4 h-4" />}
                            >
                              查看证书
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="暂无捐赠记录"
                  description="用小红花积分参与公益，留下爱的印记"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        size="lg"
        title="公益捐赠"
        footer={
          selectedProject && (
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-sm text-neutral-500">捐赠</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-honghua-500" />
                  <span className="text-2xl font-bold text-honghua-600">{donationAmount}</span>
                  <span className="text-sm text-neutral-400">积分</span>
                </div>
              </div>
              <Button
                variant="success"
                size="lg"
                onClick={handleDonate}
                loading={donationLoading}
                disabled={donationAmount <= 0 || user.points < donationAmount}
                leftIcon={<HeartHandshake className="w-5 h-5" />}
              >
                {user.points < donationAmount ? '积分不足' : '确认捐赠'}
              </Button>
            </div>
          )
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <img
                src={selectedProject.coverImage}
                alt={selectedProject.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-neutral-800 mb-1">{selectedProject.name}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2">{selectedProject.description}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedProject.donorCount} 人已捐
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    目标 {selectedProject.targetPoints.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">选择捐赠数量</h4>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {quickAmounts.map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAmount(amount)}
                    className={cn(
                      'py-3 rounded-xl font-medium transition-all',
                      donationAmount === amount && customAmount === ''
                        ? 'bg-gradient-to-r from-honghua-500 to-honghua-600 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    <Flower2 className="w-4 h-4 inline mr-1" />
                    {amount}
                  </motion.button>
                ))}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="或输入自定义数量"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min={1}
                  suffix={<Flower2 className="w-5 h-5 text-honghua-500" />}
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">捐赠方式</h4>
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all w-full',
                  isAnonymous
                    ? 'border-honghua-500 bg-honghua-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  isAnonymous
                    ? 'border-honghua-500 bg-honghua-500'
                    : 'border-neutral-300'
                )}>
                  {isAnonymous && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-neutral-800 flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    匿名捐赠
                  </p>
                  <p className="text-sm text-neutral-500">选择后您的名字将不会公开显示</p>
                </div>
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                留言祝福 <span className="text-sm text-neutral-400 font-normal">(选填)</span>
              </h4>
              <TextArea
                placeholder="写下您对受助者的祝福..."
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                maxLength={100}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between text-sm bg-neutral-50 rounded-xl p-4">
              <span className="text-neutral-600">当前可用积分</span>
              <span className="font-bold text-honghua-600 flex items-center gap-1">
                <Flower2 className="w-4 h-4" />
                {user.points.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <AnimatePresence>
        {showCertificateModal && currentCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCertificateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-chaojing-50 via-white to-honghua-50 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 16 + 8}px`,
                        color: i % 2 === 0 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                      }}
                      animate={{
                        y: [0, -20],
                        opacity: [0, 0.6, 0],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    >
                      {i % 2 === 0 ? '🌸' : '✨'}
                    </motion.div>
                  ))}
                </div>

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-honghua-400 to-honghua-600 flex items-center justify-center mx-auto mb-4 shadow-lg"
                    >
                      <Award className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-neutral-800 mb-1">公益捐赠证书</h2>
                    <p className="text-neutral-500">小红花公益计划</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-chaojing-200">
                    <div className="text-center mb-4">
                      <p className="text-neutral-600 mb-2">兹证明</p>
                      <p className="text-xl font-bold text-neutral-800 mb-2">
                        {currentCertificate.anonymous ? '爱心人士' : user.nickname}
                      </p>
                      <p className="text-neutral-600">
                        于 <span className="font-semibold">{formatDate(currentCertificate.createdAt)}</span>
                      </p>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-neutral-600 mb-2">向</p>
                      <p className="text-lg font-semibold text-honghua-600 mb-2">
                        「{currentCertificate.projectName}」
                      </p>
                      <p className="text-neutral-600">捐赠</p>
                    </div>

                    <div className="text-center mb-4">
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.4 }}
                        className="flex items-center justify-center gap-2 text-4xl font-bold bg-gradient-to-r from-chaojing-500 to-honghua-500 bg-clip-text text-transparent"
                      >
                        <Flower2 className="w-10 h-10 text-honghua-500" />
                        {currentCertificate.amount}
                        <span className="text-lg text-neutral-500 font-normal">积分</span>
                      </motion.div>
                    </div>

                    {currentCertificate.message && (
                      <div className="bg-chaojing-50 rounded-xl p-3 mb-4">
                        <p className="text-sm text-neutral-600 italic">
                          💬 "{currentCertificate.message}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-neutral-500 border-t border-neutral-200 pt-4">
                      <span>证书编号</span>
                      <span className="font-mono font-medium text-neutral-700">
                        {generateCertificateCode()}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-neutral-500 mb-6">
                    感谢您的爱心，世界因您而更美好 🌸
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleShareCertificate}
                      leftIcon={<Share2 className="w-5 h-5" />}
                    >
                      分享
                    </Button>
                    <Button
                      variant="success"
                      size="lg"
                      className="flex-1"
                      onClick={() => setShowCertificateModal(false)}
                      leftIcon={<Check className="w-5 h-5" />}
                    >
                      完成
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
