import { Card, List, Badge, Tag, Table } from 'antd';
import {
  AuditOutlined,
  AlertOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface TodoItem {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  path: string;
}

interface AlarmRecord {
  id: string;
  type: string;
  placeName: string;
  time: string;
  level: 'critical' | 'major' | 'minor' | 'warning';
  levelName: string;
  status: 'pending' | 'processing' | 'resolved';
  statusName: string;
}

interface RegionStat {
  key: string;
  region: string;
  placeCount: number;
  alarmCount: number;
}

const RegulatorWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const todoItems: TodoItem[] = [
    { id: '1', title: '待审核场所', count: 5, icon: <AuditOutlined />, color: '#165DFF', path: '/place/review' },
    { id: '2', title: '待处理告警', count: 12, icon: <AlertOutlined />, color: '#F53F3F', path: '/alarm' },
    { id: '3', title: '待复核巡检', count: 3, icon: <FileSearchOutlined />, color: '#FF7D00', path: '/inspection' },
    { id: '4', title: '数据上报逾期', count: 2, icon: <ClockCircleOutlined />, color: '#86909C', path: '/analytics' },
  ];

  const recentAlarms: AlarmRecord[] = [
    { id: '1', type: '实名核验异常', placeName: '金阳光网吧（历下区）', time: '10:32', level: 'critical', levelName: '严重', status: 'pending', statusName: '待处理' },
    { id: '2', type: '超时未上报', placeName: '星际网咖（市中区）', time: '09:15', level: 'major', levelName: '重要', status: 'processing', statusName: '处理中' },
    { id: '3', type: '预约超限', placeName: '飞翔网络会所（槐荫区）', time: '08:47', level: 'major', levelName: '重要', status: 'pending', statusName: '待处理' },
    { id: '4', type: '设备离线', placeName: '网虫部落（天桥区）', time: '08:20', level: 'minor', levelName: '一般', status: 'resolved', statusName: '已处理' },
    { id: '5', type: '实名核验异常', placeName: '极客网咖（历城区）', time: '07:55', level: 'warning', levelName: '警告', status: 'resolved', statusName: '已处理' },
  ];

  const levelColorMap: Record<string, string> = {
    critical: 'red',
    major: 'orange',
    minor: 'blue',
    warning: 'gold',
  };

  const statusColorMap: Record<string, string> = {
    pending: 'red',
    processing: 'orange',
    resolved: 'green',
  };

  const regionStats: RegionStat[] = [
    { key: '1', region: '济南市', placeCount: 186, alarmCount: 3 },
    { key: '2', region: '青岛市', placeCount: 203, alarmCount: 5 },
    { key: '3', region: '烟台市', placeCount: 142, alarmCount: 1 },
    { key: '4', region: '潍坊市', placeCount: 118, alarmCount: 2 },
    { key: '5', region: '临沂市', placeCount: 96, alarmCount: 1 },
  ];

  const regionColumns = [
    {
      title: '地市',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '场所数',
      dataIndex: 'placeCount',
      key: 'placeCount',
      render: (v: number) => <span className="font-medium">{v}</span>,
    },
    {
      title: '告警数',
      dataIndex: 'alarmCount',
      key: 'alarmCount',
      render: (v: number) => (
        <span className={v > 3 ? 'text-danger-500 font-medium' : ''}>{v}</span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card
        title={
          <span className="font-semibold">
            <AuditOutlined className="mr-2 text-primary-500" />
            待办事项
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '8px 0' }}
      >
        <List
          dataSource={todoItems}
          renderItem={(item) => (
            <List.Item
              className="px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span style={{ color: item.color, fontSize: '18px' }}>{item.icon}</span>
                  <span className="text-neutral-600">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    count={item.count}
                    style={{ backgroundColor: item.color }}
                    overflowCount={99}
                  />
                  <RightOutlined className="text-neutral-300 text-xs" />
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card
        title={
          <span className="font-semibold">
            <AlertOutlined className="mr-2 text-danger-500" />
            最近告警
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '8px 0' }}
      >
        <List
          dataSource={recentAlarms}
          renderItem={(item) => (
            <List.Item className="px-4 py-2.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Tag color={levelColorMap[item.level]} className="text-xs">
                      {item.levelName}
                    </Tag>
                    <span className="text-sm text-neutral-600 truncate">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 truncate">
                    {item.placeName} · {item.time}
                  </div>
                </div>
                <Tag color={statusColorMap[item.status]} className="ml-2 shrink-0">
                  {item.statusName}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card
        title={
          <span className="font-semibold">
            <FileSearchOutlined className="mr-2 text-warning-500" />
            区域场所统计
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '12px' }}
      >
        <Table
          dataSource={regionStats}
          columns={regionColumns}
          pagination={false}
          size="small"
          bordered={false}
        />
      </Card>
    </div>
  );
};

export default RegulatorWorkspace;
