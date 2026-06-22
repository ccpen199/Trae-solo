import { useState } from 'react';
import { Card, Tag, Button, List, Progress, message, Switch, Divider } from 'antd';
import {
  CloudSyncOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  WifiOutlined,
  DisconnectOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import Empty from '@/components/Empty';
import { useOfflineStore } from '@/store/offlineStore';

type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed';

interface SyncQueueItem {
  id: string;
  operation: string;
  orderNo: string;
  createdAt: number;
  retryCount: number;
  status: SyncStatus;
}

const operationLabels: Record<string, { label: string; color: string }> = {
  CREATE_ORDER: { label: '创建订单', color: 'blue' },
  UPDATE_ORDER: { label: '更新订单', color: 'cyan' },
  COMPLETE_ORDER: { label: '完成订单', color: 'green' },
  CANCEL_ORDER: { label: '取消订单', color: 'orange' },
  UPDATE_STATUS: { label: '更新状态', color: 'purple' },
  UPLOAD_LOCATION: { label: '上传位置', color: 'geekblue' },
  UPLOAD_PHOTO: { label: '上传凭证', color: 'magenta' },
};

const statusMap: Record<SyncStatus, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'gold', text: '等待同步', icon: <ClockCircleOutlined /> },
  syncing: { color: 'blue', text: '同步中', icon: <SyncOutlined spin /> },
  success: { color: 'green', text: '已同步', icon: <CheckCircleOutlined /> },
  failed: { color: 'red', text: '同步失败', icon: <ExclamationCircleOutlined /> },
};

const mockQueue: SyncQueueItem[] = [
  {
    id: '1',
    operation: 'COMPLETE_ORDER',
    orderNo: 'DD20240601003',
    createdAt: Date.now() - 10 * 60 * 1000,
    retryCount: 0,
    status: 'pending',
  },
  {
    id: '2',
    operation: 'UPDATE_STATUS',
    orderNo: 'DD20240601004',
    createdAt: Date.now() - 25 * 60 * 1000,
    retryCount: 1,
    status: 'pending',
  },
  {
    id: '3',
    operation: 'UPLOAD_PHOTO',
    orderNo: 'DD20240601002',
    createdAt: Date.now() - 45 * 60 * 1000,
    retryCount: 2,
    status: 'failed',
  },
  {
    id: '4',
    operation: 'UPLOAD_LOCATION',
    orderNo: '-',
    createdAt: Date.now() - 60 * 60 * 1000,
    retryCount: 0,
    status: 'success',
  },
];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const OfflineCenter: React.FC = () => {
  const { isOnline, pendingSync, syncInProgress, startSync, clearAll, lastSyncTime } = useOfflineStore();
  const [queue, setQueue] = useState<SyncQueueItem[]>(mockQueue);
  const [syncLoading, setSyncLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const displayQueue = pendingSync.length > 0
    ? pendingSync.map((p) => ({
        id: p.id,
        operation: p.method === 'POST' ? 'CREATE_ORDER' : p.method === 'PUT' ? 'UPDATE_ORDER' : 'UPDATE_STATUS',
        orderNo: p.data?.orderNo || '-',
        createdAt: p.timestamp,
        retryCount: p.retryCount,
        status: 'pending' as SyncStatus,
      }))
    : queue;

  const pendingCount = displayQueue.filter((q) => q.status === 'pending').length;
  const successCount = displayQueue.filter((q) => q.status === 'success').length;
  const failedCount = displayQueue.filter((q) => q.status === 'failed').length;

  const handleStartSync = async () => {
    if (pendingSync.length > 0) {
      setSyncLoading(true);
      try {
        await startSync();
        message.success('同步完成');
      } catch (error) {
        message.error('同步失败，请稍后重试');
      } finally {
        setSyncLoading(false);
      }
    } else {
      setSyncLoading(true);
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'pending' || item.status === 'failed'
            ? { ...item, status: 'syncing' as SyncStatus }
            : item
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setQueue((prev) =>
        prev.map((item) => {
          if (item.status === 'syncing') {
            return item.retryCount >= 3
              ? { ...item, status: 'failed' as SyncStatus, retryCount: item.retryCount + 1 }
              : { ...item, status: 'success' as SyncStatus };
          }
          return item;
        })
      );

      setSyncLoading(false);
      message.success('同步完成');
    }
  };

  const handleClearFailed = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'failed'));
    message.success('已清空失败记录');
  };

  return (
    <div className="page-container pb-20">
      <PageHeader title="离线中心" />

      <div className="px-4 pt-3">
        <Card size="small" className="shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <WifiOutlined className="text-green-500 text-lg" />
                  <div>
                    <p className="font-medium text-gray-800">在线</p>
                    <p className="text-xs text-gray-500">网络连接正常</p>
                  </div>
                </>
              ) : (
                <>
                  <DisconnectOutlined className="text-red-500 text-lg" />
                  <div>
                    <p className="font-medium text-gray-800">离线</p>
                    <p className="text-xs text-gray-500">操作已缓存，联网后自动同步</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">自动同步</span>
              <Switch size="small" checked={autoSync} onChange={setAutoSync} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">待同步</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{successCount + 12}</p>
              <p className="text-xs text-gray-500 mt-1">今日已同步</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{failedCount}</p>
              <p className="text-xs text-gray-500 mt-1">失败</p>
            </div>
          </div>

          {lastSyncTime && (
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
              <ClockCircleOutlined />
              上次同步：{formatTime(lastSyncTime)}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={syncLoading || syncInProgress}
              onClick={handleStartSync}
              disabled={pendingCount === 0 && failedCount === 0}
              className="flex-1"
            >
              立即同步
            </Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClearFailed}
              disabled={failedCount === 0}
              danger
            >
              清空失败
            </Button>
          </div>
        </Card>

        <Divider className="my-4" orientation="left" plain>
          <span className="text-sm text-gray-500">同步队列</span>
        </Divider>

        {displayQueue.length === 0 ? (
          <Empty description="暂无待同步数据" />
        ) : (
          <List
            dataSource={displayQueue}
            renderItem={(item) => {
              const opInfo = operationLabels[item.operation] || {
                label: item.operation,
                color: 'default',
              };
              const statusInfo = statusMap[item.status];

              return (
                <List.Item className="bg-white rounded-lg mb-2 shadow-sm px-3 py-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <SyncOutlined className="text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Tag color={opInfo.color}>{opInfo.label}</Tag>
                          <Tag color={statusInfo.color} icon={statusInfo.icon}>
                            {statusInfo.text}
                          </Tag>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-mono">{item.orderNo}</span>
                          <span className="flex items-center gap-1">
                            <ClockCircleOutlined />
                            {formatTime(item.createdAt)}
                          </span>
                          {item.retryCount > 0 && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <ReloadOutlined />
                              重试{item.retryCount}次
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.status === 'failed' && (
                      <Button
                        type="link"
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setQueue((prev) =>
                            prev.map((q) =>
                              q.id === item.id ? { ...q, status: 'pending' } : q
                            )
                          );
                        }}
                      >
                        重试
                      </Button>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <InfoCircleOutlined className="text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">离线使用说明</p>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                弱网环境下系统会自动缓存操作数据，包括订单状态更新、位置上传、凭证提交等。
                检测到网络恢复后将自动尝试同步，您也可以点击"立即同步"手动触发。
                同步失败的操作会自动重试最多3次，超过后请手动处理。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineCenter;
