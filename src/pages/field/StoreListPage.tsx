import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapPin, Phone, Clock, Star, Users, Calendar, Search, Plus } from 'lucide-react';
import { getStores } from '../../services/api';
import type { Store } from '../../../shared/types';
import { Link } from 'react-router-dom';

export default function StoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await getStores();
      if (res.code === 0) {
        setStores(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}'
    },
    geo: {
      map: 'china',
      roam: true,
      label: {
        show: true,
        fontSize: 10,
        color: '#6b7280'
      },
      itemStyle: {
        areaColor: '#f0fdf4',
        borderColor: '#059669',
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#d1fae5'
        },
        label: {
          color: '#059669'
        }
      }
    },
    series: [
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: [
          { name: '北京', value: [116.46, 39.92, 120] },
          { name: '上海', value: [121.48, 31.22, 86] },
          { name: '广州', value: [113.23, 23.16, 65] },
          { name: '成都', value: [104.06, 30.67, 52] },
          { name: '深圳', value: [114.07, 22.62, 48] },
          { name: '杭州', value: [120.19, 30.26, 41] },
          { name: '武汉', value: [114.31, 30.52, 35] },
          { name: '西安', value: [108.95, 34.27, 30] },
        ],
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 2,
        rippleEffect: {
          brushType: 'stroke',
          scale: 3
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 10
        },
        itemStyle: {
          color: '#059669',
          shadowBlur: 10,
          shadowColor: '#059669'
        }
      }
    ]
  };

  const filteredStores = stores.filter(s =>
    !searchKeyword || s.name.includes(searchKeyword) || s.address.includes(searchKeyword)
  );

  const stats = [
    { label: '生活馆总数', value: 128, icon: MapPin, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '今日预约', value: 86, icon: Calendar, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '服务客户', value: 12.8, unit: '万', icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '平均评分', value: 4.9, icon: Star, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}{stat.unit || ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">全国生活馆分布</h3>
        <ReactECharts option={mapOption} style={{ height: 400 }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索生活馆名称或地址..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="input pl-10 w-80"
          />
        </div>
        <div className="flex gap-3">
          <Link to="/field/appointments/create" className="btn btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            新建预约
          </Link>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            添加生活馆
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <div key={store.id} className="card overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
              <img
                src={store.imageUrl}
                alt={store.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/90 text-primary-700 rounded text-xs font-medium">
                    {store.type === 'standard' ? '标准店' : store.type === 'flagship' ? '旗舰店' : '社区店'}
                  </span>
                  {store.rating >= 4.8 && (
                    <span className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      五星门店
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 text-lg mb-2">{store.name}</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="line-clamp-1">{store.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span>{store.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span>{store.businessHours}</span>
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="font-semibold text-gray-900">{store.rating}</span>
                  <span className="text-gray-400 text-sm">({store.reviewCount}条评价)</span>
                </div>
                <Link
                  to={`/field/appointments/create?storeId=${store.id}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  预约
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
