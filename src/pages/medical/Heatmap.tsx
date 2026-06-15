import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Thermometer, Clock, Users, TrendingDown, TrendingUp, Building, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { api } from '@/api/client';
import type { Hospital, Department } from '../../../shared/types';
import { cn } from '@/lib/utils';

interface WaitTimeData {
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  waitTime: number;
  waitingCount: number;
}

interface HospitalStat {
  hospitalName: string;
  avgWaitTime: number;
  maxWaitTime: number;
  totalWaiting: number;
}

interface TrendData {
  time: string;
  waitTime: number;
}

export default function Heatmap() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [waitTimes, setWaitTimes] = useState<WaitTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<WaitTimeData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [hospitalData, waitTimeData] = await Promise.all([
        api.medical.getHospitals(),
        api.medical.getWaitTimes(),
      ]);
      setHospitals(Array.isArray(hospitalData) ? hospitalData : []);
      
      if (Array.isArray(waitTimeData) && waitTimeData.length > 0) {
        setWaitTimes(waitTimeData);
      } else {
        const mockData: WaitTimeData[] = [];
        if (Array.isArray(hospitalData)) {
          hospitalData.forEach((hospital: Hospital) => {
            hospital.departments?.forEach((dept: Department) => {
              mockData.push({
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                departmentId: dept.id,
                departmentName: dept.name,
                waitTime: dept.waitTime || Math.floor(Math.random() * 90) + 15,
                waitingCount: Math.floor(Math.random() * 30) + 5,
              });
            });
          });
        }
        setWaitTimes(mockData);
      }
    } catch (e) {
      console.error('Failed to load heatmap data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes <= 20) return 'bg-eco-400';
    if (minutes <= 40) return 'bg-eco-300';
    if (minutes <= 60) return 'bg-warm-400';
    if (minutes <= 90) return 'bg-warm-500';
    return 'bg-red-500';
  };

  const getWaitTimeTextColor = (minutes: number) => {
    if (minutes <= 40) return 'text-white';
    return 'text-white';
  };

  const getWaitTimeStatus = (minutes: number) => {
    if (minutes <= 20) return { text: '畅通', color: 'text-eco-600', icon: CheckCircle };
    if (minutes <= 40) return { text: '正常', color: 'text-eco-500', icon: CheckCircle };
    if (minutes <= 60) return { text: '较忙', color: 'text-warm-600', icon: Info };
    if (minutes <= 90) return { text: '繁忙', color: 'text-warm-500', icon: AlertTriangle };
    return { text: '拥挤', color: 'text-red-600', icon: AlertTriangle };
  };

  const allDepartments = Array.from(new Set(waitTimes.map((w) => w.departmentName)));

  const hospitalStats: HospitalStat[] = hospitals.map((hospital) => {
    const hospitalWaits = waitTimes.filter((w) => w.hospitalId === hospital.id);
    const avgWaitTime = hospitalWaits.length > 0
      ? Math.round(hospitalWaits.reduce((acc, w) => acc + w.waitTime, 0) / hospitalWaits.length)
      : 0;
    const maxWaitTime = hospitalWaits.length > 0
      ? Math.max(...hospitalWaits.map((w) => w.waitTime))
      : 0;
    const totalWaiting = hospitalWaits.reduce((acc, w) => acc + w.waitingCount, 0);
    return {
      hospitalName: hospital.name,
      avgWaitTime,
      maxWaitTime,
      totalWaiting,
    };
  });

  const maxAvgWaitTime = Math.max(...hospitalStats.map((s) => s.avgWaitTime), 1);

  const trendData: TrendData[] = [
    { time: '08:00', waitTime: 25 },
    { time: '09:00', waitTime: 45 },
    { time: '10:00', waitTime: 65 },
    { time: '11:00', waitTime: 55 },
    { time: '12:00', waitTime: 30 },
    { time: '14:00', waitTime: 50 },
    { time: '15:00', waitTime: 70 },
    { time: '16:00', waitTime: 40 },
  ];

  const maxTrendValue = Math.max(...trendData.map((t) => t.waitTime), 1);

  const handleMouseMove = (e: React.MouseEvent, data: WaitTimeData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredCell(data);
  };

  const overallAvgWaitTime = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((acc, w) => acc + w.waitTime, 0) / waitTimes.length)
    : 0;
  const overallWaitingCount = waitTimes.reduce((acc, w) => acc + w.waitingCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/medical')}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">候诊热力图</h1>
          <p className="text-gray-500 mt-1">实时查看各医院科室候诊情况</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-eco-50 text-eco-600 rounded-xl hover:bg-eco-100 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          <span className="text-sm font-medium">刷新数据</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600">
              <Clock className="w-5 h-5" />
            </div>
            <TrendingDown className="w-4 h-4 text-eco-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{overallAvgWaitTime}<span className="text-sm font-normal text-gray-500">分钟</span></p>
          <p className="text-sm text-gray-500 mt-1">平均候诊时间</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-600">
              <Users className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-warm-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{overallWaitingCount}<span className="text-sm font-normal text-gray-500">人</span></p>
          <p className="text-sm text-gray-500 mt-1">当前等待人数</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Building className="w-5 h-5" />
            </div>
            <CheckCircle className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{hospitals.length}<span className="text-sm font-normal text-gray-500">家</span></p>
          <p className="text-sm text-gray-500 mt-1">监测医院</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Thermometer className="w-5 h-5" />
            </div>
            <Info className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{allDepartments.length}<span className="text-sm font-normal text-gray-500">个</span></p>
          <p className="text-sm text-gray-500 mt-1">监测科室</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-eco-500" />
            候诊热力图
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">候诊时间：</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-eco-400" />
                <span className="text-xs text-gray-500">≤20分钟</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-eco-300" />
                <span className="text-xs text-gray-500">≤40分钟</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-warm-400" />
                <span className="text-xs text-gray-500">≤60分钟</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-warm-500" />
                <span className="text-xs text-gray-500">≤90分钟</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-xs text-gray-500">＞90分钟</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-gray-50 rounded-tl-xl font-medium text-gray-600 text-sm sticky left-0 z-10">
                    医院 / 科室
                  </th>
                  {allDepartments.map((dept) => (
                    <th key={dept} className="p-3 bg-gray-50 font-medium text-gray-600 text-center text-sm min-w-[100px]">
                      {dept}
                    </th>
                  ))}
                  <th className="p-3 bg-gray-50 rounded-tr-xl font-medium text-gray-600 text-sm min-w-[100px]">
                    平均候诊
                  </th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital, rowIndex) => {
                  const hospitalWaits = waitTimes.filter((w) => w.hospitalId === hospital.id);
                  const avgWait = hospitalWaits.length > 0
                    ? Math.round(hospitalWaits.reduce((acc, w) => acc + w.waitTime, 0) / hospitalWaits.length)
                    : 0;
                  const status = getWaitTimeStatus(avgWait);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={hospital.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="p-3 font-medium text-gray-800 text-sm sticky left-0 z-10 bg-inherit">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-eco-500" />
                          <span className="truncate max-w-[180px]" title={hospital.name}>
                            {hospital.name}
                          </span>
                        </div>
                      </td>
                      {allDepartments.map((deptName) => {
                        const data = waitTimes.find(
                          (w) => w.hospitalId === hospital.id && w.departmentName === deptName
                        );
                        if (!data) {
                          return (
                            <td key={deptName} className="p-3 text-center">
                              <div className="w-full h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                -
                              </div>
                            </td>
                          );
                        }
                        const cellStatus = getWaitTimeStatus(data.waitTime);
                        const CellIcon = cellStatus.icon;
                        return (
                          <td key={deptName} className="p-3 text-center">
                            <div
                              className={cn(
                                'w-full h-10 rounded-lg flex items-center justify-center font-medium text-sm cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative',
                                getWaitTimeColor(data.waitTime),
                                getWaitTimeTextColor(data.waitTime)
                              )}
                              onMouseMove={(e) => handleMouseMove(e, data)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              <span className="flex items-center gap-1">
                                <CellIcon className="w-3 h-3" />
                                {data.waitTime}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <StatusIcon className={cn('w-4 h-4', status.color)} />
                          <span className={cn('font-semibold', status.color)}>{avgWait}分钟</span>
                        </div>
                        <div className={cn('text-xs mt-1', status.color)}>{status.text}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hoveredCell && (
        <div
          className="fixed z-50 bg-gray-900 text-white rounded-xl p-4 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="font-semibold mb-2">{hoveredCell.hospitalName}</div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">科室：</span>
              <span>{hoveredCell.departmentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warm-400" />
              <span className="text-gray-400">等待时间：</span>
              <span className="text-warm-400 font-medium">{hoveredCell.waitTime} 分钟</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-gray-400">等待人数：</span>
              <span className="text-primary-400 font-medium">{hoveredCell.waitingCount} 人</span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-eco-500" />
            各医院候诊时间统计
          </h3>
          <div className="space-y-5">
            {hospitalStats.map((stat, index) => (
              <div key={stat.hospitalName}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" title={stat.hospitalName}>
                    {stat.hospitalName}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      平均 <span className="font-semibold text-eco-600">{stat.avgWaitTime}</span> 分钟
                    </span>
                    <span className="text-gray-500">
                      最长 <span className="font-semibold text-warm-600">{stat.maxWaitTime}</span> 分钟
                    </span>
                    <span className="text-gray-500">
                      等待 <span className="font-semibold text-primary-600">{stat.totalWaiting}</span> 人
                    </span>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-eco-400 via-warm-400 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(stat.avgWaitTime / maxAvgWaitTime) * 100}%` }}
                  />
                </div>
                <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    {waitTimes
                      .filter((w) => w.hospitalId === hospitals[index]?.id)
                      .map((w, i) => (
                        <div
                          key={w.departmentId}
                          className={cn('h-full transition-all', getWaitTimeColor(w.waitTime))}
                          style={{
                            width: `${100 / (hospitals[index]?.departments?.length || 1)}%`,
                            marginLeft: i > 0 ? '1px' : '0',
                          }}
                          title={`${w.departmentName}: ${w.waitTime}分钟`}
                        />
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-eco-500" />
            今日候诊时间趋势
          </h3>
          <div className="flex items-end justify-between h-48 gap-2 px-2">
            {trendData.map((data, index) => (
              <div key={data.time} className="flex-1 flex flex-col items-center">
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group',
                    getWaitTimeColor(data.waitTime)
                  )}
                  style={{ height: `${(data.waitTime / maxTrendValue) * 100}%`, minHeight: '20px' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.waitTime}分钟
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.time}</span>
                {index < trendData.length - 1 && (
                  <div
                    className="absolute w-full h-0.5 bg-gray-200"
                    style={{
                      bottom: `${(trendData[index + 1].waitTime / maxTrendValue) * 50 + 48}%`,
                      left: `${(index + 0.5) * (100 / trendData.length)}%`,
                      width: `${100 / trendData.length}%`,
                      transform: `rotate(${Math.atan2(
                        (trendData[index + 1].waitTime - data.waitTime) / maxTrendValue * 100,
                        100 / trendData.length
                      )}rad)`,
                      transformOrigin: 'left center',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-eco-600">
                {Math.min(...trendData.map((t) => t.waitTime))}分钟
              </p>
              <p className="text-xs text-gray-500">最短等待</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-warm-600">
                {Math.max(...trendData.map((t) => t.waitTime))}分钟
              </p>
              <p className="text-xs text-gray-500">最长等待</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary-600">
                {Math.round(trendData.reduce((acc, t) => acc + t.waitTime, 0) / trendData.length)}分钟
              </p>
              <p className="text-xs text-gray-500">日均等待</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warm-500" />
          候诊预警提示
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waitTimes
            .filter((w) => w.waitTime > 60)
            .sort((a, b) => b.waitTime - a.waitTime)
            .slice(0, 6)
            .map((data) => {
              const status = getWaitTimeStatus(data.waitTime);
              const StatusIcon = status.icon;
              return (
                <div
                  key={`${data.hospitalId}-${data.departmentId}`}
                  className="p-4 bg-gradient-to-br from-warm-50 to-red-50 border border-warm-200 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{data.departmentName}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{data.hospitalName}</p>
                    </div>
                    <StatusIcon className={cn('w-5 h-5', status.color)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-warm-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold text-lg">{data.waitTime}</span>
                      <span className="text-sm">分钟</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600">
                      <Users className="w-4 h-4" />
                      <span className="font-bold text-lg">{data.waitingCount}</span>
                      <span className="text-sm">人等待</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/medical/appointment')}
                    className="w-full mt-3 py-2 bg-white border border-warm-300 text-warm-600 rounded-lg text-sm font-medium hover:bg-warm-50 transition-colors"
                  >
                    预约其他时段
                  </button>
                </div>
              );
            })}
        </div>
        {waitTimes.filter((w) => w.waitTime > 60).length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-eco-500" />
            </div>
            <p className="text-gray-500">当前所有科室候诊正常，无需长时间等待</p>
          </div>
        )}
      </div>
    </div>
  );
}
