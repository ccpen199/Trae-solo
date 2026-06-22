import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Building2,
  Layers,
  ChevronUp,
  ChevronDown,
  Star,
  Clock,
  Shield,
  ArrowRight,
  Filter,
  Locate,
  Route,
  Info,
  Heart,
  Phone,
} from 'lucide-react';
import { navigationApi } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import type { Hospital } from '@shared/types';

interface FloorInfo {
  id: number;
  name: string;
  departments: string[];
}

interface PathPoint {
  x: number;
  y: number;
}

const floors: FloorInfo[] = [
  { id: 1, name: '1F 门诊大厅', departments: ['挂号处', '药房', '收费处', '导诊台'] },
  { id: 2, name: '2F 内科门诊', departments: ['心内科', '呼吸科', '消化科', '内分泌科'] },
  { id: 3, name: '3F 外科门诊', departments: ['普外科', '骨科', '神经外科', '泌尿外科'] },
  { id: 4, name: '4F 医技科室', departments: ['检验科', '影像科', '超声科', '心电图室'] },
  { id: 5, name: '5F 住院部', departments: ['内科病房', '外科病房', 'ICU'] },
];

const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: '江苏省人民医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '南京市鼓楼区广州路300号',
    isInsurancePoint: true,
    longitude: 118.767413,
    latitude: 32.041544,
    departments: [],
    distance: 0.8,
    insurancePolicy: {
      reimbursementRate: 85,
      deductible: 1000,
      maxReimbursement: 200000,
    },
  },
  {
    id: '2',
    name: '南京医科大学第一附属医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '南京市鼓楼区广州路300号',
    isInsurancePoint: true,
    longitude: 118.77,
    latitude: 32.045,
    departments: [],
    distance: 1.2,
    insurancePolicy: {
      reimbursementRate: 85,
      deductible: 1000,
      maxReimbursement: 200000,
    },
  },
  {
    id: '3',
    name: '江苏省中医院',
    level: '三级甲等',
    area: '南京市秦淮区',
    address: '南京市秦淮区汉中路155号',
    isInsurancePoint: true,
    longitude: 118.775,
    latitude: 32.038,
    departments: [],
    distance: 1.5,
    insurancePolicy: {
      reimbursementRate: 80,
      deductible: 800,
      maxReimbursement: 180000,
    },
  },
  {
    id: '4',
    name: '南京鼓楼医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '南京市鼓楼区中山路321号',
    isInsurancePoint: true,
    longitude: 118.78,
    latitude: 32.05,
    departments: [],
    distance: 2.1,
    insurancePolicy: {
      reimbursementRate: 85,
      deductible: 1000,
      maxReimbursement: 200000,
    },
  },
];

function NavigationPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [showIndoorMap, setShowIndoorMap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [filterInsurance, setFilterInsurance] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setHospitals(mockHospitals);
      } catch (error) {
        console.error('Failed to fetch navigation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredHospitals = hospitals.filter((h) => {
    if (filterInsurance && !h.isInsurancePoint) return false;
    if (searchKeyword && !h.name.includes(searchKeyword) && !h.address.includes(searchKeyword)) return false;
    return true;
  });

  const getHospitalPosition = (hospital: Hospital) => {
    const baseX = 100;
    const baseY = 80;
    const scale = 120;
    const x = baseX + (hospital.longitude - 118.76) * scale;
    const y = baseY + (32.06 - hospital.latitude) * scale;
    return { x, y };
  };

  const indoorPath: PathPoint[] = [
    { x: 120, y: 200 },
    { x: 200, y: 200 },
    { x: 200, y: 120 },
    { x: 350, y: 120 },
    { x: 350, y: 280 },
    { x: 480, y: 280 },
  ];

  const currentFloor = floors.find((f) => f.id === selectedFloor);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setHospitals(mockHospitals);
      return;
    }
    try {
      const res = await navigationApi.searchPOI(searchKeyword);
      setHospitals(res.data);
    } catch (error) {
      console.error('Failed to search POI:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="skeleton h-[600px] rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">医院导航</h1>
        <p className="text-slate-500 mt-1">查找医保定点医院并获取导航指引</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索医院、科室或地址..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-12 pr-4"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                搜索
              </button>
              <button
                onClick={() => setFilterInsurance(!filterInsurance)}
                className={`btn-secondary flex items-center gap-2 ${
                  filterInsurance ? 'bg-insurance-50 border-insurance-300 text-insurance-600' : ''
                }`}
              >
                <Filter className="w-5 h-5" />
                <Shield className="w-4 h-4" />
                医保定点
              </button>
              <button className="btn-secondary p-3">
                <Locate className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="card overflow-hidden relative" style={{ height: '600px' }}>
            {!showIndoorMap ? (
              <div className="w-full h-full bg-gradient-to-br from-insurance-100 via-insurance-50 to-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 grid-bg" />
                <div className="absolute inset-0 bg-gradient-to-br from-insurance-400/5 to-transparent" />

                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(22, 119, 255, 0.1)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  <line x1="0" y1="300" x2="100%" y2="300" stroke="rgba(22, 119, 255, 0.2)" strokeWidth="3" />
                  <line x1="400" y1="0" x2="400" y2="100%" stroke="rgba(22, 119, 255, 0.2)" strokeWidth="3" />
                  <line x1="0" y1="450" x2="100%" y2="450" stroke="rgba(22, 119, 255, 0.15)" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="600" y1="0" x2="600" y2="100%" stroke="rgba(22, 119, 255, 0.15)" strokeWidth="2" strokeDasharray="5,5" />
                </svg>

                {filteredHospitals.map((hospital) => {
                  const pos = getHospitalPosition(hospital);
                  const isSelected = selectedHospital?.id === hospital.id;
                  return (
                    <button
                      key={hospital.id}
                      onClick={() => setSelectedHospital(hospital)}
                      className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
                        isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
                      }`}
                      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    >
                      <div
                        className={`relative group ${
                          isSelected ? 'animate-pulse-slow' : ''
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 rounded-full bg-insurance-200 animate-ring-expand" />
                        )}
                        <div
                          className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            isSelected
                              ? 'bg-insurance-500 text-white'
                              : 'bg-white text-insurance-500 border-2 border-insurance-200'
                          }`}
                        >
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition-opacity ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          } ${
                            isSelected
                              ? 'bg-insurance-500 text-white'
                              : 'bg-white text-slate-700 border border-slate-200'
                          } shadow-lg`}
                        >
                          <p className="text-sm font-medium">{hospital.name}</p>
                          <p className="text-xs opacity-80">{hospital.distance}km</p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-insurance-300/50 animate-ring-expand" />
                    <div className="relative w-6 h-6 rounded-full bg-insurance-500 border-4 border-white shadow-lg flex items-center justify-center">
                      <Navigation className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-20">
                  <p className="text-xs font-medium text-slate-700 mb-2">图例</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-insurance-500" />
                      <span className="text-xs text-slate-600">医保定点医院</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-600">非定点医院</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-insurance-500 border-2 border-white" />
                      <span className="text-xs text-slate-600">我的位置</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                  <button
                    onClick={() => setShowIndoorMap(true)}
                    disabled={!selectedHospital}
                    className="btn-primary flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Layers className="w-5 h-5" />
                    室内导航
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-50 to-insurance-50 relative overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-50" />

                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  <defs>
                    <pattern id="indoorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(22, 119, 255, 0.1)" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1677FF" />
                      <stop offset="100%" stopColor="#4096FF" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#indoorGrid)" />

                  <rect x="80" y="80" width="180" height="120" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />
                  <text x="170" y="145" textAnchor="middle" className="text-xs fill-slate-600 font-medium">
                    内科门诊区
                  </text>

                  <rect x="320" y="80" width="200" height="120" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />
                  <text x="420" y="145" textAnchor="middle" className="text-xs fill-slate-600 font-medium">
                    外科门诊区
                  </text>

                  <rect x="80" y="240" width="180" height="120" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />
                  <text x="170" y="305" textAnchor="middle" className="text-xs fill-slate-600 font-medium">
                    功能检查区
                  </text>

                  <rect x="320" y="240" width="200" height="120" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />
                  <text x="420" y="305" textAnchor="middle" className="text-xs fill-slate-600 font-medium">
                    心内科
                  </text>

                  <rect x="560" y="80" width="80" height="280" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />
                  <text x="600" y="230" textAnchor="middle" className="text-xs fill-slate-600 font-medium" transform="rotate(90, 600, 230)">
                    候诊区
                  </text>

                  <circle cx="120" cy="200" r="8" fill="#00B42A" />
                  <text x="120" y="185" textAnchor="middle" className="text-xs fill-slate-600">
                    起点
                  </text>

                  <circle cx="480" cy="280" r="8" fill="#F53F3F" />
                  <text x="480" y="265" textAnchor="middle" className="text-xs fill-slate-600">
                    终点
                  </text>

                  {showRoute && (
                    <>
                      <path
                        d={`M ${indoorPath.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="10,5"
                        className="animate-pulse-slow"
                      />
                      <circle cx="350" cy="120" r="6" fill="#FF7D00" className="animate-pulse" />
                    </>
                  )}
                </svg>

                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-20">
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {selectedHospital?.name}
                  </p>
                  <p className="text-xs text-slate-500">{currentFloor?.name}</p>
                </div>

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg z-20">
                  <div className="flex flex-col gap-1">
                    {floors.map((floor) => (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedFloor(floor.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedFloor === floor.id
                            ? 'bg-insurance-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {floor.id}F
                      </button>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                  <button
                    onClick={() => setShowRoute(!showRoute)}
                    className={`btn-primary flex items-center gap-2 shadow-lg ${
                      showRoute ? 'bg-medical-500 hover:bg-medical-600' : ''
                    }`}
                  >
                    <Route className="w-5 h-5" />
                    {showRoute ? '隐藏路径' : '规划路径'}
                  </button>
                  <button
                    onClick={() => setShowIndoorMap(false)}
                    className="btn-secondary flex items-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-5 h-5" />
                    返回地图
                  </button>
                </div>

                {showRoute && (
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-20 max-w-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <Route className="w-5 h-5 text-insurance-500" />
                      <p className="font-semibold text-slate-900">导航信息</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">步行距离</span>
                        <span className="font-medium text-slate-900">约 180 米</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">预计时间</span>
                        <span className="font-medium text-slate-900">约 3 分钟</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">目的地</span>
                        <span className="font-medium text-insurance-600">心内科诊室</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedHospital && (
            <div className="card p-6 bg-gradient-to-br from-insurance-500 to-insurance-700 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedHospital.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                      {selectedHospital.level}
                    </span>
                    {selectedHospital.isInsurancePoint && (
                      <span className="px-2 py-0.5 bg-medical-500/80 rounded text-xs flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        医保定点
                      </span>
                    )}
                  </div>
                </div>
                <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedHospital.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  <span>距您 {selectedHospital.distance} km</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-lg font-bold">{selectedHospital.insurancePolicy.reimbursementRate}%</p>
                  <p className="text-xs text-white/70">报销比例</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatCurrency(selectedHospital.insurancePolicy.deductible)}</p>
                  <p className="text-xs text-white/70">起付线</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{(selectedHospital.insurancePolicy.maxReimbursement / 10000).toFixed(0)}万</p>
                  <p className="text-xs text-white/70">最高限额</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="btn-success flex-1 flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5" />
                  导航
                </button>
                <button className="btn-secondary flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  电话
                </button>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Shield className="w-5 h-5 text-insurance-500" />
              医保报销政策
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-insurance-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">门诊报销</span>
                  <span className="text-lg font-bold text-insurance-600">50-80%</span>
                </div>
                <p className="text-xs text-slate-500">根据医院等级确定，三级医院50%，社区医院80%</p>
              </div>
              <div className="p-4 bg-medical-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">住院报销</span>
                  <span className="text-lg font-bold text-medical-600">85-95%</span>
                </div>
                <p className="text-xs text-slate-500">起付线以上部分，年度最高支付限额10万元</p>
              </div>
              <div className="p-4 bg-warning-500/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">慢特病门诊</span>
                  <span className="text-lg font-bold text-warning-600">80%</span>
                </div>
                <p className="text-xs text-slate-500">需先进行慢特病资格认定，年度限额15万元</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Building2 className="w-5 h-5 text-insurance-500" />
              附近医院
            </h3>
            <div className="space-y-3">
              {filteredHospitals.slice(0, 4).map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedHospital?.id === hospital.id
                      ? 'border-insurance-300 bg-insurance-50'
                      : 'border-slate-100 hover:border-insurance-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        hospital.isInsurancePoint ? 'bg-insurance-50' : 'bg-slate-50'
                      }`}
                    >
                      <Building2
                        className={`w-5 h-5 ${
                          hospital.isInsurancePoint ? 'text-insurance-500' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{hospital.name}</p>
                        {hospital.isInsurancePoint && (
                          <Shield className="w-4 h-4 text-insurance-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <Star className="w-4 h-4 text-warning-500" />
                        <span>{hospital.level}</span>
                        <span>·</span>
                        <span>{hospital.distance}km</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showIndoorMap && currentFloor && (
            <div className="card p-6">
              <h3 className="section-title flex items-center gap-2">
                <Layers className="w-5 h-5 text-insurance-500" />
                {currentFloor.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentFloor.departments.map((dept) => (
                  <span
                    key={dept}
                    className="px-3 py-1.5 bg-insurance-50 text-insurance-600 rounded-full text-sm"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavigationPage;
