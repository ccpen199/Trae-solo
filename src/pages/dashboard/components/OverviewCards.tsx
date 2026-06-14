import { Row, Col, Card, Statistic } from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

interface OverviewCardsProps {
  data?: {
    totalPlaces: number;
    filedPlaces: number;
    pendingReview: number;
    cancelledPlaces: number;
    todayVisitors: number;
    visitorTrend: number;
    pendingAlarms: number;
    criticalAlarms: number;
    majorAlarms: number;
    minorAlarms: number;
    inspectionRate: number;
    monthCompleted: number;
    monthTotal: number;
  };
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => {
  const d = data || {
    totalPlaces: 1286,
    filedPlaces: 1102,
    pendingReview: 47,
    cancelledPlaces: 137,
    todayVisitors: 32856,
    visitorTrend: 5.2,
    pendingAlarms: 12,
    criticalAlarms: 2,
    majorAlarms: 4,
    minorAlarms: 6,
    inspectionRate: 78,
    monthCompleted: 156,
    monthTotal: 200,
  };

  const cards = [
    {
      title: '场所总数',
      value: d.totalPlaces,
      icon: <ShopOutlined className="text-2xl" />,
      color: '#165DFF',
      bgColor: '#E8F3FF',
      extra: (
        <div className="text-xs text-neutral-400 mt-1 space-y-0.5">
          <div>已备案 <span className="text-success-500 font-medium">{d.filedPlaces}</span></div>
          <div>待审核 <span className="text-warning-500 font-medium">{d.pendingReview}</span></div>
          <div>已注销 <span className="text-neutral-400 font-medium">{d.cancelledPlaces}</span></div>
        </div>
      ),
    },
    {
      title: '今日上网人次',
      value: d.todayVisitors,
      icon: <UserOutlined className="text-2xl" />,
      color: '#00B42A',
      bgColor: '#E8FFEA',
      extra: (
        <div className="mt-1">
          {d.visitorTrend >= 0 ? (
            <span className="text-xs text-success-500">
              <ArrowUpOutlined /> 较昨日 +{d.visitorTrend}%
            </span>
          ) : (
            <span className="text-xs text-danger-500">
              <ArrowDownOutlined /> 较昨日 {d.visitorTrend}%
            </span>
          )}
        </div>
      ),
    },
    {
      title: '待处理告警',
      value: d.pendingAlarms,
      icon: <AlertOutlined className="text-2xl" />,
      color: '#F53F3F',
      bgColor: '#FFECE8',
      extra: (
        <div className="text-xs text-neutral-400 mt-1 space-y-0.5">
          <div>严重 <span className="text-danger-500 font-medium">{d.criticalAlarms}</span></div>
          <div>重要 <span className="text-warning-500 font-medium">{d.majorAlarms}</span></div>
          <div>一般 <span className="text-neutral-400 font-medium">{d.minorAlarms}</span></div>
        </div>
      ),
    },
    {
      title: '巡检完成率',
      value: d.inspectionRate,
      suffix: '%',
      icon: <CheckCircleOutlined className="text-2xl" />,
      color: '#FF7D00',
      bgColor: '#FFF7E8',
      extra: (
        <div className="text-xs text-neutral-400 mt-1">
          本月 {d.monthCompleted}/{d.monthTotal}
        </div>
      ),
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col key={index} xs={24} sm={12} lg={6}>
          <Card
            className="h-full hover:shadow-cardHover transition-shadow duration-300"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Statistic
                  title={
                    <span className="text-sm text-neutral-400">{card.title}</span>
                  }
                  value={card.value}
                  suffix={card.suffix}
                  valueStyle={{
                    color: card.color,
                    fontSize: '28px',
                    fontWeight: 600,
                  }}
                />
                {card.extra}
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl"
                style={{ backgroundColor: card.bgColor, color: card.color }}
              >
                {card.icon}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default OverviewCards;
