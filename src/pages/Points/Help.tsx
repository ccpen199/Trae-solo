import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Flower2,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Calendar,
  Sparkles,
  Gift,
  Users,
  Ticket,
  Heart,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';

interface FAQItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const faqItems: FAQItem[] = [
  {
    question: '如何获得小红花积分？',
    answer: '您可以通过以下方式获得小红花：\n• 每日签到：+10小红花/天\n• 发布爆料并通过审核：+20小红花/条\n• 参与圈子活动并完成：+30小红花/次\n• 邀请好友注册：+50小红花/人\n• 内容被精选或置顶：额外+30小红花',
    icon: Calendar
  },
  {
    question: '小红花有什么用途？',
    answer: '小红花可用于：\n• 积分商城兑换优惠券和实物商品\n• 公益捐赠，支持惠州本地公益项目\n• 解锁会员等级特权\n• 参与平台抽奖活动\n• 兑换活动报名资格',
    icon: Gift
  },
  {
    question: '会员等级如何划分？',
    answer: '小红花会员共10个等级：\nLV.1 新手上路（0-99分）\nLV.2 初级会员（100-499分）\nLV.3 白银会员（500-999分）\nLV.4 白银会员（1000-1999分）\nLV.5 黄金会员（2000-3499分）\nLV.6 黄金会员（3500-4999分）\nLV.7 黄金会员（5000-7999分）\nLV.8 铂金会员（8000-11999分）\nLV.9 铂金会员（12000-19999分）\nLV.10 钻石会员（20000分以上）',
    icon: Award
  },
  {
    question: '积分会过期吗？',
    answer: '小红花积分永久有效，不会过期。您可以随时使用积分兑换商品或参与活动。但请注意，违规获取的积分将被平台收回。',
    icon: Star
  },
  {
    question: '如何查看我的积分记录？',
    answer: '您可以在「我的」-「小红花积分」页面查看完整的积分收支记录，包括每一笔积分的获取来源、支出用途和当前余额。',
    icon: TrendingUp
  },
  {
    question: '兑换的商品如何领取？',
    answer: '• 优惠券：兑换后即时到账，可在「我的」-「优惠券」中查看和使用\n• 实物商品：需填写收货地址，7个工作日内安排发货\n• 惠州特色商品：支持到店自提或快递配送\n• 如有疑问可联系客服：400-888-8888',
    icon: Ticket
  },
  {
    question: '公益捐赠如何操作？',
    answer: '您可以在「积分商城」-「公益捐赠」板块选择感兴趣的公益项目，用小红花进行捐赠。平台会定期公示捐赠资金使用情况，确保透明公开。每一笔捐赠都会获得专属电子证书。',
    icon: Heart
  },
  {
    question: '什么情况下积分会被扣除？',
    answer: '以下情况可能导致积分被扣除：\n• 发布违规内容被删除\n• 恶意灌水、刷分等作弊行为\n• 恶意举报、造谣等违反社区规则的行为\n• 账号注销时积分将被清零\n如有疑问可联系客服申诉。',
    icon: HelpCircle
  }
];

const waysToEarn = [
  { icon: Calendar, title: '每日签到', points: '+10', desc: '每日登录签到', color: 'from-westlake-400 to-westlake-600' },
  { icon: Sparkles, title: '发布爆料', points: '+20', desc: '审核通过后发放', color: 'from-honghua-400 to-honghua-600' },
  { icon: Gift, title: '参与活动', points: '+30', desc: '完成活动并打卡', color: 'from-chaojing-400 to-chaojing-600' },
  { icon: Users, title: '邀请好友', points: '+50', desc: '好友成功注册', color: 'from-purple-400 to-purple-600' },
];

export default function PointHelp() {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="font-semibold text-lg text-neutral-800">积分说明</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <Card className="p-6 bg-gradient-to-br from-chaojing-400 via-chaojing-500 to-chaojing-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 24 + 12}px`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.2, 0.5, 0.2],
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{
                    duration: Math.random() * 4 + 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                >
                  🌸
                </motion.div>
              ))}
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Flower2 className="w-10 h-10 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">小红花积分</h2>
                  <p className="text-white/80">惠州生活圈专属积分体系</p>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed">
                小红花是惠州生活圈的官方积分，您可以通过签到、发布内容、参与活动等方式获取，
                用于兑换优惠券、实物商品，或参与公益捐赠。让每一份贡献都有价值！
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="font-bold text-lg text-neutral-800 mb-4">赚取积分方式</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {waysToEarn.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <Card className="p-4 h-full">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white mb-3',
                      item.color
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-medium text-neutral-800 mb-1">{item.title}</h4>
                    <div className="text-honghua-600 font-bold text-lg mb-1">{item.points}</div>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-westlake-500" />
            常见问题
          </h3>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const Icon = item.icon;
              const isExpanded = expandedIndex === index;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.03 }}
                >
                  <Card
                    className={cn(
                      'p-0 overflow-hidden cursor-pointer transition-all',
                      isExpanded && 'ring-2 ring-westlake-500'
                    )}
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        isExpanded ? 'bg-westlake-100 text-westlake-600' : 'bg-neutral-100 text-neutral-500'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={cn(
                          'font-medium transition-colors',
                          isExpanded ? 'text-westlake-700' : 'text-neutral-800'
                        )}>
                          {item.question}
                        </h4>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-neutral-400"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="p-4 bg-neutral-50 rounded-lg">
                              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="p-6 bg-gradient-to-br from-westlake-50 to-honghua-50 border border-westlake-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-westlake-100 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-westlake-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-800 mb-2">还有其他问题？</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  如有其他关于积分的疑问，欢迎联系我们的客服团队。
                </p>
                <div className="flex flex-wrap gap-2">
                  <Tag color="westlake">客服热线：400-888-8888</Tag>
                  <Tag color="honghua">工作时间：9:00-21:00</Tag>
                  <Tag color="chaojing">微信公众号：惠州生活圈</Tag>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
