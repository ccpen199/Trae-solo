import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  LayoutGrid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { PickupTask, TaskStatus } from 'shared/types';
import { TaskCard } from '@/components/TaskCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { Modal, ModalFooter } from '@/components/Modal';
import { useTaskStore } from '@/store/task';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const statusTabs: { key: TaskStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: 'bg-gray-500' },
  { key: 'pending', label: '待揽收', color: 'bg-yellow-500' },
  { key: 'assigned', label: '已指派', color: 'bg-blue-500' },
  { key: 'picked', label: '揽收中', color: 'bg-green-500' },
  { key: 'completed', label: '已完成', color: 'bg-emerald-500' },
  { key: 'exception', label: '异常', color: 'bg-red-500' },
];

const priorityOptions = [
  { key: 'high', label: '高优先级', color: 'text-red-600 bg-red-50' },
  { key: 'medium', label: '中优先级', color: 'text-yellow-600 bg-yellow-50' },
  { key: 'low', label: '低优先级', color: 'text-green-600 bg-green-50' },
];

const timeSlotOptions = [
  { key: 'morning', label: '上午 (09:00-12:00)' },
  { key: 'afternoon', label: '下午 (14:00-18:00)' },
  { key: 'evening', label: '晚上 (18:00-21:00)' },
];

const mockCouriers = [
  { id: '1', name: '张快递' },
  { id: '2', name: '李配送' },
  { id: '3', name: '王揽收' },
];

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    total,
    loading,
    error,
    filters,
    viewMode,
    selectedTaskIds,
    fetchTasks,
    setFilters,
    resetFilters,
    setViewMode,
    toggleTaskSelection,
    clearTaskSelection,
    batchAssignTasks,
  } = useTaskStore();

  const { hasRole } = useAuthStore();
  const { addNotification } = useAppStore();
  const isAdmin = hasRole(['admin', 'operator']);

  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleStatusTabClick = (status: TaskStatus | 'all') => {
    setFilters({ status, page: 1 });
  };

  const handlePriorityChange = (priority: 'high' | 'medium' | 'low' | undefined) => {
    setFilters({ priority, page: 1 });
  };

  const handleTimeSlotChange = (timeSlot: 'morning' | 'afternoon' | 'evening' | undefined) => {
    setFilters({ timeSlot, page: 1 });
  };

  const handleDateApply = () => {
    setFilters({ startDate, endDate, page: 1 });
  };

  const handleSearch = () => {
    setFilters({ pickupCode: searchCode, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewDetail = (task: PickupTask) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleStartPickup = (task: PickupTask) => {
    navigate(`/offline-pickup?taskId=${task.id}`);
  };

  const handleBatchAssign = async () => {
    if (!selectedCourier) {
      addNotification({
        type: 'warning',
        title: '请选择快递员',
        message: '请先选择要分配的快递员',
      });
      return;
    }

    try {
      await batchAssignTasks(selectedTaskIds, selectedCourier);
      addNotification({
        type: 'success',
        title: '分配成功',
        message: `已将 ${selectedTaskIds.length} 个任务分配给快递员`,
      });
      setShowBatchAssignModal(false);
      setSelectedCourier('');
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '分配失败',
        message: err.message || '批量分配失败',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  const tableColumns = [
    {
      key: 'select',
      title: isAdmin ? (
        <input
          type="checkbox"
          checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              tasks.forEach((t) => {
                if (!selectedTaskIds.includes(t.id)) {
                  toggleTaskSelection(t.id);
                }
              });
            } else {
              clearTaskSelection();
            }
          }}
          className="w-4 h-4 text-primary rounded focus:ring-primary"
        />
      ) : (
        ''
      ),
      render: (row: PickupTask) =>
        isAdmin ? (
          <input
            type="checkbox"
            checked={selectedTaskIds.includes(row.id)}
            onChange={() => toggleTaskSelection(row.id)}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
            onClick={(e) => e.stopPropagation()}
          />
        ) : null,
      className: 'w-12',
    },
    {
      key: 'pickupCode',
      title: '揽收码',
      render: (row: PickupTask) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {row.pickupCode}
        </span>
      ),
    },
    {
      key: 'taskNo',
      title: '任务编号',
      render: (row: PickupTask) => <span className="font-medium">{row.taskNo}</span>,
    },
    {
      key: 'senderAddress',
      title: '寄件地址',
      render: (row: PickupTask) => (
        <span className="text-gray-600 line-clamp-1 max-w-xs">
          {row.senderAddress}
        </span>
      ),
    },
    {
      key: 'itemType',
      title: '物品类型',
    },
    {
      key: 'estimatedWeight',
      title: '预估重量',
      render: (row: PickupTask) => (
        <span>{row.actualWeight ?? row.estimatedWeight} kg</span>
      ),
    },
    {
      key: 'appointmentTime',
      title: '预约时间',
      render: (row: PickupTask) =>
        dayjs(row.appointmentTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: PickupTask) => <StatusBadge status={row.status} type="task" />,
    },
    {
      key: 'freight',
      title: '运费',
      render: (row: PickupTask) =>
        row.freight !== undefined ? (
          <span className="font-semibold text-primary">
            ¥{row.freight.toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: PickupTask) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(row);
            }}
            className="px-3 py-1.5 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            详情
          </button>
          {(row.status === 'assigned' || row.status === 'pending') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartPickup(row);
              }}
              className="px-3 py-1.5 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              揽收
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 animate-slide-down">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">揽收任务列表</h1>
        <p className="text-gray-500">管理和处理所有揽收任务</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-slide-down">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => fetchTasks()}
            className="ml-auto px-3 py-1 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 animate-slide-down">
        <div className="flex items-center border-b border-gray-100 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusTabClick(tab.key)}
              className={cn(
                'relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                filters.status === tab.key
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn('w-2 h-2 rounded-full', tab.color)}
                />
                {tab.label}
              </span>
              {filters.status === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索揽收码..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              搜索
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleDateApply}
              className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              应用
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && selectedTaskIds.length > 0 && (
              <button
                onClick={() => setShowBatchAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                批量分配 ({selectedTaskIds.length})
              </button>
            )}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showSidebar ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'card'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'table'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {showSidebar && (
          <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              快捷筛选
            </h3>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">优先级</h4>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() =>
                      handlePriorityChange(
                        filters.priority === option.key
                          ? undefined
                          : (option.key as 'high' | 'medium' | 'low')
                      )
                    }
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg text-left transition-colors',
                      filters.priority === option.key
                        ? option.color + ' font-medium'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">预约时段</h4>
              <div className="space-y-2">
                {timeSlotOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() =>
                      handleTimeSlotChange(
                        filters.timeSlot === option.key
                          ? undefined
                          : (option.key as 'morning' | 'afternoon' | 'evening')
                      )
                    }
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg text-left transition-colors',
                      filters.timeSlot === option.key
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                resetFilters();
                setStartDate('');
                setEndDate('');
                setSearchCode('');
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重置筛选
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === 'card' ? (
            <div className="flex-1 overflow-auto">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-medium">暂无任务</p>
                  <p className="text-sm mt-1">请尝试调整筛选条件</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onViewDetail={handleViewDetail}
                      onStartPickup={handleStartPickup}
                      selectable={isAdmin}
                      selected={selectedTaskIds.includes(task.id)}
                      onSelect={toggleTaskSelection}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <Table
                columns={tableColumns}
                data={tasks}
                loading={loading}
                rowKey="id"
                onRowClick={(row) => handleViewDetail(row)}
                emptyText="暂无任务数据"
              />
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 bg-white rounded-xl p-4">
              <p className="text-sm text-gray-500">
                共 <span className="font-semibold text-gray-900">{total}</span> 条记录，
                第 <span className="font-semibold text-gray-900">{filters.page}</span> /{' '}
                {totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (filters.page <= 3) {
                    pageNum = i + 1;
                  } else if (filters.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = filters.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg font-medium transition-colors',
                        filters.page === pageNum
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showBatchAssignModal}
        onClose={() => {
          setShowBatchAssignModal(false);
          setSelectedCourier('');
        }}
        title="批量分配任务"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            已选择 <span className="font-semibold text-primary">{selectedTaskIds.length}</span> 个任务，请选择要分配的快递员：
          </p>
          <div className="space-y-2">
            {mockCouriers.map((courier) => (
              <label
                key={courier.id}
                className={cn(
                  'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                  selectedCourier === courier.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="courier"
                  value={courier.id}
                  checked={selectedCourier === courier.id}
                  onChange={() => setSelectedCourier(courier.id)}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <p className="font-medium text-gray-900">{courier.name}</p>
                  <p className="text-sm text-gray-500">快递员</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <ModalFooter>
          <button
            onClick={() => {
              setShowBatchAssignModal(false);
              setSelectedCourier('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleBatchAssign}
            disabled={!selectedCourier || loading}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            确认分配
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default TaskList;
