import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Cloud, Thermometer, Users, Package,
  Image as ImageIcon, Send, Upload, CheckCircle2, AlertCircle,
  Phone, MapPin, User, FileText, Clock, Sun, CloudRain,
  ChevronRight, CheckSquare, Square, X, SendHorizonal,
} from 'lucide-react';
import {
  Avatar, Progress, Checkbox, Button, Modal, Tag, Tooltip,
  Input, Empty,
} from 'antd';

const { TextArea } = Input;

const siteInfo = {
  id: 1,
  name: '阳光花园3栋全屋整装',
  ownerName: '张女士',
  ownerAvatar: 'Z',
  address: '阳光花园小区3栋2301室',
  area: 128,
  startDate: '2024-03-20',
  plannedDays: 75,
  passedDays: 58,
  plannedProgress: 80,
  actualProgress: 75,
  currentStage: '油漆阶段',
  manager: '张工',
  managerPhone: '138****8899',
  supervisor: '李监理',
  supervisorPhone: '139****6677',
  inspectionCount: 18,
  photoCount: 126,
};

const dailyLogs = [
  {
    id: 1,
    date: '2024-06-12',
    weekday: '周三',
    weather: '多云',
    temp: '22℃ ~ 28℃',
    workers: [
      { name: '王师傅', role: '油漆工' },
      { name: '赵师傅', role: '油漆工' },
      { name: '小刘', role: '杂工' },
    ],
    workContent: [
      '客厅墙面第二遍腻子批刮完成',
      '主卧天花板打磨处理',
      '书房墙面阴阳角找直',
      '次卫防水层闭水试验检查',
    ],
    photos: [
      { id: 1, emoji: '🎨', label: '客厅腻子' },
      { id: 2, emoji: '🪟', label: '主卧天花板' },
      { id: 3, emoji: '📏', label: '阴阳角找直' },
      { id: 4, emoji: '🛁', label: '卫生间防水' },
    ],
    materials: [
      { name: '立邦净味腻子粉', brand: '立邦', spec: '20kg/袋', quantity: 15, unit: '袋' },
      { name: '阴阳角线条', brand: '国产', spec: '2.4m/根', quantity: 30, unit: '根' },
    ],
    tomorrowPlan: [
      '客厅及走廊底漆涂刷',
      '卧室墙面打磨',
      '厨房瓷砖美缝施工',
    ],
    needOwnerConfirm: true,
    confirmContent: '卫生间闭水试验结果确认签字',
  },
  {
    id: 2,
    date: '2024-06-11',
    weekday: '周二',
    weather: '晴',
    temp: '24℃ ~ 31℃',
    workers: [
      { name: '王师傅', role: '油漆工' },
      { name: '赵师傅', role: '油漆工' },
    ],
    workContent: [
      '全房第一遍腻子批刮完成',
      '石膏线安装完毕',
      '吊顶接缝处防裂处理',
    ],
    photos: [
      { id: 1, emoji: '🏠', label: '全房腻子' },
      { id: 2, emoji: '🏛️', label: '石膏线' },
    ],
    materials: [
      { name: '立邦净味腻子粉', brand: '立邦', spec: '20kg/袋', quantity: 20, unit: '袋' },
      { name: '防裂网格布', brand: '国产', spec: '1m宽', quantity: 60, unit: 'm' },
    ],
    tomorrowPlan: [
      '第二遍腻子批刮',
      '墙面打磨准备',
    ],
    needOwnerConfirm: false,
  },
  {
    id: 3,
    date: '2024-06-10',
    weekday: '周一',
    weather: '小雨',
    temp: '19℃ ~ 24℃',
    workers: [
      { name: '钱师傅', role: '木工' },
      { name: '王师傅', role: '油漆工' },
    ],
    workContent: [
      '客厅吊顶石膏板封板完成',
      '过道吊顶造型施工完毕',
      '厨房卫生间防水开始施工',
    ],
    photos: [
      { id: 1, emoji: '🔨', label: '吊顶封板' },
      { id: 2, emoji: '🧱', label: '防水施工' },
      { id: 3, emoji: '📐', label: '过道吊顶' },
      { id: 4, emoji: '🚿', label: '厨房防水' },
      { id: 5, emoji: '🧰', label: '材料进场' },
    ],
    materials: [
      { name: '泰山石膏板', brand: '泰山', spec: '1220×2440×9.5mm', quantity: 28, unit: '张' },
      { name: '德高防水涂料', brand: '德高', spec: '20kg/桶', quantity: 6, unit: '桶' },
    ],
    tomorrowPlan: [
      '第一遍腻子批刮',
      '石膏线安装',
    ],
    needOwnerConfirm: false,
  },
];

const inspections = [
  {
    id: 1,
    date: '2024-06-12',
    time: '15:30',
    inspector: '李监理',
    type: '日常巡检',
    status: 'passed',
    items: [
      { name: '腻子批刮平整度', result: '合格', remark: '局部2处偏差2mm，需打磨处理' },
      { name: '阴阳角垂直度', result: '合格', remark: '误差在允许范围内' },
    ],
    overall: '整体施工质量符合规范要求，需注意成品保护。',
  },
  {
    id: 2,
    date: '2024-06-09',
    time: '10:00',
    inspector: '李监理',
    type: '隐蔽工程验收',
    status: 'passed',
    items: [
      { name: '吊顶龙骨承重', result: '合格', remark: '主副龙骨间距符合规范' },
      { name: '水电管线走向', result: '合格', remark: '管线标识清晰，走向合理' },
      { name: '防水层厚度', result: '合格', remark: '平均厚度1.8mm，满足要求' },
    ],
    overall: '隐蔽工程全部合格，可进入下道工序施工。',
  },
  {
    id: 3,
    date: '2024-06-05',
    time: '14:00',
    inspector: '李监理',
    type: '泥瓦工程验收',
    status: 'warning',
    items: [
      { name: '墙面砖空鼓率', result: '整改', remark: '厨房墙砖空鼓3处，需整改' },
      { name: '地面砖平整度', result: '合格', remark: '' },
      { name: '地漏坡度', result: '合格', remark: '排水顺畅无积水' },
    ],
    overall: '除局部墙砖空鼓外，其余项目合格。整改完成后复检。',
  },
];

const messages = [
  {
    id: 1,
    time: '2024-06-12 09:15',
    sender: 'owner',
    name: '张女士',
    content: '早上好张工，今天油漆开始做了吗？麻烦拍一下客厅的照片给我看看~',
  },
  {
    id: 2,
    time: '2024-06-12 09:42',
    sender: 'manager',
    name: '张工',
    content: '张姐早上好！已经在施工了，王师傅和赵师傅都在批第二遍腻子，照片稍后上传日志里，您可以随时查看哈。',
  },
  {
    id: 3,
    time: '2024-06-12 11:28',
    sender: 'manager',
    name: '张工',
    content: '对了张姐，卫生间闭水试验已经做了48小时，需要您方便时到现场确认签字，或者我拍视频给您远程确认也行~',
    images: ['🛁', '💧'],
  },
  {
    id: 4,
    time: '2024-06-12 11:45',
    sender: 'owner',
    name: '张女士',
    content: '好的，我下午过去一趟吧，顺便看看现场。大概3点到，可以吗？',
  },
  {
    id: 5,
    time: '2024-06-12 11:47',
    sender: 'manager',
    name: '张工',
    content: '好的没问题！我下午在工地等您，顺便把这几天的材料清单给您过目一下。',
  },
];

const weatherIcon = {
  '晴': Sun,
  '多云': Cloud,
  '小雨': CloudRain,
};

const photoGradients = [
  'from-haze-200 via-ivory-200 to-terracotta-200',
  'from-wood-200 via-terracotta-200 to-amber-200',
  'from-terracotta-200 via-amber-200 to-wood-200',
  'from-haze-200 via-wood-200 to-ivory-200',
  'from-ivory-200 via-haze-200 to-wood-200',
  'from-wood-300 via-terracotta-200 to-haze-200',
];

const SiteDailyLog = () => {
  const navigate = useNavigate();
  const { id = '1' } = useParams();
  const [selectedLog, setSelectedLog] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; label: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [needConfirm, setNeedConfirm] = useState(dailyLogs[0].needOwnerConfirm);

  const currentLog = dailyLogs[selectedLog];
  const daysRemaining = siteInfo.plannedDays - siteInfo.passedDays;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/provider/sites')}
          className="w-10 h-10 rounded-xl bg-white border border-ivory-200 flex items-center justify-center text-carbon-600 hover:bg-ivory-50 hover:text-terracotta-600 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="section-title !text-xl md:!text-2xl !mb-1">
            {siteInfo.name}
          </h1>
          <div className="flex items-center gap-3 text-sm text-ivory-600 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {siteInfo.address}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              业主 {siteInfo.ownerName}
            </span>
            <Tag color="orange" className="!m-0">{siteInfo.currentStage}</Tag>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-ivory-500">总面积</p>
            <p className="font-mono text-lg font-bold text-carbon-700">{siteInfo.area}㎡</p>
          </div>
          <div className="w-px h-10 bg-ivory-200" />
          <div className="text-center">
            <p className="text-xs text-ivory-500">已施工</p>
            <p className="font-mono text-lg font-bold text-haze-600">{siteInfo.passedDays}<span className="text-sm ml-0.5">天</span></p>
          </div>
          <div className="w-px h-10 bg-ivory-200" />
          <div className="text-center">
            <p className="text-xs text-ivory-500">剩余</p>
            <p className={`font-mono text-lg font-bold ${daysRemaining <= 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {daysRemaining}<span className="text-sm ml-0.5">天</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card-base p-5 bg-gradient-to-r from-ivory-50/60 via-white to-haze-50/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
          <div className="md:col-span-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-carbon-700 font-medium flex items-center gap-2">
                <Progress
                  type="circle"
                  size={36}
                  percent={siteInfo.actualProgress}
                  strokeColor="#C4623A"
                  strokeWidth={6}
                  format={(p) => <span className="text-[10px] font-mono font-bold">{p}%</span>}
                />
                整体施工进度
              </span>
              <span className="text-xs text-ivory-500">
                计划 {siteInfo.plannedProgress}% / 实际 {siteInfo.actualProgress}%
              </span>
            </div>
            <div className="relative h-3">
              <div className="absolute inset-0 rounded-full bg-ivory-200/70 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${siteInfo.plannedProgress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-ivory-300/60"
                />
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${siteInfo.actualProgress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`absolute inset-y-0 left-0 rounded-full shadow-sm ${
                  siteInfo.actualProgress < siteInfo.plannedProgress
                    ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                    : 'bg-gradient-to-r from-terracotta-400 via-terracotta-500 to-terracotta-600'
                }`}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Avatar size={28} className="!bg-terracotta-400 !text-white !text-[11px]">
                {siteInfo.manager[0]}
              </Avatar>
              <div>
                <p className="text-xs text-ivory-500">项目经理</p>
                <p className="text-sm font-medium text-carbon-700">{siteInfo.manager}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="card-base p-5">
            <h3 className="font-serif text-lg text-carbon-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-wood-500" />
              施工日志时间轴
            </h3>
            <div className="relative">
              <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-terracotta-300 via-haze-300 to-ivory-300" />
              <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
                {dailyLogs.map((log, idx) => {
                  const WeatherIco = weatherIcon[log.weather] || Sun;
                  const isActive = idx === selectedLog;
                  return (
                    <motion.button
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedLog(idx)}
                      className={`w-full relative flex gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-terracotta-50/80 to-transparent border border-terracotta-200/60 shadow-sm'
                          : 'hover:bg-ivory-50/60 border border-transparent'
                      }`}
                    >
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                        isActive
                          ? 'bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-white border-terracotta-400/30'
                          : 'bg-white text-ivory-600 border-ivory-200'
                      }`}>
                        {isActive ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`font-mono text-sm font-semibold ${
                            isActive ? 'text-terracotta-700' : 'text-carbon-700'
                          }`}>
                            {log.date.slice(5)}
                          </span>
                          <span className={`text-[10px] ${isActive ? 'text-terracotta-600' : 'text-ivory-500'}`}>
                            {log.weekday}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-ivory-500">
                          <WeatherIco className="w-3 h-3" />
                          <span>{log.weather} {log.temp.split(' ~ ')[0]}</span>
                          <span>·</span>
                          <span>{log.workers.length}人施工</span>
                          {log.needOwnerConfirm && (
                            <Tag color="orange" className="!m-0 !text-[10px] !py-0 !px-1.5">待确认</Tag>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-serif text-lg text-carbon-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-haze-500" />
              巡检记录
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
              {inspections.map((ins, idx) => {
                const isWarning = ins.status === 'warning';
                return (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      isWarning
                        ? 'bg-gradient-to-br from-amber-50/80 to-transparent border-amber-200/60'
                        : 'bg-gradient-to-br from-emerald-50/60 to-transparent border-emerald-200/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="font-medium text-sm text-carbon-800">{ins.type}</span>
                        </div>
                        <p className="text-[11px] text-ivory-500 font-mono">
                          {ins.date} {ins.time}
                        </p>
                      </div>
                      <Tag color={isWarning ? 'warning' : 'success'} className="!m-0 !text-[11px]">
                        {isWarning ? '有整改项' : '全部合格'}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ivory-600 mb-2">
                      <Avatar size={18} className="!bg-haze-400 !text-white !text-[10px]">
                        {ins.inspector[0]}
                      </Avatar>
                      <span>巡检人：{ins.inspector}</span>
                    </div>
                    <p className="text-xs text-carbon-600 leading-relaxed border-t border-dashed border-ivory-200 pt-2 mt-2">
                      {isWarning && <AlertCircle className="w-3 h-3 inline text-amber-500 mr-1" />}
                      {ins.overall}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ins.items.map((it, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            it.result === '合格'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {it.name} {it.result}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="card-base overflow-hidden">
            <div className="bg-gradient-to-br from-haze-50/80 via-white to-wood-50/40 p-5 border-b border-ivory-100">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-serif text-lg text-carbon-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-terracotta-500" />
                    {currentLog.date} · {currentLog.weekday}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-ivory-600">
                    <span className="flex items-center gap-1">
                      <Cloud className="w-4 h-4 text-haze-500" />
                      {currentLog.weather}
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-4 h-4 text-terracotta-500" />
                      {currentLog.temp}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-wood-500" />
                      {currentLog.workers.length}名工人
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentLog.workers.map((w, i) => (
                    <Tooltip key={i} title={`${w.name} · ${w.role}`}>
                      <Avatar size={28} className={`!text-white !text-[11px] !border-2 !border-white ${
                        i === 0 ? '!bg-terracotta-400' : i === 1 ? '!bg-haze-500' : '!bg-wood-500'
                      } ${i > 0 ? '-ml-2' : ''}`}>
                        {w.name[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '巡检次数', value: siteInfo.inspectionCount, unit: '次', color: 'haze' },
                  { label: '施工天数', value: siteInfo.passedDays, unit: '天', color: 'wood' },
                  { label: '照片总数', value: siteInfo.photoCount, unit: '张', color: 'terracotta' },
                  { label: '材料进场', value: currentLog.materials.length, unit: '批', color: 'emerald' },
                ].map((it, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/70 border border-white shadow-sm backdrop-blur-sm">
                    <p className="text-[11px] text-ivory-500 mb-0.5">{it.label}</p>
                    <p className="font-mono text-lg font-bold text-carbon-800">
                      {it.value}
                      <span className="text-xs font-normal text-ivory-500 ml-0.5">{it.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-carbon-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  今日完成内容
                </h4>
                <div className="space-y-2">
                  {currentLog.workContent.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-ivory-50/60 transition-colors">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-carbon-700 leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-carbon-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-haze-500" />
                    施工照片 ({currentLog.photos.length})
                  </h4>
                  <button className="text-xs text-haze-600 hover:text-haze-700 flex items-center gap-1 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    上传更多
                  </button>
                </div>
                <div className={`grid gap-3 ${
                  currentLog.photos.length >= 4 ? 'grid-cols-3' : 'grid-cols-2'
                }`}>
                  {currentLog.photos.map((p, idx) => (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      onClick={() => setPhotoPreview({ src: p.emoji, label: p.label })}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${photoGradients[idx % photoGradients.length]} border-2 border-white shadow-card group`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-grain">
                        <span className="text-5xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300">
                          {p.emoji}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[11px] font-medium text-carbon-800 bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                          {p.label}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {currentLog.materials.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-carbon-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-wood-500" />
                    今日材料进场
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-ivory-200">
                    <table className="w-full text-sm">
                      <thead className="bg-ivory-50/80">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ivory-600">材料名称</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ivory-600">品牌/规格</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-ivory-600">数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLog.materials.map((m, i) => (
                          <tr key={i} className="border-t border-ivory-100 hover:bg-ivory-50/40 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-carbon-700">{m.name}</td>
                            <td className="px-3 py-2.5 text-xs text-ivory-600">{m.brand} · {m.spec}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-carbon-800">
                              {m.quantity}<span className="text-xs text-ivory-500 ml-0.5">{m.unit}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-carbon-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-haze-500" />
                  明日计划
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-br from-haze-50/70 to-ivory-50/50 border border-haze-200/50">
                  <div className="space-y-2">
                    {currentLog.tomorrowPlan.map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-haze-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-carbon-700">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                needConfirm
                  ? 'bg-gradient-to-br from-amber-50/80 to-terracotta-50/40 border-amber-300'
                  : 'bg-ivory-50/40 border-ivory-200'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <button
                    onClick={() => setNeedConfirm(!needConfirm)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                      needConfirm
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 text-white'
                        : 'bg-white border-ivory-300 hover:border-amber-400'
                    }`}
                  >
                    {needConfirm && <CheckSquare className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${needConfirm ? 'text-amber-800' : 'text-carbon-700'}`}>
                      需要业主确认
                    </p>
                    {needConfirm && currentLog.confirmContent && (
                      <p className="text-xs text-amber-700 mt-1 bg-white/60 px-2.5 py-1.5 rounded-lg inline-block mt-2">
                        📝 {currentLog.confirmContent}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="card-base h-full flex flex-col min-h-[700px] max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-ivory-100 bg-gradient-to-r from-terracotta-50/60 via-white to-haze-50/40">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif text-lg text-carbon-800 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-terracotta-500" />
                  业主沟通
                </h3>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-ivory-200/60 mt-3">
                <Avatar size={40} className="!bg-terracotta-400 !text-white !font-semibold">
                  {siteInfo.ownerAvatar}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-carbon-800">{siteInfo.ownerName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-ivory-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    最近上线：2小时前
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-gradient-to-b from-ivory-50/30 via-white to-transparent">
              {messages.map((msg, idx) => {
                const isOwner = msg.sender === 'owner';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`flex gap-2.5 ${isOwner ? '' : 'flex-row-reverse'}`}
                  >
                    <Avatar
                      size={28}
                      className={`flex-shrink-0 !text-white !text-[11px] ${
                        isOwner ? '!bg-terracotta-400' : '!bg-haze-500'
                      }`}
                    >
                      {msg.name[0]}
                    </Avatar>
                    <div className={`max-w-[85%] ${isOwner ? '' : 'text-right'}`}>
                      <div className={`text-[10px] text-ivory-500 mb-1 ${isOwner ? '' : 'text-right'}`}>
                        {msg.name} · {msg.time.split(' ')[1]}
                      </div>
                      <div
                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isOwner
                            ? 'bg-white border border-ivory-200 text-carbon-700 rounded-tl-md'
                            : 'bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-white rounded-tr-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.images && (
                        <div className={`flex gap-2 mt-2 ${isOwner ? '' : 'justify-end'}`}>
                          {msg.images.map((img, i) => (
                            <div
                              key={i}
                              className={`w-16 h-16 rounded-xl bg-gradient-to-br ${photoGradients[i + 1]} border-2 border-white shadow-sm flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-transform`}
                            >
                              {img}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="p-4 border-t border-ivory-100 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <button className="w-8 h-8 rounded-lg hover:bg-ivory-100 text-ivory-600 hover:text-terracotta-600 transition-colors flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-ivory-100 text-ivory-600 hover:text-haze-600 transition-colors flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-ivory-100 text-ivory-600 hover:text-wood-600 transition-colors flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-ivory-400">Enter 发送 / Shift+Enter 换行</span>
              </div>
              <div className="flex items-end gap-2">
                <TextArea
                  rows={2}
                  placeholder="输入消息..."
                  className="!rounded-xl !resize-none !text-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey && newMessage.trim()) {
                      e.preventDefault();
                      setNewMessage('');
                    }
                  }}
                />
                <button
                  disabled={!newMessage.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    newMessage.trim()
                      ? 'bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-white shadow-md shadow-terracotta-500/30 hover:from-terracotta-500 hover:to-terracotta-600 hover:shadow-lg'
                      : 'bg-ivory-100 text-ivory-400 cursor-not-allowed'
                  }`}
                >
                  <SendHorizonal className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {photoPreview && (
          <Modal
            open={!!photoPreview}
            onCancel={() => setPhotoPreview(null)}
            footer={null}
            centered
            width={520}
            destroyOnClose
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
            >
              <div
                className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${photoGradients[0]} overflow-hidden flex items-center justify-center relative`}
              >
                <span className="text-9xl opacity-70">{photoPreview.src}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-medium text-carbon-800">{photoPreview.label}</p>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-carbon-600 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-carbon-600 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteDailyLog;
