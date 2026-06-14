import { useState, useMemo } from 'react';
import {
  Building2,
  ArrowUpDown,
  AlertTriangle,
  MapPin,
  Users,
  Briefcase,
  TrendingUp,
  Search,
} from 'lucide-react';
import type { SchoolStats } from '../../../../shared/types';
import { cn } from '@/lib/utils';

const mockSchools: SchoolStats[] = [
  {
    id: '1',
    name: '清华大学',
    province: '北京',
    studentCount: 856,
    jobCount: 320,
    applicationCount: 2150,
    complaintCount: 2,
    complaintRate: 0.09,
    avgSalary: 4200,
  },
  {
    id: '2',
    name: '北京大学',
    province: '北京',
    studentCount: 782,
    jobCount: 298,
    applicationCount: 1980,
    complaintCount: 5,
    complaintRate: 0.25,
    avgSalary: 4100,
  },
  {
    id: '3',
    name: '复旦大学',
    province: '上海',
    studentCount: 654,
    jobCount: 256,
    applicationCount: 1650,
    complaintCount: 3,
    complaintRate: 0.18,
    avgSalary: 3800,
  },
  {
    id: '4',
    name: '上海交通大学',
    province: '上海',
    studentCount: 621,
    jobCount: 245,
    applicationCount: 1580,
    complaintCount: 8,
    complaintRate: 0.51,
    avgSalary: 3750,
  },
  {
    id: '5',
    name: '浙江大学',
    province: '浙江',
    studentCount: 598,
    jobCount: 230,
    applicationCount: 1480,
    complaintCount: 4,
    complaintRate: 0.27,
    avgSalary: 3600,
  },
  {
    id: '6',
    name: '南京大学',
    province: '江苏',
    studentCount: 487,
    jobCount: 198,
    applicationCount: 1220,
    complaintCount: 12,
    complaintRate: 0.98,
    avgSalary: 3400,
  },
  {
    id: '7',
    name: '武汉大学',
    province: '湖北',
    studentCount: 456,
    jobCount: 185,
    applicationCount: 1100,
    complaintCount: 6,
    complaintRate: 0.55,
    avgSalary: 3200,
  },
  {
    id: '8',
    name: '中山大学',
    province: '广东',
    studentCount: 423,
    jobCount: 172,
    applicationCount: 1050,
    complaintCount: 2,
    complaintRate: 0.19,
    avgSalary: 3500,
  },
];

type SortKey = 'studentCount' | 'jobCount' | 'complaintRate' | 'avgSalary';
type SortOrder = 'asc' | 'desc';

export default function SchoolMonitor() {
  const [schools] = useState<SchoolStats[]>(mockSchools);
  const [sortKey, setSortKey] = useState<SortKey>('studentCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedSchools = useMemo(() => {
    let filtered = schools;
    if (searchQuery) {
      filtered = schools.filter(
        (s) =>
          s.name.includes(searchQuery) ||
          s.province.includes(searchQuery)
      );
    }
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [schools, sortKey, sortOrder, searchQuery]);

  const isHighComplaint = (rate: number) => rate > 0.5;

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className="ml-1 p-0.5 hover:bg-slate-700 rounded transition-colors"
    >
      <ArrowUpDown
        className={cn(
          'w-3.5 h-3.5',
          sortKey === columnKey ? 'text-primary-400' : 'text-slate-500'
        )}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">院校监控</h1>
          <p className="text-slate-400 mt-1">监控各院校实习数据与异常情况</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索院校..."
            className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Building2 className="w-4 h-4" />
            院校总数
          </div>
          <p className="text-2xl font-bold text-white">{schools.length}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            学生总数
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {schools.reduce((sum, s) => sum + s.studentCount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            异常院校
          </div>
          <p className="text-2xl font-bold text-red-400">
            {schools.filter((s) => isHighComplaint(s.complaintRate)).length}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            平均薪资
          </div>
          <p className="text-2xl font-bold text-amber-400">
            ¥{Math.round(schools.reduce((sum, s) => sum + s.avgSalary, 0) / schools.length)}
          </p>
        </div>
      </div>

      <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-4 text-sm font-medium text-slate-400">
                  院校名称
                </th>
                <th className="text-left px-5 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    省份
                  </div>
                </th>
                <th className="text-right px-5 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center justify-end">
                    学生数
                    <SortIcon columnKey="studentCount" />
                  </div>
                </th>
                <th className="text-right px-5 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center justify-end">
                    岗位数
                    <SortIcon columnKey="jobCount" />
                  </div>
                </th>
                <th className="text-right px-5 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center justify-end">
                    投诉率
                    <SortIcon columnKey="complaintRate" />
                  </div>
                </th>
                <th className="text-right px-5 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center justify-end">
                    平均薪资
                    <SortIcon columnKey="avgSalary" />
                  </div>
                </th>
                <th className="text-center px-5 py-4 text-sm font-medium text-slate-400">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {sortedSchools.map((school) => (
                <tr
                  key={school.id}
                  className={cn(
                    'hover:bg-slate-700/30 transition-colors',
                    isHighComplaint(school.complaintRate) && 'bg-red-500/5'
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{school.name}</p>
                        <p className="text-xs text-slate-500">
                          {school.applicationCount} 次投递
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-300">{school.province}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-medium text-white">
                      {school.studentCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-medium text-white">
                      {school.jobCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={cn(
                        'font-semibold',
                        isHighComplaint(school.complaintRate)
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      )}
                    >
                      {school.complaintRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-medium text-amber-400">
                      ¥{school.avgSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {isHighComplaint(school.complaintRate) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        异常预警
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <Briefcase className="w-3 h-3" />
                        正常
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
