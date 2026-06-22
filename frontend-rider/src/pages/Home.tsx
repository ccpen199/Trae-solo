import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Badge, Switch, message, Progress, Steps } from 'antd';
import {
  BellOutlined,
  CloudOutlined,
  IdcardOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  BorderOutlined,
  FileTextOutlined,
  MessageOutlined,
  BarChartOutlined,
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CarryOutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useOfflineStore } from '@/store/offlineStore';
import { riderService } from '@/services/rider.service';
import { orderService } from '@/services/order.service';
import TaskCard from '@/components/TaskCard';
import OrderCard from '@/components/OrderCard';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';
import { formatAmount, formatDistance, formatTime, formatOrderType } from '@/utils/format';
import type { TaskPool, Order, OrderStatus } from '@shared/types';

const { TabPane } = Tabs;

const vehicleTypeMap: Record<string, string> = {
  walk: '步行',
  bicycle: '自行车',
  electric_scooter: '电动滑板车',
  bike: '自行车',
  electric_bike: '电动车',
  motorcycle: '摩托车',
  car: '汽车',
};

const formatVehicleType = (type: string): string => vehicleTypeMap[type] || type;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const {
    availableTasks,
    currentTask,
    currentOrder,
    loading,
    fetchAvailableTasks,
    fetchCurrentTask,
    grabTask,
    acceptTask,
  } = useTaskStore();
  const { isOnline } = useOfflineStore();

  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [todayStats, setTodayStats] = useState({ orders: 0, earnings: 0 });
  const [timeoutWarnings, setTimeoutWarnings] = useState<any[]>([]);
  const [online, setOnline] = useState(user?.onlineStatus === 'online');
  const [showGrabConfirm, setShowGrabConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskPool | null>(null);
  const [grabLoading, setGrabLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentTask();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchCurrentTask]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchAvailableTasks(),
        fetchCurrentTask(),
        loadTodayOrders(),
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const loadTodayOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await orderService.getMyOrders({ page: 1, pageSize: 50 });
      const orders = result.items || [];
      setTodayOrders(orders);
      const earnings = orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + (o.amount ?? 0) + (o.tip ?? 0), 0);
      const completedCount = orders.filter((o) => o.status === 'completed').length;
      setTodayStats({ orders: completedCount, earnings });
      const warnings = orders.filter((o) => {
        if (o.status === 'completed' || o.status === 'cancelled') return false;
        if (!o.deadline) return false;
        const diff = new Date(o.deadline).getTime() - Date.now();
        return diff > 0 && diff < 30 * 60 * 1000;
      });
      setTimeoutWarnings(warnings);
    } catch (error) {
      console.error('Load today orders error:', error);
    }
  };

  const handleOnlineChange = async (checked: boolean) => {
    try {
      const result = await riderService.updateOnlineStatus({
        online: checked,
      });
      setOnline(checked);
      updateUser({ onlineStatus: result.onlineStatus });
      message.success(checked ? '已上线' : '已下线');
    } catch (error) {
      console.error('Update online status error:', error);
    }
  };

  const handleGrabClick = (task: TaskPool) => {
    setSelectedTask(task);
    setShowGrabConfirm(true);
  };

  const handleGrabConfirm = async () => {
    if (!selectedTask) return;

    setGrabLoading(true);
    try {
      const result = await grabTask(selectedTask.id);
      if (result.success) {
        message.success('抢单成功！');
        if (result.order) {
          navigate(`/order/${result.order.id}/execute`);
        }
      } else {
        message.error(result.message || '抢单失败');
      }
    } catch (error) {
      console.error('Grab task error:', error);
    } finally {
      setGrabLoading(false);
      setShowGrabConfirm(false);
    }
  };

  const handleAcceptClick = async (task: TaskPool) => {
    try {
      const result = await acceptTask(task.id);
      if (result.success) {
        message.success('接单成功！');
        if (result.order) {
          navigate(`/order/${result.order.id}/execute`);
        }
      } else {
        message.error(result.message || '接单失败');
      }
    } catch (error) {
      console.error('Accept task error:', error);
    }
  };

  const autoDispatchTasks = useMemo(() => {
    return availableTasks.filter((t) => t.dispatchMode === 'auto');
  }, [availableTasks]);

  const grabTasks = useMemo(() => {
    return availableTasks.filter((t) => t.dispatchMode !== 'auto' || t.isHot === true);
  }, [availableTasks]);

  const creditScore = user?.creditScore ?? 100;
  const isFrozen = user?.isFrozen === true || creditScore < 60;
  const isRealNameApproved = user?.realNameAuditStatus === 'approved';
  const qualificationAuditStatus = user?.qualificationAuditStatus ?? user?.auditStatus ?? 'pending';
  const isQualificationPending = qualificationAuditStatus === 'pending';

  const statusFlowCounts = useMemo(() => {
    const orders = todayOrders;
    const pending = availableTasks.length;
    const inProgress = orders.filter(
      (o) => o.status === 'accepted' || o.status === 'picking_up' || o.status === 'delivering'
    ).length + (currentOrder ? 1 : 0);
    const completed = orders.filter((o) => o.status === 'completed').length;
    const exception = orders.filter((o) => o.status === 'exception' || o.status === 'cancelled').length;
    return { pending, inProgress, completed, exception };
  }, [todayOrders, availableTasks, currentOrder]);

  const getCurrentStep = (status?: OrderStatus): number => {
    const stepMap: Record<string, number> = {
      pending: 0,
      accepted: 1,
      picking_up: 2,
      delivering: 3,
      completed: 4,
    };
    return status ? stepMap[status] ?? 0 : 0;
  };

  const StatusSteps = ({ status }: { status?: OrderStatus }) => (
    <Steps
      size="small"
      current={getCurrentStep(status)}
      className="mt-3"
      items={[
        { title: '待接单', icon: <ClockCircleOutlined /> },
        { title: '已接单', icon: <CheckCircleOutlined /> },
        { title: '取货中', icon: <CarryOutOutlined /> },
        { title: '配送中', icon: <EnvironmentOutlined /> },
        { title: '已完成', icon: <CheckCircleOutlined /> },
      ]}
    />
  );

  const quickAccessItems = [
    { icon: <IdcardOutlined />, label: '实名认证', path: '/profile/realname', color: 'text-blue-500 bg-blue-50' },
    { icon: <SettingOutlined />, label: '接单偏好', path: '/profile/preferences', color: 'text-purple-500 bg-purple-50' },
    { icon: <EnvironmentOutlined />, label: '实时定位', path: '/tracking', color: 'text-green-500 bg-green-50' },
    { icon: <BorderOutlined />, label: '地理围栏', path: '/geofence', color: 'text-cyan-500 bg-cyan-50' },
    { icon: <FileTextOutlined />, label: '申诉复查', path: '/appeals', color: 'text-orange-500 bg-orange-50' },
    { icon: <MessageOutlined />, label: '消息中心', path: '/messages', color: 'text-pink-500 bg-pink-50' },
    { icon: <BarChartOutlined />, label: '运营数据', path: '/stats', color: 'text-indigo-500 bg-indigo-50' },
    { icon: <WifiOutlined />, label: '离线中心', path: '/offline', color: 'text-gray-500 bg-gray-50' },
  ];

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold">
              欢迎回来，{user?.name || '骑手'}
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              {user?.phone ? `账号：${user.phone}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">{online ? '在线' : '离线'}</span>
              <Switch
                checked={online}
                onChange={handleOnlineChange}
                size="small"
              />
            </div>
            <Badge count={unreadCount} size="small">
              <BellOutlined className="text-2xl cursor-pointer" onClick={() => navigate('/messages')} />
            </Badge>
          </div>
        </div>
      </div>

      {!isOnline && (
        <div className="px-4 py-2 bg-red-50 text-red-500 text-sm flex items-center gap-1">
          <CloudOutlined /> 当前离线
        </div>
      )}

      <div className="px-4 pt-4">
        {!isRealNameApproved ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WarningOutlined className="text-2xl text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-700 mb-1">未完成实名认证</h3>
                <p className="text-sm text-yellow-600 mb-3">请先完成实名认证后才能接单</p>
                <button
                  className="btn-warning w-full"
                  onClick={() => navigate('/profile/realname')}
                >
                  去实名认证
                </button>
              </div>
            </div>
          </div>
        ) : isFrozen ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="text-2xl text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 mb-1">账号已冻结</h3>
                <p className="text-sm text-red-600 mb-1">
                  冻结原因：{user?.frozenReason ?? '信用分低于60分'}
                </p>
                {user?.frozenUntil && (
                  <p className="text-sm text-red-600 mb-3">
                    解冻时间：{formatTime(user.frozenUntil)}
                  </p>
                )}
                <button
                  className="btn-danger w-full"
                  onClick={() => navigate('/appeals')}
                >
                  申诉解冻
                </button>
              </div>
            </div>
          </div>
        ) : isQualificationPending ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ClockCircleOutlined className="text-2xl text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700 mb-1">资质审核中</h3>
                <p className="text-sm text-blue-600">资质审核中，请耐心等待</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircleOutlined className="text-2xl text-green-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-700 mb-2">正常可接单</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {isRealNameApproved && (
                    <span className="status-badge bg-green-100 text-green-700">实名认证 ✓</span>
                  )}
                  {qualificationAuditStatus === 'approved' && (
                    <span className="status-badge bg-green-100 text-green-700">资质认证 ✓</span>
                  )}
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">信用分</span>
                    <span className="text-sm font-medium text-gray-800">{creditScore} / 100</span>
                  </div>
                  <Progress
                    percent={creditScore}
                    showInfo={false}
                    strokeColor={creditScore >= 80 ? '#52c41a' : creditScore >= 60 ? '#faad14' : '#ff4d4f'}
                    size="small"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500">今日完成</p>
                    <p className="text-xl font-bold text-gray-800">{todayStats.orders} 单</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500">今日收入</p>
                    <p className="text-xl font-bold text-green-600">{formatAmount(todayStats.earnings)}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>车辆：{formatVehicleType(user?.vehicleType ?? 'electric_bike')}</span>
                  {user?.vehiclePlate && <span>车牌：{user.vehiclePlate}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="card">
          <div className="grid grid-cols-4 gap-3">
            {quickAccessItems.map((item) => (
              <button
                key={item.path}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => navigate(item.path)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {timeoutWarnings.length > 0 && (
        <div className="px-4 pt-2">
          <div
            className="bg-red-500 text-white rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-red-600 transition-colors"
            onClick={() => navigate('/orders')}
          >
            <div className="flex items-center gap-2">
              <WarningOutlined />
              <span className="text-sm font-medium">
                您有 {timeoutWarnings.length} 单即将超时，请立即处理！
              </span>
            </div>
            <span className="text-sm">[查看]</span>
          </div>
        </div>
      )}

      {currentOrder && (
        <div className="px-4 pt-4">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-blue-600 font-medium">当前任务</span>
              <span className="text-lg font-bold text-blue-500">
                {formatAmount(currentOrder.amount)}
              </span>
            </div>
            <div className="mb-2">
              <span className="status-badge bg-blue-100 text-blue-700">
                {formatOrderType(currentOrder.type)}
              </span>
              {currentOrder.isUrgent && (
                <span className="status-badge bg-red-100 text-red-600 ml-2">加急</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {currentOrder.pickupAddress} → {currentOrder.deliveryAddress}
            </p>
            <StatusSteps status={currentOrder.status} />
            <button
              className="w-full btn-primary mt-4"
              onClick={() => navigate(`/order/${currentOrder.id}/execute`)}
            >
              继续配送
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <Tabs defaultActiveKey="auto" className="task-tabs">
          <TabPane tab="智能派单" key="auto">
            <div>
              {loading && <Loading />}
              {!loading && autoDispatchTasks.length === 0 && (
                <Empty description="暂无智能派单任务" />
              )}
              {autoDispatchTasks.map((task) => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    onGrab={() => handleGrabClick(task)}
                    onAccept={() => handleAcceptClick(task)}
                  />
                  <StatusSteps status={task.order?.status} />
                </div>
              ))}
            </div>
          </TabPane>

          <TabPane tab="手动抢单" key="grab">
            <div>
              {loading && <Loading />}
              {!loading && grabTasks.length === 0 && (
                <Empty description="暂无可抢任务" />
              )}
              {grabTasks.map((task) => (
                <div key={task.id} className="relative">
                  {task.isHot && (
                    <span className="absolute -top-1 -right-1 z-10 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      🔥 热门
                    </span>
                  )}
                  <TaskCard
                    task={task}
                    onGrab={() => handleGrabClick(task)}
                    onAccept={() => handleAcceptClick(task)}
                  />
                  <StatusSteps status={task.order?.status} />
                </div>
              ))}
            </div>
          </TabPane>

          <TabPane tab="我的任务" key="my">
            <div>
              {loading && <Loading />}
              {!loading && !currentTask && !currentOrder && todayOrders.length === 0 && (
                <Empty description="暂无进行中的任务" />
              )}
              {currentTask && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">当前分配任务</p>
                  <TaskCard task={currentTask} showActions={false} />
                  <StatusSteps status={currentTask.order?.status} />
                </div>
              )}
              {currentOrder && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">进行中订单</p>
                  <OrderCard order={currentOrder} />
                  <StatusSteps status={currentOrder.status} />
                </div>
              )}
              {todayOrders.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">今日历史订单</p>
                  {todayOrders.map((order) => (
                    <div key={order.id}>
                      <OrderCard order={order} />
                      <StatusSteps status={order.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      <div className="px-4 pt-4 pb-4">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">今日状态流转</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{statusFlowCounts.pending}</p>
              <p className="text-xs text-gray-500 mt-1">待接单</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{statusFlowCounts.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">进行中</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{statusFlowCounts.completed}</p>
              <p className="text-xs text-gray-500 mt-1">已完成</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{statusFlowCounts.exception}</p>
              <p className="text-xs text-gray-500 mt-1">异常</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showGrabConfirm}
        title="确认抢单"
        content={
          selectedTask
            ? `确认抢单此任务？\n距离: ${formatDistance(selectedTask.distance ?? 0)}\n预估收入: ${formatAmount(selectedTask.estimatedAmount ?? selectedTask.order?.amount)}`
            : ''
        }
        okText="确认抢单"
        okType="primary"
        onOk={handleGrabConfirm}
        onCancel={() => setShowGrabConfirm(false)}
        loading={grabLoading}
      />
    </div>
  );
};

export default Home;
