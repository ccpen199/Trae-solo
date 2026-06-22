import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronRight,
  Filter,
  Star,
  Clock,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { registrationApi } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import type { Hospital } from '@shared/types';

const areas = [
  { key: '', label: '全部地区' },
  { key: '南京市', label: '南京市' },
  { key: '苏州市', label: '苏州市' },
  { key: '无锡市', label: '无锡市' },
  { key: '常州市', label: '常州市' },
  { key: '镇江市', label: '镇江市' },
  { key: '南通市', label: '南通市' },
  { key: '扬州市', label: '扬州市' },
  { key: '泰州市', label: '泰州市' },
  { key: '徐州市', label: '徐州市' },
  { key: '淮安市', label: '淮安市' },
  { key: '盐城市', label: '盐城市' },
  { key: '连云港市', label: '连云港市' },
  { key: '宿迁市', label: '宿迁市' },
];

const levels = [
  { key: '', label: '全部等级' },
  { key: '三级甲等', label: '三级甲等' },
  { key: '三级乙等', label: '三级乙等' },
  { key: '三级丙等', label: '三级丙等' },
  { key: '二级甲等', label: '二级甲等' },
  { key: '二级乙等', label: '二级乙等' },
];

const sortOptions = [
  { key: 'default', label: '综合排序' },
  { key: 'level', label: '等级优先' },
  { key: 'distance', label: '距离优先' },
  { key: 'reimbursement', label: '报销比例优先' },
];

function RegistrationPage() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [insuranceOnly, setInsuranceOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const params: {
          area?: string;
          level?: string;
          isInsurancePoint?: boolean;
        } = {};
        if (selectedArea) params.area = selectedArea;
        if (selectedLevel) params.level = selectedLevel;
        if (insuranceOnly) params.isInsurancePoint = true;

        const res = await registrationApi.getHospitals(params);
        let data = res.data;

        if (searchKeyword) {
          data = data.filter(
            (h) =>
              h.name.includes(searchKeyword) ||
              h.address.includes(searchKeyword) ||
              h.departments.some((d) => d.name.includes(searchKeyword))
          );
        }

        switch (sortBy) {
          case 'level':
            data.sort((a, b) => {
              const levelOrder: Record<string, number> = {
                '三级甲等': 1,
                '三级乙等': 2,
                '三级丙等': 3,
                '二级甲等': 4,
                '二级乙等': 5,
              };
              return (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
            });
            break;
          case 'distance':
            data.sort((a, b) => (a.distance || 999) - (b.distance || 999));
            break;
          case 'reimbursement':
            data.sort(
              (a, b) =>
                b.insurancePolicy.reimbursementRate -
                a.insurancePolicy.reimbursementRate
            );
            break;
        }

        setHospitals(data);
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [selectedArea, selectedLevel, insuranceOnly, sortBy, searchKeyword]);

  const clearFilters = () => {
    setSelectedArea('');
    setSelectedLevel('');
    setInsuranceOnly(false);
    setSearchKeyword('');
    setSortBy('default');
  };

  const hasActiveFilters =
    selectedArea || selectedLevel || insuranceOnly || searchKeyword;

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">挂号预约</h1>
        <p className="text-slate-500 mt-1">
          选择江苏省内二级以上医院进行在线预约挂号
        </p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索医院名称、地址或科室..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input-field pl-12 pr-4"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary py-3 px-4 flex items-center gap-2 ${
              showFilters ? 'bg-insurance-50 border-insurance-300' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-danger-500" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline-block mr-1 text-slate-400" />
                  选择地区
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="input-field"
                >
                  {areas.map((area) => (
                    <option key={area.key} value={area.key}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Building2 className="w-4 h-4 inline-block mr-1 text-slate-400" />
                  医院等级
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="input-field"
                >
                  {levels.map((level) => (
                    <option key={level.key} value={level.key}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <ArrowUpDown className="w-4 h-4 inline-block mr-1 text-slate-400" />
                  排序方式
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={insuranceOnly}
                  onChange={(e) => setInsuranceOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-insurance-500 focus:ring-insurance-500"
                />
                <span className="text-sm text-slate-700">
                  <ShieldCheck className="w-4 h-4 inline-block mr-1 text-medical-500" />
                  仅显示医保定点医院
                </span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-500 hover:text-insurance-600 transition-colors"
                >
                  清除筛选条件
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-slate-500">已选条件：</span>
          {selectedArea && (
            <span className="badge-info flex items-center gap-1">
              {selectedArea}
              <button onClick={() => setSelectedArea('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedLevel && (
            <span className="badge-info flex items-center gap-1">
              {selectedLevel}
              <button onClick={() => setSelectedLevel('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {insuranceOnly && (
            <span className="badge-success flex items-center gap-1">
              医保定点
              <button onClick={() => setInsuranceOnly(false)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchKeyword && (
            <span className="badge-info flex items-center gap-1">
              关键词: {searchKeyword}
              <button onClick={() => setSearchKeyword('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : hospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="card p-5 card-hover cursor-pointer group"
              onClick={() => navigate(`/registration/hospital/${hospital.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-insurance-100 to-insurance-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-8 h-8 text-insurance-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg group-hover:text-insurance-600 transition-colors">
                        {hospital.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="badge-info">{hospital.level}</span>
                        {hospital.isInsurancePoint ? (
                          <span className="badge-success flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            医保定点
                          </span>
                        ) : (
                          <span className="badge">非医保定点</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-insurance-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  <p className="text-sm text-slate-500 mt-3 flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{hospital.address}</span>
                    {hospital.distance && (
                      <span className="text-insurance-600 ml-2 flex-shrink-0">
                        {hospital.distance.toFixed(1)}km
                      </span>
                    )}
                  </p>

                  {hospital.isInsurancePoint && (
                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-medical-50 to-transparent border border-medical-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-slate-500">报销比例</p>
                            <p className="text-lg font-bold text-medical-600">
                              {hospital.insurancePolicy.reimbursementRate}%
                            </p>
                          </div>
                          <div className="h-8 w-px bg-slate-200" />
                          <div>
                            <p className="text-xs text-slate-500">起付标准</p>
                            <p className="text-sm font-medium text-slate-700">
                              {formatCurrency(hospital.insurancePolicy.deductible)}
                            </p>
                          </div>
                          <div className="h-8 w-px bg-slate-200" />
                          <div>
                            <p className="text-xs text-slate-500">最高支付</p>
                            <p className="text-sm font-medium text-slate-700">
                              {formatCurrency(
                                hospital.insurancePolicy.maxReimbursement
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-medical-600">
                          <Star className="w-3 h-3 fill-current" />
                          医保资质已审核
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      今日有号
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {hospital.departments.length}个科室
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            未找到符合条件的医院
          </h3>
          <p className="text-slate-500 mb-4">
            请尝试调整筛选条件或搜索关键词
          </p>
          <button onClick={clearFilters} className="btn-primary py-2 px-4">
            清除筛选条件
          </button>
        </div>
      )}
    </div>
  );
}

export default RegistrationPage;
