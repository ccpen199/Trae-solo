import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, Shield, FileText, Calendar, MapPin, User, Clock, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { getServiceRecords } from '../../services/api';
import type { ServiceRecord } from '../../../shared/types';

export default function ServiceRecordPage() {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await getServiceRecords();
      if (res.code === 0) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  const chainOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: records.map((_, i) => `区块 ${i + 1}`).slice(-10),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: '交易量',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: records.map(r => r.id).slice(-10),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#059669' },
              { offset: 1, color: '#10b981' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 20,
      }
    ]
  };

  const stats = [
    { label: '服务记录总数', value: records.length, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '今日服务', value: 12, icon: Calendar, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '上链数量', value: records.filter(r => r.isOnChain).length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '客户满意度', value: '98.6%', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const filteredRecords = records.filter(r =>
    !searchKeyword || r.customerName.includes(searchKeyword) || r.serviceType.includes(searchKeyword)
  );

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
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">区块链上链趋势</h3>
            <div className="flex items-center gap-2 text-sm text-primary-600">
              <Shield className="w-4 h-4" />
              <span>实时同步中</span>
            </div>
          </div>
          <ReactECharts option={chainOption} style={{ height: 250 }} />
        </div>
        
        <div className="card p-6 bg-gradient-to-br from-primary-50 to-amber-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            区块链存证
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-gray-500 mb-1">最新区块高度</p>
              <p className="text-2xl font-bold text-primary-600">#1,258,412</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-gray-500 mb-1">当前链上交易</p>
              <p className="text-2xl font-bold text-amber-600">{records.filter(r => r.isOnChain).length} 笔</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-gray-500 mb-1">存证类型</p>
              <p className="text-sm text-gray-900">服务记录、预约记录、评价数据</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户、服务类型..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        <div className="text-sm text-gray-500">
          共 {filteredRecords.length} 条服务记录
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const isExpanded = expandedId === record.id;
          return (
            <div key={record.id} className="card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {record.customerName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{record.customerName}</h4>
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                          {record.serviceType}
                        </span>
                        {record.isOnChain && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            已上链
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {record.storeName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.serviceDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.duration}分钟
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">服务人员</p>
                      <p className="text-sm text-gray-500">{record.operator}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">服务内容</p>
                      <p className="text-sm text-gray-700">{record.serviceContent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">服务结果</p>
                      <p className="text-sm text-gray-700">{record.result}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">客户反馈</p>
                      <p className="text-sm text-gray-700">{record.feedback || '暂无反馈'}</p>
                    </div>
                  </div>
                  
                  {record.isOnChain && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h5 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        区块链存证信息
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-amber-600">区块高度</p>
                          <p className="font-semibold text-amber-900">#{record.blockHeight || '1,258,396'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-600">上链时间</p>
                          <p className="font-semibold text-amber-900 text-sm">{record.chainTimestamp || record.createdAt?.slice(0, 19)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-600">交易哈希</p>
                          <p className="font-mono text-xs text-amber-900 truncate">{record.transactionHash || '0x7f8a...e3d2c1'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-600">数据指纹</p>
                          <p className="font-mono text-xs text-amber-900 truncate">{record.dataHash || 'QmXy7...9Zk2p'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 mt-3">
                        ✅ 本服务记录已通过区块链技术存证，数据不可篡改，可独立验证。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
