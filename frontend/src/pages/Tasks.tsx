import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Tag, List, Spin, message, Statistic } from 'antd';
import { CheckCircleOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import api from '../api';

interface Task {
  id: string;
  type: string;
  description: string;
  rewardAmount: number;
  completed: boolean;
}

interface CheckInData {
  streak: number;
  todayCheckedIn: boolean;
}

interface TaskHistory {
  id: string;
  taskType: string;
  rewardAmount: number;
  completedAt: string;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkIn, setCheckIn] = useState<CheckInData>({ streak: 0, todayCheckedIn: false });
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, checkInRes, historyRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/tasks/checkin'),
          api.get('/tasks/history'),
        ]);
        setTasks(tasksRes.data.items || []);
        setCheckIn(checkInRes.data);
        setHistory(historyRes.data.items || []);
      } catch {
        setTasks([
          { id: '1', type: 'daily_post', description: '发一条话题', rewardAmount: 5, completed: false },
          { id: '2', type: 'daily_comment', description: '评论3条话题', rewardAmount: 3, completed: true },
          { id: '3', type: 'daily_share', description: '分享一个商品', rewardAmount: 2, completed: false },
          { id: '4', type: 'invite', description: '邀请一位新邻居', rewardAmount: 20, completed: false },
        ]);
        setCheckIn({ streak: 5, todayCheckedIn: false });
        setHistory([
          { id: 'h1', taskType: '每日签到', rewardAmount: 2, completedAt: '2026-06-18T10:00:00Z' },
          { id: 'h2', taskType: '发一条话题', rewardAmount: 5, completedAt: '2026-06-18T14:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/tasks/checkin');
      setCheckIn((prev) => ({ ...prev, todayCheckedIn: true, streak: prev.streak + 1 }));
      message.success('签到成功！连续签到 ' + (checkIn.streak + 1) + ' 天');
    } catch {
      message.error('签到失败');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.post(`/tasks/${taskId}/complete`);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: true } : t));
      message.success('任务完成');
    } catch {
      message.error('任务完成失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="连续签到"
              value={checkIn.streak}
              suffix="天"
              prefix={<FireOutlined style={{ color: '#f50' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Button
              type={checkIn.todayCheckedIn ? 'default' : 'primary'}
              icon={<CheckCircleOutlined />}
              disabled={checkIn.todayCheckedIn}
              loading={checkingIn}
              onClick={handleCheckIn}
              block
              size="large"
            >
              {checkIn.todayCheckedIn ? '今日已签到 ✓' : '每日签到'}
            </Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日可领"
              value={tasks.filter((t) => !t.completed).reduce((sum, t) => sum + t.rewardAmount, 0)}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card title="任务列表" style={{ marginBottom: 16 }}>
        <List
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                task.completed ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>
                ) : (
                  <Button type="primary" size="small" onClick={() => handleCompleteTask(task.id)}>
                    完成
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                title={task.description}
                description={
                  <Tag color="gold">奖励 ¥{task.rewardAmount}</Tag>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="完成历史">
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.taskType}
                description={new Date(item.completedAt).toLocaleDateString('zh-CN')}
              />
              <Tag color="green">+¥{item.rewardAmount}</Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Tasks;
