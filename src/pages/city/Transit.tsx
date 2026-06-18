import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bus, Train, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import type { BusArrival, MetroLine } from '../../../shared/types';

export default function Transit() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'bus' | 'metro'>('bus');
  const [station, setStation] = useState('莲坂站');

  const { data: busArrivals, isLoading, refetch } = useGet<BusArrival[]>(
    ['busArrivals', station],
    `/city/bus?station=${encodeURIComponent(station)}`,
    { refetchInterval: 10000 }
  );

  const { data: metroLines } = useGet<MetroLine[]>(
    ['metroLines'],
    '/city/metro'
  );

  const popularStations = ['莲坂站', '火车站', '会展中心站', '第一码头站', 'SM城市广场站', '集美学村站'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('bus')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            tab === 'bus'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Bus className="w-5 h-5" />
          公交实时
        </button>
        <button
          onClick={() => setTab('metro')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            tab === 'metro'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Train className="w-5 h-5" />
          地铁线路
        </button>
      </div>

      {tab === 'bus' && (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="输入公交站点名称..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {popularStations.map((s) => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  station === s
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                {s}
              </button>
            ))}
          </div>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">{station} - 实时到站信息</h3>
                </div>
                <span className="text-xs text-gray-500">每10秒自动刷新</span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : busArrivals?.length ? (
                <div className="divide-y divide-gray-100">
                  {busArrivals.map((bus, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">
                            {bus.lineName}
                          </span>
                          <span className="text-sm text-gray-600">{bus.direction}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {bus.nextBus.eta <= 3 ? (
                            <StatusBadge status="success" text="即将到站" />
                          ) : bus.nextBus.eta <= 10 ? (
                            <StatusBadge status="warning" text="正在驶来" />
                          ) : (
                            <StatusBadge status="info" text="行驶中" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-2xl font-bold text-primary">{bus.nextBus.eta}</span>
                          <span className="text-gray-500">分钟</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">距离</span>
                          <span className="font-medium text-gray-700">{bus.nextBus.distance} 米</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">车牌</span>
                          <span className="font-mono text-gray-700">{bus.nextBus.plateNo}</span>
                        </div>
                      </div>
                      {bus.followingBuses && bus.followingBuses.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">后续车辆：</p>
                          <div className="flex gap-4">
                            {bus.followingBuses.map((fb, i) => (
                              <span key={i} className="text-xs text-gray-600">
                                {fb.eta}分钟 ({fb.plateNo})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Bus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">暂无到站信息</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {tab === 'metro' && (
        <div className="space-y-4">
          {metroLines?.map((line, idx) => (
            <Card key={line.id}>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: line.color }}
                  >
                    {line.name.replace(/[^0-9]/g, '')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{line.name}</h3>
                    <p className="text-xs text-gray-500">
                      首班 {line.firstTrain} · 末班 {line.lastTrain} · 共 {line.stations.length} 站
                    </p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {line.stations.map((station, sIdx) => (
                    <div key={station.id} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            station.transferLines.length > 0 ? 'border-gray-800' : 'border-gray-400'
                          }`}
                          style={{ backgroundColor: station.transferLines.length > 0 ? 'white' : line.color }}
                        />
                        <span className="text-xs text-gray-500 mt-1 whitespace-nowrap max-w-16 truncate">
                          {station.name}
                        </span>
                      </div>
                      {sIdx < line.stations.length - 1 && (
                        <div
                          className="w-8 h-0.5 flex-shrink-0"
                          style={{ backgroundColor: line.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
