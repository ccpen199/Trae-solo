import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Empty,
  Tabs,
  Badge,
  Modal,
  List,
  Descriptions,
  Calendar,
  Divider,
  Select,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CalendarTwoTone,
  EyeOutlined,
} from '@ant-design/icons';
import type { InterviewSchedule } from '../../types';
import { interviews } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待确认' },
  accepted: { color: 'green', text: '已接受' },
  declined: { color: 'red', text: '已拒绝' },
  completed: { color: 'blue', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
};

const MyInterviews = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InterviewSchedule[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [icsDownloading, setIcsDownloading] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<InterviewSchedule | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await interviews.list();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await interviews.update(id, { status });
      message.success(status === 'accepted' ? '已接受面试邀请' : '已拒绝面试邀请');
      fetchData();
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const handleDownloadICS = async (id: number) => {
    setIcsDownloading(id);
    try {
      const icsData = await interviews.getICS(id);
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('日历文件已下载，请导入您的日历应用');
    } catch (error) {
      message.error('下载失败，请稍后重试');
    } finally {
      setIcsDownloading(null);
    }
  };

  const handleSyncCalendar = async (id: number) => {
    try {
      const result = await interviews.syncCalendar(id);
      if (result.success) {
        message.success('已同步到手机日历');
        fetchData();
      }
    } catch (error) {
      message.error('同步失败，请稍后重试');
    }
  };

  const filteredData = activeTab === 'all'
    ? data
    : data.filter(item => item.status === activeTab);

  const getCalendarData = () => {
    const calendarData: Record<string, InterviewSchedule[]> = {};
    data.forEach(item => {
      const date = dayjs(item.interviewTime).format('YYYY-MM-DD');
      if (!calendarData[date]) {
        calendarData[date] = [];
      }
      calendarData[date].push(item);
    });
    return calendarData;
  };

  const calendarData = getCalendarData();

  const dateCellRender = (value: any) => {
    const date = dayjs(value.toDate()).format('YYYY-MM-DD');
    const dayInterviews = calendarData[date] || [];
    if (dayInterviews.length === 0) return null;
    return (
      <ul className="calendar-events">
        {dayInterviews.slice(0, 2).map((item, idx) => (
          <li key={idx}>
            <Badge
              color={statusConfig[item.status]?.color || 'default'}
              text={
                <Text ellipsis style={{ fontSize: '11px' }}>
                  {item.job?.title || '面试'}
                </Text>
              }
            />
          </li>
        ))}
        {dayInterviews.length > 2 && (
          <li>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              +{dayInterviews.length - 2} 更多
            </Text>
          </li>
        )}
      </ul>
    );
  };

  const renderInterviewCard = (item: InterviewSchedule) => (
    <Card key={item.id} style={{ marginBottom: '16px' }}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <div style={{ marginBottom: '8px' }}>
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                  {item.job?.title || '面试邀请'}
                </Title>
                <Text type="secondary">
                  {item.company?.companyName || '某印刷企业'}
                </Text>
              </div>
              <Tag color={statusConfig[item.status]?.color || 'default'}>
                {statusConfig[item.status]?.text || item.status}
              </Tag>
            </Space>
          </div>

          <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '12px' }}>
            <div>
              <CalendarOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
              <Text>
                {dayjs(item.interviewTime).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
            {item.location && (
              <div>
                <EnvironmentOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                <Text>{item.location}</Text>
              </div>
            )}
            {item.interviewer && (
              <div>
                <ClockCircleOutlined style={{ color: '#722ed1', marginRight: '4px' }} />
                <Text>面试官：{item.interviewer}</Text>
              </div>
            )}
          </Space>

          <Space wrap>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setDetailItem(item)}
            >
              详情
            </Button>
            {item.status === 'pending' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleStatusUpdate(item.id, 'accepted')}
                >
                  接受
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => Modal.confirm({
                    title: '确认拒绝',
                    content: '确定要拒绝这个面试邀请吗？',
                    okText: '确认拒绝',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk: () => handleStatusUpdate(item.id, 'declined'),
                  })}
                >
                  拒绝
                </Button>
              </>
            )}
            {item.status === 'accepted' && (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadICS(item.id)}
                  loading={icsDownloading === item.id}
                >
                  下载ICS
                </Button>
                {!item.calendarSynced && (
                  <Button
                    type="primary"
                    icon={<CalendarTwoTone />}
                    onClick={() => handleSyncCalendar(item.id)}
                  >
                    同步到手机日历
                  </Button>
                )}
                {item.calendarSynced && (
                  <Tag color="green">已同步日历</Tag>
                )}
              </>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const tabItems = [
    { key: 'all', label: `全部 (${data.length})` },
    { key: 'pending', label: `待确认 (${data.filter(d => d.status === 'pending').length})` },
    { key: 'accepted', label: `已接受 (${data.filter(d => d.status === 'accepted').length})` },
    { key: 'completed', label: `已完成 (${data.filter(d => d.status === 'completed').length})` },
    { key: 'declined', label: `已拒绝 (${data.filter(d => d.status === 'declined').length})` },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CalendarOutlined /> 我的面试
          </Title>
        </Col>
        <Col>
          <Button
            icon={<CalendarTwoTone />}
            onClick={() => setCalendarVisible(!calendarVisible)}
            type={calendarVisible ? 'primary' : 'default'}
          >
            {calendarVisible ? '列表视图' : '日历视图'}
          </Button>
        </Col>
      </Row>

      {calendarVisible ? (
        <Card>
          <Calendar
            dateCellRender={dateCellRender}
            headerRender={({ value, onChange }) => {
              const start = 0;
              const end = 12;
              const monthOptions = [];

              const localeData = (value as any).localeData();
              const months = [];
              for (let i = 0; i < 12; i++) {
                months.push(localeData.monthsShort((value as any).clone().month(i)));
              }

              for (let i = start; i < end; i++) {
                monthOptions.push(
                  <Select.Option key={i} value={i} className="month-item">
                    {months[i]}
                  </Select.Option>,
                );
              }

              const year = (value as any).year();
              const month = (value as any).month();
              const options = [];
              for (let i = year - 10; i < year + 10; i += 1) {
                options.push(
                  <Select.Option key={i} value={i} className="year-item">
                    {i}
                  </Select.Option>,
                );
              }
              return (
                <div style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Select
                    size="small"
                    dropdownMatchSelectWidth={false}
                    value={year}
                    onChange={(newYear) => {
                      const now = (value as any).clone().year(newYear);
                      onChange(now);
                    }}
                  >
                    {options}
                  </Select>
                  <Select
                    size="small"
                    dropdownMatchSelectWidth={false}
                    value={month}
                    onChange={(newMonth) => {
                      const now = (value as any).clone().month(newMonth);
                      onChange(now);
                    }}
                  >
                    {monthOptions}
                  </Select>
                </div>
              );
            }}
          />
          <Divider style={{ margin: '16px 0' }} />
          <Title level={5}>图例</Title>
          <Space wrap>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Tag key={key} color={config.color}>{config.text}</Tag>
            ))}
          </Space>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: '16px' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>

          {loading ? (
            <Card loading />
          ) : filteredData.length === 0 ? (
            <Empty description="暂无面试安排" />
          ) : (
            <List
              dataSource={filteredData}
              renderItem={renderInterviewCard}
            />
          )}
        </>
      )}

      <Modal
        title="面试详情"
        open={!!detailItem}
        footer={null}
        onCancel={() => setDetailItem(null)}
        width={600}
      >
        {detailItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="岗位">{detailItem.job?.title || '面试邀请'}</Descriptions.Item>
            <Descriptions.Item label="公司">{detailItem.company?.companyName || '某印刷企业'}</Descriptions.Item>
            <Descriptions.Item label="面试时间">{dayjs(detailItem.interviewTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="面试地点">{detailItem.location || '待定'}</Descriptions.Item>
            <Descriptions.Item label="面试官">{detailItem.interviewer || '待定'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig[detailItem.status]?.color || 'default'}>
                {statusConfig[detailItem.status]?.text || detailItem.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="日历同步">
              {detailItem.calendarSynced ? <Tag color="green">已同步</Tag> : <Tag color="default">未同步</Tag>}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyInterviews;
