import { useState } from 'react';
import { mockBases } from '../../data/mockData';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Star,
  Briefcase,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const BaseManagement = () => {
  const bases = mockBases;
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const typeMap: Record<string, { label: string; color: string; icon: string }> = {
    enterprise: { label: '企业', color: 'bg-blue-100 text-blue-700', icon: '🏢' },
    village: { label: '乡村', color: 'bg-green-100 text-green-700', icon: '🌾' },
    community: { label: '社区', color: 'bg-orange-100 text-orange-700', icon: '🏘️' },
  };

  const filteredBases = bases.filter((base) => {
    const matchesSearch =
      base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      base.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || base.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPositions = bases.reduce((sum, b) => sum + b.positionCount, 0);
  const avgSatisfaction =
    bases.reduce((sum, b) => sum + b.satisfaction, 0) / bases.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索基地名称、地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类型</option>
              <option value="enterprise">企业</option>
              <option value="village">乡村</option>
              <option value="community">社区</option>
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          添加基地
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{bases.length}</p>
              <p className="text-xs text-gray-500">基地总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalPositions}</p>
              <p className="text-xs text-gray-500">岗位总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {avgSatisfaction.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">平均满意度</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {Object.keys(typeMap).length}
              </p>
              <p className="text-xs text-gray-500">基地类型</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredBases.map((base) => (
          <div
            key={base.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {base.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                        typeMap[base.type].color
                      }`}
                    >
                      {typeMap[base.type].icon} {typeMap[base.type].label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-4 line-clamp-2">
                {base.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 truncate">
                    {base.address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {base.contactPhone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {base.contactPerson}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {base.positionCount}个岗位
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {base.satisfaction}分
                    </span>
                  </div>
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                      style={{ width: `${base.satisfaction}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BaseManagement;
