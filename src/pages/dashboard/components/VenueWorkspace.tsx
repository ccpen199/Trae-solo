import { Card, Button, Tag, List, Badge, Descriptions, Statistic, Row, Col } from 'antd';
import {
  ShopOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  UploadOutlined,
  WarningOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface RectificationItem {
  id: string;
  title: string;
  deadline: string;
  status: 'pending' | 'in_progress';
}

const VenueWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const venueInfo = {
    name: '金阳光网吧（历下区）',
    status: '正常运营',
    validUntil: '2026-12-31',
    licenseNo: '鲁文网37010220240001',
  };

  const reservationStats = {
    reserved: 42,
    arrived: 35,
    cancelled: 3,
  };

  const reportStatus = {
    monthSubmitted: false,
    deadline: '2026-06-15',
    currentMonth: '2026年6月',
  };

  const rectificationItems: RectificationItem[] = [
    { id: '1', title: '实名登记系统升级', deadline: '2026-06-20', status: 'in_progress' },
    { id: '2', title: '消防通道标识整改', deadline: '2026-06-25', status: 'pending' },
    { id: '3', title: '监控设备维护更新', deadline: '2026-07-01', status: 'pending' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card
        title={
          <span className="font-semibold">
            <ShopOutlined className="mr-2 text-primary-500" />
            我的场所
          </span>
        }
        className="lg:col-span-1"
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="场所名称">{venueInfo.name}</Descriptions.Item>
          <Descriptions.Item label="运营状态">
            <Tag color="green">{venueInfo.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="有效期至">{venueInfo.validUntil}</Descriptions.Item>
          <Descriptions.Item label="许可证号">{venueInfo.licenseNo}</Descriptions.Item>
        </Descriptions>
        <div className="mt-4">
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            block
            size="large"
            onClick={() => navigate('/verification')}
          >
            一键发起实名核验
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-1 flex flex-col gap-4">
        <Card
          title={
            <span className="font-semibold">
              <CalendarOutlined className="mr-2 text-success-500" />
              今日预约情况
            </span>
          }
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">已预约</span>}
                value={reservationStats.reserved}
                valueStyle={{ color: '#165DFF', fontSize: '24px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">已到店</span>}
                value={reservationStats.arrived}
                valueStyle={{ color: '#00B42A', fontSize: '24px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span className="text-xs text-neutral-400">取消</span>}
                value={reservationStats.cancelled}
                valueStyle={{ color: '#86909C', fontSize: '24px' }}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <span className="font-semibold">
              <UploadOutlined className="mr-2 text-warning-500" />
              经营数据上报
            </span>
          }
          bodyStyle={{ padding: '16px' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">{reportStatus.currentMonth}</div>
              <div className="mt-1">
                {reportStatus.monthSubmitted ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>已上报</Tag>
                ) : (
                  <Tag color="warning" icon={<ClockCircleOutlined />}>未上报</Tag>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-400">截止日期</div>
              <div className="text-sm font-medium text-warning-500">{reportStatus.deadline}</div>
            </div>
          </div>
          {!reportStatus.monthSubmitted && (
            <Button
              type="primary"
              size="small"
              className="mt-3 w-full"
              onClick={() => navigate('/analytics')}
            >
              立即上报
            </Button>
          )}
        </Card>
      </div>

      <Card
        title={
          <span className="font-semibold">
            <WarningOutlined className="mr-2 text-danger-500" />
            整改通知
            <Badge count={rectificationItems.filter((i) => i.status === 'pending').length} className="ml-2" />
          </span>
        }
        className="lg:col-span-1"
        bodyStyle={{ padding: '8px 0' }}
      >
        <List
          dataSource={rectificationItems}
          renderItem={(item) => (
            <List.Item className="px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-600">{item.title}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    截止日期：{item.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {item.status === 'in_progress' ? (
                    <Tag color="processing">进行中</Tag>
                  ) : (
                    <Tag color="default">待整改</Tag>
                  )}
                  <RightOutlined className="text-neutral-300 text-xs" />
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default VenueWorkspace;
