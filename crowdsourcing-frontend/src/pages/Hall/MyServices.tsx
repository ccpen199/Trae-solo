import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Empty, Spin, Button, Descriptions, Modal, Timeline } from 'antd';
import {
  UserOutlined,
  FileProtectOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  published: { label: '待受理', color: 'blue', icon: <ClockCircleOutlined /> },
  bidding: { label: '待分配', color: 'orange', icon: <ClockCircleOutlined /> },
  in_progress: { label: '办理中', color: 'processing', icon: <ClockCircleOutlined /> },
  submitted: { label: '已提交', color: 'cyan', icon: <CheckCircleOutlined /> },
  reviewing: { label: '审核中', color: 'purple', icon: <ClockCircleOutlined /> },
  completed: { label: '已办结', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: '已撤销', color: 'default', icon: <ExclamationCircleOutlined /> },
  disputed: { label: '有异议', color: 'red', icon: <ExclamationCircleOutlined /> },
  pending_review: { label: '待审核', color: 'gold', icon: <ClockCircleOutlined /> },
};

const MyServices: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const fetchMyTasks = async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      const result = await taskApi.getMyTasks({ page: 1, pageSize: 50 }) as any;
      setTasks(result?.list || []);
    } catch (error) {
      console.error('Fetch my tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyTasks(); }, [isLoggedIn]);

  const showDetail = (task: any) => {
    setSelectedTask(task);
    setDetailModal(true);
  };

  const getTimeline = (task: any) => {
    const st = statusMap[task.status] || { label: task.status };
    const items: any[] = [
      { color: 'green', children: <div><div className="font-medium">已提交</div><div className="text-xs text-gray-400">{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}</div></div> },
    ];
    if (['in_progress', 'submitted', 'reviewing', 'completed'].includes(task.status)) {
      items.push({ color: 'blue', children: <div><div className="font-medium">受理中</div><div className="text-xs text-gray-400">已分配承办单位</div></div> });
    }
    if (['submitted', 'reviewing', 'completed'].includes(task.status)) {
      items.push({ color: 'blue', children: <div><div className="font-medium">办理中</div><div className="text-xs text-gray-400">承办单位正在处理</div></div> });
    }
    if (task.status === 'completed') {
      items.push({ color: 'green', children: <div><div className="font-medium">已办结</div><div className="text-xs text-gray-400">{dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm')}</div></div> });
    }
    return items;
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p className="text-gray-500 mb-4">请先登录查看您的办件进度</p>
              <Button type="primary" onClick={() => navigate('/login')}>登录工作台</Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">我的办件</h1>
        <p className="text-purple-100">办件进度跟踪 · 受理结果查询 · 异议反馈</p>
      </div>

      <Card title={<span className="flex items-center gap-2"><FileProtectOutlined />办件列表</span>} extra={<Button onClick={fetchMyTasks} loading={loading}>刷新</Button>}>
        <Spin spinning={loading}>
          {tasks.length > 0 ? (
            <List
              dataSource={tasks}
              renderItem={(task: any) => {
                const st = statusMap[task.status] || { label: task.status, color: 'default' };
                return (
                  <List.Item
                    className="cursor-pointer hover:bg-purple-50 px-4 rounded transition-colors"
                    onClick={() => showDetail(task)}
                    actions={[<RightOutlined className="text-gray-300" />]}
                  >
                    <List.Item.Meta
                      avatar={<div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><FileProtectOutlined className="text-purple-600" /></div>}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Tag color={st.color}>{st.label}</Tag>
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500">
                          <span>编号: {task.requestNo || task.taskNo}</span>
                          <span className="ml-4">{dayjs(task.createdAt).format('YYYY-MM-DD')}</span>
                          {task.categoryName && <span className="ml-4">{task.categoryName}</span>}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="暂无办件记录" />
          )}
        </Spin>
      </Card>

      <Modal
        title="办件详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {selectedTask && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="办件编号">{selectedTask.requestNo || selectedTask.taskNo}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusMap[selectedTask.status]?.color || 'default'}>
                  {statusMap[selectedTask.status]?.label || selectedTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="事项名称" span={2}>{selectedTask.title}</Descriptions.Item>
              <Descriptions.Item label="受理部门">常州市政务服务中心</Descriptions.Item>
              <Descriptions.Item label="提交时间">{dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="事项描述" span={2}>{selectedTask.description}</Descriptions.Item>
            </Descriptions>

            <Card title="办理进度" size="small">
              <Timeline items={getTimeline(selectedTask)} />
            </Card>

            <Card title="材料与证照" size="small">
              {selectedTask.skillsRequired ? (
                <div className="flex flex-wrap gap-1">
                  {(typeof selectedTask.skillsRequired === 'string' ? JSON.parse(selectedTask.skillsRequired) : selectedTask.skillsRequired)?.map((s: string, i: number) => (
                    <Tag key={i}>{s}</Tag>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">暂无关联材料</div>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyServices;
