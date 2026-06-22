import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Train,
  Bus,
  Car,
  MapPin,
  Clock,
  AlertCircle,
  Navigation,
  ArrowRight,
  Phone,
  ExternalLink,
  Zap,
  CreditCard,
  FileText,
  Users,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceDetailConfig {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  sections: {
    title: string;
    icon: any;
    content: React.ReactNode;
  }[];
}

const subwayLines = [
  { name: '1号线', color: 'bg-red-500', stations: ['先锋岛', '盐城站', '市政府', '金融城', '亭湖新区', '环保产业园'], active: true },
  { name: '2号线', color: 'bg-blue-500', stations: ['城南新区', '市中医院', '盐城工学院', '盐渎公园', '新都路', '开发区'], active: true },
  { name: '3号线', color: 'bg-green-500', stations: ['规划中'], active: false },
];

const busRoutes = [
  { id: 'B1', name: 'B1路快线', from: '先锋岛', to: '环保产业园', interval: '8分钟', firstBus: '06:00', lastBus: '21:30', stops: 18 },
  { id: 'K1', name: 'K1路快线', from: '盐城站', to: '城南新区', interval: '10分钟', firstBus: '06:30', lastBus: '21:00', stops: 12 },
  { id: '5', name: '5路公交', from: '市政府', to: '亭湖新区', interval: '12分钟', firstBus: '06:00', lastBus: '20:30', stops: 22 },
  { id: '22', name: '22路公交', from: '金融城', to: '开发区', interval: '15分钟', firstBus: '06:30', lastBus: '20:00', stops: 15 },
];

const transferPlans = [
  { from: '先锋岛', to: '城南新区', plan: '1号线 → 市政府站换乘2号线', duration: '约35分钟', cost: '3元', stops: 7 },
  { from: '盐城站', to: '金融城', plan: '1号线直达', duration: '约15分钟', cost: '2元', stops: 3 },
  { from: '市中医院', to: '环保产业园', plan: '2号线 → 市政府站换乘1号线', duration: '约45分钟', cost: '4元', stops: 9 },
];

const serviceDetails: Record<string, ServiceDetailConfig> = {
  subway: {
    id: 'subway',
    title: '地铁出行',
    icon: Train,
    color: 'from-blue-500 to-blue-700',
    description: '盐城地铁线路查询、换乘方案、实时运营信息',
    sections: [
      {
        title: '线路图',
        icon: MapPin,
        content: null,
      },
      {
        title: '换乘方案',
        icon: ArrowRight,
        content: null,
      },
      {
        title: '实时运营',
        icon: Clock,
        content: null,
      },
    ],
  },
  bus: {
    id: 'bus',
    title: '公交查询',
    icon: Bus,
    color: 'from-green-500 to-green-700',
    description: '盐城公交实时到站、线路查询',
    sections: [
      {
        title: '实时公交',
        icon: Clock,
        content: null,
      },
    ],
  },
  trafficfine: {
    id: 'trafficfine',
    title: '违章查询',
    icon: Car,
    color: 'from-yellow-500 to-yellow-700',
    description: '机动车违法记录查询与处理',
    sections: [
      {
        title: '查询入口',
        icon: Search,
        content: null,
      },
    ],
  },
  socialsec: {
    id: 'socialsec',
    title: '社保查询',
    icon: Users,
    color: 'from-teal-500 to-teal-700',
    description: '社保缴费明细、账户余额查询',
    sections: [
      {
        title: '社保信息',
        icon: FileText,
        content: null,
      },
    ],
  },
  housingfund: {
    id: 'housingfund',
    title: '公积金提取',
    icon: CreditCard,
    color: 'from-amber-500 to-amber-700',
    description: '公积金提取、贷款查询',
    sections: [
      {
        title: '公积金业务',
        icon: CreditCard,
        content: null,
      },
    ],
  },
};

function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  );
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transferFrom, setTransferFrom] = useState('先锋岛');
  const [transferTo, setTransferTo] = useState('城南新区');
  const [busSearch, setBusSearch] = useState('');
  const config = serviceDetails[id || 'subway'] || serviceDetails.subway;
  const Icon = config.icon;

  const renderSubwayContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          线路图
        </h3>
        <div className="space-y-4">
          {subwayLines.map((line) => (
            <div key={line.name} className={cn('rounded-xl border p-5', line.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60')}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn('px-3 py-1 rounded-lg text-white font-bold text-sm', line.color)}>
                  {line.name}
                </span>
                {line.active ? (
                  <span className="chip bg-green-100 text-green-700">运营中</span>
                ) : (
                  <span className="chip bg-gray-100 text-gray-500">规划中</span>
                )}
              </div>
              {line.active && (
                <div className="flex items-center gap-1 flex-wrap">
                  {line.stations.map((station, idx) => (
                    <div key={station} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-4 h-4 rounded-full border-2 border-white shadow', line.color)} />
                        <span className="text-xs text-gray-600 mt-1 whitespace-nowrap">{station}</span>
                      </div>
                      {idx < line.stations.length - 1 && (
                        <div className={cn('w-8 h-1 mx-1', line.color)} style={{ marginTop: '-12px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          换乘方案查询
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">出发站</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {subwayLines.filter(l => l.active).flatMap(l => l.stations).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 mt-5" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">到达站</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {subwayLines.filter(l => l.active).flatMap(l => l.stations).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {transferPlans.map((plan, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{plan.from}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-900">{plan.to}</span>
                </div>
                <span className="chip bg-blue-100 text-blue-700">方案 {idx + 1}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{plan.plan}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.duration}</span>
                <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{plan.cost}</span>
                <span>{plan.stops} 站</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          实时运营信息
        </h3>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-blue-800">全线正常运营</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-600 mb-1">首班车</p>
              <p className="font-bold text-gray-900">06:00</p>
            </div>
            <div>
              <p className="text-blue-600 mb-1">末班车</p>
              <p className="font-bold text-gray-900">22:30</p>
            </div>
            <div>
              <p className="text-blue-600 mb-1">发车间隔</p>
              <p className="font-bold text-gray-900">高峰5分钟 / 平峰8分钟</p>
            </div>
            <div>
              <p className="text-blue-600 mb-1">今日客流</p>
              <p className="font-bold text-gray-900">约 18.5 万人次</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          实时公交查询
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={busSearch}
            onChange={(e) => setBusSearch(e.target.value)}
            placeholder="输入线路号或站点名称..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button className="btn-primary !bg-gradient-to-r !from-green-500 !to-green-600">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {busRoutes.map((route) => (
            <div key={route.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">{route.id}</span>
                  <div>
                    <p className="font-bold text-gray-900">{route.name}</p>
                    <p className="text-xs text-gray-500">{route.from} → {route.to}</p>
                  </div>
                </div>
                <span className="chip bg-green-100 text-green-700">约{route.interval}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />首班 {route.firstBus}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />末班 {route.lastBus}</span>
                <span>{route.stops} 站</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 font-medium">下一班约3分钟后到站</span>
                </div>
                <button className="text-xs text-green-600 font-medium flex items-center gap-1 hover:text-green-700">
                  查看站点 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderServiceForm = (fields: { label: string; placeholder: string }[], resultItems: { label: string; value: string }[]) => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gov-600" />
          在线办理
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.label}>
                <label className="text-sm text-gray-700 font-medium mb-1.5 block">{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gov-400"
                />
              </div>
            ))}
            <button className="btn-primary w-full mt-2">
              查询
            </button>
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-gov-600" />
          办理指南
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {resultItems.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getDetailContent = () => {
    switch (id) {
      case 'subway':
        return renderSubwayContent();
      case 'bus':
        return renderBusContent();
      case 'trafficfine':
        return renderServiceForm(
          [
            { label: '车牌号', placeholder: '例如：苏J·XXXXX' },
            { label: '车架号后6位', placeholder: '请输入车架号后6位' },
            { label: '发动机号后6位', placeholder: '请输入发动机号后6位' },
          ],
          [
            { label: '违章查询', value: '实时查询违法记录' },
            { label: '罚款缴纳', value: '在线缴纳罚款' },
            { label: '处理时限', value: '15日内处理完毕' },
            { label: '服务时间', value: '全天24小时' },
          ],
        );
      case 'socialsec':
        return renderServiceForm(
          [
            { label: '身份证号', placeholder: '请输入18位身份证号' },
            { label: '社保卡号', placeholder: '请输入社保卡号' },
          ],
          [
            { label: '缴费明细', value: '查看历年缴费记录' },
            { label: '账户余额', value: '个人账户余额查询' },
            { label: '养老金认证', value: '人脸识别在线认证' },
            { label: '医保消费', value: '医保账户消费记录' },
          ],
        );
      case 'housingfund':
        return renderServiceForm(
          [
            { label: '身份证号', placeholder: '请输入18位身份证号' },
            { label: '公积金账号', placeholder: '请输入公积金账号' },
          ],
          [
            { label: '账户余额', value: '公积金账户余额查询' },
            { label: '提取办理', value: '在线申请提取' },
            { label: '贷款查询', value: '公积金贷款进度' },
            { label: '缴存明细', value: '月度缴存记录' },
          ],
        );
      default:
        return renderServiceForm(
          [
            { label: '身份证号', placeholder: '请输入18位身份证号' },
            { label: '手机号', placeholder: '请输入手机号' },
          ],
          [
            { label: '在线办理', value: '一键在线提交' },
            { label: '进度查询', value: '实时查看办理进度' },
            { label: '咨询热线', value: '12345' },
            { label: '服务时间', value: '周一至周五 9:00-17:30' },
          ],
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/services" className="hover:text-gov-600 transition-colors">服务大厅</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">{config.title}</span>
      </nav>

      <div className="flex items-center gap-4 mb-8">
        <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', config.color)}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-500">{config.description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {getDetailContent()}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">相关服务</h3>
            <div className="space-y-2">
              {[
                { label: '地铁出行', id: 'subway' },
                { label: '公交查询', id: 'bus' },
                { label: '违章查询', id: 'trafficfine' },
                { label: '社保查询', id: 'socialsec' },
                { label: '公积金提取', id: 'housingfund' },
              ].filter(s => s.id !== id).map((s) => (
                <Link
                  key={s.id}
                  to={`/services/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gov-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-gov-600 font-medium">{s.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gov-600" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-gov-500 to-gov-700 text-white border-0">
            <h3 className="font-serif text-lg font-bold mb-3">服务热线</h3>
            <a
              href="tel:12345"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <div>
                <p className="font-bold text-xl text-warm-300">12345</p>
                <p className="text-xs text-white/70">政务服务热线</p>
              </div>
            </a>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">办理提示</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                '办理业务请携带本人有效身份证件',
                '部分业务支持线上办理，无需到现场',
                '如需帮助请拨打12345政务服务热线',
                '老年用户可点击右下角SOS按钮紧急求助',
              ].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
