import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Timeline,
  Image,
  Statistic,
  List,
  Avatar,
  Typography,
  Space,
  Alert,
  Steps,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CameraOutlined,
  UserOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store/appStore';
import { Waybill, TrackingNode } from '@/types';

const { Title } = Typography;

const TrackingPage = () => {
  const [searchNo, setSearchNo] = useState('');
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);

  const waybills = useAppStore((state) => state.waybills);
  const alerts = useAppStore((state) => state.alerts);
  const gpsTrack = useAppStore((state) => state.gpsTrack);

  const handleSearch = () => {
    const found = waybills.find((w) => w.waybillNo === searchNo || w.waybillNo.includes(searchNo));
    if (found) {
      setSelectedWaybill(found);
    } else {
      setSelectedWaybill(null);
    }
  };

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待揽收', color: 'default' },
    picked: { text: '已揽收', color: 'blue' },
    in_transit: { text: '运输中', color: 'processing' },
    arrived: { text: '已到达', color: 'purple' },
    delivered: { text: '已签收', color: 'success' },
    exception: { text: '异常', color: 'error' },
  };

  const mapOption = {
    backgroundColor: '#f5f5f5',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data.name || 'GPS点位'}<br/>时间: ${params.data.time || ''}<br/>速度: ${params.data.speed || 0}km/h`;
      },
    },
    xAxis: {
      type: 'value',
      min: 112,
      max: 116,
      show: false,
    },
    yAxis: {
      type: 'value',
      min: 22,
      max: 29,
      show: false,
    },
    series: [
      {
        name: '轨迹',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#1890ff',
          width: 3,
        },
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2,
        },
        data: gpsTrack.map((p) => ({
          value: [p.lng, p.lat],
          name: p.address,
          time: p.time,
          speed: p.speed,
        })),
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          data: [
            {
              coord: [gpsTrack[0].lng, gpsTrack[0].lat],
              name: '起点',
              value: '起点',
              itemStyle: { color: '#52c41a' },
            },
            {
              coord: [gpsTrack[gpsTrack.length - 1].lng, gpsTrack[gpsTrack.length - 1].lat],
              name: '当前位置',
              value: '当前',
              itemStyle: { color: '#ff4d4f' },
            },
          ],
        },
      },
    ],
  };

  const speedChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: gpsTrack.map((p) => p.time),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: { type: 'value', name: '速度(km/h)' },
    series: [
      {
        name: '行驶速度',
        type: 'line',
        data: gpsTrack.map((p) => p.speed),
        smooth: true,
        areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
        lineStyle: { color: '#1890ff' },
      },
    ],
  };

  const activeStepMap: Record<string, number> = {
    pending: 0,
    picked: 1,
    in_transit: 2,
    arrived: 3,
    delivered: 4,
    exception: 2,
  };

  const steps = [
    { title: '下单', icon: <FileTextOutlined /> },
    { title: '揽收', icon: <UserOutlined /> },
    { title: '运输中', icon: <TruckOutlined /> },
    { title: '到达', icon: <EnvironmentOutlined /> },
    { title: '签收', icon: <CheckCircleOutlined /> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        全程物流可视化
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="请输入运单号查询"
              enterButton={<Button type="primary" icon={<SearchOutlined />}>查询</Button>}
              size="large"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              onSearch={handleSearch}
            />
          </Col>
          <Col span={16}>
            <Space wrap>
              <span style={{ color: '#999' }}>快速查询：</span>
              {waybills.slice(0, 4).map((w) => (
                <Tag
                  key={w.id}
                  color={statusMap[w.status].color}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => {
                    setSearchNo(w.waybillNo);
                    setSelectedWaybill(w);
                  }}
                >
                  {w.waybillNo}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {selectedWaybill ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={16}>
              <Card
                title={
                  <Space>
                    <span>运单轨迹</span>
                    <Tag color={statusMap[selectedWaybill.status].color}>
                      {statusMap[selectedWaybill.status].text}
                    </Tag>
                    {selectedWaybill.isGreenChannel && <Tag color="green">绿色通道</Tag>}
                  </Space>
                }
                extra={<span style={{ color: '#999' }}>{selectedWaybill.waybillNo}</span>}
              >
                <ReactECharts option={mapOption} style={{ height: 400 }} />
                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 16px',
                    background: '#f0f5ff',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      当前位置：{selectedWaybill.currentLocation || '暂无'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      预计到达：{selectedWaybill.estimatedArrival || '待定'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="速度监控" style={{ marginBottom: 16 }}>
                <ReactECharts option={speedChartOption} style={{ height: 200 }} />
              </Card>
              <Card title="运输统计">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="已行驶" value={860} suffix="km" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="剩余里程" value={420} suffix="km" />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic title="平均速度" value={58} suffix="km/h" />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="预计到达"
                      value={selectedWaybill.estimatedArrival?.split(' ')[1] || '-'}
                      style={{ fontSize: 12 }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="物流节点">
                <Steps
                  direction="vertical"
                  current={activeStepMap[selectedWaybill.status]}
                  status={selectedWaybill.status === 'exception' ? 'error' : 'process'}
                  items={steps.map((s, i) => ({
                    title: s.title,
                    description: selectedWaybill.trackingNodes[i]
                      ? `${selectedWaybill.trackingNodes[i].time}\n${selectedWaybill.trackingNodes[i].description}`
                      : '',
                  }))}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="节点详情 & 拍照上传">
                <Timeline
                  items={selectedWaybill.trackingNodes.map((node: TrackingNode) => ({
                    color: node.status.includes('异常') || node.status.includes('滞留') ? 'red' : 'blue',
                    children: (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>
                          {node.status}
                          <Tag style={{ marginLeft: 8 }} color="blue">
                            {node.location}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {node.time}
                          {node.operator && (
                            <span style={{ marginLeft: 12 }}>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {node.operator}
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#666' }}>{node.description}</div>
                        {node.photo && (
                          <div style={{ marginTop: 8 }}>
                            <Image width={100} height={100} src={node.photo} />
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <div style={{ color: '#999' }}>请输入运单号查询物流信息</div>
        </Card>
      )}

      <Card title="异常预警" style={{ marginTop: 16 }}>
        {alerts
          .filter((a) => a.type === 'delay' || a.type === 'exception')
          .map((alert) => (
            <Alert
              key={alert.id}
              message={alert.title}
              description={
                <div>
                  <div>{alert.description}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{alert.time}</div>
                </div>
              }
              type={alert.level === 'error' ? 'error' : alert.level === 'warning' ? 'warning' : 'info'}
              showIcon
              icon={
                alert.level === 'error' ? (
                  <ExclamationCircleOutlined />
                ) : (
                  <WarningOutlined />
                )
              }
              style={{ marginBottom: 8 }}
            />
          ))}
      </Card>
    </div>
  );
};

export default TrackingPage;
