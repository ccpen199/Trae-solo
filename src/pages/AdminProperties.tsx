import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Eye,
  MapPin,
  Home,
} from 'lucide-react';
import api, { ApiResponse, Property } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const res = await api.get<ApiResponse<Property[]>>('/properties');
      if (res.code === 200) {
        const payload = res.data as any;
        setProperties(Array.isArray(payload) ? payload : payload.list || []);
      }
    } catch (error) {
      console.error('加载房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (property: Property) => {
    const newStatus = property.status === 'available' ? 'offline' : 'available';
    try {
      const res = await api.put<ApiResponse<Property>>(`/admin/properties/${property.id}`, {
        ...property,
        status: newStatus,
      });
      if (res.code === 200) {
        setProperties(prev => prev.map(p => p.id === res.data.id ? res.data : p));
      }
    } catch (error) {
      console.error('更新房源状态失败:', error);
    }
  };

  const handleDeleteProperty = async (propertyId: number) => {
    if (!confirm('确定要删除这个房源吗？')) return;
    try {
      await api.delete(`/admin/properties/${propertyId}`);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('删除房源失败:', error);
    }
  };

  const cities = [...new Set(properties.map(p => p.city))];

  const filteredProperties = properties.filter(p => {
    const matchSearch = !searchQuery || 
      p.projectName.includes(searchQuery) ||
      p.address.includes(searchQuery);
    const matchCity = cityFilter === 'all' || p.city === cityFilter;
    return matchSearch && matchCity;
  });

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">楼盘信息配置</h1>
          <p className="text-gray-500 mt-1">管理所有楼盘的基础信息和销售状态</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadProperties}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加楼盘
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索楼盘名称或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部城市</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '全部房源', value: properties.length, color: 'bg-blue-500' },
          { label: '在售', value: properties.filter(p => p.status === 'available').length, color: 'bg-green-500' },
          { label: '已锁', value: properties.filter(p => p.status === 'locked').length, color: 'bg-yellow-500' },
          { label: '已售', value: properties.filter(p => p.status === 'sold').length, color: 'bg-red-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">楼盘信息</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">坐落位置</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">户型</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">面积</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">价格</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">折扣</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <Home className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{property.projectName}</p>
                        <p className="text-xs text-gray-500">ID: {property.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{property.city} {property.district}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{property.address}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900">
                      {property.bedrooms}室{property.bathrooms}卫
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900">{property.area}㎡</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-lg text-primary-600">
                      ¥{formatPrice(property.price)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={property.status} />
                  </td>
                  <td className="py-4 px-6">
                    {property.discount < 10 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        {property.discount}折
                      </span>
                    ) : (
                      <span className="text-gray-400">无折扣</span>
                    )}
                    {property.promotion && (
                      <p className="text-xs text-amber-600 mt-1">{property.promotion}</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(property)}
                        className={`p-2 rounded-lg transition-colors ${
                          property.status === 'available'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={property.status === 'available' ? '点击下架' : '点击上架'}
                      >
                        {property.status === 'available' ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProperties.length === 0 && (
          <div className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无符合条件的房源</p>
          </div>
        )}
      </div>
    </div>
  );
}
