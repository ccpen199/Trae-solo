import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  FileCheck,
  Copy,
  Download,
  ExternalLink,
  Share2,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  QrCode,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type ConclusionType = 'genuine' | 'fake' | 'suspicious';

interface AppraisalPoint {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

interface ExpertInfo {
  name: string;
  signature: string;
  level: 'national' | 'provincial' | 'senior';
  levelText: string;
  no: string;
}

interface VerificationRecord {
  ip: string;
  location: string;
  time: string;
  result: 'pass' | 'fail';
}

interface CertificateDetail {
  certificateNo: string;
  artworkName: string;
  artworkCategory: string;
  era: string;
  conclusion: ConclusionType;
  conclusionText: string;
  conclusionDetail: string;
  appraisalPoints: AppraisalPoint[];
  images: string[];
  leadExpert: ExpertInfo;
  reviewers: ExpertInfo[];
  appraisalTime: string;
  blockchainHash: string;
  blockchainHeight: number;
  chainTime: string;
  txId: string;
}

const MOCK_CERTIFICATES: Record<string, CertificateDetail> = {
  'JZG-202406-00128': {
    certificateNo: 'JZG-202406-00128',
    artworkName: '清乾隆青花缠枝莲纹赏瓶',
    artworkCategory: '陶瓷 · 瓷器',
    era: '清代乾隆年间（约1736-1795年）',
    conclusion: 'genuine',
    conclusionText: '真品',
    conclusionDetail:
      '经目鉴+仪器检测，此青花缠枝莲纹赏瓶器型规整，青花发色沉稳呈翠毛蓝，胎釉结合紧密，修足规整，底款为乾隆官窑标准篆书款。综合判断为清代乾隆本朝官窑真品，品相完好，具有较高的收藏价值。',
    appraisalPoints: [
      { name: '器型', status: 'pass', detail: '造型端庄，比例协调，符合乾隆官窑标准制式' },
      { name: '纹饰', status: 'pass', detail: '缠枝莲纹布局疏朗，笔法流畅，层次分明' },
      { name: '胎釉', status: 'pass', detail: '胎质细腻洁白，釉面莹润，胎釉结合紧密' },
      { name: '款识', status: 'pass', detail: '"大清乾隆年制"六字三行篆书款，笔法规范' },
      { name: '工艺', status: 'pass', detail: '修足规整，露胎处泛火石红，符合时代特征' },
      { name: '微观痕迹', status: 'pass', detail: '气泡分布自然，老化痕迹明显，无人工做旧' },
    ],
    images: [
      'https://picsum.photos/seed/ceramic1/400/400',
      'https://picsum.photos/seed/ceramic2/400/400',
      'https://picsum.photos/seed/ceramic3/400/400',
      'https://picsum.photos/seed/ceramic4/400/400',
    ],
    leadExpert: {
      name: '张明德',
      signature: 'Zhang Mingde',
      level: 'national',
      levelText: '国家级鉴定专家',
      no: 'EXP-CN-00128',
    },
    reviewers: [
      {
        name: '李雅琴',
        signature: 'Li Yaqin',
        level: 'national',
        levelText: '国家级鉴定专家',
        no: 'EXP-CN-00092',
      },
      {
        name: '王建国',
        signature: 'Wang Jianguo',
        level: 'provincial',
        levelText: '省级鉴定专家',
        no: 'EXP-BJ-00356',
      },
    ],
    appraisalTime: '2024-06-12 14:32:18',
    blockchainHash: '0x8f3a9c2e1b7d5f4a8e6c3b1d9f2a5e8c7b4d1f3a5e7c9b2d4f6a8e1c3b5d7f91',
    blockchainHeight: 19872345,
    chainTime: '2024-06-12 14:35:22',
    txId: '0xabc123def456...789xyz',
  },
  'JZG-202406-00133': {
    certificateNo: 'JZG-202406-00133',
    artworkName: '明晚期和田白玉子冈牌',
    artworkCategory: '玉器 · 佩饰',
    era: '明代万历年间（约1573-1620年）',
    conclusion: 'suspicious',
    conclusionText: '存疑',
    conclusionDetail:
      '此玉牌玉质确为和田白玉，油润度尚可，但雕工风格与明代陆子冈真迹存在差异：地子平整度略逊，阴线走刀有断续痕迹，牌头饰纹比例稍失协调。综合判断为清代仿子冈风格作品，有一定收藏价值，但非明代本朝子冈真迹。',
    appraisalPoints: [
      { name: '玉质', status: 'pass', detail: '和田白玉，质地细腻，油润度尚可' },
      { name: '器型', status: 'pass', detail: '形制规整，比例基本合理' },
      { name: '雕工', status: 'warn', detail: '阴线走刀有断续，地子平整度略欠，与真迹有差' },
      { name: '沁色', status: 'warn', detail: '表面沁色有加速老化处理痕迹' },
      { name: '包浆', status: 'pass', detail: '传世包浆自然，有一定年份' },
      { name: '款识', status: 'warn', detail: '"子冈"款字体风格与标准款略有差异' },
    ],
    images: [
      'https://picsum.photos/seed/jade1/400/400',
      'https://picsum.photos/seed/jade2/400/400',
      'https://picsum.photos/seed/jade3/400/400',
      'https://picsum.photos/seed/jade4/400/400',
    ],
    leadExpert: {
      name: '张明德',
      signature: 'Zhang Mingde',
      level: 'national',
      levelText: '国家级鉴定专家',
      no: 'EXP-CN-00128',
    },
    reviewers: [
      {
        name: '刘长根',
        signature: 'Liu Changgen',
        level: 'senior',
        levelText: '资深鉴定专家',
        no: 'EXP-SH-00782',
      },
      {
        name: '陈美玲',
        signature: 'Chen Meiling',
        level: 'provincial',
        levelText: '省级鉴定专家',
        no: 'EXP-ZJ-00214',
      },
    ],
    appraisalTime: '2024-06-14 10:18:45',
    blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    blockchainHeight: 19895612,
    chainTime: '2024-06-14 10:22:08',
    txId: '0xdef789abc012...345uvw',
  },
  'JZG-202406-00145': {
    certificateNo: 'JZG-202406-00145',
    artworkName: '齐白石款虾蟹图立轴',
    artworkCategory: '书画 · 绘画',
    era: '近现代（托名）',
    conclusion: 'fake',
    conclusionText: '仿品',
    conclusionDetail:
      '此幅虾蟹图纸质、装裱虽有旧意，但笔墨功力与齐白石真迹相去甚远：虾身结构含糊，缺少透明灵动之感，蟹爪软弱无力，书法款识笔力单薄，印章篆刻水平低下。综合判断为近二十年仿齐白石风格的赝品，无收藏价值。',
    appraisalPoints: [
      { name: '笔墨', status: 'fail', detail: '虾蟹造型呆板，笔墨单薄，无大家气度' },
      { name: '气韵', status: 'fail', detail: '整体缺乏生机灵动，画面刻意做作' },
      { name: '书法', status: 'fail', detail: '款识书法笔力软弱，结体松散' },
      { name: '印章', status: 'fail', detail: '印章篆刻水平低劣，与齐白石自用印不符' },
      { name: '纸绢', status: 'warn', detail: '纸张虽有旧感，但为人为做旧' },
      { name: '著录', status: 'fail', detail: '查无相关出版著录，流传脉络不清' },
    ],
    images: [
      'https://picsum.photos/seed/painting1/400/400',
      'https://picsum.photos/seed/painting2/400/400',
      'https://picsum.photos/seed/painting3/400/400',
      'https://picsum.photos/seed/painting4/400/400',
    ],
    leadExpert: {
      name: '李雅琴',
      signature: 'Li Yaqin',
      level: 'national',
      levelText: '国家级鉴定专家',
      no: 'EXP-CN-00092',
    },
    reviewers: [
      {
        name: '张明德',
        signature: 'Zhang Mingde',
        level: 'national',
        levelText: '国家级鉴定专家',
        no: 'EXP-CN-00128',
      },
      {
        name: '赵文博',
        signature: 'Zhao Wenbo',
        level: 'senior',
        levelText: '资深鉴定专家',
        no: 'EXP-NJ-00467',
      },
    ],
    appraisalTime: '2024-06-16 15:45:30',
    blockchainHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    blockchainHeight: 19918207,
    chainTime: '2024-06-16 15:49:12',
    txId: '0xghi456jkl789...012mno',
  },
};

const QUICK_SAMPLE_NOS = [
  'JZG-202406-00128',
  'JZG-202406-00133',
  'JZG-202406-00145',
];

const MOCK_VERIFY_HISTORY: VerificationRecord[] = [
  {
    ip: '114.88.23.156',
    location: '上海市 浦东新区',
    time: '2024-06-18 09:24:12',
    result: 'pass',
  },
  {
    ip: '221.216.112.78',
    location: '北京市 朝阳区',
    time: '2024-06-17 16:42:55',
    result: 'pass',
  },
  {
    ip: '183.129.45.201',
    location: '浙江省 杭州市',
    time: '2024-06-15 11:08:33',
    result: 'pass',
  },
];

const CornerPattern = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 60 60"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0H60V60"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 0V8H0M0 52H8V60M52 0V8H60M60 52H52V60"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path
      d="M14 0V14H0M0 46H14V60M46 0V14H60M60 46H46V60"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      opacity="0.7"
    />
    <g stroke="currentColor" strokeWidth="0.6" opacity="0.6">
      <path d="M0 30L60 30" />
      <path d="M30 0L30 60" />
    </g>
  </svg>
);

const RidingSeal = ({
  className,
  side,
}: {
  className?: string;
  side: 'left' | 'right';
}) => (
  <div
    className={`absolute top-24 ${side === 'left' ? '-left-6' : '-right-6'} w-16 h-24
      bg-cinnabar-400/85 rounded-sm flex items-center justify-center
      ${side === 'left' ? 'rounded-r-none border-r-0' : 'rounded-l-none border-l-0'}
      border-2 border-cinnabar-500 shadow-seal`}
    style={{
      clipPath:
        side === 'left'
          ? 'polygon(100% 0, 100% 100%, 60% 98%, 0 92%, 0 8%, 60% 2%)'
          : 'polygon(0 0, 0 100%, 40% 98%, 100% 92%, 100% 8%, 40% 2%)',
    }}
  >
    <div
      className="text-white font-serif font-bold text-xs leading-tight text-center
      transform rotate-90 whitespace-nowrap"
      style={{ writingMode: 'vertical-rl' }}
    >
      <span className="block">鉴真</span>
      <span className="block">阁印</span>
    </div>
  </div>
);

const SealIcon = ({
  type,
  className,
}: {
  type: 'pass' | 'warn' | 'fail';
  className?: string;
}) => {
  if (type === 'pass')
    return <CheckCircle2 className={`text-jade-500 ${className}`} />;
  if (type === 'warn')
    return <AlertTriangle className={`text-gold-500 ${className}`} />;
  return <XCircle className={`text-cinnabar-500 ${className}`} />;
};

const ExpertLevelSeal = ({ level }: { level: ExpertInfo['level'] }) => {
  const config = {
    national: { text: '国', color: 'bg-cinnabar-500', ring: 'ring-cinnabar-600' },
    provincial: { text: '省', color: 'bg-gold-500', ring: 'ring-gold-600' },
    senior: { text: '资', color: 'bg-jade-500', ring: 'ring-jade-600' },
  };
  const c = config[level];
  return (
    <div
      className={`w-9 h-9 ${c.color} text-white rounded-sm flex items-center justify-center
      font-serif font-bold text-base ring-2 ${c.ring} ring-offset-1 ring-offset-rice-100
      shadow-seal transform -rotate-3`}
    >
      {c.text}
    </div>
  );
};

const ConclusionSeal = ({ conclusion }: { conclusion: ConclusionType }) => {
  const config = {
    genuine: { text: '真品', sub: 'GENUINE' },
    suspicious: { text: '存疑', sub: 'SUSPICIOUS' },
    fake: { text: '仿品', sub: 'FAKE' },
  };
  const c = config[conclusion];
  return (
    <motion.div
      initial={{ scale: 2, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        delay: 0.6,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="w-24 h-24 rounded-full border-4 border-cinnabar-500 bg-cinnabar-500/10
        flex flex-col items-center justify-center shadow-seal relative"
    >
      <div className="absolute inset-1 rounded-full border-2 border-cinnabar-400" />
      <span className="font-serif font-black text-2xl text-cinnabar-500 tracking-wider">
        {c.text}
      </span>
      <span className="font-mono text-[9px] text-cinnabar-400 mt-0.5 tracking-[0.2em]">
        {c.sub}
      </span>
    </motion.div>
  );
};

export default function Certificate() {
  const [certificateNo, setCertificateNo] = useState('JZG-202406-00128');
  const [searchInput, setSearchInput] = useState('JZG-202406-00128');
  const [searched, setSearched] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'pass' | 'fail' | null>(null);
  const [isTampered, setIsTampered] = useState(false);
  const [hashExpanded, setHashExpanded] = useState(false);
  const [showStampAnim, setShowStampAnim] = useState(false);
  const toast = useToast();

  const currentCert = useMemo(
    () => MOCK_CERTIFICATES[certificateNo] ?? null,
    [certificateNo],
  );

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCertificateNo(searchInput.trim().toUpperCase());
      setSearched(true);
      setVerifyResult(null);
      setIsTampered(false);
      setShowStampAnim(false);
    }
  };

  const handleQuickQuery = (no: string) => {
    setSearchInput(no);
    setCertificateNo(no);
    setSearched(true);
    setVerifyResult(null);
    setIsTampered(false);
    setShowStampAnim(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label}已复制`);
    });
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setVerifyResult(null);
    setShowStampAnim(false);
    setTimeout(() => {
      setIsVerifying(false);
      setShowStampAnim(true);
      setVerifyResult(isTampered ? 'fail' : 'pass');
      setTimeout(() => setShowStampAnim(false), 1000);
    }, 2000);
  };

  const handleSimulateTamper = () => {
    setIsTampered(!isTampered);
    setVerifyResult(null);
    toast[isTampered ? 'success' : 'warning'](
      isTampered ? '已恢复证书原始状态' : '已模拟篡改证书数据，请点击核验查看效果',
    );
  };

  const conclusionBadgeColor = (c: ConclusionType) => {
    if (c === 'genuine') return 'bg-jade-500';
    if (c === 'suspicious') return 'bg-gold-500';
    return 'bg-cinnabar-500';
  };

  return (
    <div className="min-h-screen pb-16">
      <style>{`
        @keyframes paperGrain {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.05; }
        }
        .cert-watermark {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'><text x='140' y='150' font-family='Noto Serif SC, serif' font-size='22' font-weight='700' fill='%23C9A961' text-anchor='middle' transform='rotate(-30 140 150)' opacity='0.08'>鉴真阁 JIANZHENGE</text></svg>");
          background-repeat: repeat;
        }
        .signature-hand {
          font-family: 'Brush Script MT', 'Noto Serif SC', cursive;
          font-style: italic;
        }
        @keyframes verifyStamp {
          0% { transform: scale(2.5) rotate(-15deg); opacity: 0; }
          50% { transform: scale(0.9) rotate(3deg); opacity: 0.9; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .verify-stamp-anim {
          animation: verifyStamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div className="container pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <Tag variant="gold" className="mb-4">
            <Shield className="w-3.5 h-3.5 mr-1" />
            区块链存证 · 权威可溯
          </Tag>
          <h1 className="section-title text-3xl md:text-4xl mb-3">
            专业鉴定证书查询平台
          </h1>
          <p className="section-subtitle text-lg">
            证书所有数据已同步联盟链永久存证，可随时核验真伪
          </p>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* ============== 左侧 60%: 防伪证书 ============== */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.9, transformOrigin: 'top center' }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="xl:w-[60%] w-full"
          >
            {!searched || !currentCert ? (
              <Card className="min-h-[800px] flex items-center justify-center">
                <EmptyState
                  icon={<FileCheck className="w-16 h-16 text-gold-500" />}
                  title={searched ? '证书未找到' : '暂无查询结果'}
                  description={
                    searched
                      ? '未查询到该编号的证书，请检查编号后重试'
                      : '请在右侧输入证书编号查询鉴定证书详情'
                  }
                />
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCert.certificateNo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* 卷轴顶部装饰 */}
                  <div className="h-6 bg-ink-gradient rounded-t-lg border-2 border-gold-400 border-b-0 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                      <div className="w-3 h-3 rounded-full bg-gold-400 shadow-gold-glow" />
                      <div className="w-3 h-3 rounded-full bg-gold-400 shadow-gold-glow" />
                    </div>
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(201,169,97,0.4) 12px, rgba(201,169,97,0.4) 13px)',
                      }}
                    />
                  </div>

                  {/* 证书主体 */}
                  <div
                    className={`relative bg-rice-100 border-x-2 border-b-2 border-gold-400 shadow-scroll overflow-hidden
                      ${isTampered ? 'ring-2 ring-cinnabar-400 ring-offset-2' : ''}`}
                  >
                    {/* 防伪水印层 */}
                    <div className="absolute inset-0 cert-watermark pointer-events-none z-0" />
                    {/* 纸张纹理 */}
                    <div className="absolute inset-0 bg-paper-texture pointer-events-none z-0" />

                    {/* 骑缝章 */}
                    <RidingSeal side="left" />
                    <RidingSeal side="right" />

                    {/* 双线鎏金边框内层 */}
                    <div className="relative m-4 border-2 border-gold-400 z-10">
                      <div className="absolute inset-2 border border-gold-300 pointer-events-none" />

                      {/* 四角回纹装饰 */}
                      <CornerPattern className="absolute top-3 left-3 w-10 h-10 text-gold-400" />
                      <CornerPattern
                        className="absolute top-3 right-3 w-10 h-10 text-gold-400 scale-x-[-1]"
                      />
                      <CornerPattern
                        className="absolute bottom-3 left-3 w-10 h-10 text-gold-400 scale-y-[-1]"
                      />
                      <CornerPattern
                        className="absolute bottom-3 right-3 w-10 h-10 text-gold-400 rotate-180"
                      />

                      <div className="px-10 py-10 relative">
                        {/* ========== 证书头部 ========== */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-center mb-8"
                        >
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div
                              className="w-12 h-12 rounded-full border-2 border-gold-400 bg-jade-700/10
                                flex items-center justify-center"
                            >
                              <span
                                className="font-serif text-2xl font-black text-jade-600"
                                style={{
                                  fontFamily: 'Noto Serif SC, serif',
                                }}
                              >
                                鉴
                              </span>
                            </div>
                          </div>
                          <h2
                            className="font-serif font-black text-5xl text-jade-700 mb-2 tracking-[0.3em]"
                            style={{
                              fontFamily: 'Noto Serif SC, serif',
                            }}
                          >
                            鉴真阁
                          </h2>
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px w-16 bg-gold-gradient" />
                            <span
                              className="text-gold-500 text-lg font-medium tracking-widest"
                              style={{
                                background:
                                  'linear-gradient(135deg, #C9A961 0%, #DBB85E 50%, #A08544 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              专业鉴定证书
                            </span>
                            <div className="h-px w-16 bg-gold-gradient" />
                          </div>
                          <p className="text-gold-600 text-xs tracking-[0.4em] uppercase">
                            Professional Authentication Certificate
                          </p>
                        </motion.div>

                        {/* 证书编号 */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center justify-between mb-6 px-4 py-3 bg-rice-50/50 border-y border-gold-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-jade-500 text-sm font-medium">
                              证书编号 / No.
                            </span>
                            <span
                              className="font-mono text-jade-700 font-bold tracking-wide"
                              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                            >
                              {currentCert.certificateNo}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleCopy(currentCert.certificateNo, '证书编号')
                            }
                            className="flex items-center gap-1 text-gold-600 hover:text-gold-500 transition-colors text-sm"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            复制
                          </button>
                        </motion.div>

                        {/* ========== 藏品图像区 ========== */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 }}
                          className="mb-8"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-jade-500 rounded" />
                            <span className="font-serif font-bold text-jade-700 text-base">
                              藏品图像
                            </span>
                            <span className="text-jade-400 text-xs">/ Artwork Images</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-3 bg-rice-50 border border-gold-200 rounded-md">
                            {currentCert.images.map((src, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-square overflow-hidden rounded-sm border border-gold-200 group"
                              >
                                <img
                                  src={src}
                                  alt={`detail-${idx}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 border border-gold-100/40 pointer-events-none" />
                                {/* 微型水印 logo */}
                                <div
                                  className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-sm
                                    bg-black/30 backdrop-blur-[1px] text-white
                                    text-[9px] font-serif font-bold tracking-wide"
                                >
                                  鉴真阁
                                </div>
                                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="text-white text-[10px] font-bold">
                                    {idx + 1}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* 藏品基础信息 */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mb-8 grid grid-cols-3 gap-4 px-2"
                        >
                          <div>
                            <p className="text-xs text-jade-400 mb-1">藏品名称</p>
                            <p className="font-serif font-semibold text-jade-700 text-sm leading-tight">
                              {currentCert.artworkName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-jade-400 mb-1">藏品类别</p>
                            <p className="font-medium text-jade-700 text-sm">
                              {currentCert.artworkCategory}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-jade-400 mb-1">鉴定年代</p>
                            <p className="font-medium text-jade-700 text-sm">
                              {currentCert.era}
                            </p>
                          </div>
                        </motion.div>

                        {/* ========== 鉴定结论区 ========== */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="mb-8 p-5 bg-rice-50 border-2 border-jade-200/60 rounded-md relative"
                        >
                          {/* 标题印章框 */}
                          <div className="flex items-start justify-between mb-5 gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-jade-700 rounded-sm text-white">
                              <div className="w-6 h-6 rounded-sm border border-jade-400 flex items-center justify-center bg-jade-600">
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-serif font-bold tracking-[0.2em]">
                                鉴定结论
                              </span>
                            </div>
                            <ConclusionSeal conclusion={currentCert.conclusion} />
                          </div>

                          {/* 结论标签 */}
                          <div className="flex items-center gap-3 mb-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-sm text-white font-bold tracking-wider ${conclusionBadgeColor(
                                currentCert.conclusion,
                              )}`}
                            >
                              {currentCert.conclusionText}
                              <span className="ml-2 text-xs font-mono opacity-80">
                                {currentCert.conclusion.toUpperCase()}
                              </span>
                            </span>
                          </div>

                          {/* 详细结论 */}
                          <p className="text-jade-700 text-sm leading-[1.9] mb-5 indent-8 font-serif">
                            {currentCert.conclusionDetail}
                          </p>

                          {/* 鉴定要点清单 */}
                          <div className="pt-4 border-t border-gold-200/60">
                            <p className="text-xs text-jade-500 mb-3 font-medium">
                              鉴定要点 / Appraisal Points
                            </p>
                            <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                              {currentCert.appraisalPoints.map((pt, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 py-1.5"
                                  title={pt.detail}
                                >
                                  <SealIcon
                                    type={pt.status}
                                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-medium text-jade-700">
                                        {pt.name}
                                      </span>
                                      <span className="text-[10px] text-jade-400">
                                        · {pt.status === 'pass' ? '符合' : pt.status === 'warn' ? '存疑' : '不符'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-jade-500 leading-tight truncate">
                                      {pt.detail}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>

                        {/* ========== 专家签名区 ========== */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 }}
                          className="mb-8"
                        >
                          <div className="grid grid-cols-3 gap-4">
                            {/* 主鉴定专家 */}
                            <div className="col-span-1 p-4 bg-rice-50 border border-gold-200 rounded-sm">
                              <div className="text-[10px] text-jade-400 mb-2 tracking-wider">
                                主鉴定专家
                              </div>
                              <div className="flex items-end gap-3 mb-2">
                                <div
                                  className="signature-hand text-3xl text-jade-700 leading-none"
                                  style={{ fontFamily: 'Brush Script MT, cursive' }}
                                >
                                  {currentCert.leadExpert.signature}
                                </div>
                                <ExpertLevelSeal
                                  level={currentCert.leadExpert.level}
                                />
                              </div>
                              <div className="flex items-center justify-between border-t border-gold-200 pt-2 mt-2">
                                <span className="font-serif font-bold text-jade-700 text-sm">
                                  {currentCert.leadExpert.name}
                                </span>
                                <span className="text-[10px] text-gold-600 font-mono">
                                  {currentCert.leadExpert.no}
                                </span>
                              </div>
                              <p className="text-[10px] text-jade-500 mt-1">
                                {currentCert.leadExpert.levelText}
                              </p>
                            </div>

                            {/* 复核专家 */}
                            {currentCert.reviewers.map((r, idx) => (
                              <div
                                key={idx}
                                className="col-span-1 p-4 bg-rice-50 border border-gold-200 rounded-sm"
                              >
                                <div className="text-[10px] text-jade-400 mb-2 tracking-wider">
                                  复核专家 {idx + 1}
                                </div>
                                <div className="flex items-end gap-3 mb-2">
                                  <div
                                    className="signature-hand text-3xl text-jade-700 leading-none"
                                    style={{ fontFamily: 'Brush Script MT, cursive' }}
                                  >
                                    {r.signature}
                                  </div>
                                  <ExpertLevelSeal level={r.level} />
                                </div>
                                <div className="flex items-center justify-between border-t border-gold-200 pt-2 mt-2">
                                  <span className="font-serif font-bold text-jade-700 text-sm">
                                    {r.name}
                                  </span>
                                  <span className="text-[10px] text-gold-600 font-mono">
                                    {r.no}
                                  </span>
                                </div>
                                <p className="text-[10px] text-jade-500 mt-1">
                                  {r.levelText}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* ========== 时间与骑缝 ========== */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mb-6 flex items-end justify-between px-4 py-4 border-t border-dashed border-gold-300"
                        >
                          <div>
                            <p className="text-[10px] text-jade-400 mb-1 tracking-wider">
                              鉴定时间
                            </p>
                            <p className="font-mono text-sm text-jade-700 font-semibold">
                              {currentCert.appraisalTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center gap-2 mb-1">
                              <QrCode className="w-5 h-5 text-gold-500" />
                              <span className="text-[10px] text-jade-400 tracking-wider">
                                扫码核验
                              </span>
                            </div>
                            <div
                              className="w-16 h-16 bg-white border border-gold-200 rounded-sm mx-auto
                              flex items-center justify-center"
                              style={{
                                backgroundImage:
                                  'radial-gradient(circle, #223830 1px, transparent 1px)',
                                backgroundSize: '3px 3px',
                              }}
                            >
                              <div className="w-4 h-4 bg-jade-700" />
                            </div>
                          </div>
                        </motion.div>

                        {/* ========== 证书底部 ========== */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55 }}
                          className="pt-4 border-t-2 border-double border-gold-400"
                        >
                          <div className="text-center">
                            <p className="text-xs text-gold-600 mb-1 flex items-center justify-center gap-2">
                              <Shield className="w-3.5 h-3.5" />
                              <span>本证书所有数据已同步至联盟链永久存证</span>
                              <Shield className="w-3.5 h-3.5" />
                            </p>
                            <p className="text-[11px] text-jade-500">
                              扫码或访问{' '}
                              <span className="font-mono font-bold text-gold-600">
                                jianzhenge.com/verify
                              </span>{' '}
                              输入证书编号进行在线核验
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* 卷轴底部装饰 */}
                  <div className="h-6 bg-ink-gradient rounded-b-lg border-2 border-gold-400 border-t-0 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                      <div className="w-3 h-3 rounded-full bg-gold-400 shadow-gold-glow" />
                      <div className="w-3 h-3 rounded-full bg-gold-400 shadow-gold-glow" />
                    </div>
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(201,169,97,0.4) 12px, rgba(201,169,97,0.4) 13px)',
                      }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

          {/* ============== 右侧 40%: 区块链核验面板 ============== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="xl:w-[40%] w-full space-y-5 xl:sticky xl:top-6"
          >
            {/* === 证书查询表单 === */}
            <Card className="border-2 border-gold-300">
              <Card.Content className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gold-500" />
                  <h3 className="font-serif font-bold text-jade-700">证书查询</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label-field text-sm">证书编号</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleSearch()
                          }
                          placeholder="JZG-202406-XXXXX"
                          className="input-field pl-10 font-mono text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jade-400" />
                      </div>
                      <Button onClick={handleSearch} size="md">
                        查询
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-jade-400 mb-2">快速查询示例：</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SAMPLE_NOS.map((no) => (
                        <button
                          key={no}
                          onClick={() => handleQuickQuery(no)}
                          className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all
                            ${
                              certificateNo === no
                                ? 'bg-jade-700 text-white shadow-gold-glow'
                                : 'bg-rice-100 border border-gold-200 text-jade-600 hover:border-gold-400 hover:bg-gold-50'
                            }`}
                        >
                          {no}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {currentCert && (
              <>
                {/* === 区块链存证信息卡片 === */}
                <Card className="border-2 border-gold-400 shadow-gold-glow/30 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient"
                    style={{
                      boxShadow: '0 0 20px rgba(201, 169, 97, 0.5)',
                    }}
                  />
                  <Card.Content className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-ink-gradient flex items-center justify-center">
                          <Shield className="w-4 h-4 text-gold-300" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-jade-700">
                            区块链存证信息
                          </h3>
                          <p className="text-[10px] text-jade-400">
                            Blockchain Notarization
                          </p>
                        </div>
                      </div>
                      <span className="seal-tag">联盟链</span>
                    </div>

                    <div className="space-y-4">
                      {/* 存证哈希 */}
                      <div className="p-3 bg-rice-50 border border-gold-200 rounded-md">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-jade-500 font-medium">
                            存证哈希 / Hash
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleCopy(currentCert.blockchainHash, '存证哈希')
                              }
                              className="text-xs text-gold-600 hover:text-gold-500 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              复制
                            </button>
                            <button
                              onClick={() => setHashExpanded(!hashExpanded)}
                              className="text-jade-500"
                            >
                              {hashExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p
                          className={`font-mono text-[11px] text-jade-700 break-all leading-relaxed
                            ${hashExpanded ? '' : 'line-clamp-2'}`}
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, monospace',
                          }}
                        >
                          {isTampered
                            ? '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e'
                            : currentCert.blockchainHash}
                        </p>
                      </div>

                      {/* 区块高度 + 上链时间 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-rice-50 border border-gold-200 rounded-md">
                          <span className="text-xs text-jade-500 block mb-1">
                            区块高度
                          </span>
                          <p className="font-mono font-bold text-jade-700 text-lg">
                            {currentCert.blockchainHeight.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-rice-50 border border-gold-200 rounded-md">
                          <span className="text-xs text-jade-500 block mb-1">
                            上链时间
                          </span>
                          <p className="font-mono text-xs text-jade-700 font-semibold leading-tight pt-1">
                            {currentCert.chainTime}
                          </p>
                        </div>
                      </div>

                      {/* 交易ID */}
                      <div className="p-3 bg-rice-50 border border-gold-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-jade-500 block mb-0.5">
                              交易 ID / TX
                            </span>
                            <p
                              className="font-mono text-xs text-jade-700 font-semibold"
                              style={{
                                fontFamily:
                                  'ui-monospace, SFMono-Regular, Menlo, monospace',
                              }}
                            >
                              {currentCert.txId}
                            </p>
                          </div>
                          <button className="inline-flex items-center gap-1 text-xs text-gold-600 hover:text-gold-500 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                            浏览器
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* === 一键核验按钮 === */}
                <Card className="border-2 border-jade-200">
                  <Card.Content className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-jade-500" />
                          <h3 className="font-serif font-bold text-jade-700">
                            一键核验证书
                          </h3>
                        </div>
                        <button
                          onClick={handleSimulateTamper}
                          className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-1
                            ${
                              isTampered
                                ? 'bg-cinnabar-100 text-cinnabar-600 border border-cinnabar-300'
                                : 'bg-rice-100 text-jade-500 border border-gold-200 hover:border-gold-400'
                            }`}
                        >
                          <Zap className="w-3 h-3" />
                          {isTampered ? '已模拟篡改' : '模拟篡改'}
                        </button>
                      </div>

                      <Button
                        fullWidth
                        onClick={handleVerify}
                        loading={isVerifying}
                        disabled={isVerifying}
                        size="lg"
                        className="relative overflow-hidden"
                      >
                        {!isVerifying && (
                          <Shield className="w-4 h-4 mr-1" />
                        )}
                        {isVerifying
                          ? '正在比对链上存证数据...'
                          : '开始核验证书真伪'}
                      </Button>

                      {/* 核验结果 */}
                      <AnimatePresence mode="wait">
                        {verifyResult && (
                          <motion.div
                            key={verifyResult}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`relative p-4 rounded-md border-2 overflow-hidden
                              ${
                                verifyResult === 'pass'
                                  ? 'bg-jade-50 border-jade-300'
                                  : 'bg-cinnabar-50 border-cinnabar-300'
                              }`}
                          >
                            {showStampAnim && (
                              <div className="absolute top-3 right-3 pointer-events-none verify-stamp-anim">
                                <div
                                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center
                                    ${
                                      verifyResult === 'pass'
                                        ? 'border-jade-500 bg-jade-500/10'
                                        : 'border-cinnabar-500 bg-cinnabar-500/10'
                                    }`}
                                >
                                  {verifyResult === 'pass' ? (
                                    <CheckCircle2 className="w-10 h-10 text-jade-500" />
                                  ) : (
                                    <XCircle className="w-10 h-10 text-cinnabar-500" />
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3 pr-20">
                              {verifyResult === 'pass' ? (
                                <div className="w-10 h-10 rounded-full bg-jade-500 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-cinnabar-500 flex items-center justify-center flex-shrink-0">
                                  <XCircle className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <div>
                                <h4
                                  className={`font-bold mb-1 ${
                                    verifyResult === 'pass'
                                      ? 'text-jade-700'
                                      : 'text-cinnabar-700'
                                  }`}
                                >
                                  {verifyResult === 'pass'
                                    ? '✓ 验证通过'
                                    : '✗ 验证失败'}
                                </h4>
                                <p
                                  className={`text-sm leading-relaxed ${
                                    verifyResult === 'pass'
                                      ? 'text-jade-600'
                                      : 'text-cinnabar-600'
                                  }`}
                                >
                                  {verifyResult === 'pass'
                                    ? '证书内容完整，与链上存证数据 100% 匹配。鉴定结论、专家签名、藏品图像等所有要素均未被篡改。'
                                    : '检测到证书内容与链上存证数据不一致！数据哈希校验失败，请立即联系鉴真阁官方客服核实，谨防伪造证书。'}
                                </p>
                                <div
                                  className={`mt-2 text-xs font-mono ${
                                    verifyResult === 'pass'
                                      ? 'text-jade-500'
                                      : 'text-cinnabar-500'
                                  }`}
                                >
                                  核验时间：
                                  {new Date().toLocaleString('zh-CN')}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card.Content>
                </Card>

                {/* === 历史验证记录 === */}
                <Card className="border border-gold-200">
                  <Card.Content className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-4 h-4 text-gold-500" />
                      <h3 className="font-serif font-bold text-jade-700">
                        历史验证记录
                      </h3>
                      <span className="ml-auto text-xs text-jade-400">
                        最近 3 次
                      </span>
                    </div>
                    <div className="space-y-2">
                      {MOCK_VERIFY_HISTORY.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-rice-50 rounded-md border border-gold-100"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                              ${
                                rec.result === 'pass'
                                  ? 'bg-jade-100'
                                  : 'bg-cinnabar-100'
                              }`}
                          >
                            {rec.result === 'pass' ? (
                              <CheckCircle2 className="w-4 h-4 text-jade-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-cinnabar-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-jade-700 font-medium">
                                {rec.location}
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  rec.result === 'pass'
                                    ? 'text-jade-600'
                                    : 'text-cinnabar-600'
                                }`}
                              >
                                {rec.result === 'pass' ? '通过' : '失败'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-jade-400 font-mono">
                                {rec.ip}
                              </span>
                              <span className="text-[10px] text-jade-400">
                                ·
                              </span>
                              <span className="text-[10px] text-jade-400">
                                {rec.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>

                {/* === 操作按钮组 === */}
                <Card className="border border-gold-200">
                  <Card.Content className="p-5">
                    <h3 className="font-serif font-bold text-jade-700 mb-4">
                      证书操作
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => toast.success('PDF 生成中，请稍候...')}
                      >
                        下载 PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Share2 className="w-3.5 h-3.5" />}
                        onClick={() => toast.success('分享链接已复制')}
                      >
                        分享证书
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => {
                          toast.success('正在准备打印...');
                          setTimeout(() => window.print(), 500);
                        }}
                      >
                        打印证书
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => toast.success('原图查看器已打开')}
                      >
                        查看原图
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
