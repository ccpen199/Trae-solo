import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  User,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { appealStatusLabels, appealCategories, districts } from '@shared/types';
import type { Appeal, AppealStatus } from '@shared/types';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  transferred: 'bg-purple-100 text-purple-700 border-purple-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: RefreshCw,
  transferred: ArrowRight,
  resolved: CheckCircle,
  closed: XCircle,
};

export default function AppealManagement() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppealStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, [filterStatus, filterCategory, filterDistrict]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterDistrict !== 'all') params.append('district', filterDistrict);

      const res = await fetch(`http://localhost:3001/api/appeals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAppeals(data.data.list);
        if (!selectedAppeal && data.data.list.length > 0) {
          setSelectedAppeal(data.data.list[0]);
        }
      }
    } catch (e) {
      const mockData: Appeal[] = [
        {
          id: 'appeal_1',
          title: '反映小区下水道堵塞问题',
          content: '市民反映：小区下水道堵塞问题，希望相关部门能够尽快处理解决，谢谢！详细情况：该问题已经存在一段时间了，对日常生活造成了一定影响。诉求：希望相关部门能够重视并尽快处理。',
          category: '市政设施',
          status: 'pending',
          citizenName: '王先生',
          citizenPhone: '13812345678',
          address: '彭城路123号',
          district: '鼓楼区',
          createTime: '2024-06-20 09:30:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '王先生', remark: '市民通过平台提交诉求', time: '2024-06-20 09:30:00' },
          ],
        },
        {
          id: 'appeal_2',
          title: '建议增设公共自行车站点',
          content: '市民建议在XX路附近增设公共自行车站点，方便居民出行。该区域人流量较大，但公共交通不够便利，希望能增加公共自行车覆盖。',
          category: '交通出行',
          status: 'processing',
          citizenName: '李女士',
          citizenPhone: '13987654321',
          address: '淮海东路456号',
          district: '云龙区',
          createTime: '2024-06-19 14:20:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '李女士', remark: '市民通过平台提交诉求', time: '2024-06-19 14:20:00' },
            { id: '2', action: '受理派单', operator: '工单受理员', remark: '已受理并分派至交通运输局', time: '2024-06-19 15:00:00' },
          ],
        },
        {
          id: 'appeal_3',
          title: '投诉施工噪音扰民',
          content: '市民投诉：附近工地夜间施工噪音严重扰民，影响居民正常休息。希望相关部门加强监管，规范施工时间。',
          category: '噪音扰民',
          status: 'transferred',
          citizenName: '张大爷',
          citizenPhone: '13756781234',
          address: '解放南路789号',
          district: '泉山区',
          platform12345Id: 'XZ12345000001',
          transferTime: '2024-06-18 10:30:00',
          createTime: '2024-06-17 16:45:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '张大爷', remark: '市民通过平台提交诉求', time: '2024-06-17 16:45:00' },
            { id: '2', action: '受理派单', operator: '工单受理员', remark: '已受理并分派至城管局', time: '2024-06-17 17:10:00' },
            { id: '3', action: '转办12345', operator: '平台管理员', remark: '已转办至12345政务服务便民热线，工单号：XZ12345000001', time: '2024-06-18 10:30:00' },
          ],
        },
        {
          id: 'appeal_4',
          title: '咨询社保缴费相关问题',
          content: '市民咨询社保缴费基数调整、缴费方式变更等相关问题，希望得到详细解答。',
          category: '教育医疗',
          status: 'resolved',
          citizenName: '刘阿姨',
          citizenPhone: '13678901234',
          address: '复兴北路321号',
          district: '鼓楼区',
          resolveTime: '2024-06-16 15:00:00',
          satisfaction: 5,
          createTime: '2024-06-15 10:00:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '刘阿姨', remark: '市民通过平台提交诉求', time: '2024-06-15 10:00:00' },
            { id: '2', action: '受理派单', operator: '工单受理员', remark: '已受理并分派至人社局', time: '2024-06-15 10:30:00' },
            { id: '3', action: '转办12345', operator: '平台管理员', remark: '已转办至12345政务服务便民热线', time: '2024-06-15 11:00:00' },
            { id: '4', action: '处理完成', operator: '人社局', remark: '已电话回复市民详细解答社保缴费问题', time: '2024-06-16 15:00:00' },
          ],
        },
        {
          id: 'appeal_5',
          title: '反映路灯损坏不亮',
          content: '市民反映XX路段多盏路灯损坏不亮，夜间出行不便，存在安全隐患，希望尽快维修。',
          category: '市政设施',
          status: 'processing',
          citizenName: '陈先生',
          citizenPhone: '13512348765',
          address: '和平大道654号',
          district: '云龙区',
          createTime: '2024-06-20 08:15:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '陈先生', remark: '市民通过平台提交诉求', time: '2024-06-20 08:15:00' },
            { id: '2', action: '受理派单', operator: '工单受理员', remark: '已受理并分派至市政工程处', time: '2024-06-20 08:45:00' },
          ],
        },
        {
          id: 'appeal_6',
          title: '建议优化公交线路',
          content: '市民建议优化XX公交线路，增加班次，延长运营时间，方便市民上下班出行。',
          category: '交通出行',
          status: 'closed',
          citizenName: '赵女士',
          citizenPhone: '13445678901',
          address: '铜山路987号',
          district: '铜山区',
          resolveTime: '2024-06-14 17:00:00',
          satisfaction: 4,
          createTime: '2024-06-10 09:00:00',
          logs: [
            { id: '1', action: '诉求提交', operator: '赵女士', remark: '市民通过平台提交诉求', time: '2024-06-10 09:00:00' },
            { id: '2', action: '受理派单', operator: '工单受理员', remark: '已受理并分派至公交公司', time: '2024-06-10 09:30:00' },
            { id: '3', action: '处理完成', operator: '公交公司', remark: '已研究调整方案，将于下月实施', time: '2024-06-14 17:00:00' },
            { id: '4', action: '满意度评价', operator: '赵女士', remark: '市民评价：满意', time: '2024-06-15 10:00:00' },
          ],
        },
      ];
      setAppeals(mockData);
      if (!selectedAppeal) {
        setSelectedAppeal(mockData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTo12345 = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/appeals/transfer/${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        loadAppeals();
      }
    } catch (e) {
      const updated = appeals.map(a => {
        if (a.id === id) {
          return {
            ...a,
            status: 'transferred' as AppealStatus,
            platform12345Id: `XZ12345${Date.now()}`,
            transferTime: new Date().toISOString(),
            logs: [...a.logs, {
              id: String(Date.now()),
              action: '转办12345',
              operator: '平台管理员',
              remark: '已转办至12345政务服务便民热线',
              time: new Date().toLocaleString(),
            }],
          };
        }
        return a;
      });
      setAppeals(updated);
      const selected = updated.find(a => a.id === selectedAppeal?.id);
      if (selected) setSelectedAppeal(selected);
    }
  };

  const stats = [
    { label: '全部诉求', value: appeals.length, color: 'text-slate-700' },
    { label: '待处理', value: appeals.filter(a => a.status === 'pending').length, color: 'text-yellow-600' },
    { label: '处理中', value: appeals.filter(a => a.status === 'processing').length, color: 'text-blue-600' },
    { label: '已转办', value: appeals.filter(a => a.status === 'transferred').length, color: 'text-purple-600' },
    { label: '已解决', value: appeals.filter(a => a.status === 'resolved' || a.status === 'closed').length, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="市民诉求中心"
        description="12345诉求处理与跟踪，一键转办至政务服务平台"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-card p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索诉求..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppealStatus | 'all')}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部状态</option>
            {Object.entries(appealStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部类型</option>
            {appealCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="all">全部区域</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {appeals.map((appeal) => {
              const StatusIcon = statusIcons[appeal.status];
              return (
                <div
                  key={appeal.id}
                  onClick={() => setSelectedAppeal(appeal)}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedAppeal?.id === appeal.id
                      ? 'border-primary-300 bg-primary-50/50'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{appeal.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{appeal.content}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0', statusColors[appeal.status])}>
                      {appealStatusLabels[appeal.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {appeal.citizenName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {appeal.createTime.slice(5, 16)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2 bg-slate-50 rounded-xl p-5">
            {selectedAppeal ? (
              <div className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedAppeal.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border', statusColors[selectedAppeal.status])}>
                        {appealStatusLabels[selectedAppeal.status]}
                      </span>
                      <span className="text-xs text-slate-500">{selectedAppeal.category}</span>
                      <span className="text-xs text-slate-500">{selectedAppeal.district}</span>
                    </div>
                  </div>
                  {selectedAppeal.status === 'pending' && (
                    <button
                      onClick={() => handleTransferTo12345(selectedAppeal.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      转办12345
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> 诉求人
                    </p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{selectedAppeal.citizenName}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 联系电话
                    </p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{selectedAppeal.citizenPhone}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg col-span-2">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 事发地址
                    </p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{selectedAppeal.address}</p>
                  </div>
                </div>

                {selectedAppeal.platform12345Id && (
                  <div className="mb-5 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">已转办至12345平台</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      工单号：{selectedAppeal.platform12345Id}
                    </p>
                  </div>
                )}

                <div className="flex-1 bg-white rounded-lg p-4 min-h-0">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">诉求内容</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedAppeal.content}
                  </p>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">处理流程</h4>
                  <div className="relative">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                    <div className="space-y-4">
                      {selectedAppeal.logs.map((log, index) => (
                        <div key={log.id} className="relative flex gap-3 pl-8">
                          <div className={cn(
                            'absolute left-0 top-1 w-4 h-4 rounded-full border-2',
                            index === selectedAppeal.logs.length - 1
                              ? 'bg-primary-500 border-primary-500'
                              : 'bg-white border-slate-300'
                          )}>
                            {index === selectedAppeal.logs.length - 1 && (
                              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-30"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">{log.action}</span>
                              <span className="text-xs text-slate-400">{log.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {log.operator} · {log.remark}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <AlertCircle className="w-8 h-8 mr-2" />
                请选择一条诉求查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
