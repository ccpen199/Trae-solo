import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock,
  Bell,
  Flag,
  Shield,
} from 'lucide-react';

const entries = [
  {
    icon: Clock,
    title: '房价时光机',
    description: '回溯历史价格，见证市场变迁',
    link: '/time-machine',
    color: 'text-primary-800',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-100',
  },
  {
    icon: Bell,
    title: '降价订阅提醒',
    description: '订阅房源价格变动，第一时间获取通知',
    link: '/user-center',
    color: 'text-accent-up',
    bgColor: 'bg-accent-up/5',
    borderColor: 'border-accent-up/10',
  },
  {
    icon: Flag,
    title: '虚假房源举报',
    description: '共同维护真实可信的交易环境',
    link: '/report',
    color: 'text-accent-verified',
    bgColor: 'bg-accent-verified/5',
    borderColor: 'border-accent-verified/10',
  },
  {
    icon: Shield,
    title: '运营管理后台',
    description: '经纪人风控·市场健康度仪表盘',
    link: '/admin/dashboard',
    color: 'text-accent-down',
    bgColor: 'bg-accent-down/5',
    borderColor: 'border-accent-down/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function BusinessEntryGrid() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {entries.map((entry) => {
        const Icon = entry.icon;
        return (
          <motion.div key={entry.title} variants={itemVariants}>
            <Link
              to={entry.link}
              className="group block rounded-xl border border-neutral-100 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${entry.bgColor}`}>
                <Icon className={`h-6 w-6 ${entry.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900 group-hover:text-primary-800">
                {entry.title}
              </h3>
              <p className="text-sm text-neutral-500">
                {entry.description}
              </p>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
