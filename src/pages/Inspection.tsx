import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  Eye,
  Edit3,
  FileText,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Tabs, { TabPanel } from '@/components/Tabs';
import { cn } from '@/lib/utils';

interface InspectionPlan {
  id: string;
  title: string;
  area: string;
  start_date: string;
  end_date: string;
  assignees: string[];
  status: 'planned' | 'in_progress' | 'completed';
  total_tasks: number;
  completed_tasks: number;
}

interface InspectionRecord {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  account_no: string;
  address: string;
  plan_title: string;
  inspector: string;
  inspect_date: string;
  result: 'pass' | 'warning' | 'fail';
  notes: string;
  images: string[];
  converted_to_work_order: string | null;
}

interface GridWorker {
  id: string;
  name: string;
  phone: string;
  area: string;
  status: string;
  active_orders: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

const planStatusConfig: Record<string, { variant: 'success' | 'warning' | 'info' | 'default'; label: string }> = {
  planned: { variant: 'default', label: '待开始' },
  in_progress: { variant: 'warning', label: '进行中' },
  completed: { variant: 'success', label: '已完成' },
};

const resultConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string; icon: typeof CheckCircle2 }> = {
  pass: { variant: 'success', label: '合格', icon: CheckCircle2 },
  warning: { variant: 'warning', label: '隐患', icon: AlertTriangle },
  fail: { variant: 'danger', label: '不合格', icon: XCircle },
};

const areas = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 1) return '今天';
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function Inspection() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [plansTotal, setPlansTotal] = useState(0);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [plansPage, setPlansPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [pageSize] = useState(10);

  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showResultDropdown, setShowResultDropdown] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    area: '',
    start_date: '',
    end_date: '',
    assignees: [] as string[],
    total_tasks: 0,
  });

  const [workers, setWorkers] = useState<GridWorker[]>([]);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const params = new URLSearchParams({
        page: String(plansPage),
        pageSize: String(pageSize),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (areaFilter) params.append('area', areaFilter);

      const res = await fetch(`/api/inspections/plans?${params}`);
      const data: ApiResponse<ListResponse<InspectionPlan>> = await res.json();

      if (data.success) {
        setPlans(data.data.list);
        setPlansTotal(data.data.total);
      }
    } catch (err) {
      console.error('获取巡检计划失败:', err);
    } finally {
      setPlansLoading(false);
    }
  }, [statusFilter, areaFilter, plansPage, pageSize]);

  const fetchRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      const params = new URLSearchParams({
        page: String(recordsPage),
        pageSize: String(pageSize),
      });
      if (resultFilter !== 'all') params.append('result', resultFilter);

      const res = await fetch(`/api/inspections/records?${params}`);
      const data: ApiResponse<ListResponse<InspectionRecord>> = await res.json();

      if (data.success) {
        setRecords(data.data.list);
        setRecordsTotal(data.data.total);
      }
    } catch (err) {
      console.error('获取巡检记录失败:', err);
    } finally {
      setRecordsLoading(false);
    }
  }, [resultFilter, recordsPage, pageSize]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/gis/grid-workers');
      const data: ApiResponse<GridWorker[]> = await res.json();
      if (data.success) {
        setWorkers(data.data);
      }
    } catch (err) {
      console.error('获取网格员列表失败:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchRecords();
    }
  }, [activeTab, fetchPlans, fetchRecords]);

  useEffect(() => {
    if (showCreateModal) {
      fetchWorkers();
    }
  }, [showCreateModal, fetchWorkers]);

  const handleCreatePlan = async () => {
    if (!createForm.title || !createForm.area || !createForm.start_date || !createForm.end_date) {
      alert('请填写完整信息');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/inspections/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          area: '',
          start_date: '',
          end_date: '',
          assignees: [],
          total_tasks: 0,
        });
        fetchPlans();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleConvertToOrder = async (recordId: string) => {
    if (!confirm('确定要将此巡检记录转为工单吗？')) return;

    try {
      setConverting(true);
      const res = await fetch(`/api/inspections/records/${recordId}/convert-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 'high' }),
      });
      const data = await res.json();

      if (data.success) {
        alert('转工单成功');
        fetchRecords();
        if (selectedRecord?.id === recordId) {
          setSelectedRecord({ ...selectedRecord, converted_to_work_order: data.data.work_order.id });
        }
      } else {
        alert(data.error || '转工单失败');
      }
    } catch (err) {
      alert('转工单失败');
    } finally {
      setConverting(false);
    }
  };

  const handleViewPlanDetail = (plan: InspectionPlan) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
  };

  const handleViewRecordDetail = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const toggleWorker = (workerName: string) => {
    setCreateForm((f) => ({
      ...f,
      assignees: f.assignees.includes(workerName)
        ? f.assignees.filter((a) => a !== workerName)
        : [...f.assignees, workerName],
    }));
  };

  const filteredWorkers = createForm.area
    ? workers.filter((w) => w.area === createForm.area)
    : workers;

  const tabItems = [
    { key: 'plans', label: '巡检计划', icon: ClipboardList },
    { key: 'records', label: '巡检记录', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">巡检管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理巡检计划和巡检记录</p>
        </div>
        {activeTab === 'plans' && (
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            创建计划
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6 pt-4"
        >
          <TabPanel tabKey="plans">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 pb-4">
                <div className="flex items-center gap-2">
                  {['all', 'planned', 'in_progress', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setPlansPage(1);
                      }}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                        statusFilter === status
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {status === 'all' ? '全部' : planStatusConfig[status].label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex items-center gap-3 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索计划名称..."
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                        setPlansPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Button
                      variant="secondary"
                      icon={Filter}
                      onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                      className="min-w-[100px]"
                    >
                      <span className="flex items-center gap-1">
                        {areaFilter || '全部片区'}
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </Button>
                    {showAreaDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                        <button
                          onClick={() => {
                            setAreaFilter('');
                            setShowAreaDropdown(false);
                            setPlansPage(1);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                            !areaFilter && 'text-primary-600 font-medium'
                          )}
                        >
                          全部片区
                        </button>
                        {areas.map((area) => (
                          <button
                            key={area}
                            onClick={() => {
                              setAreaFilter(area);
                              setShowAreaDropdown(false);
                              setPlansPage(1);
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                              areaFilter === area && 'text-primary-600 font-medium'
                            )}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {plansLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-5 animate-pulse"
                    >
                      <div className="space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-2 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : plans.length === 0 ? (
                  <div className="py-12 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂无巡检计划</p>
                  </div>
                ) : (
                  plans.map((plan) => {
                    const status = planStatusConfig[plan.status];
                    const progress = plan.total_tasks > 0 ? (plan.completed_tasks / plan.total_tasks) * 100 : 0;

                    return (
                      <div
                        key={plan.id}
                        className="bg-gray-50 rounded-xl p-5 hover:bg-primary-50/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-base font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                {plan.title}
                              </h3>
                              <StatusBadge variant={status.variant} icon>
                                {status.label}
                              </StatusBadge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {plan.area}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPlanDetail(plan)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-gray-500">巡检进度</span>
                            <span className="font-medium text-gray-700">
                              {plan.completed_tasks} / {plan.total_tasks}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                plan.status === 'completed'
                                  ? 'bg-success'
                                  : 'bg-primary-500'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">网格员：</span>
                            <div className="flex -space-x-2">
                              {plan.assignees.slice(0, 3).map((name, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium border-2 border-white"
                                  title={name}
                                >
                                  {name.charAt(0)}
                                </div>
                              ))}
                              {plan.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium border-2 border-white">
                                  +{plan.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewPlanDetail(plan)}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            查看详情
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {plansTotal > pageSize && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <button
                    onClick={() => setPlansPage((p) => Math.max(1, p - 1))}
                    disabled={plansPage === 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-500">
                    第 {plansPage} 页 / 共 {Math.ceil(plansTotal / pageSize)} 页
                  </span>
                  <button
                    onClick={() => setPlansPage((p) => p + 1)}
                    disabled={plansPage >= Math.ceil(plansTotal / pageSize)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel tabKey="records">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 pb-4">
                <div className="flex items-center gap-2">
                  {['all', 'pass', 'warning', 'fail'].map((result) => (
                    <button
                      key={result}
                      onClick={() => {
                        setResultFilter(result);
                        setRecordsPage(1);
                      }}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                        resultFilter === result
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {result === 'all' ? '全部' : resultConfig[result].label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex items-center gap-3 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索户号、用户姓名..."
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                        setRecordsPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">巡检日期</th>
                      <th className="pb-3 font-medium">用户户号</th>
                      <th className="pb-3 font-medium">片区</th>
                      <th className="pb-3 font-medium">检查员</th>
                      <th className="pb-3 font-medium">结果</th>
                      <th className="pb-3 font-medium">隐患项</th>
                      <th className="pb-3 font-medium">状态</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td colSpan={8} className="py-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">暂无巡检记录</p>
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => {
                        const result = resultConfig[record.result];
                        const ResultIcon = result.icon;
                        const hasConverted = !!record.converted_to_work_order;

                        return (
                          <tr
                            key={record.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 text-sm text-gray-700">
                              {formatDate(record.inspect_date)}
                            </td>
                            <td className="py-4">
                              <div className="text-sm font-medium text-gray-800">
                                {record.account_no}
                              </div>
                              <div className="text-xs text-gray-500">{record.user_name}</div>
                            </td>
                            <td className="py-4 text-sm text-gray-600">{record.address?.split('区')[0]}区</td>
                            <td className="py-4 text-sm text-gray-600">{record.inspector}</td>
                            <td className="py-4">
                              <StatusBadge variant={result.variant} icon>
                                {result.label}
                              </StatusBadge>
                            </td>
                            <td className="py-4 text-sm text-gray-600 max-w-[150px] truncate">
                              {record.result === 'pass' ? '-' : record.notes}
                            </td>
                            <td className="py-4">
                              {hasConverted ? (
                                <StatusBadge variant="info" icon>
                                  已转工单
                                </StatusBadge>
                              ) : record.result === 'pass' ? (
                                <StatusBadge variant="success" icon>
                                  已完成
                                </StatusBadge>
                              ) : (
                                <StatusBadge variant="warning" icon>
                                  待处理
                                </StatusBadge>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewRecordDetail(record)}
                                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="查看详情"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!hasConverted && record.result !== 'pass' && (
                                  <button
                                    onClick={() => handleConvertToOrder(record.id)}
                                    className="p-2 text-gray-400 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                                    title="转工单"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {recordsTotal > pageSize && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <button
                    onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                    disabled={recordsPage === 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-500">
                    第 {recordsPage} 页 / 共 {Math.ceil(recordsTotal / pageSize)} 页
                  </span>
                  <button
                    onClick={() => setRecordsPage((p) => p + 1)}
                    disabled={recordsPage >= Math.ceil(recordsTotal / pageSize)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建巡检计划"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreatePlan} loading={creating}>
              创建计划
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              计划名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="请输入计划名称"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              片区 <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.area}
              onChange={(e) => {
                setCreateForm((f) => ({ ...f, area: e.target.value, assignees: [] }));
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">请选择片区</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务总数
            </label>
            <input
              type="number"
              value={createForm.total_tasks || ''}
              onChange={(e) => setCreateForm((f) => ({ ...f, total_tasks: parseInt(e.target.value) || 0 }))}
              placeholder="请输入任务总数"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分配人员
            </label>
            <button
              type="button"
              onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[40px]"
            >
              {createForm.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {createForm.assignees.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-md"
                    >
                      {name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWorker(name);
                        }}
                        className="hover:text-primary-800"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">
                  {createForm.area ? '请选择分配人员' : '请先选择片区'}
                </span>
              )}
            </button>
            {showWorkerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                {filteredWorkers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    该片区暂无网格员
                  </div>
                ) : (
                  filteredWorkers.map((worker) => (
                    <label
                      key={worker.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.assignees.includes(worker.name)}
                        onChange={() => toggleWorker(worker.name)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700">{worker.name}</div>
                        <div className="text-xs text-gray-400">{worker.phone}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPlan ? '巡检计划详情' : '巡检记录详情'}
        size="lg"
      >
        {selectedPlan ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedPlan.title}</h3>
              <StatusBadge variant={planStatusConfig[selectedPlan.status].variant} icon>
                {planStatusConfig[selectedPlan.status].label}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">片区</div>
                <div className="font-medium text-gray-800">{selectedPlan.area}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">时间范围</div>
                <div className="font-medium text-gray-800">
                  {formatDate(selectedPlan.start_date)} ~ {formatDate(selectedPlan.end_date)}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">巡检进度</span>
                <span className="text-sm font-medium text-gray-700">
                  {selectedPlan.completed_tasks} / {selectedPlan.total_tasks}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    selectedPlan.status === 'completed' ? 'bg-success' : 'bg-primary-500'
                  )}
                  style={{ width: `${selectedPlan.total_tasks > 0 ? (selectedPlan.completed_tasks / selectedPlan.total_tasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">分配人员</div>
              <div className="flex flex-wrap gap-2">
                {selectedPlan.assignees.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                      {name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-primary-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedRecord ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedRecord.account_no}
                </h3>
                <p className="text-sm text-gray-500">{selectedRecord.user_name}</p>
              </div>
              <StatusBadge variant={resultConfig[selectedRecord.result].variant} icon>
                {resultConfig[selectedRecord.result].label}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">巡检日期</div>
                <div className="font-medium text-gray-800">
                  {formatDate(selectedRecord.inspect_date)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">检查员</div>
                <div className="font-medium text-gray-800">{selectedRecord.inspector}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">所属计划</div>
                <div className="font-medium text-gray-800">{selectedRecord.plan_title}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">工单状态</div>
                <div className="font-medium text-gray-800">
                  {selectedRecord.converted_to_work_order ? '已转工单' : '未转工单'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">用户地址</div>
              <div className="font-medium text-gray-800">{selectedRecord.address}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">巡检备注</div>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm">
                {selectedRecord.notes || '无'}
              </div>
            </div>

            {!selectedRecord.converted_to_work_order && selectedRecord.result !== 'pass' && (
              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => handleConvertToOrder(selectedRecord.id)}
                  loading={converting}
                >
                  转为工单
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
