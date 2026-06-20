import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Droplets,
  Zap,
  Flame,
  HardHat,
  MapPin,
  Clock,
  X,
  Layers,
  Info,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { MapLayerItem } from '@shared/types';
import { cn } from '@/lib/utils';

const layerTypes = [
  { value: 'water', label: '停水通知', icon: Droplets, color: 'text-blue-500 bg-blue-50' },
  { value: 'power', label: '停电通知', icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
  { value: 'gas', label: '停气通知', icon: Flame, color: 'text-orange-500 bg-orange-50' },
  { value: 'construction', label: '施工公告', icon: HardHat, color: 'text-purple-500 bg-purple-50' },
];

const statusColors: Record<string, string> = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

export default function GISMap() {
  const [activeLayers, setActiveLayers] = useState<string[]>(['water', 'power', 'gas', 'construction']);
  const [mapData, setMapData] = useState<MapLayerItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapLayerItem | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/map/layers');
      const data = await res.json();
      if (data.success) {
        setMapData(data.data);
      }
    } catch (e) {
      const mockData: MapLayerItem[] = [
        {
          id: 'water_1',
          name: '鼓楼区供水主管维修',
          type: 'water',
          status: 'warning',
          address: '鼓楼区中山北路沿线',
          district: '鼓楼区',
          startTime: '2024-06-20 09:00:00',
          endTime: '2024-06-20 17:00:00',
          description: '因供水主管道老化更换施工，中山北路沿线用户将暂停供水8小时。请相关用户提前做好储水准备。',
          lng: 117.175,
          lat: 34.285,
          affectedArea: 2.5,
        },
        {
          id: 'power_1',
          name: '云龙区变电站检修',
          type: 'power',
          status: 'warning',
          address: '云龙区和平大道沿线',
          district: '云龙区',
          startTime: '2024-06-22 07:00:00',
          endTime: '2024-06-22 19:00:00',
          description: '110kV变电站年度检修，沿线商业和居民用户停电12小时。请提前做好停电准备。',
          lng: 117.225,
          lat: 34.258,
          affectedArea: 3.8,
        },
        {
          id: 'gas_1',
          name: '鼓楼区燃气管道更换',
          type: 'gas',
          status: 'danger',
          address: '鼓楼区民主路附近',
          district: '鼓楼区',
          startTime: '2024-06-20 14:00:00',
          endTime: '2024-06-20 22:00:00',
          description: '燃气管道腐蚀严重，紧急更换施工，请用户关闭阀门注意安全。',
          lng: 117.19,
          lat: 34.275,
          affectedArea: 1.8,
        },
        {
          id: 'construction_1',
          name: '地铁5号线施工',
          type: 'construction',
          status: 'normal',
          address: '泉山区三环南路沿线',
          district: '泉山区',
          startTime: '2024-01-15 00:00:00',
          endTime: '2026-12-31 23:59:59',
          description: '地铁5号线一期工程土建施工，部分路段限行。',
          lng: 117.155,
          lat: 34.248,
          affectedArea: 8.5,
        },
        {
          id: 'power_2',
          name: '铜山区线路整改',
          type: 'power',
          status: 'normal',
          address: '铜山区北京南路两侧',
          district: '铜山区',
          startTime: '2024-06-23 08:30:00',
          endTime: '2024-06-23 17:30:00',
          description: '架空线路入地改造工程，部分区域停电。',
          lng: 117.168,
          lat: 34.215,
          affectedArea: 2.1,
        },
        {
          id: 'water_2',
          name: '泉山区小区管网改造',
          type: 'water',
          status: 'normal',
          address: '泉山区泰山街道某小区',
          district: '泉山区',
          startTime: '2024-06-21 08:00:00',
          endTime: '2024-06-21 16:00:00',
          description: '小区供水管网升级改造，施工期间供水压力可能下降。',
          lng: 117.145,
          lat: 34.235,
          affectedArea: 1.2,
        },
      ];
      setMapData(mockData);
    }
  };

  const toggleLayer = (type: string) => {
    setActiveLayers((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredData = mapData.filter((item) => activeLayers.includes(item.type));

  const getMapOption = () => {
    const typeColors: Record<string, string> = {
      water: '#3b82f6',
      power: '#eab308',
      gas: '#f97316',
      construction: '#8b5cf6',
    };

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.componentType === 'series') {
            const item = filteredData[params.dataIndex];
            return `
              <div style="font-weight:600;margin-bottom:4px">${item.name}</div>
              <div style="font-size:12px;color:#6b7280">${item.address}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px">
                影响范围：约${item.affectedArea}平方公里
              </div>
            `;
          }
          return '';
        },
      },
      geo: {
        map: 'xuzhou',
        roam: true,
        zoom: 1.2,
        center: [117.185, 34.268],
        itemStyle: {
          areaColor: '#f0f9ff',
          borderColor: '#93c5fd',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#dbeafe',
          },
          label: {
            show: false,
          },
        },
      },
      series: [
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: filteredData.map((item) => ({
            name: item.name,
            value: [item.lng, item.lat, item.affectedArea],
            itemType: item.type,
          })),
          symbolSize: (val: number[]) => Math.sqrt(val[2]) * 8 + 8,
          itemStyle: {
            color: (params: any) => typeColors[params.data.itemType] || '#3b82f6',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
          },
          emphasis: {
            scale: 1.2,
          },
        },
      ],
    };
  };

  const getTypeIcon = (type: string) => {
    const found = layerTypes.find((l) => l.value === type);
    return found ? found.icon : MapPin;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GIS公共服务地图"
        description="实时查看停水、停电、停气、施工等公共服务信息"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">图层控制</h3>
            </div>
            <div className="space-y-2">
              {layerTypes.map((layer) => {
                const Icon = layer.icon;
                const isActive = activeLayers.includes(layer.value);
                return (
                  <button
                    key={layer.value}
                    onClick={() => toggleLayer(layer.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', layer.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium flex-1 text-left">{layer.label}</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        isActive
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-slate-300'
                      )}
                    >
                      {isActive && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">事件列表</h3>
              <span className="ml-auto text-xs text-slate-500">{filteredData.length} 条</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredData.map((item) => {
                const Icon = getTypeIcon(item.type);
                const typeInfo = layerTypes.find((l) => l.value === item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all border',
                      selectedItem?.id === item.id
                        ? 'bg-primary-50 border-primary-200'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeInfo?.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{item.name}</h4>
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[item.status])}></span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.district}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{item.startTime.slice(5, 10)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden h-[600px] relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow">
              <p className="text-xs text-slate-500">徐州市行政区划图</p>
            </div>

            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">徐州市 GIS 地图</h3>
                <p className="text-sm text-slate-500 mt-2">
                  当前显示 {filteredData.length} 个公共服务事件
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {layerTypes.map((layer) => {
                    const Icon = layer.icon;
                    return (
                      <div key={layer.value} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md text-xs text-slate-600 shadow-sm">
                        <Icon className="w-3.5 h-3.5" />
                        {layer.label}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-6">
                  （实际项目中可接入高德/百度/天地图 API 实现完整 GIS 功能）
                </p>
              </div>
            </div>

            {selectedItem && (
              <div className="absolute bottom-4 left-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                      selectedItem.type === 'water' ? 'bg-blue-100 text-blue-600' :
                      selectedItem.type === 'power' ? 'bg-yellow-100 text-yellow-600' :
                      selectedItem.type === 'gas' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    )}>
                      {(() => {
                        const Icon = getTypeIcon(selectedItem.type);
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{selectedItem.name}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{selectedItem.address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-3">{selectedItem.description}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">开始时间</p>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedItem.startTime.slice(5, 16)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">结束时间</p>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedItem.endTime.slice(5, 16)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">影响范围</p>
                    <p className="text-slate-700 font-medium mt-0.5">约{selectedItem.affectedArea}km²</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
