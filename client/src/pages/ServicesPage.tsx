import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Card from '../components/Card';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import type { ServiceCategory, TransportService, CinemaService, JobService, GovernmentService } from '@/types/shared';

const serviceTabs: { key: ServiceCategory; label: string; icon: string }[] = [
  { key: 'transport', label: '客运班次', icon: '🚌' },
  { key: 'cinema', label: '影院排片', icon: '🎬' },
  { key: 'jobs', label: '招聘岗位', icon: '💼' },
  { key: 'government', label: '政务预约', icon: '🏛️' },
];

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ServiceCategory | null;
  const [activeTab, setActiveTab] = useState<ServiceCategory>(tabParam || 'transport');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ServiceCategory) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setKeyword('');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/services/${activeTab}`, {
        params: { keyword: keyword || undefined },
      });
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">生活服务</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {serviceTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`p-4 rounded-xl text-center transition-all ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-3xl block mb-2">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`搜索${serviceTabs.find(t => t.key === activeTab)?.label}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            搜索
          </button>
        </form>
      </Card>

      {loading ? (
        <div className="py-12">
          <Loading text="加载中..." />
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon="🔍" title="暂无结果" description="换个关键词试试" />
      ) : (
        <div className="space-y-3">
          {activeTab === 'transport' && data.map((item: TransportService, idx) => (
            <TransportCard key={idx} item={item} />
          ))}
          {activeTab === 'cinema' && data.map((item: CinemaService, idx) => (
            <CinemaCard key={idx} item={item} />
          ))}
          {activeTab === 'jobs' && data.map((item: JobService, idx) => (
            <JobCard key={idx} item={item} />
          ))}
          {activeTab === 'government' && data.map((item: GovernmentService, idx) => (
            <GovernmentCard key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransportCard({ item }: { item: TransportService }) {
  const typeLabels: Record<string, string> = {
    bus: '公交',
    train: '列车',
    flight: '航班',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">
              {item.type === 'bus' ? '🚌' : item.type === 'train' ? '🚄' : '✈️'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">{item.route}</span>
              <Tag color="secondary" size="sm">{typeLabels[item.type]}</Tag>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{item.departure}</span>
              <span className="text-gray-300">→</span>
              <span>{item.arrival}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary-600">¥{item.price}</p>
          <p className="text-xs text-gray-500">
            {item.departureTime} - {item.arrivalTime}
          </p>
          {item.available ? (
            <Tag color="success" size="sm" className="mt-1">有票</Tag>
          ) : (
            <Tag color="danger" size="sm" className="mt-1">无票</Tag>
          )}
        </div>
      </div>
    </Card>
  );
}

function CinemaCard({ item }: { item: CinemaService }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎬</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">{item.movieTitle}</h3>
            <p className="text-sm text-gray-500">{item.cinemaName} · {item.hall}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary-600">¥{item.price}</p>
          <p className="text-xs text-gray-500">
            {item.startTime} - {item.endTime}
          </p>
          <p className="text-xs text-gray-400 mt-1">剩余 {item.availableSeats} 座</p>
        </div>
      </div>
    </Card>
  );
}

function JobCard({ item }: { item: JobService }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{item.position}</h3>
          <p className="text-sm text-gray-600 mb-2">{item.company}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>📍 {item.location}</span>
            <span>📅 {item.postedDate}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 line-clamp-1">{item.requirements}</p>
        </div>
        <div className="text-lg font-bold text-green-600">{item.salary}</div>
      </div>
    </Card>
  );
}

function GovernmentCard({ item }: { item: GovernmentService }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🏛️</span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800">{item.name}</h3>
            <button className="text-primary-600 text-sm font-medium hover:underline">
              在线预约
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-2">{item.department}</p>
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {item.requiredDocs.map((doc, idx) => (
              <Tag key={idx} color="secondary" size="sm">{doc}</Tag>
            ))}
          </div>
          <p className="text-xs text-gray-400">办理时间：{item.processTime}</p>
        </div>
      </div>
    </Card>
  );
}
