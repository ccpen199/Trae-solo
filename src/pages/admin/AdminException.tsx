import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Car,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
  MessageSquare,
  UserCheck,
  Brain,
  Lightbulb,
  History,
  Zap,
  BookOpen,
  ArrowRight,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import dayjs from 'dayjs';
import type { ExceptionEvent } from '../../../shared/types';

const attributionAnalysis: Record<string, {
  rootCause: string;
  confidence: number;
  factors: string[];
  solution: string;
  knowledge: string[];
  prevention: string;
}> = {
  '跟车干扰': {
    rootCause: '车辆跟车距离不足2米，邻车OBU信号与本车信号发生串扰，导致交易系统无法准确识别扣费车辆',
    confidence: 92,
    factors: ['跟车距离<2米', '车速>20km/h', '邻车OBU信号强度高', '车道天线信号覆盖重叠'],
    solution: '建议车主保持安全车距(>2米)，降低车速(<20km/h)通过ETC车道；如已扣费失败，可走人工车道或24小时后系统自动重试扣费',
    knowledge: [
      'ETC车道通行速度应控制在20km/h以内',
      '与前车保持至少2米的安全距离',
      '确保OBU设备已正确激活并粘贴在前挡风玻璃指定位置',
      '大型车辆应保持更远的安全距离(>3米)',
    ],
    prevention: '设置车道预警系统，对跟车过近车辆进行声光提醒；优化天线信号覆盖范围，减少相邻车道干扰',
  },
  '标签失效': {
    rootCause: 'OBU设备内置电池电量耗尽或设备硬件故障，导致无法与车道天线进行正常通信',
    confidence: 88,
    factors: ['设备使用年限>3年', '长期日晒导致电池老化', '设备物理损坏', '未正确激活'],
    solution: '检查OBU设备指示灯状态，如无指示灯闪烁说明电池耗尽；需车主携带身份证、行驶证到服务网点更换设备或重新激活',
    knowledge: [
      'OBU设备内置电池使用寿命约5年',
      '设备长时间暴晒可能导致电池加速老化',
      '更换设备需携带身份证和行驶证到网点办理',
      '设备激活后不可随意拆卸，拆卸后需重新激活',
    ],
    prevention: '建立设备健康监测系统，提前预警低电量设备；优化设备太阳能充电效率，延长电池使用寿命',
  },
  '交易失败': {
    rootCause: '账户余额不足或绑定的代扣银行卡状态异常，导致系统无法完成扣费操作',
    confidence: 95,
    factors: ['账户余额<应付金额', '银行卡冻结', '代扣协议过期', '网络通信超时'],
    solution: '检查账户余额是否充足，确认绑定银行卡状态是否正常；如为网络问题，系统会在72小时内自动重试3次；也可手动充值后发起补缴',
    knowledge: [
      '确保账户余额充足或绑定银行卡状态正常',
      '系统支持72小时内自动重试3次',
      '如多次失败，请联系客服处理',
      '开通自动代扣可避免余额不足问题',
    ],
    prevention: '设置余额预警阈值(建议>200元)，提前推送充值提醒；优化代扣协议自动续约机制',
  },
  '路径异常': {
    rootCause: '高速公路门架设备故障或网络传输延迟，导致车辆通行路径数据不完整，无法准确计算通行费用',
    confidence: 85,
    factors: ['门架设备故障', '网络传输中断', '数据校验不通过', '相邻门架时间戳异常'],
    solution: '系统自动补全缺失门架数据，采用相邻门架插值算法拟合完整路径；如费用有异议，可在30日内申请人工复核',
    knowledge: [
      '门架数据传输延迟属正常现象',
      '系统会在24小时内自动补全数据',
      '如对费用有异议，可在30日内申请复核',
      '路径拟合准确率可达98%以上',
    ],
    prevention: '建立门架设备状态实时监控系统，及时发现并修复故障设备；优化数据传输冗余机制',
  },
  '其他': {
    rootCause: '其他未知原因导致的异常，需人工介入进一步排查',
    confidence: 60,
    factors: ['系统升级', '数据同步延迟', '特殊天气影响', '其他不可预见因素'],
    solution: '建议联系客服热线96533，提供详细通行信息以便进一步排查处理',
    knowledge: [
      '客服热线：96533',
      '工作时间：08:00-22:00',
      '也可通过APP在线客服咨询',
      '请准备好车牌号、卡号等信息以便快速处理',
    ],
    prevention: '持续优化异常检测算法，扩大异常类型覆盖范围，提高自动识别准确率',
  },
};

const operationTemplates: Record<string, string[]> = {
  '跟车干扰': ['已电话联系车主，提醒注意跟车距离', '已推送安全通行知识', '已标记车道，需优化信号覆盖'],
  '标签失效': ['已通知车主到网点更换设备', '已安排技术人员上门检测', '已补发新设备'],
  '交易失败': ['已发送余额不足提醒', '已协助车主充值', '已重置代扣协议'],
  '路径异常': ['已自动补全路径数据', '已通知车主费用详情', '已记录设备故障'],
  '其他': ['已转人工处理', '已记录问题', '待进一步排查'],
};

export default function AdminException() {
  const { exceptionEvents, updateWorkOrderStatus } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExceptionEvent | null>(null);
  const [assignedHandler, setAssignedHandler] = useState('');
  const [remark, setRemark] = useState('');
  const [operationLog, setOperationLog] = useState<Record<string, Array<{ time: string; operator: string; action: string }>>>({});

  const handlers = [
    { id: 'h001', name: '张工', role: '高级运维工程师', currentTasks: 2, avatar: '张' },
    { id: 'h002', name: '李工', role: '运维工程师', currentTasks: 1, avatar: '李' },
    { id: 'h003', name: '王工', role: '技术支持', currentTasks: 3, avatar: '王' },
    { id: 'h004', name: '赵工', role: '客服主管', currentTasks: 0, avatar: '赵' },
  ];

  const stats = [
    {
      label: '待处理',
      value: exceptionEvents.filter((e) => e.status === '待处理').length,
      color: 'bg-yellow-500',
    },
    {
      label: '处理中',
      value: exceptionEvents.filter((e) => e.status === '处理中').length,
      color: 'bg-blue-500',
    },
    {
      label: '已解决',
      value: exceptionEvents.filter((e) => e.status === '已解决').length,
      color: 'bg-green-500',
    },
    {
      label: '高优先级',
      value: exceptionEvents.filter((e) => e.severity === '高').length,
      color: 'bg-red-500',
    },
  ];

  const typeDistribution = exceptionEvents.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '高':
        return 'bg-red-100 text-red-700';
      case '中':
        return 'bg-yellow-100 text-yellow-700';
      case '低':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待处理':
        return 'bg-yellow-100 text-yellow-700';
      case '处理中':
        return 'bg-blue-100 text-blue-700';
      case '已解决':
        return 'bg-green-100 text-green-700';
      case '已关闭':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case '跟车干扰':
        return 'border-l-accent-500';
      case '标签失效':
        return 'border-l-red-500';
      case '交易失败':
        return 'border-l-yellow-500';
      case '路径异常':
        return 'border-l-blue-500';
      default:
        return 'border-l-purple-500';
    }
  };

  const filteredEvents = exceptionEvents.filter((event) => {
    const matchSeverity = severityFilter === '全部' || event.severity === severityFilter;
    const matchStatus = statusFilter === '全部' || event.status === statusFilter;
    return matchSeverity && matchStatus;
  });

  const handleAssign = (event: ExceptionEvent) => {
    setSelectedEvent(event);
    setShowAssignModal(true);
    setAssignedHandler('');
    setRemark('');
  };

  const confirmAssign = () => {
    if (selectedEvent && assignedHandler) {
      const handler = handlers.find((h) => h.id === assignedHandler);
      const log = operationLog[selectedEvent.id] || [];
      const newLog = [
        { time: new Date().toISOString(), operator: '系统', action: '异常事件自动检测并创建工单' },
        ...log,
        {
          time: new Date().toISOString(),
          operator: '管理员',
          action: `工单已派发给${handler?.name}${remark ? `，备注：${remark}` : ''}`,
        },
      ];
      setOperationLog({ ...operationLog, [selectedEvent.id]: newLog });
      updateWorkOrderStatus(selectedEvent.id, '处理中');
      setShowAssignModal(false);
      setAssignedHandler('');
      setSelectedEvent(null);
    }
  };

  const handleResolve = (eventId: string) => {
    const event = exceptionEvents.find((e) => e.id === eventId);
    if (event) {
      const log = operationLog[eventId] || [];
      const templates = operationTemplates[event.eventType] || [];
      const newLog = [
        ...log,
        {
          time: new Date().toISOString(),
          operator: '管理员',
          action: templates[0] || '问题已解决，工单已完成',
        },
      ];
      setOperationLog({ ...operationLog, [eventId]: newLog });
    }
    updateWorkOrderStatus(eventId, '已解决');
  };

  const handleClose = (eventId: string) => {
    const log = operationLog[eventId] || [];
    const newLog = [
      ...log,
      { time: new Date().toISOString(), operator: '管理员', action: '工单已关闭' },
    ];
    setOperationLog({ ...operationLog, [eventId]: newLog });
    updateWorkOrderStatus(eventId, '已关闭');
  };

  const handleReopen = (eventId: string) => {
    updateWorkOrderStatus(eventId, '处理中');
  };

  const getAnalysis = (eventType: string) => {
    return attributionAnalysis[eventType] || attributionAnalysis['其他'];
  };

  const getEventLogs = (eventId: string) => {
    return operationLog[eventId] || [
      { time: new Date().toISOString(), operator: '系统', action: '异常事件自动检测并创建工单' },
    ];
  };

  return (
    <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">异常事件管理</h1>
              <p className="text-dark-400">通行异常事件自动归因与工单派发闭环管理</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors">
                <RotateCcw className="w-4 h-4" />
                重新检测
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                刷新数据
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
              className="card-dark p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-dark-400 text-sm">{stat.label}</p>
                <div className={`w-2 h-2 ${stat.color} rounded-full animate-pulse`} />
              </div>
              <p className="text-3xl font-bold text-white font-mono">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-dark p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-400" />
            异常类型分布
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(typeDistribution).map(([type, count], idx) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${getEventTypeColor(type)} bg-dark-800`}
              >
                <p className="text-sm text-dark-300 mb-1">{type}</p>
                <p className="text-2xl font-bold text-white font-mono">{count}</p>
                <p className="text-xs text-dark-400 mt-1">
                  占比 {((count / exceptionEvents.length) * 100).toFixed(1)}%
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="card-dark p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="搜索事件描述或用户信息..."
                className="input-field-dark pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-dark-400" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input-field-dark w-auto"
                >
                  <option value="全部">全部级别</option>
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field-dark w-auto"
              >
                <option value="全部">全部状态</option>
                <option value="待处理">待处理</option>
                <option value="处理中">处理中</option>
                <option value="已解决">已解决</option>
                <option value="已关闭">已关闭</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event, idx) => {
              const analysis = getAnalysis(event.eventType);
              const logs = getEventLogs(event.id);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                  className={`border-l-4 ${getEventTypeColor(event.eventType)} bg-dark-800 rounded-r-xl overflow-hidden`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-dark-700 transition-colors"
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            event.severity === '高'
                              ? 'bg-red-500/20 text-red-400'
                              : event.severity === '中'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h4 className="text-white font-semibold">{event.eventType}</h4>
                            <span className={`badge ${getSeverityColor(event.severity)}`}>
                              {event.severity}级
                            </span>
                            <span className={`badge ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            <span className="badge bg-primary-100 text-primary-700">
                              置信度 {analysis.confidence}%
                            </span>
                          </div>
                          <p className="text-dark-300 text-sm line-clamp-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-dark-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')}
                            </span>
                            {event.userId && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                用户 {event.userId.slice(1)}
                              </span>
                            )}
                            {event.trafficRecordId && (
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                通行 {event.trafficRecordId.slice(1)}
                              </span>
                            )}
                            {event.workOrderId && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                工单 {event.workOrderId.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('View detail:', event.id);
                          }}
                          className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-dark-400" />
                        </button>
                        {expandedId === event.id ? (
                          <ChevronUp className="w-5 h-5 text-dark-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-dark-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === event.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-dark-700"
                      >
                        <div className="p-4 bg-dark-750">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-dark-700 rounded-lg">
                              <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-primary-400" />
                                智能归因分析
                                <span className="ml-auto text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
                                  AI分析
                                </span>
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-dark-400 mb-1">根因分析</p>
                                  <p className="text-white text-sm">{analysis.rootCause}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-dark-400 mb-1">影响因素</p>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.factors.map((factor, i) => (
                                      <span key={i} className="text-xs bg-dark-600 text-dark-300 px-2 py-1 rounded">
                                        {factor}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-dark-600">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-dark-400">置信度</span>
                                    <span className="text-xs font-medium text-primary-400">{analysis.confidence}%</span>
                                  </div>
                                  <div className="w-full bg-dark-600 rounded-full h-1.5 mt-1">
                                    <div
                                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${analysis.confidence}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-dark-700 rounded-lg">
                              <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-accent-400" />
                                建议解决方案
                              </h5>
                              <p className="text-white text-sm mb-3">{analysis.solution}</p>
                              <div>
                                <p className="text-xs text-dark-400 mb-2">相关知识库</p>
                                <div className="space-y-1">
                                  {analysis.knowledge.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-dark-300">
                                      <BookOpen className="w-3 h-3 text-dark-400 mt-0.5 flex-shrink-0" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-dark-700 rounded-lg mb-4">
                            <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-green-400" />
                              预防措施
                            </h5>
                            <p className="text-white text-sm">{analysis.prevention}</p>
                          </div>

                          <div className="p-4 bg-dark-700 rounded-lg mb-4">
                            <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-dark-400" />
                              工单信息
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-dark-400 mb-1">工单号</p>
                                <p className="text-white font-mono">
                                  {event.workOrderId || '待生成'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-400 mb-1">创建时间</p>
                                <p className="text-white text-sm">
                                  {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-400 mb-1">当前处理人</p>
                                <p className="text-white text-sm">
                                  {event.status === '待处理' ? '待分配' : '张工'}
                                </p>
                              </div>
                              {event.resolvedAt && (
                                <div>
                                  <p className="text-xs text-dark-400 mb-1">解决时间</p>
                                  <p className="text-green-400 text-sm">
                                    {dayjs(event.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-dark-700 rounded-lg mb-4">
                            <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                              <History className="w-4 h-4 text-dark-400" />
                              操作日志
                            </h5>
                            <div className="space-y-2">
                              {logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                  <div className="w-6 h-6 bg-dark-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs text-dark-400">{logs.length - i}</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-medium">{log.operator}</span>
                                      <span className="text-xs text-dark-500">
                                        {dayjs(log.time).format('YYYY-MM-DD HH:mm:ss')}
                                      </span>
                                    </div>
                                    <p className="text-dark-300 text-xs">{log.action}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-dark-500" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 flex-wrap">
                            {event.status === '待处理' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssign(event);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                                >
                                  <Send className="w-4 h-4" />
                                  派发工单
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolve(event.id);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  直接解决
                                </button>
                              </>
                            )}
                            {event.status === '处理中' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolve(event.id);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  标记已解决
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssign(event);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  转派处理
                                </button>
                              </>
                            )}
                            {event.status === '已解决' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReopen(event.id);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  重新打开
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose(event.id);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
                                >
                                  <XCircle className="w-4 h-4" />
                                  关闭工单
                                </button>
                              </>
                            )}
                            {event.status === '已关闭' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopen(event.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                              >
                                <RotateCcw className="w-4 h-4" />
                                重新打开
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('View detail:', event.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              查看详情
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-dark-400">暂无符合条件的异常事件</p>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showAssignModal && selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/70 backdrop-blur-sm"
              onClick={() => setShowAssignModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-dark-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-dark-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-2">派发工单</h3>
                <p className="text-dark-400 mb-2">{selectedEvent.eventType}</p>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`badge ${getSeverityColor(selectedEvent.severity)}`}>
                    {selectedEvent.severity}级
                  </span>
                  <span className="text-sm text-dark-400">
                    创建时间：{dayjs(selectedEvent.createdAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    选择处理人员
                  </label>
                  <div className="space-y-2">
                    {handlers.map((handler) => (
                      <button
                        key={handler.id}
                        onClick={() => setAssignedHandler(handler.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                          assignedHandler === handler.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                          {handler.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{handler.name}</p>
                            {handler.currentTasks === 0 && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                空闲
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-dark-400">
                            {handler.role} · 当前 {handler.currentTasks} 个任务
                          </p>
                        </div>
                        {assignedHandler === handler.id && (
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    处理说明
                  </label>
                  <textarea
                    placeholder="请输入处理说明（选填）"
                    rows={3}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="input-field-dark resize-none"
                  />
                </div>

                <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                  <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent-400" />
                    快捷回复
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(operationTemplates[selectedEvent.eventType] || []).map((template, i) => (
                      <button
                        key={i}
                        onClick={() => setRemark(template)}
                        className="text-xs px-3 py-1.5 bg-dark-600 text-dark-300 rounded hover:bg-dark-500 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmAssign}
                    disabled={!assignedHandler}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    确认派发
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
