import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Waves,
  Pill,
  LockKeyhole,
  Wallet,
  Receipt,
  PlusCircle,
  ShieldCheck,
  Info,
  ChevronRight,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { mockECard, mockPaymentRecords } from '@/mock/data';
import {
  formatCurrency,
  formatDateTime,
  getStatusText,
  getStatusColor,
} from '@/utils/format';
import type { PaymentRecord } from '@/types';

const getPaymentTypeText = (type: PaymentRecord['type']): string => {
  const map = {
    medical: '医疗消费',
    pharmacy: '药店购药',
    other: '其他消费',
  };
  return map[type] || type;
};

const getPaymentMethodText = (method: PaymentRecord['paymentMethod']): string => {
  const map = {
    nfc: 'NFC闪付',
    qrcode: '扫码支付',
  };
  return map[method] || method;
};

const getPaymentTypeColor = (type: PaymentRecord['type']): string => {
  const map = {
    medical: 'secondary',
    pharmacy: 'warning',
    other: 'default',
  };
  return map[type] || 'default';
};

const ECardChip: React.FC = () => (
  <div className="relative w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 overflow-hidden shadow-inner">
    <div className="absolute inset-1 rounded-sm bg-gradient-to-br from-yellow-400/50 to-yellow-600/50" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-4 rounded border border-yellow-700/50">
      <div className="absolute top-0 left-0 w-1/2 h-full border-r border-yellow-700/50" />
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-yellow-700/50 -translate-y-1/2" />
    </div>
  </div>
);

const SocialSecurityCard: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-full h-52 cursor-pointer perspective-1000 animate-fade-in-up"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary-400 via-secondary-500 to-cyan-700 p-6 text-white overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl"
            style={{ transform: 'translateZ(0)' }}
          />
          <div
            className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-cyan-300/20 blur-2xl"
            style={{ transform: 'translateZ(0)' }}
          />

          <div
            className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)',
            }}
          />

          <div
            className="absolute top-0 right-0 w-1/2 h-full opacity-10"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/70 font-medium tracking-wider">
                  中华人民共和国
                </p>
                <h3 className="text-xl font-bold mt-0.5 tracking-wide">
                  社会保障卡
                </h3>
              </div>
              <div
                className={`badge ${
                  getStatusColor(mockECard.status) === 'success'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                {getStatusText(mockECard.status)}
              </div>
            </div>

            <ECardChip />

            <div>
              <p className="text-xs text-white/60 mb-1">卡号</p>
              <p className="text-lg font-mono font-semibold tracking-widest">
                {mockECard.cardNo.replace(/(.{4})/g, '$1 ').trim()}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/60 mb-0.5">持卡人</p>
                <p className="text-base font-semibold">{mockECard.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">发卡日期</p>
                    <p className="text-sm font-medium">{mockECard.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">有效期</p>
                    <p className="text-sm font-medium">{mockECard.validDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute bottom-3 right-4 text-white/20"
            style={{ transform: 'translateZ(20px)' }}
          >
            <CreditCard className="w-16 h-16" strokeWidth={1} />
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary-500 via-cyan-600 to-cyan-800 p-6 text-white overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative z-10 h-full flex flex-col justify-center gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-xs text-white/70 mb-1">身份证号</p>
              <p className="text-sm font-mono font-medium tracking-wide">
                {mockECard.idCard.replace(
                  /^(\d{6})\d{8}(\d{4})$/,
                  '$1********$2'
                )}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-xs text-white/70 mb-1">最近使用</p>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-white/60" />
                <span>{mockECard.lastUsedPlace}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Clock className="w-4 h-4 text-white/60" />
                <span>{mockECard.lastUsedTime}</span>
              </div>
            </div>
            <p className="text-xs text-white/50 text-center">
              点击卡片翻转查看
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      icon: <Waves className="w-6 h-6" />,
      label: 'NFC闪付',
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50',
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      label: '扫码支付',
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50',
    },
    {
      icon: <Pill className="w-6 h-6" />,
      label: '用药记录',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: <LockKeyhole className="w-6 h-6" />,
      label: '挂失解挂',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: <PlusCircle className="w-6 h-6" />,
      label: '充值',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      label: '余额查询',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <Receipt className="w-6 h-6" />,
      label: '交易明细',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      label: '安全中心',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <Card padding="lg">
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-all duration-200 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
              >
                {action.icon}
              </div>
              <span className="text-xs text-neutral-600 font-medium">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

const BalanceSection: React.FC = () => (
  <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
    <Card padding="lg" className="overflow-hidden">
      <div className="bg-gradient-to-r from-secondary-50 to-cyan-50 -mx-5 -mt-5 px-5 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 mb-1">医保个人账户余额</p>
            <p className="text-3xl font-bold text-secondary-600">
              ¥{formatCurrency(mockECard.balance, 2)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Wallet className="w-7 h-7 text-secondary-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-neutral-50 rounded-xl">
          <p className="text-xl font-semibold text-neutral-700">
            {mockPaymentRecords.length}
          </p>
          <p className="text-xs text-neutral-400 mt-1">本月交易</p>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl">
          <p className="text-xl font-semibold text-neutral-700">
            ¥{formatCurrency(
              mockPaymentRecords.reduce((sum, r) => sum + r.amount, 0),
              0
            )}
          </p>
          <p className="text-xs text-neutral-400 mt-1">本月支出</p>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl">
          <p className="text-xl font-semibold text-success-500">
            {getStatusText(mockECard.status)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">账户状态</p>
        </div>
      </div>
    </Card>
  </div>
);

const RecentTransactions: React.FC = () => (
  <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-700">
          近期交易
        </h3>
        <button className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-600 transition-colors">
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {mockPaymentRecords.map((record, index) => (
          <div
            key={record.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                record.type === 'medical'
                  ? 'bg-secondary-50 text-secondary-500'
                  : record.type === 'pharmacy'
                  ? 'bg-warning-50 text-warning-500'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {record.type === 'medical' ? (
                <Building2 className="w-5 h-5" />
              ) : record.type === 'pharmacy' ? (
                <Pill className="w-5 h-5" />
              ) : (
                <Receipt className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-700 truncate">
                  {record.merchantName}
                </p>
                <span
                  className={`badge badge-${getPaymentTypeColor(record.type)} shrink-0`}
                >
                  {getPaymentTypeText(record.type)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-neutral-400">
                  {formatDateTime(record.paymentTime)}
                </span>
                <span className="text-xs text-neutral-300">|</span>
                <span className="text-xs text-neutral-400">
                  {getPaymentMethodText(record.paymentMethod)}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-neutral-700">
                -¥{formatCurrency(record.amount, 2)}
              </p>
              <span
                className={`badge badge-${getStatusColor(record.status)}`}
              >
                {getStatusText(record.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const TipsSection: React.FC = () => {
  const tips = [
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: '安全提示',
      content: '请勿将社保卡转借他人使用，妥善保管社保卡密码',
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50',
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: '使用说明',
      content: '电子社保卡与实体社保卡一一对应，可在定点医药机构使用',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <LockKeyhole className="w-5 h-5" />,
      title: '挂失须知',
      content: '社保卡遗失后请及时挂失，可通过线上或线下渠道办理',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
      <h3 className="text-base font-semibold text-neutral-700 mb-3">
        使用说明
      </h3>
      <div className="space-y-3">
        {tips.map((tip) => (
          <Card key={tip.title} padding="md" hover>
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg ${tip.bgColor} ${tip.color} flex items-center justify-center shrink-0`}
              >
                {tip.icon}
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">
                  {tip.title}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ECard: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-secondary-500 via-cyan-500 to-teal-600 text-white">
        <div className="container mx-auto px-4 pt-8 pb-16">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">电子社保卡</h1>
                <p className="text-sm text-white/70">
                  社会保障卡 · 医保账户 · 便捷支付
                </p>
              </div>
            </div>
          </div>

          <SocialSecurityCard />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10 space-y-4">
        <QuickActions />
        <BalanceSection />
        <RecentTransactions />
        <TipsSection />
      </div>
    </div>
  );
};

export default ECard;
