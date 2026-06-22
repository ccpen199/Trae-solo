import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Badge, Switch, message } from 'antd';
import { BellOutlined, CloudOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useOfflineStore } from '@/store/offlineStore';
import { riderService } from '@/services/rider.service';
import PageHeader from '@/components/PageHeader';
import TaskCard from '@/components/TaskCard';
import OrderCard from '@/components/OrderCard';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';
import { formatAmount, formatDistance } from '@/utils/format';
import type { TaskPool } from '@shared/types';

const { TabPane } = Tabs;

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

  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(user?.onlineStatus === 'online');
  const [showGrabConfirm, setShowGrabConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskPool | null>(null);
  const [grabLoading, setGrabLoading] = useState(false);

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
      await Promise.all([fetchAvailableTasks(), fetchCurrentTask()]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
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

  const headerRight = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{online ? '在线' : '离线'}</span>
        <Switch checked={online} onChange={handleOnlineChange} />
      </div>
      <Badge count={0}>
        <BellOutlined className="text-xl text-gray-600" />
      </Badge>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader
        title={`欢迎回来，${user?.name || '骑手'}`}
        rightContent={headerRight}
      />

      {!isOnline && (
        <div className="px-4 py-2 bg-red-50 text-red-500 text-sm flex items-center gap-1">
          <CloudOutlined /> 当前离线
        </div>
      )}

      {user?.creditScore !== undefined && (
        <div className="px-4 py-1 text-sm text-gray-500">
          信用分: {user.creditScore}
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
            <p className="text-sm text-gray-600 mb-3">
              {currentOrder.pickupAddress} → {currentOrder.deliveryAddress}
            </p>
            <button
              className="w-full btn-primary"
              onClick={() => navigate(`/order/${currentOrder.id}/execute`)}
            >
              继续配送
            </button>
          </div>
        </div>
      )}

      <Tabs defaultActiveKey="available" className="px-4 pt-4">
        <TabPane tab="可接任务" key="available">
          <div>
            {loading && <Loading />}
            {!loading && availableTasks.length === 0 && (
              <Empty description="暂无可用任务" />
            )}
            {availableTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onGrab={() => handleGrabClick(task)}
                onAccept={() => handleAcceptClick(task)}
              />
            ))}
          </div>
        </TabPane>

        <TabPane tab="我的任务" key="my">
          <div>
            {loading && <Loading />}
            {!loading && !currentTask && !currentOrder && (
              <Empty description="暂无进行中的任务" />
            )}
            {currentTask && <TaskCard task={currentTask} showActions={false} />}
            {currentOrder && <OrderCard order={currentOrder} />}
          </div>
        </TabPane>
      </Tabs>

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
