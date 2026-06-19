import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Clock,
  AlertTriangle,
  Plus,
  Inbox,
  ChevronRight,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type TabKey = "all" | "pending" | "consulting" | "closed" | "reviewed";

interface Consultation {
  id: string;
  title: string;
  summary: string;
  status: "pending" | "consulting" | "closed" | "reviewed";
  statusLabel: string;
  category: string;
  lastMessage: string;
  lastTime: string;
  hasUnread: boolean;
  unreadCount: number;
  urgency: 1 | 2 | 3;
  lawyer?: {
    name: string;
    avatar: string;
    specialty: string;
  };
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待分派" },
  { key: "consulting", label: "咨询中" },
  { key: "closed", label: "已结案" },
  { key: "reviewed", label: "已评价" },
];

const statusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
  pending: {
    label: "待分派",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  consulting: {
    label: "咨询中",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  closed: {
    label: "已结案",
    className: "bg-green-50 text-green-700 border-green-200",
    dotClass: "bg-green-500",
  },
  reviewed: {
    label: "已评价",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
  },
};

const urgencyConfig: Record<number, { label: string; className: string }> = {
  1: { label: "低", className: "text-green-600 bg-green-50" },
  2: { label: "中", className: "text-amber-600 bg-amber-50" },
  3: { label: "高", className: "text-red-600 bg-red-50" },
};

const mockConsultations: Consultation[] = [
  {
    id: "1",
    title: "公司拖欠工资三个月，如何维权？",
    summary: "我所在的公司已经连续三个月没有发放工资，多次沟通无果...",
    status: "consulting",
    statusLabel: "咨询中",
    category: "劳动纠纷",
    lastMessage: "张律师：建议您先收集劳动合同、考勤记录、工资条等证据材料...",
    lastTime: "10分钟前",
    hasUnread: true,
    unreadCount: 2,
    urgency: 3,
    lawyer: {
      name: "李淑芬",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
      specialty: "劳动纠纷、合同争议",
    },
  },
  {
    id: "2",
    title: "离婚财产分割问题咨询",
    summary: "准备离婚，涉及房产和存款分割，想了解如何保障自己的权益...",
    status: "pending",
    statusLabel: "待分派",
    category: "婚姻家庭",
    lastMessage: "正在为您匹配最合适的婚姻家庭律师...",
    lastTime: "2小时前",
    hasUnread: false,
    unreadCount: 0,
    urgency: 2,
  },
  {
    id: "3",
    title: "交通事故对方全责但拒绝赔偿",
    summary: "上个月发生交通事故，交警认定对方全责，但对方保险公司一直拖延...",
    status: "reviewed",
    statusLabel: "已评价",
    category: "交通事故",
    lastMessage: "王律师：如果后续还有问题，随时可以咨询。祝您顺利！",
    lastTime: "3天前",
    hasUnread: false,
    unreadCount: 0,
    urgency: 2,
    lawyer: {
      name: "王建国",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      specialty: "交通事故、人身损害",
    },
  },
  {
    id: "4",
    title: "朋友借钱不还，没有借条怎么办？",
    summary: "去年借给朋友5万元，当时因为关系好没有写借条，现在对方一直推脱不还...",
    status: "closed",
    statusLabel: "已结案",
    category: "债务债权",
    lastMessage: "陈律师：建议您整理好转账记录、聊天记录等证据后可以起诉...",
    lastTime: "1周前",
    hasUnread: false,
    unreadCount: 0,
    urgency: 1,
    lawyer: {
      name: "陈雨晴",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
      specialty: "债务债权、公司法务",
    },
  },
  {
    id: "5",
    title: "购买二手房合同纠纷",
    summary: "签订购房合同后，卖家反悔不想卖了，我交了定金应该怎么办...",
    status: "consulting",
    statusLabel: "咨询中",
    category: "合同纠纷",
    lastMessage: "您需要我帮您审查一下合同条款吗？",
    lastTime: "昨天",
    hasUnread: true,
    unreadCount: 1,
    urgency: 2,
    lawyer: {
      name: "张明远",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      specialty: "合同纠纷、房产纠纷",
    },
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ConsultationListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filteredConsultations =
    activeTab === "all"
      ? mockConsultations
      : mockConsultations.filter((c) => c.status === activeTab);

  return (
    <div className="min-h-screen bg-neutral-warm py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-800 mb-2">
                我的咨询
              </h1>
              <p className="text-primary-500">
                查看您的法律咨询记录和律师回复
              </p>
            </div>
            <button
              onClick={() => navigate("/submit")}
              className="btn-gold px-5 py-2.5"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建咨询
            </button>
          </div>

          <motion.div
            className="card p-1.5 mb-6 inline-flex flex-wrap gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gold-gradient text-primary-900 shadow-sm"
                    : "text-primary-600 hover:bg-primary-50"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? "bg-primary-900/10 text-primary-900"
                      : "bg-primary-100 text-primary-500"
                  }`}
                >
                  {tab.key === "all"
                    ? mockConsultations.length
                    : mockConsultations.filter((c) => c.status === tab.key).length}
                </span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {filteredConsultations.length > 0 ? (
              <motion.div
                key="list"
                variants={stagger}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, y: 10 }}
                className="space-y-4"
              >
                {filteredConsultations.map((consultation) => {
                  const status = statusConfig[consultation.status];
                  const urgency = urgencyConfig[consultation.urgency];
                  return (
                    <motion.div
                      key={consultation.id}
                      variants={fadeInUp}
                      layout
                      whileHover={{ y: -2 }}
                      onClick={() => navigate(`/consultation/${consultation.id}`)}
                      className="card card-hover p-5 cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`badge border ${status.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} mr-1.5`} />
                            {status.label}
                          </span>
                          <span className="badge bg-primary-50 text-primary-600 border-primary-100">
                            {consultation.category}
                          </span>
                          {consultation.urgency > 1 && (
                            <span className={`badge ${urgency.className}`}>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {urgency.label}紧急
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {consultation.hasUnread && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-medium">
                              {consultation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-primary-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {consultation.lastTime}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-primary-800 mb-1.5 line-clamp-1">
                        {consultation.title}
                      </h3>
                      <p className="text-sm text-primary-500 mb-4 line-clamp-1">
                        {consultation.summary}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-primary-100/50">
                        {consultation.lawyer ? (
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gold-gradient p-0.5">
                                <img
                                  src={consultation.lawyer.avatar}
                                  alt={consultation.lawyer.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary-800">
                                {consultation.lawyer.name} 律师
                              </p>
                              <p className="text-xs text-primary-400">
                                {consultation.lawyer.specialty}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary-600">律师匹配中</p>
                              <p className="text-xs text-primary-400">请稍候，正在分派</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="hidden sm:block max-w-[240px]">
                            <p className="text-sm text-primary-500 line-clamp-1">
                              {consultation.lastMessage}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-accent-gold">
                            {consultation.status === "reviewed" && (
                              <span className="text-xs flex items-center gap-0.5 bg-accent-gold/10 px-2 py-1 rounded">
                                <Star className="w-3 h-3 fill-accent-gold" />
                                已评价
                              </span>
                            )}
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                  <Inbox className="w-10 h-10 text-primary-300" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-primary-800 mb-2">
                  暂无咨询记录
                </h3>
                <p className="text-primary-500 mb-6 max-w-sm mx-auto">
                  {activeTab === "all"
                    ? "您还没有提交过法律咨询，现在就开始您的第一次咨询吧"
                    : `当前筛选条件下没有咨询记录`}
                </p>
                <button
                  onClick={() => navigate("/submit")}
                  className="btn-gold px-6 py-2.5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  提交咨询
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
