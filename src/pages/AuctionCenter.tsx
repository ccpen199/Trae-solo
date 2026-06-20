import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  FileCheck,
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Upload,
  Camera,
  Shield,
  TrendingUp,
  ArrowRight,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockDepositRecords, mockBidder, mockProperties } from '@/mock/data';
import { formatPrice, formatDate, cn } from '@/utils';

const menuItems = [
  { key: 'bids', label: '我的竞拍', icon: Gavel },
  { key: 'deposit', label: '保证金管理', icon: CreditCard },
  { key: 'qualification', label: '资质审核', icon: FileCheck },
  { key: 'favorites', label: '我的关注', icon: Bell },
  { key: 'settings', label: '账号设置', icon: Settings },
];

export default function AuctionCenter() {
  const [activeMenu, setActiveMenu] = useState('bids');

  const myBids = mockProperties.slice(0, 3);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Page Header */}
      <div className="hero-gradient py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold text-white mb-1">
                {mockBidder.name}
              </h1>
              <p className="text-primary-200 text-sm mb-3">
                {mockBidder.phone} · 注册于{formatDate(mockBidder.registerDate)}
              </p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                  <Shield className="w-4 h-4" />
                  已实名认证
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/30 text-gold-200 text-sm rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  信用分 {mockBidder.creditScore}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-ink-200 p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveMenu(item.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                      activeMenu === item.key
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Help Card */}
            <div className="mt-6 bg-gradient-to-br from-primary-50 to-gold-50 rounded-xl p-5 border border-gold-100">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-gold-600" />
                <span className="font-medium text-ink-900">需要帮助？</span>
              </div>
              <p className="text-sm text-ink-600 mb-4">
                遇到问题？专属顾问随时为您解答
              </p>
              <button className="w-full py-2 bg-white border border-gold-200 text-gold-700 rounded-lg text-sm font-medium hover:bg-gold-50 transition-colors">
                联系客服
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* My Bids */}
            {activeMenu === 'bids' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-ink-200 p-6">
                  <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                    我的竞拍
                  </h2>

                  {/* Status Tabs */}
                  <div className="flex gap-1 mb-6 border-b border-ink-200">
                    {[
                      { key: 'all', label: '全部' },
                      { key: 'bidding', label: '进行中' },
                      { key: 'won', label: '已得标' },
                      { key: 'lost', label: '未得标' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                          tab.key === 'all'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-ink-500 border-transparent hover:text-ink-700'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Bid List */}
                  <div className="space-y-4">
                    {myBids.map((property, index) => (
                      <Link
                        key={property.id}
                        to={`/detail/${property.id}`}
                        className="flex gap-4 p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors group"
                      >
                        <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-ink-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                {property.title}
                              </h3>
                              <p className="text-sm text-ink-500 line-clamp-1 mt-1">
                                {property.address}
                              </p>
                            </div>
                            <span className={cn(
                              'tag flex-shrink-0',
                              property.status === 'bidding' ? 'tag-danger' :
                              property.status === 'deposit' ? 'tag-warning' :
                              property.status === 'sold' ? 'tag-success' : 'tag-info'
                            )}>
                              {property.status === 'bidding' ? '竞价中' :
                               property.status === 'deposit' ? '待支付' :
                               property.status === 'sold' ? '已成交' : '报名中'}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 mt-3">
                            <div>
                              <span className="text-xs text-ink-400">起拍价</span>
                              <div className="text-lg font-bold text-primary-600 font-serif">
                                ¥{formatPrice(property.startingPrice)}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-ink-400">当前价</span>
                              <div className="text-lg font-bold text-danger-600 font-serif">
                                ¥{formatPrice(property.startingPrice * 1.1)}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-ink-400">我的出价</span>
                              <div className="text-lg font-medium text-ink-700 font-serif">
                                -
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-200">
                            <span className="text-xs text-ink-500">
                              <Clock className="w-3.5 h-3.5 inline mr-1" />
                              {property.status === 'bidding' ? '距结束 2天12时' : '开拍时间：6月25日'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: '缴纳保证金', desc: '参与竞拍必备', icon: CreditCard, color: 'primary' },
                    { title: '资质审核', desc: '提前审核更快参拍', icon: FileCheck, color: 'success' },
                    { title: '委托出价', desc: '设置价格自动出价', icon: Gavel, color: 'gold' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl border border-ink-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                          item.color === 'primary' && 'bg-primary-100',
                          item.color === 'success' && 'bg-success-100',
                          item.color === 'gold' && 'bg-gold-100'
                        )}>
                          <Icon className={cn(
                            'w-6 h-6',
                            item.color === 'primary' && 'text-primary-600',
                            item.color === 'success' && 'text-success-600',
                            item.color === 'gold' && 'text-gold-600'
                          )} />
                        </div>
                        <h3 className="font-medium text-ink-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-ink-500">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Deposit Management */}
            {activeMenu === 'deposit' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-ink-200 p-6">
                  <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                    保证金管理
                  </h2>

                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-xl p-5">
                      <div className="text-sm text-primary-600 mb-2">冻结保证金</div>
                      <div className="text-2xl font-bold text-primary-700 font-serif">
                        ¥{formatPrice(mockDepositRecords.filter(r => r.status === 'frozen' || r.status === 'paid').reduce((sum, r) => sum + r.amount, 0))}
                      </div>
                      <div className="text-xs text-primary-400 mt-1">
                        {mockDepositRecords.filter(r => r.status === 'frozen' || r.status === 'paid').length} 笔
                      </div>
                    </div>
                    <div className="bg-success-50 rounded-xl p-5">
                      <div className="text-sm text-success-600 mb-2">可退还</div>
                      <div className="text-2xl font-bold text-success-700 font-serif">
                        ¥0
                      </div>
                      <div className="text-xs text-success-400 mt-1">
                        0 笔待退款
                      </div>
                    </div>
                    <div className="bg-ink-50 rounded-xl p-5">
                      <div className="text-sm text-ink-500 mb-2">累计退还</div>
                      <div className="text-2xl font-bold text-ink-700 font-serif">
                        ¥{formatPrice(mockDepositRecords.filter(r => r.status === 'refunded').reduce((sum, r) => sum + r.amount, 0))}
                      </div>
                      <div className="text-xs text-ink-400 mt-1">
                        {mockDepositRecords.filter(r => r.status === 'refunded').length} 笔
                      </div>
                    </div>
                  </div>

                  {/* Records */}
                  <h3 className="font-medium text-ink-900 mb-4">保证金记录</h3>
                  <div className="space-y-3">
                    {mockDepositRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-ink-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-ink-900">{record.propertyTitle}</div>
                          <div className="text-xs text-ink-500 mt-1">
                            订单号：{record.orderNo} · 缴纳时间：{record.payDate}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-ink-900">
                            ¥{formatPrice(record.amount)}
                          </div>
                          <span className={cn(
                            'text-xs mt-1 inline-block',
                            record.status === 'paid' && 'text-primary-600',
                            record.status === 'frozen' && 'text-gold-600',
                            record.status === 'refunded' && 'text-success-600',
                            record.status === 'refunding' && 'text-gold-600'
                          )}>
                            {record.status === 'paid' && '已缴纳'}
                            {record.status === 'frozen' && '已冻结'}
                            {record.status === 'refunding' && '退款中'}
                            {record.status === 'refunded' && '已退还'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Qualification */}
            {activeMenu === 'qualification' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-ink-200 p-6">
                  <h2 className="font-serif font-bold text-xl text-ink-900 mb-2">
                    竞买人资质审核
                  </h2>
                  <p className="text-sm text-ink-500 mb-6">
                    完成资质审核后方可参与司法拍卖，审核通过后长期有效
                  </p>

                  {/* Status Card */}
                  <div className={cn(
                    'rounded-xl p-6 mb-6',
                    mockBidder.fundProofStatus === 'verified'
                      ? 'bg-gradient-to-r from-success-50 to-primary-50 border border-success-200'
                      : 'bg-gold-50 border border-gold-200'
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center',
                        mockBidder.fundProofStatus === 'verified'
                          ? 'bg-success-100'
                          : 'bg-gold-100'
                      )}>
                        {mockBidder.fundProofStatus === 'verified' ? (
                          <CheckCircle2 className="w-8 h-8 text-success-600" />
                        ) : mockBidder.fundProofStatus === 'pending' ? (
                          <Clock className="w-8 h-8 text-gold-600" />
                        ) : (
                          <XCircle className="w-8 h-8 text-danger-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif font-bold text-lg text-ink-900 mb-1">
                          {mockBidder.fundProofStatus === 'verified' && '资质审核已通过'}
                          {mockBidder.fundProofStatus === 'pending' && '资质审核中'}
                          {mockBidder.fundProofStatus === 'rejected' && '资质审核未通过'}
                        </h3>
                        <p className="text-sm text-ink-600">
                          {mockBidder.fundProofStatus === 'verified' && '您的竞买资质已审核通过，可参与全部司法拍卖标的'}
                          {mockBidder.fundProofStatus === 'pending' && '您的资质资料正在审核中，预计1-3个工作日完成'}
                          {mockBidder.fundProofStatus === 'rejected' && '您的资质资料未通过审核，请补充后重新提交'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Qualification Items */}
                  <div className="space-y-4">
                    {[
                      {
                        title: '实名认证',
                        status: 'verified',
                        desc: '身份信息已核验通过',
                        icon: User,
                      },
                      {
                        title: '资金证明',
                        status: 'verified',
                        desc: '银行存款证明、流水等资产证明已核验',
                        icon: CreditCard,
                      },
                      {
                        title: '征信查询',
                        status: 'verified',
                        desc: '个人信用报告已查询，信用良好',
                        icon: FileCheck,
                      },
                      {
                        title: '风险测评',
                        status: 'verified',
                        desc: '投资风险承受能力测评已完成',
                        icon: AlertCircle,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={index} className="flex items-center gap-4 p-4 bg-ink-50 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-ink-900">{item.title}</div>
                            <div className="text-xs text-ink-500">{item.desc}</div>
                          </div>
                          {item.status === 'verified' ? (
                            <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              已完成
                            </span>
                          ) : (
                            <span className="text-gold-600 text-sm font-medium flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              待审核
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* OCR Upload */}
                  <div className="mt-8 p-5 border-2 border-dashed border-ink-200 rounded-xl text-center hover:border-primary-300 transition-colors cursor-pointer">
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-7 h-7 text-primary-600" />
                    </div>
                    <h4 className="font-medium text-ink-900 mb-1">上传资金证明</h4>
                    <p className="text-sm text-ink-500 mb-3">
                      支持银行存款证明、流水账单等，OCR自动识别
                    </p>
                    <button className="btn-primary justify-center">
                      <Camera className="w-4 h-4 mr-2" />
                      拍照/上传
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings */}
            {activeMenu === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-ink-200 p-6"
              >
                <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                  账号设置
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">手机号码</div>
                      <div className="text-sm text-ink-500 mt-1">用于接收拍卖通知和验证码</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-ink-600">{mockBidder.phone}</span>
                      <button className="text-primary-600 text-sm hover:text-primary-700">
                        更换
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">实名认证</div>
                      <div className="text-sm text-ink-500 mt-1">{mockBidder.idCard}</div>
                    </div>
                    <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      已认证
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">支付密码</div>
                      <div className="text-sm text-ink-500 mt-1">用于保证金缴纳和出价确认</div>
                    </div>
                    <button className="text-primary-600 text-sm hover:text-primary-700">
                      设置
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ink-900">消息通知</div>
                      <div className="text-sm text-ink-500 mt-1">拍卖提醒、出价通知、结果通知等</div>
                    </div>
                    <button className="text-primary-600 text-sm hover:text-primary-700">
                      管理
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
