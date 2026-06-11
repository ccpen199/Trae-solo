import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Button, Space } from 'antd';
import {
  PayCircleOutlined,
  FileTextOutlined,
  NotificationOutlined,
  UserAddOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { reportApi } from '@/services/payment';
import { workOrderApi } from '@/services/workOrder';
import { announcementApi } from '@/services/announcement';
import { formatMoney, formatDateTime } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<any>(null);
  const [pendingWorkOrders, setPendingWorkOrders] = useState<any[]>([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, workOrdersRes, announcementsRes]: any[] = await Promise.all([
        reportApi.getPaymentStatistics({ type: 'day' }),
        workOrderApi.getAdminWorkOrders({ status: 0, page: 1, pageSize: 5 }),
        announcementApi.getAnnouncementList({ page: 1, pageSize: 5 } as any),
      ]);

      if (statsRes.code === 0) setStatistics(statsRes.data);
      if (workOrdersRes.code === 0) setPendingWorkOrders(workOrdersRes.data.list);
      if (announcementsRes.code === 0) setPendingAnnouncements(announcementsRes.data.list);
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const trendOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['缴费金额', '缴费笔数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: statistics?.dailyTrend?.slice(0, 7).reverse().map((item: any) => item.date) || [],
    },
    yAxis: [
      { type: 'value', name: '金额(元)', position: 'left' },
      { type: 'value', name: '笔数', position: 'right' },
    ],
    series: [
      {
        name: '缴费金额',
        type: 'bar',
        data: statistics?.dailyTrend?.slice(0, 7).reverse().map((item: any) => item.amount) || [],
        itemStyle: { color: '#165DFF' },
      },
      {
        name: '缴费笔数',
        type: 'line',
        yAxisIndex: 1,
        data: statistics?.dailyTrend?.slice(0, 7).reverse().map((item: any) => item.count) || [],
        itemStyle: { color: '#00B42A' },
        smooth: true,
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}元 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: statistics?.typeRatio?.map((item: any) => ({
          value: item.amount,
          name: item.typeName,
        })) || [],
      },
    ],
  };

  const quickActions = [
    { icon: <PlusOutlined />, title: '新建公告', action: () => navigate('/admin/announcements/create') },
    { icon: <FileTextOutlined />, title: '工单处理', action: () => navigate('/admin/work-orders/pending') },
    { icon: <PayCircleOutlined />, title: '对账报表', action: () => navigate('/admin/payment/reconciliation') },
    { icon: <NotificationOutlined />, title: '公告审核', action: () => navigate('/admin/announcements') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">工作台</h2>
        <Space>
          <Button onClick={loadData} loading={loading}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="今日缴费金额"
              value={statistics?.todayAmount || 0}
              precision={2}
              prefix={<><PayCircleOutlined /> ¥</>}
              valueStyle={{ color: '#165DFF' }}
            />
            <p className="text-gray-400 text-sm mt-2">
              <RiseOutlined className="text-green-500 mr-1" /> 较昨日增长 12.5%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="今日缴费笔数"
              value={statistics?.todayCount || 0}
              valueStyle={{ color: '#00B42A' }}
              prefix={<PayCircleOutlined />}
            />
            <p className="text-gray-400 text-sm mt-2">
              <RiseOutlined className="text-green-500 mr-1" /> 较昨日增长 8.3%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="待处理工单"
              value={pendingWorkOrders.length}
              valueStyle={{ color: '#FF7D00' }}
              prefix={<FileTextOutlined />}
            />
            <p className="text-gray-400 text-sm mt-2">
              <ClockCircleOutlined className="text-orange-500 mr-1" /> 需要及时处理
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="待审核公告"
              value={pendingAnnouncements.length}
              valueStyle={{ color: '#722ED1' }}
              prefix={<NotificationOutlined />}
            />
            <p className="text-gray-400 text-sm mt-2">
              <ClockCircleOutlined className="text-purple-500 mr-1" /> 等待审核发布
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="本月总营收"
              value={statistics?.totalAmount || 0}
              precision={2}
              prefix={<><RiseOutlined /> ¥</>}
              valueStyle={{ color: '#F53F3F' }}
            />
            <p className="text-gray-400 text-sm mt-2">
              <RiseOutlined className="text-green-500 mr-1" /> 较上月增长 15.2%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="本月新增用户"
              value={128}
              valueStyle={{ color: '#00B8D9' }}
              prefix={<UserAddOutlined />}
            />
            <p className="text-gray-400 text-sm mt-2">
              <RiseOutlined className="text-green-500 mr-1" /> 较上月增长 20.1%
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="近7天缴费趋势" className="shadow-sm">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="缴费类型占比" className="shadow-sm">
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="待办事项"
            extra={
              <Button type="link" onClick={() => navigate('/admin/work-orders')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            className="shadow-sm"
          >
            <List
              dataSource={[...pendingWorkOrders.slice(0, 3), ...pendingAnnouncements.slice(0, 2)]}
              renderItem={(item: any) => (
                <List.Item className="px-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <List.Item.Meta
                    avatar={
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        {item.orderNo ? <FileTextOutlined className="text-orange-500" /> : <NotificationOutlined className="text-purple-500" />}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium truncate max-w-[200px]">
                          {item.title || item.orderNo}
                        </span>
                        {item.orderNo ? (
                          <StatusTag type="workOrderStatus" status={item.status} />
                        ) : (
                          <StatusTag type="announcement" status={item.status} />
                        )}
                      </div>
                    }
                    description={
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">
                          {item.userName || item.creatorName}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDateTime(item.createTime, 'MM-DD HH:mm')}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快捷操作" className="shadow-sm">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} key={index}>
                  <Card
                    hoverable
                    onClick={action.action}
                    className="text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-blue-500 text-xl">{action.icon}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{action.title}</span>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
