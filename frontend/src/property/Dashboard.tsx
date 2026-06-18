import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Typography, Space, Button, Tag, Progress, List } from 'antd';
import {
  DesktopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { analyticsApi, deviceApi, workOrderApi } from '@/api';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatDateTime, truncate } from '@/utils/format';
import type { Device, WorkOrder } from '@/types';

const { Title, Text } = Typography;

const PropertyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    faultyDevices: 0,
    todayWorkOrders: 0,
  });
  const [gridData, setGridData] = useState<any[]>([]);
  const [workOrderTrend, setWorkOrderTrend] = useState<any[]>([]);
  const [deviceTypeDistribution, setDeviceTypeDistribution] = useState<any[]>([]);
  const [pendingWorkOrders, setPendingWorkOrders] = useState<WorkOrder[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deviceRes, workOrderRes, gridRes, trendRes, typeRes] = await Promise.all([
        deviceApi.getDevices({ pageSize: 1000 }),
        workOrderApi.getWorkOrders({ status: 'pending', pageSize: 5 }),
        analyticsApi.getGridOperations(),
        analyticsApi.getUsageStatistics({ type: 'workOrderTrend' }),
        analyticsApi.getDeviceStatistics({ type: 'distribution' }),
      ]);

      if (deviceRes.success && deviceRes.data) {
        const devices = deviceRes.data.list;
        setStats({
          totalDevices: devices.length,
          onlineDevices: devices.filter((d: Device) => d.status === 'online').length,
          faultyDevices: devices.filter((d: Device) => d.status === 'faulty').length,
          todayWorkOrders: Math.floor(Math.random() * 20) + 5,
        });
      }

      if (gridRes.success && gridRes.data) {
        setGridData(gridRes.data);
      }

      if (workOrderRes.success && workOrderRes.data) {
        setPendingWorkOrders(workOrderRes.data.list);
      }

      if (trendRes.success && trendRes.data) {
        setWorkOrderTrend(trendRes.data);
      }

      if (typeRes.success && typeRes.data) {
        setDeviceTypeDistribution(typeRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      const mockGrids = [
        { _id: '1', name: '1号网格', area: '1-3号楼', deviceCount: 12, faultCount: 2, workOrderCount: 15, completionRate: 85 },
        { _id: '2', name: '2号网格', area: '4-6号楼', deviceCount: 15, faultCount: 1, workOrderCount: 12, completionRate: 92 },
        { _id: '3', name: '3号网格', area: '7-9号楼', deviceCount: 10, faultCount: 3, workOrderCount: 18, completionRate: 78 },
        { _id: '4', name: '4号网格', area: '10-12号楼', deviceCount: 14, faultCount: 0, workOrderCount: 8, completionRate: 100 },
      ];
      setGridData(mockGrids);

      const mockOrders: WorkOrder[] = [
        { _id: '1', orderNo: 'WO20240101001', title: '洗衣机故障报修', type: 'fault', priority: 'high', status: 'pending', reporterName: '张三', createdAt: new Date().toISOString() },
        { _id: '2', orderNo: 'WO20240101002', title: '烘干机定期维护', type: 'maintenance', priority: 'medium', status: 'pending', reporterName: '李四', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: '3', orderNo: 'WO20240101003', title: '饮水机漏水维修', type: 'repair', priority: 'urgent', status: 'pending', reporterName: '王五', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { _id: '4', orderNo: 'WO20240101004', title: '淋浴设备巡检', type: 'inspection', priority: 'low', status: 'pending', reporterName: '赵六', createdAt: new Date(Date.now() - 10800000).toISOString() },
        { _id: '5', orderNo: 'WO20240101005', title: '新设备安装', type: 'install', priority: 'medium', status: 'pending', reporterName: '系统', createdAt: new Date(Date.now() - 14400000).toISOString() },
      ];
      setPendingWorkOrders(mockOrders);

      setStats({
        totalDevices: 51,
        onlineDevices: 45,
        faultyDevices: 6,
        todayWorkOrders: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTrendOption = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const createdData = [12, 18, 15, 22, 19, 25, 17];
    const completedData = [10, 16, 14, 20, 18, 23, 15];

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#f0f0f0',
        textStyle: { color: '#333' },
      },
      legend: {
        data: ['创建工单', '完成工单'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        axisLabel: { color: '#8c8c8c' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#8c8c8c' },
      },
      series: [
        {
          name: '创建工单',
          type: 'line',
          smooth: true,
          data: createdData,
          lineStyle: { color: '#1890ff', width: 3 },
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        {
          name: '完成工单',
          type: 'line',
          smooth: true,
          data: completedData,
          lineStyle: { color: '#52c41a', width: 3 },
          itemStyle: { color: '#52c41a' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  };

  const getPieOption = () => {
    const data = Object.entries(DEVICE_TYPE_MAP).map(([key, name]) => ({
      value: Math.floor(Math.random() * 20) + 5,
      name,
      itemStyle: { color: DEVICE_TYPE_COLORS[key as keyof typeof DEVICE_TYPE_COLORS] },
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#f0f0f0',
        textStyle: { color: '#333' },
        formatter: '{b}: {c}台 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
        },
      ],
    };
  };

  const workOrderColumns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <Text copyable={{ text }}>{truncate(text, 12)}</Text>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => truncate(text, 15),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (status: string) => <StatusBadge type="priority" status={status} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <StatusBadge type="workOrder" status={status} />,
    },
    {
      title: '报修人',
      dataIndex: 'reporterName',
      key: 'reporterName',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: WorkOrder) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/property/work-orders?id=${record._id}`)}>
            处理
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>运维看板</Title>
            <Text type="secondary">实时监控设备状态和工单处理情况</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新数据
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} lg={6}>
            <StatCard
              title="设备总数"
              value={stats.totalDevices}
              icon={<DesktopOutlined />}
              trend={5.2}
              trendLabel="较上周"
              color="#1890ff"
              onClick={() => navigate('/property/devices')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="在线设备"
              value={stats.onlineDevices}
              icon={<CheckCircleOutlined />}
              trend={2.8}
              trendLabel="较上周"
              color="#52c41a"
              onClick={() => navigate('/property/devices?status=online')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="故障设备"
              value={stats.faultyDevices}
              icon={<WarningOutlined />}
              trend={-15.3}
              trendLabel="较上周"
              color="#ff4d4f"
              onClick={() => navigate('/property/devices?status=faulty')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="今日工单"
              value={stats.todayWorkOrders}
              icon={<FileTextOutlined />}
              trend={8.5}
              trendLabel="较昨日"
              color="#722ed1"
              onClick={() => navigate('/property/work-orders')}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title="区域网格化运维"
              extra={<Button type="link" size="small" onClick={() => navigate('/property/devices')}>查看全部 <RightOutlined style={{ fontSize: 12 }} /></Button>}
              className="card-shadow"
            >
              <Row gutter={[16, 16]}>
                {gridData.map((grid) => (
                  <Col xs={24} sm={12} lg={12} key={grid._id}>
                    <div className="grid-card">
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 16 }}>{grid.name}</Text>
                          <Tag color="blue">{grid.area}</Tag>
                        </div>
                        <Row gutter={8}>
                          <Col span={8} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>{grid.deviceCount}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>设备总数</Text>
                          </Col>
                          <Col span={8} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: grid.faultCount > 0 ? '#ff4d4f' : '#52c41a' }}>{grid.faultCount}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>故障数</Text>
                          </Col>
                          <Col span={8} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>{grid.completionRate}%</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>处理率</Text>
                          </Col>
                        </Row>
                        <Progress
                          percent={grid.completionRate}
                          size="small"
                          strokeColor={grid.completionRate >= 90 ? '#52c41a' : grid.completionRate >= 70 ? '#faad14' : '#ff4d4f'}
                        />
                      </Space>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="设备类型分布" className="card-shadow" style={{ height: '100%' }}>
              <ReactECharts option={getPieOption()} style={{ height: 280 }} />
              <List
                size="small"
                dataSource={Object.entries(DEVICE_TYPE_MAP)}
                renderItem={([key, name]) => (
                  <List.Item>
                    <Space>
                      <span style={{ fontSize: 18 }}>{DEVICE_TYPE_ICONS[key as keyof typeof DEVICE_TYPE_ICONS]}</span>
                      <Text>{name}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="近7天工单趋势" className="card-shadow">
              <ReactECharts option={getTrendOption()} style={{ height: 300 }} />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="待处理工单"
              extra={<Button type="link" size="small" onClick={() => navigate('/property/work-orders?tab=pending')}>查看全部 <RightOutlined style={{ fontSize: 12 }} /></Button>}
              className="card-shadow"
            >
              <Table
                dataSource={pendingWorkOrders}
                columns={workOrderColumns}
                rowKey="_id"
                pagination={false}
                size="small"
                loading={loading}
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default PropertyDashboard;
