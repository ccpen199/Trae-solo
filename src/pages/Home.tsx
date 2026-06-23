import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Phone,
  ClipboardList,
  TrendingUp,
  Users,
  Clock,
  FileCheck,
  MapPin,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ShieldAlert,
  AlertTriangle,
  Newspaper,
  Zap,
  Droplets,
  Search,
  Video,
  Grid3x3,
  Map as MapIcon,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, speak } from '@/store';

const mockNews = [
  {
    id: '1',
    title: '盐城市召开民生服务工作推进会 部署下半年重点任务',
    summary: '会议强调要以群众需求为导向，加快推进融媒体民生云平台建设，提升政务服务效能。',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20government%20meeting%20hall%20with%20officials%20at%20conference%20table%2C%20modern%20civic%20building%20interior&image_size=landscape_16_9',
    category: '政务要闻',
    publishTime: '2026-06-20',
    views: 3582,
  },
  {
    id: '2',
    title: '暴雨天气防范指南：这些事项请市民注意',
    summary: '近期我市进入主汛期，强降雨天气频发，市应急管理局发布安全提示。',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Heavy%20rainstorm%20in%20Chinese%20city%20with%20flooded%20streets%2C%20dramatic%20dark%20sky&image_size=landscape_16_9',
    category: '应急预警',
    publishTime: '2026-06-20',
    views: 2145,
  },
  {
    id: '3',
    title: '社保待遇领取资格认证"刷脸"即可完成',
    summary: '我市全面推行社保待遇领取资格"人脸识别"认证，退休人员足不出户即可办理。',
    category: '便民提示',
    publishTime: '2026-06-19',
    views: 1876,
  },
  {
    id: '4',
    title: '2026年城乡居民医保缴费即将开始',
    summary: '缴费标准、缴费方式、参保范围等关键信息已公布，请市民及时办理。',
    category: '民生政策',
    publishTime: '2026-06-19',
    views: 4521,
  },
  {
    id: '5',
    title: '盐城高新区新建3个社区卫生服务站',
    summary: '进一步完善基层医疗卫生服务体系，为居民提供更便捷的健康服务。',
    category: '民生动态',
    publishTime: '2026-06-18',
    views: 986,
  },
];

const coreEntries = [
  { id: 'news', label: '新闻客户端', desc: '图文/短视频/直播', icon: Newspaper, color: 'from-gov-500 to-gov-700', route: '/news' },
  { id: 'hotline', label: '12345热线', desc: '诉求提交与追踪', icon: Phone, color: 'from-warm-400 to-warm-600', route: '/workorders/submit' },
  { id: 'emergency', label: '应急广播', desc: '台风暴雨预警', icon: ShieldAlert, color: 'from-red-500 to-red-700', route: '/emergency' },
  { id: 'map', label: '公共服务地图', desc: '水电气/医疗网点', icon: MapPin, color: 'from-blue-500 to-blue-700', route: '/map' },
  { id: 'services', label: '便民服务聚合', desc: '社保/违章/公积金', icon: ClipboardList, color: 'from-green-500 to-green-700', route: '/services' },
];

const quickServices = [
  { id: 'cert', title: '证件办理', icon: FileCheck, color: 'text-gov-600', bgColor: 'bg-gov-100', route: '/services' },
  { id: 'social', title: '社保查询', icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100', route: '/services' },
  { id: 'fund', title: '公积金', icon: Grid3x3, color: 'text-amber-600', bgColor: 'bg-amber-100', route: '/services' },
  { id: 'health', title: '预约挂号', icon: ClipboardList, color: 'text-rose-600', bgColor: 'bg-rose-100', route: '/services' },
  { id: 'traffic', title: '违章查询', icon: MapIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-100', route: '/services' },
  { id: 'water', title: '水费缴纳', icon: Droplets, color: 'text-cyan-600', bgColor: 'bg-cyan-100', route: '/services' },
  { id: 'elec', title: '电费缴纳', icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-100', route: '/services' },
  { id: 'gas', title: '燃气服务', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-100', route: '/services' },
  { id: 'more', title: '全部服务', icon: ChevronRight, color: 'text-gray-600', bgColor: 'bg-gray-100', route: '/services' },
];

const videoGuides = [
  {
    id: 'v1',
    title: '社保查询操作指南',
    duration: '2:30',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20elderly%20person%20using%20smartphone%20for%20social%20security%20query%2C%20warm%20lighting&image_size=landscape_4_3',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    route: '/services/socialsec',
    cta: '立即查询社保',
    steps: [
      { n: 1, text: '点击"社保查询"按钮进入服务页' },
      { n: 2, text: '输入本人18位身份证号码' },
      { n: 3, text: '输入社保卡号后点击查询' },
      { n: 4, text: '查看缴费明细、账户余额等信息' },
    ],
  },
  {
    id: 'v2',
    title: '公积金提取视频讲解',
    duration: '3:15',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Housing%20fund%20extraction%20tutorial%20on%20phone%20screen%2C%20clean%20UI&image_size=landscape_4_3',
    src: 'https://www.w3schools.com/html/movie.mp4',
    route: '/services/housingfund',
    cta: '办理公积金提取',
    steps: [
      { n: 1, text: '进入公积金服务页面' },
      { n: 2, text: '选择提取原因（购房/租房/退休等）' },
      { n: 3, text: '上传相关证明材料照片' },
      { n: 4, text: '提交申请，等待3-5个工作日审核' },
    ],
  },
  {
    id: 'v3',
    title: '交通违章处理流程',
    duration: '1:50',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Traffic%20violation%20processing%20app%20interface%2C%20modern%20design&image_size=landscape_4_3',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    route: '/services/trafficfine',
    cta: '查询并处理违章',
    steps: [
      { n: 1, text: '输入车牌号和车架号后6位' },
      { n: 2, text: '查看违法记录详情' },
      { n: 3, text: '在线确认并缴纳罚款' },
      { n: 4, text: '获取电子处理凭证' },
    ],
  },
];

const alertItems = [
  { level: 'red' as const, title: '暴雨红色预警', desc: '预计未来3小时强降水，请注意防范' },
  { level: 'orange' as const, title: '高温橙色预警', desc: '今日最高气温可达38度，注意防暑' },
  { level: 'blue' as const, title: '台风蓝色预警', desc: '沿海地区阵风可达8-9级' },
];

const outlets = [
  { name: '盐城市政务服务中心', type: '综合', queue: 18, wait: 32, icon: Users },
  { name: '国家电网营业厅', type: '电力', queue: 6, wait: 12, icon: Zap },
  { name: '市第一人民医院', type: '医疗', queue: 45, wait: 58, icon: ClipboardList },
];

const levelConfig = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', label: '蓝色预警' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', bar: 'bg-yellow-500', label: '黄色预警' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', label: '橙色预警' },
  red: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500', label: '红色预警' },
};

export default function Home() {
  const navigate = useNavigate();
  const { elderlyMode, highContrast, _forceRender } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'success' | 'not_supported' | 'denied' | 'fallback'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCalled, setSosCalled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const featuredNews = mockNews[0];
  const otherNews = mockNews.slice(1, 5);

  const quickSearchTerms = ['社保查询', '公积金提取', '违章处理', '暴雨预警', '医保缴费', '证件办理', '预约挂号', '公交线路'];

  useEffect(() => {
    if (_forceRender > 0) {
      /* 触发重渲染 */
    }
  }, [_forceRender]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
      }
    };
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      speak(`正在搜索${query}`);
      navigate(`/news?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('not_supported');
      speak('您的浏览器暂不支持语音搜索，请使用文字搜索');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        if (event.results[0].isFinal) {
          setIsListening(false);
          setVoiceState('success');
          setSearchQuery(transcript);
          speak(`已识别：${transcript}，点击搜索按钮进行搜索`);
        }
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceState('denied');
          speak('麦克风权限未开启，请使用文字搜索或点击下方热门搜索词');
        } else {
          setVoiceState('fallback');
          speak('语音识别暂不可用，请使用文字搜索');
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setVoiceState('listening');
      setVoiceText('');
      speak('请说话');
    } catch {
      setVoiceState('fallback');
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    setIsListening(false);
  };

  const toggleVideo = (videoId: string) => {
    const newActive = activeVideoId === videoId ? null : videoId;
    setActiveVideoId(newActive);
    Object.keys(videoRefs.current).forEach((id) => {
      const v = videoRefs.current[id];
      if (!v) return;
      if (id === newActive) {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => { /* noop */ });
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  };

  const handleSosCall = () => {
    setSosCalled(true);
    setTimeout(() => {
      setSosCalled(false);
      setShowSosModal(false);
    }, 3000);
  };

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-red-600 text-white animate-fade-in-up">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/20 flex-shrink-0">
                暴雨红色预警
              </span>
              <p className="text-sm font-medium truncate animate-marquee whitespace-nowrap md:whitespace-normal md:animate-none">
                盐城市气象台发布暴雨红色预警信号，预计未来3小时内部分地区将出现100毫米以上降水，请广大市民注意防范。
              </p>
            </div>
          </div>
          <Link to="/emergency" className="hidden md:inline-flex items-center gap-1 text-sm font-medium bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors">
            查看详情 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-gov-600 via-gov-700 to-gov-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-warm-400 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-8 md:py-14 relative">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索新闻、服务、政策..."
                  className={cn(
                    'w-full pl-12 pr-24 py-3.5 md:py-4 rounded-2xl bg-white/95 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-warm-400 shadow-lg',
                    elderlyMode ? 'text-lg' : 'text-base',
                  )}
                  onFocus={() => setShowSearchPanel(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch(searchQuery);
                    }
                  }}
                />
                {searchQuery.trim() && (
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-sm font-semibold hover:from-warm-500 hover:to-warm-600 transition-all shadow-md min-h-10"
                  >
                    搜索
                  </button>
                )}
              </div>
              <button
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={cn(
                  'flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-lg',
                  elderlyMode ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14',
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/20 backdrop-blur text-white hover:bg-white/30 border-2 border-white/30',
                )}
                title="语音搜索"
              >
                {isListening ? <MicOff className={cn(elderlyMode ? 'w-8 h-8' : 'w-6 h-6')} /> : <Mic className={cn(elderlyMode ? 'w-8 h-8' : 'w-6 h-6')} />}
              </button>
            </div>

            {voiceState === 'listening' && (
              <div className="mb-4 p-4 md:p-6 rounded-2xl bg-white/10 backdrop-blur animate-fade-in-up text-center border-2 border-red-400/50">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-400 animate-pulse" />
                  <span className={cn('text-white font-semibold', elderlyMode ? 'text-xl' : 'text-base')}>正在聆听，请说话...</span>
                </div>
                {voiceText && (
                  <p className={cn('text-warm-300 font-bold mt-2', elderlyMode ? 'text-2xl' : 'text-lg')}>"{voiceText}"</p>
                )}
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    onClick={stopVoiceSearch}
                    className="px-5 py-2.5 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors min-h-11"
                  >
                    停止录音
                  </button>
                  <button
                    onClick={() => { setVoiceState('idle'); setIsListening(false); }}
                    className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors min-h-11"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {voiceState === 'not_supported' && (
              <div className="mb-4 p-4 md:p-5 rounded-2xl bg-warm-500/20 backdrop-blur text-white animate-fade-in-up border-2 border-warm-400/50">
                <p className={cn('font-bold mb-2', elderlyMode && 'text-xl')}>您的浏览器暂不支持语音搜索</p>
                <p className="text-sm md:text-base text-white/90 mb-4">请使用上方搜索框输入关键词，或点击下方热门搜索词快速查找</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickSearchTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); handleSearch(term); setVoiceState('idle'); }}
                      className={cn(
                        'px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium text-left',
                        elderlyMode && 'text-lg min-h-14',
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceState === 'denied' && (
              <div className="mb-4 p-4 md:p-5 rounded-2xl bg-warm-500/20 backdrop-blur text-white animate-fade-in-up border-2 border-warm-400/50">
                <p className={cn('font-bold mb-2', elderlyMode && 'text-xl')}>🔒 麦克风权限未开启</p>
                <p className="text-sm md:text-base text-white/90 mb-4">请在浏览器地址栏右侧开启麦克风访问，或使用下方大字按钮搜索</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickSearchTerms.slice(0, 4).map((term) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); handleSearch(term); setVoiceState('idle'); }}
                      className={cn(
                        'px-3 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 hover:from-warm-500 hover:to-warm-600 transition-all font-bold text-white shadow-md',
                        elderlyMode && 'text-xl min-h-14',
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceState === 'fallback' && (
              <div className="mb-4 p-4 md:p-5 rounded-2xl bg-warm-500/20 backdrop-blur text-white animate-fade-in-up border-2 border-warm-400/50">
                <p className={cn('font-bold mb-2', elderlyMode && 'text-xl')}>语音识别暂不可用，请用文字或按钮搜索</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {quickSearchTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); handleSearch(term); setVoiceState('idle'); }}
                      className={cn(
                        'px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium text-left',
                        elderlyMode && 'text-lg min-h-14',
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceState === 'success' && voiceText && (
              <div className="mb-4 p-4 md:p-5 rounded-2xl bg-green-500/20 backdrop-blur text-white animate-fade-in-up border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className={cn(elderlyMode ? 'w-7 h-7' : 'w-5 h-5')} />
                  <span className={cn('font-bold', elderlyMode && 'text-xl')}>语音识别成功</span>
                </div>
                <div className="flex items-center flex-wrap gap-3 mb-4">
                  <span className="text-white/80">您说的是：</span>
                  <span className={cn('text-warm-300 font-bold', elderlyMode ? 'text-2xl' : 'text-xl')}>"{voiceText}"</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSearch(voiceText)}
                    className={cn(
                      'px-6 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 hover:from-warm-500 hover:to-warm-600 text-white font-bold shadow-lg transition-all',
                      elderlyMode && 'text-xl min-h-14',
                    )}
                  >
                    🔍 确认搜索
                  </button>
                  <button
                    onClick={startVoiceSearch}
                    className={cn(
                      'px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors',
                      elderlyMode && 'text-lg min-h-14',
                    )}
                  >
                    🎤 重新识别
                  </button>
                  <button
                    onClick={() => { setVoiceState('idle'); setVoiceText(''); setSearchQuery(''); }}
                    className={cn(
                      'px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors',
                      elderlyMode && 'text-lg min-h-14',
                    )}
                  >
                    清除
                  </button>
                </div>
              </div>
            )}

            {showSearchPanel && voiceState === 'idle' && (
              <div className="mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur animate-fade-in-up border border-white/10">
                <p className="text-white/70 text-sm md:text-base mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  热门搜索（点击快速查找）
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickSearchTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); handleSearch(term); setShowSearchPanel(false); }}
                      className={cn(
                        'px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium text-left',
                        elderlyMode && 'text-lg min-h-14',
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-10">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                系统运行正常
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4">
                盐城民生云平台
                <br />
                <span className="text-warm-300">让服务触手可及</span>
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                盐城市级融媒体民生服务一体化平台，整合新闻资讯、12345热线、应急预警、公共服务地图等核心功能
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  进入服务大厅
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/workorders/submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <ClipboardList className="w-5 h-5" />
                  提交诉求
                </Link>
                <button
                  onClick={() => setShowSosModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all animate-pulse-slow"
                >
                  <AlertTriangle className="w-5 h-5" />
                  紧急呼救
                </button>
              </div>
            </div>

            <div className="relative hidden md:block animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => navigate('/news')}>
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20city%20digital%20government%20service%20platform%20dashboard%2C%20modern%20Chinese%20civic%20technology&image_size=landscape_16_9"
                  alt="平台宣传"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-gov-600 ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-semibold text-lg">平台功能介绍</p>
                  <p className="text-sm text-white/70">一键了解所有便民服务</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '累计服务人次', value: '128,650', icon: Users },
              { label: '今日服务', value: '856', icon: TrendingUp },
              { label: '按时办结率', value: '96.8%', icon: FileCheck },
              { label: '群众满意度', value: '98.5%', icon: Clock },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100 + 300}ms` }}
                >
                  <Icon className="w-5 h-5 text-warm-300 mb-2" />
                  <p className="text-2xl md:text-3xl font-bold">{item.value}</p>
                  <p className="text-sm text-white/70 mt-1">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gov-800 mb-1">核心服务入口</h2>
              <p className="text-sm md:text-base text-gray-500">市民高频业务直达</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {coreEntries.map((entry, idx) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.id}
                  to={entry.route}
                  className="group p-4 md:p-5 rounded-2xl border border-gray-100 hover:border-gov-200 hover:shadow-card-hover transition-all duration-300 text-center animate-fade-in-up hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className={cn('w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform', entry.color)}>
                    <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1">{entry.label}</h3>
                  <p className="text-xs text-gray-500">{entry.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-card p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gov-800 mb-1">便民服务</h2>
              <p className="text-sm md:text-base text-gray-500">高频事项一键办理</p>
            </div>
            <Link to="/services" className="text-sm text-gov-600 hover:text-gov-700 font-medium flex items-center gap-1">
              全部服务 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 md:gap-4">
            {quickServices.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <Link
                  key={svc.id}
                  to={svc.route}
                  className="group flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform', svc.bgColor)}>
                    <Icon className={cn('w-6 h-6', svc.color)} />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700 font-medium">{svc.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-gov-800 mb-1">新闻资讯</h2>
                <p className="text-sm md:text-base text-gray-500">了解最新政策动态</p>
              </div>
              <Link to="/news" className="text-sm text-gov-600 hover:text-gov-700 font-medium flex items-center gap-1">
                查看更多 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Link to={`/news/${featuredNews.id}`} className="block bg-white rounded-2xl shadow-card overflow-hidden group hover:shadow-card-hover transition-all duration-300 mb-6">
              <div className="md:flex">
                <div className="md:w-1/2 relative aspect-video md:aspect-auto overflow-hidden">
                  <img
                    src={featuredNews.cover}
                    alt={featuredNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 chip bg-gov-500 text-white">{featuredNews.category}</span>
                </div>
                <div className="md:w-1/2 p-5 md:p-6">
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-gov-600 transition-colors leading-snug">
                    {featuredNews.title}
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base mb-4 line-clamp-3">{featuredNews.summary}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{featuredNews.publishTime}</span>
                    <span>{featuredNews.views} 次浏览</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white rounded-2xl shadow-card p-4 md:p-5 space-y-1">
              {otherNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 group-hover:text-gov-600 transition-colors line-clamp-1 mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="chip bg-gray-100 text-gray-600">{item.category}</span>
                      <span>{item.publishTime}</span>
                      <span>{item.views} 浏览</span>
                    </div>
                  </div>
                  {item.cover && (
                    <img
                      src={item.cover}
                      alt=""
                      className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-gov-800">预警通知</h3>
                <Link to="/emergency" className="text-sm text-gov-600 hover:text-gov-700">
                  全部
                </Link>
              </div>
              <div className="space-y-3">
                {alertItems.map((alert, idx) => {
                  const cfg = levelConfig[alert.level];
                  return (
                    <Link key={idx} to="/emergency" className={`block p-3 rounded-xl border ${cfg.bg} ${cfg.text} hover:opacity-80 transition-opacity`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`chip ${cfg.bar} text-white`}>{cfg.label}</span>
                        <span className="font-semibold text-sm text-gray-800">{alert.title}</span>
                      </div>
                      <p className="text-xs text-gray-500">{alert.desc}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gov-500 to-gov-700 text-white rounded-2xl shadow-card p-5">
              <h3 className="font-serif text-lg font-bold mb-3">服务热线</h3>
              <div className="space-y-3">
                <a
                  href="tel:12345"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl text-warm-300">12345</p>
                    <p className="text-xs text-white/70">政务服务热线</p>
                  </div>
                </a>
                <a
                  href="tel:120"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl">120</p>
                    <p className="text-xs text-white/70">医疗急救</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-gov-800">服务网点</h3>
                <Link to="/map" className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1">
                  地图 <MapPin className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {outlets.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link key={idx} to="/map" className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gov-50/50 rounded-lg px-1 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gov-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-gov-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">排队{item.queue}人</span>
                          <span className="text-xs text-warm-600">约{item.wait}分钟</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-gov-800 mb-1 flex items-center gap-2">
              <Video className="w-7 h-7 text-gov-600" />
              服务视频讲解
            </h2>
            <p className="text-sm md:text-base text-gray-500">手把手教您办理各项业务 · 边看边办</p>
          </div>
        </div>
        <div className="space-y-6">
          {videoGuides.map((video, idx) => {
            const isActive = activeVideoId === video.id;
            return (
              <div
                key={video.id}
                className={cn(
                  'bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in-up transition-all duration-300',
                  isActive ? 'ring-2 ring-gov-400 shadow-card-hover' : 'hover:shadow-card-hover',
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative bg-black">
                    {isActive ? (
                      <div className="relative">
                        <video
                          ref={(el) => (videoRefs.current[video.id] = el)}
                          src={video.src}
                          poster={video.cover}
                          className="w-full aspect-video bg-black"
                          controls
                          controlsList="nodownload"
                          playsInline
                          preload="metadata"
                          muted={videoMuted}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="chip bg-gov-600 text-white">正在播放</span>
                          <button
                            onClick={() => setVideoMuted(!videoMuted)}
                            className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                            title={videoMuted ? '开启声音' : '静音'}
                          >
                            {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={() => toggleVideo(video.id)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                          title="关闭视频"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="relative aspect-video cursor-pointer group"
                        onClick={() => toggleVideo(video.id)}
                      >
                        <img
                          src={video.cover}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 md:w-8 md:h-8 text-gov-600 ml-1" fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-white font-semibold text-sm md:text-base drop-shadow-lg">{video.title}</span>
                          <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded">{video.duration}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5 md:p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">{video.title}</h3>
                        <p className="text-sm text-gray-500">视频时长 {video.duration} · 适老化讲解</p>
                      </div>
                      {!isActive && (
                        <button
                          onClick={() => toggleVideo(video.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gov-50 text-gov-700 text-sm font-semibold hover:bg-gov-100 transition-colors min-h-10"
                        >
                          <Play className="w-4 h-4" fill="currentColor" />
                          播放
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        办理步骤（{video.steps.length}步）
                      </p>
                      <ol className="space-y-2.5">
                        {video.steps.map((step) => (
                          <li key={step.n} className="flex items-start gap-3">
                            <span className="w-7 h-7 flex-shrink-0 rounded-full bg-gov-100 text-gov-700 font-bold text-sm flex items-center justify-center">
                              {step.n}
                            </span>
                            <span className="text-sm text-gray-700 leading-relaxed pt-0.5">{step.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2.5 pt-4 border-t border-gray-100">
                      <Link
                        to={video.route}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all min-h-10"
                        onClick={() => speak(`正在进入${video.title}`)}
                      >
                        {video.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => speak(video.steps.map((s) => `第${s.n}步，${s.text}`).join('。'))}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-10"
                      >
                        <Volume2 className="w-4 h-4" />
                        语音播报步骤
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showSosModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-6 text-white text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-3 animate-pulse" />
              <h2 className="font-serif text-2xl font-bold">紧急呼救</h2>
              <p className="text-white/80 text-sm mt-1">点击下方按钮发起紧急求助</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-gray-600 mb-1">紧急联系人</p>
                <p className="text-xl font-bold text-red-700">138****1234</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:120"
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  120 急救
                </a>
                <a
                  href="tel:110"
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  110 报警
                </a>
              </div>
              <button
                onClick={handleSosCall}
                disabled={sosCalled}
                className={cn(
                  'w-full py-4 rounded-xl text-white font-bold text-lg transition-all',
                  sosCalled
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg',
                )}
              >
                {sosCalled ? '✓ 求助信号已发送' : '一键发送求助信号'}
              </button>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSosModal(true)}
        className={cn(
          'fixed bottom-24 right-5 z-40 flex flex-col items-center justify-center gap-0.5',
          'w-16 h-16 md:w-20 md:h-20 rounded-full',
          'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl',
          'hover:scale-110 transition-all duration-300 active:scale-95',
          'border-4 border-white/30',
        )}
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
        <span className="text-[10px] md:text-xs font-bold">紧急呼救</span>
      </button>
    </div>
  );
}
