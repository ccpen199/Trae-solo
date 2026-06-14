import { Card, List, Tag, Button, Badge, Row, Col, Statistic } from 'antd';
import {
  CarryOutOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  FormOutlined,
  RightOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface TaskItem {
  id: string;
  name: string;
  placeName: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  priorityName: string;
}

interface HistoryItem {
  id: string;
  name: string;
  placeName: string;
  completedAt: string;
  result: 'pass' | 'fail';
  resultName: string;
}

const InspectorWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const todayTasks: TaskItem[] = [
    { id: '1', name: '日常安全巡检', placeName: '金阳光网吧（历下区）', deadline: '14:00', priority: 'high', priorityName: '紧急' },
    { id: '2', name: '消防设施检查', placeName: '星际网咖（市中区）', deadline: '16:00', priority: 'medium', priorityName: '一般' },
    { id: '3', name: '实名核验抽检', placeName: '飞翔网络会所（槐荫区）', deadline: '17:30', priority: 'low', priorityName: '普通' },
    { id: '4', name: '经营资质复核', placeName: '网虫部落（天桥区）', deadline: '18:00', priority: 'medium', priorityName: '一般' },
  ];

  const weeklyStats = {
    completed: 12,
    inProgress: 2,
    pending: 3,
  };

  const priorityColorMap: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
  };

  const historyRecords: HistoryItem[] = [
    { id: '1', name: '日常安全巡检', placeName: '极客网咖（历城区）', completedAt: '06-08 16:30', result: 'pass', resultName: '通过' },
    { id: '2', name: '消防设施检查', placeName: '阳光网咖（长清区）', completedAt: '06-08 14:20', result: 'fail', resultName: '不通过' },
    { id: '3', name: '实名核验抽检', placeName: '极速网络（章丘区）', completedAt: '06-07 17:00', result: 'pass', resultName: '通过' },
    { id: '4', name: '日常安全巡检', placeName: '飞鱼网咖（济阳区）', completedAt: '06-07 15:10', result: 'pass', resultName: '通过' },
    { id: '5', name: '经营资质复核', placeName: '梦幻网络（莱芜区）', completedAt: '06-06 11:30', result: 'pass', resultName: '通过' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card
        title={
          <span className="font-semibold">
            <CarryOutOutlined className="mr-2 text-primary-500" />
            今日待执行任务
            <Badge count={todayTasks.length} className="ml-2" />
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '8px 0' }}
      >
        <List
          dataSource={todayTasks}
          renderItem={(item) => (
            <List.Item className="px-4 py-3 hover:bg-neutral-50 transition-colors">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag color={priorityColorMap[item.priority]}>{item.priorityName}</Tag>
                    <span className="text-sm font-medium text-neutral-600">{item.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-400">
                  <span>
                    <EnvironmentOutlined className="mr-1" />
                    {item.placeName}
                  </span>
                  <span>
                    <ClockCircleOutlined className="mr-1" />
                    截止 {item.deadline}
                  </span>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <div className="lg:col-span-1 flex flex-col gap-4">
        <Card
          title={
            <span className="font-semibold">
              <CalendarOutlined className="mr-2 text-warning-500" />
              本周巡检统计
            </span>
          }
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">已完成</span>}
                value={weeklyStats.completed}
                valueStyle={{ color: '#00B42A', fontSize: '24px' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">进行中</span>}
                value={weeklyStats.inProgress}
                valueStyle={{ color: '#165DFF', fontSize: '24px' }}
                prefix={<SyncOutlined spin />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">待执行</span>}
                value={weeklyStats.pending}
                valueStyle={{ color: '#86909C', fontSize: '24px' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <span className="font-semibold">
              <CheckSquareOutlined className="mr-2 text-success-500" />
              快捷操作
            </span>
          }
          bodyStyle={{ padding: '16px' }}
        >
          <div className="flex flex-col gap-3">
            <Button
              type="primary"
              size="large"
              icon={<EnvironmentOutlined />}
              block
              onClick={() => navigate('/inspection')}
            >
              签到打卡
            </Button>
            <Button
              size="large"
              icon={<FormOutlined />}
              block
              onClick={() => navigate('/inspection')}
            >
              提交巡检结果
            </Button>
          </div>
        </Card>
      </div>

      <Card
        title={
          <span className="font-semibold">
            <CarryOutOutlined className="mr-2 text-neutral-400" />
            历史巡检记录
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '8px 0' }}
        extra={
          <a className="text-sm text-primary-500" onClick={() => navigate('/inspection')}>
            查看全部 <RightOutlined />
          </a>
        }
      >
        <List
          dataSource={historyRecords}
          renderItem={(item) => (
            <List.Item className="px-4 py-2.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-600">{item.name}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {item.placeName} · {item.completedAt}
                  </div>
                </div>
                <Tag color={item.result === 'pass' ? 'success' : 'error'} className="ml-2 shrink-0">
                  {item.resultName}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default InspectorWorkspace;
