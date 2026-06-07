import { useState, useEffect } from 'react';
import { Bus, Train, Search, Clock, MapPin, AlertTriangle, ArrowRight, ArrowLeft, TrendingUp } from 'lucide-react';
import { api } from '@/utils/api';

interface BusArrival {
  route: string;
  station: string;
  arrivals: { minutes: number; station: string; bus_id: string; direction: string }[];
}

interface ApiBusRoute {
  route: string;
  from: string;
  to: string;
  directions: {
    direction: string;
    from: string;
    to: string;
    arrivals: { station: string; minutes: number }[];
  }[];
}

interface MetroStation {
  name: string;
  first_up: string;
  first_down: string;
  last_up: string;
  last_down: string;
}

interface MetroDelay {
  line: string;
  station: string;
  direction: string;
  delay_minutes: number;
  reason: string;
}

const busRoutes = [
  { id: 1, route: '1路', from: '南京站', to: '夫子庙', stations: 18 },
  { id: 2, route: '2路', from: '汉中门', to: '中山陵', stations: 22 },
  { id: 3, route: '3路', from: '雨花台', to: '玄武湖', stations: 15 },
  { id: 4, route: '5路', from: '火车站', to: '江宁大学城', stations: 28 },
  { id: 5, route: '16路', from: '南京南站', to: '仙林大学城', stations: 25 },
];

const metroLines = [
  { id: 1, name: '1号线', color: '#1A73E8', from: '迈皋桥', to: '中国药科大学', stations: [
    { name: '迈皋桥', first_up: '05:42', first_down: '---', last_up: '23:19', last_down: '---' },
    { name: '红山动物园', first_up: '05:44', first_down: '06:59', last_up: '23:21', last_down: '23:49' },
    { name: '南京站', first_up: '05:47', first_down: '06:56', last_up: '23:24', last_down: '23:46' },
    { name: '玄武门', first_up: '05:51', first_down: '06:52', last_up: '23:28', last_down: '23:42' },
    { name: '鼓楼', first_up: '05:53', first_down: '06:50', last_up: '23:30', last_down: '23:40' },
    { name: '珠江路', first_up: '05:55', first_down: '06:48', last_up: '23:32', last_down: '23:38' },
    { name: '新街口', first_up: '05:57', first_down: '06:46', last_up: '23:34', last_down: '23:36' },
    { name: '张府园', first_up: '05:59', first_down: '06:44', last_up: '23:36', last_down: '23:34' },
    { name: '三山街', first_up: '06:01', first_down: '06:42', last_up: '23:38', last_down: '23:32' },
    { name: '中华门', first_up: '06:04', first_down: '06:39', last_up: '23:41', last_down: '23:29' },
    { name: '安德门', first_up: '06:07', first_down: '06:35', last_up: '23:44', last_down: '23:25' },
    { name: '天隆寺', first_up: '06:10', first_down: '06:32', last_up: '23:47', last_down: '23:22' },
    { name: '软件大道', first_up: '06:12', first_down: '06:30', last_up: '23:49', last_down: '23:20' },
    { name: '花神庙', first_up: '06:14', first_down: '06:28', last_up: '23:51', last_down: '23:18' },
    { name: '南京南站', first_up: '06:17', first_down: '06:24', last_up: '23:54', last_down: '23:14' },
  ]},
  { id: 2, name: '2号线', color: '#E91E63', from: '经天路', to: '油坊桥', stations: [
    { name: '经天路', first_up: '06:00', first_down: '---', last_up: '23:00', last_down: '---' },
    { name: '仙林中心', first_up: '06:03', first_down: '07:02', last_up: '23:03', last_down: '23:52' },
    { name: '马群', first_up: '06:12', first_down: '06:53', last_up: '23:12', last_down: '23:43' },
    { name: '孝陵卫', first_up: '06:17', first_down: '06:48', last_up: '23:17', last_down: '23:38' },
    { name: '明故宫', first_up: '06:23', first_down: '06:42', last_up: '23:23', last_down: '23:32' },
    { name: '新街口', first_up: '06:28', first_down: '06:37', last_up: '23:28', last_down: '23:27' },
    { name: '上海路', first_up: '06:31', first_down: '06:34', last_up: '23:31', last_down: '23:24' },
    { name: '汉中门', first_up: '06:34', first_down: '06:31', last_up: '23:34', last_down: '23:21' },
    { name: '莫愁湖', first_up: '06:37', first_down: '06:28', last_up: '23:37', last_down: '23:18' },
    { name: '奥体东', first_up: '06:47', first_down: '06:18', last_up: '23:47', last_down: '23:08' },
    { name: '元通', first_up: '06:50', first_down: '06:15', last_up: '23:50', last_down: '23:05' },
    { name: '油坊桥', first_up: '---', first_down: '06:00', last_up: '---', last_down: '23:00' },
  ]},
  { id: 3, name: '3号线', color: '#00897B', from: '林场', to: '秣周东路', stations: [
    { name: '林场', first_up: '05:50', first_down: '---', last_up: '23:00', last_down: '---' },
    { name: '星火路', first_up: '05:53', first_down: '06:56', last_up: '23:03', last_down: '23:46' },
    { name: '泰冯路', first_up: '05:58', first_down: '06:51', last_up: '23:08', last_down: '23:41' },
    { name: '天润城', first_up: '06:02', first_down: '06:47', last_up: '23:12', last_down: '23:37' },
    { name: '柳洲东路', first_up: '06:05', first_down: '06:44', last_up: '23:15', last_down: '23:34' },
    { name: '南京站', first_up: '06:14', first_down: '06:35', last_up: '23:24', last_down: '23:25' },
    { name: '鸡鸣寺', first_up: '06:22', first_down: '06:27', last_up: '23:32', last_down: '23:17' },
    { name: '大行宫', first_up: '06:25', first_down: '06:24', last_up: '23:35', last_down: '23:14' },
    { name: '夫子庙', first_up: '06:29', first_down: '06:20', last_up: '23:39', last_down: '23:10' },
    { name: '南京南站', first_up: '06:38', first_down: '06:11', last_up: '23:48', last_down: '23:01' },
    { name: '九龙湖', first_up: '06:48', first_down: '06:00', last_up: '23:58', last_down: '22:50' },
    { name: '秣周东路', first_up: '---', first_down: '06:00', last_up: '---', last_down: '22:50' },
  ]},
];

const mockDelays: MetroDelay[] = [
  { line: '1号线', station: '新街口', direction: '往中国药科大学', delay_minutes: 3, reason: '客流较大' },
];

const busAlerts = [
  { route: '1路', station: '夫子庙', direction: '往夫子庙', delay_minutes: 2, reason: '中华路路口施工，公交专用道临时调整' },
  { route: '2路', station: '中山陵', direction: '往中山陵', delay_minutes: 4, reason: '景区客流集中，终点站排队进站' },
];

const mockRealTimeMetro = [
  { station: '新街口', direction: '往迈皋桥', next: '3分钟', next2: '7分钟', next3: '11分钟' },
  { station: '新街口', direction: '往中国药科大学', next: '5分钟', next2: '9分钟', next3: '14分钟' },
];

export default function Transport() {
  const [tab, setTab] = useState<'bus' | 'metro'>('bus');
  const [busSearch, setBusSearch] = useState('');
  const [selectedMetro, setSelectedMetro] = useState(1);
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null);
  const [busData, setBusData] = useState<BusArrival | null>(null);
  const [loading, setLoading] = useState(false);
  const [metroDirection, setMetroDirection] = useState<'up' | 'down'>('up');

  const filteredRoutes = busRoutes.filter(
    (r) =>
      r.route.includes(busSearch) ||
      r.from.includes(busSearch) ||
      r.to.includes(busSearch),
  );

  const currentLine = metroLines.find((l) => l.id === selectedMetro)!;

  const searchBusArrival = async (route: string) => {
    const keyword = route.trim();
    if (!keyword) {
      setBusData(null);
      return;
    }

    setLoading(true);
    try {
      const routeMatch = busRoutes.find((item) => item.route === keyword);
      const params = new URLSearchParams(routeMatch ? { route: keyword, direction: `往${routeMatch.to}` } : { station: keyword });
      const data = await api.get<ApiBusRoute[]>(`/transport/bus?${params.toString()}`);
      const selectedRoute = routeMatch
        ? data.find((item) => item.route === keyword)
        : data.find((item) => item.directions.some((direction) => direction.arrivals.length > 0));

      if (!selectedRoute) {
        setBusData(null);
        return;
      }

      const arrivals = selectedRoute.directions.flatMap((direction) =>
        direction.arrivals.map((arrival) => ({
          ...arrival,
          direction: direction.direction,
          bus_id: `${selectedRoute.route}-${direction.direction}-${arrival.station}`,
        })),
      );

      setBusData({
        route: selectedRoute.route,
        station: routeMatch ? '全线站点' : keyword,
        arrivals,
      });
    } catch (e) {
      setBusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (busSearch) {
      searchBusArrival(busSearch);
    }
  }, [busSearch]);

  const directionLabel = metroDirection === 'up' ? `${currentLine.to}方向` : `${currentLine.from}方向`;
  const directionIcon = metroDirection === 'up' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />;

  const getRealTimeData = (stationName: string) => {
    return mockRealTimeMetro.find((m) => m.station === stationName && m.direction.includes(metroDirection === 'up' ? currentLine.to : currentLine.from));
  };

  const getDelayData = (lineName: string) => {
    return mockDelays.filter((d) => d.line === lineName);
  };

  const metroDelays = getDelayData(currentLine.name);
  const activeBusAlerts = busData ? busAlerts.filter((alert) => alert.route === busData.route) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <Bus className="w-6 h-6 text-primary" />
        交通出行
      </h1>

      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setTab('bus')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'bus' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          <Bus className="w-4 h-4" />
          公交
        </button>
        <button
          onClick={() => setTab('metro')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'metro' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          <Train className="w-4 h-4" />
          地铁
        </button>
      </div>

      {tab === 'bus' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              value={busSearch}
              onChange={(e) => setBusSearch(e.target.value)}
              placeholder="搜索线路或站点，例如 1路、新街口"
              className="w-full h-11 pl-10 pr-4 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <h2 className="font-semibold text-warm-800 mb-3">公交线路</h2>
            <div className="grid gap-3">
              {filteredRoutes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => searchBusArrival(r.route)}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
                >
                  <div className="w-14 h-10 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">
                    {r.route}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warm-800">
                      {r.from} → {r.to}
                    </p>
                    <p className="text-xs text-warm-500">{r.stations}站 · 约{r.stations * 3}分钟</p>
                  </div>
                  <Clock className="w-4 h-4 text-warm-400" />
                </button>
              ))}
            </div>
          </div>

          {busData && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-warm-800 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary" />
                    {busData.route} 实时到站信息
                  </h2>
                  <span className="text-xs text-warm-500 bg-warm-100 px-2 py-1 rounded">
                    {busData.station}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="text-warm-500">运行方向：</span>
                      <span className="font-medium text-warm-800">
                        {busRoutes.find(r => r.route === busData.route)?.from || '起点站'} 
                        → 
                        {busRoutes.find(r => r.route === busData.route)?.to || '终点站'}
                      </span>
                    </div>
                  </div>
                </div>

                {activeBusAlerts.length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          公交运行异常提示
                        </p>
                        {activeBusAlerts.map((d, i) => (
                          <div key={i} className="text-sm text-amber-700 mt-2 p-2 bg-amber-100/50 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{d.route} {d.direction}</span>
                              <span className="text-amber-600 font-semibold">+{d.delay_minutes}分钟</span>
                            </div>
                            <p className="text-xs mt-1 text-amber-600">{d.reason}</p>
                            <p className="text-xs mt-1">影响站点：{d.station}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs text-warm-500 font-medium px-2 pb-2 border-b border-warm-100">
                    <div>线路 / 方向</div>
                    <div>下一站</div>
                    <div className="text-right">预计到站</div>
                  </div>
                  {busData.arrivals.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-3 rounded-lg hover:bg-warm-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium bg-primary text-white px-2.5 py-1 rounded">
                          {busData.route}
                        </span>
                        <div>
                          <span className="text-sm text-warm-700 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {a.direction}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-warm-600 flex-1 text-center">
                        {a.station}
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className={`text-lg font-bold ${
                          a.minutes <= 3 ? 'text-green-600' : a.minutes <= 8 ? 'text-accent' : 'text-warm-600'
                        }`}>
                          {a.minutes === 0 ? '即将进站' : `${a.minutes}分钟`}
                        </div>
                        <div className="text-[10px] text-warm-400">
                          {a.minutes <= 3 ? '准点' : a.minutes <= 8 ? '正常' : '可能延误'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5">
                <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  {busData.route} 线路信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <span className="text-warm-500 text-xs block mb-1">起点站</span>
                    <span className="font-medium text-warm-800">
                      {busRoutes.find(r => r.route === busData.route)?.from || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <span className="text-warm-500 text-xs block mb-1">终点站</span>
                    <span className="font-medium text-warm-800">
                      {busRoutes.find(r => r.route === busData.route)?.to || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <span className="text-warm-500 text-xs block mb-1">站点数</span>
                    <span className="font-medium text-warm-800">
                      {busRoutes.find(r => r.route === busData.route)?.stations || '-'}站
                    </span>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <span className="text-warm-500 text-xs block mb-1">全程时间</span>
                    <span className="font-medium text-warm-800">
                      约{(busRoutes.find(r => r.route === busData.route)?.stations || 0) * 3}分钟
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-warm-500">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              查询中...
            </div>
          )}
        </div>
      )}

      {tab === 'metro' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {metroLines.map((line) => (
              <button
                key={line.id}
                onClick={() => { setSelectedMetro(line.id); setSelectedStation(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedMetro === line.id
                    ? 'text-white shadow-md'
                    : 'bg-white text-warm-600 hover:bg-warm-100'
                }`}
                style={selectedMetro === line.id ? { backgroundColor: line.color } : undefined}
              >
                {line.name}
                <span className="ml-2 opacity-80">{line.from} ↔ {line.to}</span>
              </button>
            ))}
          </div>

          {metroDelays.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    地铁异常延误通知
                  </p>
                  {metroDelays.map((d, i) => (
                    <p key={i} className="text-sm text-red-700 mt-1">
                      {d.line} {d.station} {d.direction} 延误约{d.delay_minutes}分钟（{d.reason}）
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <span className="text-sm text-warm-600">运行方向：</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMetroDirection('up')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  metroDirection === 'up' ? 'bg-primary text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
                style={metroDirection === 'up' ? { backgroundColor: currentLine.color } : undefined}
              >
                <ArrowRight className="w-4 h-4" />
                {currentLine.to}方向
              </button>
              <button
                onClick={() => setMetroDirection('down')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  metroDirection === 'down' ? 'bg-primary text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
                style={metroDirection === 'down' ? { backgroundColor: currentLine.color } : undefined}
              >
                <ArrowLeft className="w-4 h-4" />
                {currentLine.from}方向
              </button>
            </div>
          </div>

          {selectedStation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-sm text-primary hover:underline"
                >
                  ← 返回线路图
                </button>
                <h2 className="font-semibold text-warm-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: currentLine.color }} />
                  {selectedStation.name}站
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-5">
                  <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    首末班车时间
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-warm-600">{directionIcon} {directionLabel}</span>
                      <div className="flex gap-4 text-sm">
                        <span>首班 <span className="font-semibold text-warm-800">
                          {metroDirection === 'up' ? selectedStation.first_up : selectedStation.first_down}
                        </span></span>
                        <span>末班 <span className="font-semibold text-warm-800">
                          {metroDirection === 'up' ? selectedStation.last_up : selectedStation.last_down}
                        </span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-5">
                  <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    实时到站
                  </h3>
                  {(() => {
                    const rt = getRealTimeData(selectedStation.name);
                    if (!rt) {
                      return <p className="text-sm text-warm-500">暂无实时数据</p>;
                    }
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-600">下一班</span>
                          <span className="text-2xl font-bold text-green-600">{rt.next}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-600">第二班</span>
                          <span className="text-lg font-semibold text-accent">{rt.next2}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-600">第三班</span>
                          <span className="text-md text-warm-600">{rt.next3}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5">
                <h3 className="font-semibold text-warm-800 mb-4">换乘信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedStation.name === '新街口' && (
                    <>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[0].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[0].color }}>1号线</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[1].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[1].color }}>2号线</div>
                      </div>
                    </>
                  )}
                  {selectedStation.name === '南京站' && (
                    <>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[0].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[0].color }}>1号线</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[2].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[2].color }}>3号线</div>
                      </div>
                    </>
                  )}
                  {selectedStation.name === '南京南站' && (
                    <>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[0].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[0].color }}>1号线</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${metroLines[2].color}15` }}>
                        <div className="text-sm font-semibold" style={{ color: metroLines[2].color }}>3号线</div>
                      </div>
                      <div className="p-3 rounded-lg text-center bg-warm-100">
                        <div className="text-sm font-semibold text-warm-700">S1机场线</div>
                      </div>
                      <div className="p-3 rounded-lg text-center bg-warm-100">
                        <div className="text-sm font-semibold text-warm-700">S3宁和线</div>
                      </div>
                    </>
                  )}
                  {!['新街口', '南京站', '南京南站'].includes(selectedStation.name) && (
                    <p className="text-sm text-warm-500 col-span-full text-center">该站暂无换乘线路</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm p-5">
                <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: currentLine.color }} />
                  {currentLine.name}线路站点
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {currentLine.stations.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedStation(st)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-warm-50 text-sm text-warm-700 text-left transition-colors hover:border-primary border border-transparent"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: currentLine.color }}
                      />
                      <span className="flex-1">{st.name}</span>
                      {['新街口', '南京站', '南京南站', '元通'].includes(st.name) && (
                        <span className="text-[10px] bg-warm-100 text-warm-600 px-1.5 py-0.5 rounded">换乘</span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-warm-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5">
                <h2 className="font-semibold text-warm-800 mb-3">主要站点首末班车</h2>
                <div className="divide-y divide-warm-100">
                  {['新街口', '南京站', '南京南站'].map((stName) => {
                    const st = currentLine.stations.find((s) => s.name === stName);
                    if (!st) return null;
                    return (
                      <div key={stName} className="flex items-center justify-between py-3">
                        <span className="text-sm font-medium text-warm-800">{stName}</span>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="text-warm-500">往{currentLine.to}</div>
                          <div className="text-warm-800 font-medium">{st.first_up} / {st.last_up}</div>
                          <div className="text-warm-500">往{currentLine.from}</div>
                          <div className="text-warm-800 font-medium">{st.first_down} / {st.last_down}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
