import { useEffect, useState } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, UserPlus, Users } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getCustomers, getCustomerGraph } from '../../services/api';
import type { Customer, CustomerGraph } from '../../../shared/types';
import { Link } from 'react-router-dom';

const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: 'VIP客户', color: 'text-amber-600', bg: 'bg-amber-100' },
  regular: { label: '普通客户', color: 'text-brand-600', bg: 'bg-brand-100' },
  potential: { label: '潜在客户', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [graph, setGraph] = useState<CustomerGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, [page]);

  useEffect(() => {
    if (showGraph) {
      fetchGraph();
    }
  }, [showGraph]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCustomers({ page, pageSize });
      if (res.code === 0) {
        setCustomers(res.data.list);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async () => {
    try {
      const res = await getCustomerGraph();
      if (res.code === 0) {
        setGraph(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch graph:', err);
    }
  };

  const graphOption = graph ? {
    tooltip: {
      trigger: 'item',
      formatter: '{b}'
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graph.nodes.map(n => ({
          id: n.id.toString(),
          name: n.name,
          symbolSize: 20 + n.value / 3,
          itemStyle: {
            color: n.type === 'sales' ? '#059669' : n.type === 'customer' ? '#2563eb' : '#f59e0b'
          },
          category: n.type
        })),
        links: graph.links.map(l => ({
          source: l.source.toString(),
          target: l.target.toString(),
          lineStyle: {
            color: l.relation === 'purchase' ? '#059669' : l.relation === 'introduce' ? '#2563eb' : '#f59e0b',
            curveness: 0.2
          }
        })),
        categories: [
          { name: '直销员', itemStyle: { color: '#059669' } },
          { name: '客户', itemStyle: { color: '#2563eb' } },
          { name: '推荐人', itemStyle: { color: '#f59e0b' } }
        ],
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12
        },
        lineStyle: {
          width: 1.5,
          curveness: 0.3
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3
          }
        },
        force: {
          repulsion: 300,
          edgeLength: 100,
          gravity: 0.1
        }
      }
    ]
  } : {};

  const stats = [
    { label: '总客户数', value: total, icon: Users, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: 'VIP客户', value: customers.filter(c => c.level === 'vip').length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '本月新增', value: 12, icon: UserPlus, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '待跟进', value: 5, icon: UserPlus, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

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
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、电话..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-80"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`btn ${showGraph ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users className="w-4 h-4 mr-2" />
            客户关系图谱
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            添加客户
          </button>
        </div>
      </div>

      {showGraph && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">客户关系图谱</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-600"></span>
                直销员
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-600"></span>
                客户
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                推荐人
              </span>
            </div>
          </div>
          <ReactECharts option={graphOption} style={{ height: 400 }} />
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">客户信息</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">等级</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">来源</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">累计消费</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">标签</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">最近消费</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                      {customer.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${levelConfig[customer.level].bg} ${levelConfig[customer.level].color}`}>
                    {levelConfig[customer.level].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.source}</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    ¥{customer.totalPurchases.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {customer.tags.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        +{customer.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString() : '暂无消费'}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    to={`/people/customers/${customer.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
              {page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
