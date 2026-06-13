import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Banknote,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Minus,
  FileText,
  User,
  Phone,
  MessageSquare,
  TrendingDown,
  AlertTriangle,
  Handshake,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockWorkOrders, mockProviders } from '@/mock';
import type { Negotiation, NegotiationRecord } from '@/types';

const mockNegotiation: Negotiation = {
  id: 'NEG001',
  workOrderId: 'WO001',
  workOrderTitle: '环球金融中心T3-28层金融企业总部装修',
  propertyName: '环球金融中心 T3 座 28层',
  providerId: 'PRV001',
  providerName: '金螳螂建筑装饰股份有限公司',
  initiatorId: 'TEN001',
  initiatorName: '张宏伟',
  initiatorRole: '租户',
  status: '进行中',
  initialPrice: 6480000,
  currentPrice: 6130000,
  priceHistory: [
    { date: '2026-05-03', price: 6480000, party: '供应方' },
    { date: '2026-05-05', price: 6280000, party: '需求方' },
    { date: '2026-05-06', price: 6200000, party: '供应方' },
    { date: '2026-05-08', price: 6150000, party: '需求方' },
    { date: '2026-05-09', price: 6130000, party: '供应方' },
  ],
  records: [
    {
      id: 'R001',
      type: '系统消息',
      senderId: 'SYS',
      senderName: '系统',
      senderRole: '系统',
      message: '议价会话已创建，初始报价 ¥6,480,000，有效期至 2026-06-15',
      timestamp: '2026-05-03 14:20:00',
    },
    {
      id: 'R002',
      type: '报价',
      senderId: 'PRV001',
      senderName: '金螳螂-周总监',
      senderRole: '供应商',
      price: 6480000,
      message: '您好，这是我们的品质优选方案报价，包含硬装、机电、家具软装等全部内容，工期120天。',
      timestamp: '2026-05-03 14:25:00',
      attachment: { name: '报价明细.pdf', url: '#' },
    },
    {
      id: 'R003',
      type: '还价',
      senderId: 'TEN001',
      senderName: '张总（租户）',
      senderRole: '业主',
      price: 6280000,
      message: '方案整体满意，但预算有限，是否可以给到 ¥6,280,000？我们可以立即确认。',
      timestamp: '2026-05-05 10:30:00',
    },
    {
      id: 'R004',
      type: '系统消息',
      senderId: 'SYS',
      senderName: '系统',
      senderRole: '系统',
      message: '供应商已修改报价，¥6,480,000 → ¥6,200,000，降幅 ¥280,000',
      timestamp: '2026-05-06 09:15:00',
    },
    {
      id: 'R005',
      type: '报价',
      senderId: 'PRV001',
      senderName: '金螳螂-周总监',
      senderRole: '供应商',
      price: 6200000,
      message: '考虑到贵司是优质客户，我们特批优惠价 ¥6,200,000，这已经是我们能给到的最低价格了。',
      timestamp: '2026-05-06 09:15:00',
    },
    {
      id: 'R006',
      type: '还价',
      senderId: 'TEN001',
      senderName: '张总（租户）',
      senderRole: '业主',
      price: 6150000,
      message: '理解，我们也是非常有诚意的。再加 3 万，¥6,150,000，可以的话今天就定。',
      timestamp: '2026-05-08 16:45:00',
    },
    {
      id: 'R007',
      type: '报价',
      senderId: 'PRV001',
      senderName: '金螳螂-周总监',
      senderRole: '供应商',
      price: 6130000,
      message: '好的，成交！就按 ¥6,130,000 签约。我们会马上启动合同流程。',
      timestamp: '2026-05-09 11:20:00',
    },
    {
      id: 'R008',
      type: '备注',
      senderId: 'TEN001',
      senderName: '张总（租户）',
      senderRole: '业主',
      message: '请确保使用进口大理石和飞利浦照明，材料进场时需要我们到场验收。',
      timestamp: '2026-05-09 14:30:00',
    },
  ],
  validUntil: '2026-06-15 23:59:59',
  createdAt: '2026-05-03 14:20:00',
  lastUpdateAt: '2026-05-09 14:30:00',
};

function PriceMiniChart({ history }: { history: { date: string; price: number; party: '需求方' | '供应方' }[] }) {
  const minPrice = Math.min(...history.map(h => h.price));
  const maxPrice = Math.max(...history.map(h => h.price));
  const range = maxPrice - minPrice;
  
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - ((h.price - minPrice) / range) * 80 - 10;
    return { x, y, price: h.price, date: h.date, party: h.party };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <div className="relative h-28">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4A853" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A853" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathD} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z`}
          fill="url(#priceGradient)"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#D4A853"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(212,168,83,0.5))' }}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill={p.party === '需求方' ? '#3D5D97' : '#D4A853'}
              stroke="#fff"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-neutral-500 px-1">
        {history.map((h, i) => (
          <span key={i}>{h.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ record }: { record: NegotiationRecord }) {
  const isSystem = record.senderRole === '系统';
  const isProvider = record.senderRole === '供应商';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-full bg-primary-800/50 text-xs text-neutral-400 border border-neutral-600/30 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-gold-400" />
          {record.message}
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex mb-5",
        isProvider ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[70%] flex flex-col",
        isProvider ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] text-neutral-500">{record.timestamp}</span>
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            isProvider
              ? "bg-gold-500/15 text-gold-300"
              : "bg-primary-500/15 text-primary-300"
          )}>
            {record.senderName}
          </span>
        </div>
        
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl",
            isProvider
              ? "bg-gradient-to-br from-gold-500/15 to-gold-600/10 text-neutral-100 border border-gold-500/20 rounded-tr-sm"
              : "bg-gradient-to-br from-primary-600/20 to-primary-700/15 text-neutral-100 border border-primary-500/20 rounded-tl-sm"
          )}
        >
          {record.price && (
            <div className="mb-2 flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-base",
                record.type === '报价'
                  ? "bg-gold-500/25 text-gold-200"
                  : "bg-primary-500/25 text-primary-200"
              )}>
                <Banknote className="w-4 h-4" />
                ¥{(record.price / 10000).toFixed(0)}万
              </span>
              <span className={cn(
                "text-xs font-medium",
                record.type === '报价' ? "text-gold-300" : "text-primary-300"
              )}>
                {record.type === '报价' ? '报价' : '还价'}
              </span>
            </div>
          )}
          
          <p className="text-sm leading-relaxed text-neutral-200">{record.message}</p>
          
          {record.attachment && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/5">
              <FileText className="w-4 h-4 text-gold-400" />
              <span className="text-xs text-neutral-300">{record.attachment.name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function NegotiationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [negotiation, setNegotiation] = useState(mockNegotiation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [negotiation.records.length]);
  
  const handleQuickOffer = (discount: number) => {
    const newPrice = negotiation.currentPrice - discount * 10000;
    const newRecord: NegotiationRecord = {
      id: `R${Date.now()}`,
      type: '还价',
      senderId: 'TEN001',
      senderName: '张总（租户）',
      senderRole: '业主',
      price: newPrice,
      message: `考虑到长期合作，我们希望价格能再优惠 ${discount} 万，至 ¥${(newPrice / 10000).toFixed(0)} 万。`,
      timestamp: new Date().toLocaleString('zh-CN'),
    };
    setNegotiation(prev => ({
      ...prev,
      currentPrice: newPrice,
      records: [...prev.records, newRecord],
      priceHistory: [...prev.priceHistory, {
        date: new Date().toISOString().slice(0, 10),
        price: newPrice,
        party: '需求方'
      }]
    }));
  };
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newRecord: NegotiationRecord = {
      id: `R${Date.now()}`,
      type: '备注',
      senderId: 'TEN001',
      senderName: '张总（租户）',
      senderRole: '业主',
      message: message.trim(),
      timestamp: new Date().toLocaleString('zh-CN'),
    };
    setNegotiation(prev => ({
      ...prev,
      records: [...prev.records, newRecord],
    }));
    setMessage('');
  };
  
  const diff = negotiation.initialPrice - negotiation.currentPrice;
  const diffPercent = Math.round((diff / negotiation.initialPrice) * 100);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1600px] p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">在线议价</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{negotiation.workOrderTitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-gold-300">{negotiation.status}</span>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8">
            <div className="card-base p-5 mb-5">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-primary-800/30">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">初始报价</p>
                  <p className="mt-1 font-mono text-xl font-bold text-neutral-300 line-through">
                    ¥{(negotiation.initialPrice / 10000).toFixed(0)}万
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-primary-800/30">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">当前价格</p>
                  <p className="mt-1 font-mono text-xl font-bold glow-text-gold">
                    ¥{(negotiation.currentPrice / 10000).toFixed(0)}万
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">已优惠</p>
                  <p className="mt-1 font-mono text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    ¥{(diff / 10000).toFixed(0)}万
                  </p>
                  <p className="text-[10px] text-emerald-400/70 mt-0.5">{diffPercent}%</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">议价有效期</p>
                  <p className="mt-1 font-mono text-base font-bold text-gold-300">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    6天
                  </p>
                  <p className="text-[10px] text-gold-400/70 mt-0.5">{negotiation.validUntil.slice(0, 10)}</p>
                </div>
              </div>
            </div>
            
            <div className="card-base overflow-hidden">
              <div className="max-h-[520px] overflow-y-auto p-6 space-y-1">
                {negotiation.records.map(record => (
                  <MessageBubble key={record.id} record={record} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t border-gold-500/10 bg-primary-900/30">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[10px] text-neutral-500">快捷还价：</span>
                  <button
                    onClick={() => handleQuickOffer(5)}
                    className="px-3 py-1 rounded-full text-xs bg-primary-700/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" />5万
                  </button>
                  <button
                    onClick={() => handleQuickOffer(3)}
                    className="px-3 py-1 rounded-full text-xs bg-primary-700/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" />3万
                  </button>
                  <button
                    onClick={() => handleQuickOffer(1)}
                    className="px-3 py-1 rounded-full text-xs bg-primary-700/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" />1万
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="input-tech flex-1"
                    placeholder="输入消息..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="btn-primary px-5"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-12 lg:col-span-4 space-y-5">
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gold-400" />
                价格走势
              </h3>
              <PriceMiniChart history={negotiation.priceHistory} />
            </div>
            
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-gold-400" />
                报价轨迹
              </h3>
              <div className="space-y-2">
                {negotiation.priceHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-700/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        h.party === '需求方' ? 'bg-primary-400' : 'bg-gold-400'
                      )} />
                      <div>
                        <p className="text-xs text-neutral-300">{h.date}</p>
                        <p className="text-[10px] text-neutral-500">{h.party}出价</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-white">¥{(h.price / 10000).toFixed(0)}万</p>
                      {i > 0 && (
                        <p className={cn(
                          "text-[10px] font-medium",
                          h.price < negotiation.priceHistory[negotiation.priceHistory.length - i].price
                            ? "text-emerald-400"
                            : "text-gold-400"
                        )}>
                          {i > 0 && h.price < negotiation.priceHistory[negotiation.priceHistory.length - i].price ? '↓' : '↑'}
                          {Math.abs((h.price - negotiation.priceHistory[negotiation.priceHistory.length - i].price) / 10000).toFixed(0)}万
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold-400" />
                供应商信息
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-primary-900 font-bold text-lg">
                  金
                </div>
                <div>
                  <p className="font-medium text-white">{negotiation.providerName}</p>
                  <p className="text-xs text-gold-300">S级 · 已认证</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/30">
                  <span className="text-neutral-500">综合评分</span>
                  <span className="font-mono font-bold text-gold-300">4.9 / 5.0</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/30">
                  <span className="text-neutral-500">成交项目</span>
                  <span className="font-mono text-white">3,560 个</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/30">
                  <span className="text-neutral-500">准时交付率</span>
                  <span className="font-mono text-emerald-400">98.5%</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-500">平均报价周期</span>
                  <span className="font-mono text-white">5 天</span>
                </div>
              </div>
            </div>
            
            <div className="card-base p-5 border border-gold-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-500/20 to-transparent" />
              <div className="absolute top-3 right-3">
                <Handshake className="w-8 h-8 text-gold-400/30" />
              </div>
              <div className="relative">
                <h3 className="text-base font-bold glow-text-gold mb-1">达成一致</h3>
                <p className="text-xs text-neutral-400 mb-4">双方确认价格后，即可生成电子合同</p>
                
                <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/20 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">确认成交价格</span>
                    <span className="font-mono text-xl font-bold glow-text-gold">¥{(negotiation.currentPrice / 10000).toFixed(0)}万</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/contract/${negotiation.workOrderId}`)}
                  className="btn-gold w-full h-12 text-base font-bold"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  达成一致，生成合同
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
