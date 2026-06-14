import { Card, Row, Col } from 'antd';
import {
  ShopOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  AlertOutlined,
  CarryOutOutlined,
  BarChartOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface EntryItem {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  todayData: string;
  path: string;
}

const QuickEntries: React.FC = () => {
  const navigate = useNavigate();

  const entries: EntryItem[] = [
    {
      key: 'place',
      name: '场所备案',
      icon: <ShopOutlined className="text-2xl" />,
      color: '#165DFF',
      bgColor: '#E8F3FF',
      todayData: '47家待审核',
      path: '/place/review',
    },
    {
      key: 'verify',
      name: '实名核验',
      icon: <SafetyCertificateOutlined className="text-2xl" />,
      color: '#00B42A',
      bgColor: '#E8FFEA',
      todayData: '1,256次核验',
      path: '/verification',
    },
    {
      key: 'reservation',
      name: '预约分流',
      icon: <ScheduleOutlined className="text-2xl" />,
      color: '#722ED1',
      bgColor: '#F5E8FF',
      todayData: '328组预约',
      path: '/reservation',
    },
    {
      key: 'alarm',
      name: 'AI告警',
      icon: <AlertOutlined className="text-2xl" />,
      color: '#F53F3F',
      bgColor: '#FFECE8',
      todayData: '12条待处理',
      path: '/alarm',
    },
    {
      key: 'inspection',
      name: '巡检任务',
      icon: <CarryOutOutlined className="text-2xl" />,
      color: '#FF7D00',
      bgColor: '#FFF7E8',
      todayData: '完成率78%',
      path: '/inspection',
    },
    {
      key: 'analytics',
      name: '经营分析',
      icon: <BarChartOutlined className="text-2xl" />,
      color: '#0FC6C2',
      bgColor: '#E8FFFB',
      todayData: '2家未上报',
      path: '/analytics',
    },
  ];

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold text-neutral-500 mb-3">快捷入口</div>
      <Row gutter={[16, 16]}>
        {entries.map((entry) => (
          <Col key={entry.key} xs={12} sm={8} lg={4}>
            <Card
              className="cursor-pointer hover:shadow-cardHover transition-all duration-300 group"
              bodyStyle={{ padding: '16px' }}
              onClick={() => navigate(entry.path)}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg mb-2"
                  style={{ backgroundColor: entry.bgColor, color: entry.color }}
                >
                  {entry.icon}
                </div>
                <RightOutlined className="text-neutral-300 text-xs mt-1 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="text-sm font-medium text-neutral-600 mt-1">{entry.name}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{entry.todayData}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default QuickEntries;
