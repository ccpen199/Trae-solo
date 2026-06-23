import { Row, Col, Card, Statistic, Table, Tag, Space, Typography } from 'antd';
import {
  FileTextOutlined,
  TruckOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store/appStore';
import dayjs from 'dayjs';

const { Title } = Typography;

const DashboardPage = () => {
  const waybills = useAppStore((state) => state.waybills);
  const drivers = useAppStore((state) => state.drivers);
  const alerts = useAppStore((state) => state.alerts);
  const customers = useAppStore((state) => state.customers);

  const totalWaybills = waybills.length;
  const inTransitCount = waybills.filter((w) => w.status === 'in_transit').length;
  const exceptionCount = waybills.filter((w) => w.status === 'exception').length;
  const deliveredToday = waybills.filter(
    (w) => w.status === 'delivered' && dayjs(w.createTime).isSame(dayjs(), 'day')
  ).length;

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待揽收', color: 'default' },
    picked: { text: '已揽收', color: 'blue' },
    in_transit: { text: '运输中', color: 'processing' },
    arrived: { text: '已到达', color: 'purple' },
    delivered: { text: '已签收', color: 'success' },
    exception: { text: '异常', color: 'error' },
  };

  const waybillTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '完成量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '订单量',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        lineStyle: { color: '#1890ff' },
        areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
      },
      {
        name: '完成量',
        type: 'line',
        data: [100, 110, 90, 120, 80, 200, 180],
        smooth: true,
        lineStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.2)' },
      },
    ],
  };

  const freightChartOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '业务分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 1048, name: '电子行业' },
          { value: 735, name: '服装纺织' },
          { value: 580, name: '食品生鲜' },
          { value: 484, name: '医疗器械' },
          { value: 300, name: '其他行业' },
        ],
      },
    ],
  };

  const columns = [
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      width: 160,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          normal: 'default',
          high: 'orange',
          urgent: 'red',
        };
        const textMap: Record<string, string> = {
          normal: '普通',
          high: '高优',
          urgent: '加急',
        };
        return <Tag color={colorMap[priority]}>{textMap[priority]}</Tag>;
      },
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        数据概览
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={totalWaybills}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              suffix={<RiseOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在途订单"
              value={inTransitCount}
              prefix={<TruckOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日签收"
              value={deliveredToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="异常订单"
              value={exceptionCount}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="订单趋势" extra={<ClockCircleOutlined />}>
            <ReactECharts option={waybillTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="业务分布">
            <ReactECharts option={freightChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="最近运单">
            <Table
              columns={columns}
              dataSource={waybills.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="系统预警">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: 12,
                    background: alert.isRead ? '#fafafa' : '#fffbe6',
                    borderRadius: 8,
                    borderLeft: `3px solid ${
                      alert.level === 'error'
                        ? '#ff4d4f'
                        : alert.level === 'warning'
                        ? '#faad14'
                        : '#1890ff'
                    }`,
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{alert.description}</div>
                  <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>{alert.time}</div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="在线运力">
            <Row gutter={16}>
              {drivers.map((driver) => (
                <Col span={6} key={driver.id}>
                  <Card size="small" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: '#e6f7ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                        }}
                      >
                        <TruckOutlined style={{ color: '#1890ff' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{driver.name}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{driver.vehicleNo}</div>
                      </div>
                      <Tag
                        color={
                          driver.status === 'idle'
                            ? 'default'
                            : driver.status === 'in_transit'
                            ? 'processing'
                            : 'success'
                        }
                        style={{ marginLeft: 'auto' }}
                      >
                        {driver.status === 'idle'
                          ? '空闲'
                          : driver.status === 'in_transit'
                          ? '运输中'
                          : driver.status === 'loading'
                          ? '装货中'
                          : '卸货中'}
                      </Tag>
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid #f0f0f0',
                        fontSize: 12,
                        color: '#666',
                      }}
                    >
                      <div>车型：{driver.vehicleType}</div>
                      <div>当前载重：{driver.totalLoad} / {driver.capacity}kg</div>
                      <div>在途订单：{driver.currentOrders} 单</div>
                    </div>
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

export default DashboardPage;
