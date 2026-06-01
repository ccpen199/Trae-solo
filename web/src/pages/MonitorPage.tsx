import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Tag, Statistic, Alert, Select, Space, Button, message, Spin, Tabs, Progress, Badge, Modal, Form, Input, Descriptions, Divider } from 'antd';
import { WarningFilled, CloudFilled, ThunderboltFilled, ReloadOutlined, BarChartOutlined, FileSearchOutlined, AlertOutlined, EnvironmentOutlined, ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { monitorApi, reportApi, warningApi } from '../api';

const LEVEL_COLORS: Record<string, string> = {
  blue: '#1890ff',
  yellow: '#faad14',
  orange: '#fa8c16',
  red: '#f5222d',
};

const LEVEL_LABELS: Record<string, string> = {
  blue: '蓝色',
  yellow: '黄色',
  orange: '橙色',
  red: '红色',
};

const DATA_TYPE_LABELS: Record<string, string> = {
  rainfall: '降雨(mm)',
  wind: '风速(m/s)',
  temperature: '温度(℃)',
  radar: '雷达回波(dBZ)',
  station: '综合监测',
};

const DATA_TYPE_ICONS: Record<string, string> = {
  rainfall: '🌧️',
  wind: '💨',
  temperature: '🌡️',
  radar: '📡',
  station: '📊',
};

const RESEARCH_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待研判', color: 'default' },
  researching: { label: '研判中', color: 'processing' },
  researched: { label: '已研判', color: 'success' },
  converted: { label: '已转预警', color: 'warning' },
};

const DATA_TYPE_TO_WARNING_TYPE: Record<string, string> = {
  rainfall: '暴雨',
  wind: '大风',
  temperature: '高温',
  radar: '雷电',
  station: '暴雨',
};

export default function MonitorPage() {
  const navigate = useNavigate();
  const [researchForm] = Form.useForm();
  const [warningForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [realtime, setRealtime] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [allTrendData, setAllTrendData] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({});
  const [dataType, setDataType] = useState<string>('rainfall');
  const [timeRange, setTimeRange] = useState<number>(24);
  const [stations, setStations] = useState<any[]>([]);
  const [researchModalOpen, setResearchModalOpen] = useState(false);
  const [researchingAlert, setResearchingAlert] = useState<any>(null);
  const [createWarningModalOpen, setCreateWarningModalOpen] = useState(false);
  const [creatingWarningAlert, setCreatingWarningAlert] = useState<any>(null);
  const [warningList, setWarningList] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadTrendForAllTypes(timeRange);
  }, [timeRange]);

  async function loadAll() {
    setLoading(true);
    try {
      const [rt, al, th, ov, st] = await Promise.all([
        monitorApi.realtime().catch((e) => { console.error('realtime error:', e); return []; }),
        monitorApi.alerts().catch((e) => { console.error('alerts error:', e); return []; }),
        monitorApi.thresholds().catch((e) => { console.error('thresholds error:', e); return []; }),
        reportApi.overview().catch((e) => { console.error('overview error:', e); return {}; }),
        monitorApi.stations().catch((e) => { console.error('stations error:', e); return []; }),
      ]);
      setRealtime(rt || []);
      const normalizedAlerts = (al || []).map((a: any) => ({
        research_status: a.research_status || 'pending',
        handler: a.handler || '',
        handle_result: a.handle_result || '',
        linked_warning_id: a.linked_warning_id || null,
        ...a,
      }));
      setAlerts(normalizedAlerts);
      setThresholds(th || []);
      setOverview(ov || {});
      setStations(st || []);
      const wl = await warningApi.list().catch(() => ({ rows: [] }));
      setWarningList(wl?.rows || []);
    } catch (e: any) {
      console.error('loadAll error:', e);
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrendForAllTypes(hours: number) {
    try {
      const types = ['rainfall', 'wind', 'temperature', 'radar', 'station'];
      const results = await Promise.all(
        types.map(t => monitorApi.trend(t, hours).catch(() => []))
      );
      const allData = results.flat();
      setAllTrendData(allData);
      const filtered = allData.filter((d: any) => d.data_type === dataType);
      setTrendData(filtered);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  useEffect(() => {
    const filtered = allTrendData.filter((d: any) => d.data_type === dataType);
    setTrendData(filtered);
  }, [dataType, allTrendData]);

  function handleTimeRangeChange(hours: number) {
    setTimeRange(hours);
    message.info(`已切换为 ${hours > 48 ? '7天' : hours + '小时'} 数据视图，正在刷新...`);
  }

  const hitByType = useMemo(() => {
    const map: Record<string, number> = {};
    alerts.forEach((a: any) => {
      map[a.data_type] = (map[a.data_type] || 0) + 1;
    });
    return map;
  }, [alerts]);

  const summaryByType = useMemo(() => {
    const map: Record<string, { count: number; hit: number; values: number[] }> = {};
    realtime.forEach((r: any) => {
      if (!map[r.data_type]) {
        map[r.data_type] = { count: 0, hit: 0, values: [] };
      }
      map[r.data_type].count++;
      if (r.threshold_hit === 1) map[r.data_type].hit++;
      map[r.data_type].values.push(r.value);
    });
    return map;
  }, [realtime]);

  function buildTrendOption() {
    const byStation: Record<string, any[]> = {};
    trendData.forEach((d: any) => {
      const key = d.station_name || `站点${d.station_id}`;
      if (!byStation[key]) byStation[key] = [];
      byStation[key].push([d.recorded_at, d.value]);
    });
    const series = Object.entries(byStation).map(([name, data]) => ({
      name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data.sort((a, b) => a[0].localeCompare(b[0])),
    }));
    const thList = thresholds.filter((t: any) => t.data_type === dataType);
    const markLines = thList.map((t: any) => ({
      name: `${LEVEL_LABELS[t.warning_level] || t.warning_level}预警`,
      yAxis: t.threshold_value,
      lineStyle: { color: LEVEL_COLORS[t.warning_level] || '#999', type: 'dashed', width: 2 },
      label: {
        formatter: `${LEVEL_LABELS[t.warning_level] || t.warning_level}:${t.threshold_value}`,
        color: LEVEL_COLORS[t.warning_level],
        fontWeight: 'bold' as const,
      },
    }));
    if (series.length > 0 && markLines.length > 0) {
      (series[0] as any).markLine = { silent: true, data: markLines, animation: false };
    }
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: Object.keys(byStation), top: 0, type: 'scroll' },
      grid: { top: 50, right: 20, bottom: 30, left: 60 },
      xAxis: {
        type: 'time',
        axisLabel: { formatter: (v: number) => dayjs(v).format(timeRange > 48 ? 'MM-DD' : 'MM-DD HH:mm') },
      },
      yAxis: { type: 'value', name: DATA_TYPE_LABELS[dataType] || dataType },
      series,
      color: ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2', '#722ed1'],
    };
  }

  function buildMultiTypeOverview() {
    const types = ['rainfall', 'wind', 'temperature', 'radar'];
    return (
      <Row gutter={[12, 12]}>
        {types.map((type) => {
          const summary = summaryByType[type] || { count: 0, hit: 0, values: [] };
          const th = thresholds
            .filter((t: any) => t.data_type === type)
            .sort((a: any, b: any) => a.threshold_value - b.threshold_value);
          const currentValues = realtime.filter((r: any) => r.data_type === type);
          const maxValue = currentValues.length > 0 ? Math.max(...currentValues.map((r: any) => r.value)) : 0;
          const maxTh = th.length > 0 ? th[th.length - 1].threshold_value : 100;
          const percent = Math.min(100, (maxValue / maxTh) * 100);
          const hitLevel = th.find((t: any) => maxValue >= t.threshold_value);
          return (
            <Col xs={24} sm={12} md={6} key={type}>
              <Card
                size="small"
                style={{ borderLeft: `4px solid ${hitLevel ? LEVEL_COLORS[hitLevel.warning_level] : '#d9d9d9'}` }}
                title={
                  <Space>
                    <span style={{ fontSize: 18 }}>{DATA_TYPE_ICONS[type]}</span>
                    <strong>{DATA_TYPE_LABELS[type].split('(')[0]}</strong>
                    {summary.hit > 0 && <Badge count={summary.hit} color="red" />}
                  </Space>
                }
                extra={
                  <Tag color={hitLevel ? LEVEL_COLORS[hitLevel.warning_level] : 'default'}>
                    {hitLevel ? LEVEL_LABELS[hitLevel.warning_level] + '命中' : '正常'}
                  </Tag>
                }
              >
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Statistic
                      title="站点数"
                      value={summary.count}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="当前最大值"
                      value={maxValue}
                      valueStyle={{ fontSize: 18, color: hitLevel ? LEVEL_COLORS[hitLevel.warning_level] : undefined }}
                      suffix={DATA_TYPE_LABELS[type].match(/\((.+)\)/)?.[1] || ''}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <Progress
                    percent={percent}
                    strokeColor={hitLevel ? LEVEL_COLORS[hitLevel.warning_level] : '#52c41a'}
                    showInfo={false}
                    size="small"
                  />
                </div>
                {th.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
                    {th.map((t: any, i: number) => (
                      <Tag key={i} color={LEVEL_COLORS[t.warning_level]}>
                        {LEVEL_LABELS[t.warning_level]} {t.threshold_value}
                      </Tag>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  }

  const alertColumns = [
    { title: '站点', dataIndex: 'station_name', key: 'station_name', width: 120 },
    {
      title: '类型',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 110,
      render: (v: string) => (
        <Space>
          <span>{DATA_TYPE_ICONS[v]}</span>
          {DATA_TYPE_LABELS[v]?.split('(')[0] || v}
        </Space>
      ),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (v: number, r: any) => {
        const th = thresholds.find((t: any) => t.data_type === r.data_type && t.threshold_value <= v);
        return (
          <Space>
            <strong style={{ fontSize: 16, color: th ? LEVEL_COLORS[th.warning_level] : undefined }}>{v}</strong>
            {th && <Tag color={LEVEL_COLORS[th.warning_level]}>{LEVEL_LABELS[th.warning_level]}阈值</Tag>}
          </Space>
        );
      },
    },
    { title: '记录时间', dataIndex: 'recorded_at', key: 'recorded_at', render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss') },
    {
      title: '研判状态',
      dataIndex: 'research_status',
      key: 'research_status',
      width: 100,
      render: (v: string) => {
        const status = RESEARCH_STATUS_MAP[v] || RESEARCH_STATUS_MAP.pending;
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '关联预警',
      dataIndex: 'linked_warning_id',
      key: 'linked_warning_id',
      width: 100,
      render: (v: number) => v ? (
        <a onClick={() => navigate('/warning')}>预警#{v}</a>
      ) : '-',
    },
    {
      title: '值班处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '处理结果',
      dataIndex: 'handle_result',
      key: 'handle_result',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => openResearchModal(record)}
          >
            研判
          </Button>
          <Button
            type="link"
            size="small"
            icon={<AlertOutlined />}
            onClick={() => openCreateWarningModal(record)}
          >
            创建预警
          </Button>
        </Space>
      ),
    },
  ];

  const realtimeColumns = [
    { title: '站点', dataIndex: 'station_name', key: 'station_name', width: 120 },
    {
      title: '类型',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 110,
      render: (v: string) => (
        <Space>
          <span>{DATA_TYPE_ICONS[v]}</span>
          <Tag>{DATA_TYPE_LABELS[v]?.split('(')[0] || v}</Tag>
        </Space>
      ),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (v: number, r: any) => {
        const th = thresholds.find((t: any) => t.data_type === r.data_type && t.threshold_value <= v);
        return (
          <Space>
            <strong style={{ fontSize: 18, color: th ? LEVEL_COLORS[th.warning_level] : undefined }}>{v}</strong>
            <span style={{ color: '#999', fontSize: 12 }}>
              {DATA_TYPE_LABELS[r.data_type]?.match(/\((.+)\)/)?.[1] || ''}
            </span>
            {r.threshold_hit === 1 && <Tag color="red">命中</Tag>}
          </Space>
        );
      },
      sorter: (a: any, b: any) => a.value - b.value,
    },
    {
      title: '时间',
      dataIndex: 'recorded_at',
      key: 'recorded_at',
      width: 150,
      render: (v: string) => (
        <Space>
          <span>{dayjs(v).format('MM-DD HH:mm:ss')}</span>
          <Tag color="green">实时</Tag>
        </Space>
      ),
    },
  ];

  const trendTabItems = ['rainfall', 'wind', 'temperature', 'radar'].map((type) => ({
    key: type,
    label: (
      <Space>
        <span style={{ fontSize: 16 }}>{DATA_TYPE_ICONS[type]}</span>
        {DATA_TYPE_LABELS[type]?.split('(')[0]}
        {hitByType[type] > 0 && <Badge count={hitByType[type]} color="red" />}
      </Space>
    ),
  }));

  function openResearchModal(record: any) {
    setResearchingAlert(record);
    researchForm.setFieldsValue({
      research_status: record.research_status || 'pending',
      handler: record.handler || '',
      handle_result: record.handle_result || '',
      linked_warning_id: record.linked_warning_id || undefined,
    });
    setResearchModalOpen(true);
  }

  async function handleResearchSave() {
    try {
      const values = await researchForm.validateFields();
      await monitorApi.updateAlert(researchingAlert.id, values);
      setAlerts(prev => prev.map(a =>
        a.id === researchingAlert.id
          ? { ...a, ...values }
          : a
      ));
      message.success('研判信息已保存');
      setResearchModalOpen(false);
    } catch (e: any) {
      if (e.message) message.error(e.message);
    }
  }

  function openCreateWarningModal(record: any) {
    setCreatingWarningAlert(record);
    const warningType = DATA_TYPE_TO_WARNING_TYPE[record.data_type] || '暴雨';
    const th = thresholds.find((t: any) => t.data_type === record.data_type && t.threshold_value <= record.value);
    const level = th?.warning_level || 'yellow';
    const content = `【${LEVEL_LABELS[level]}预警】${record.station_name || '站点'}${DATA_TYPE_LABELS[record.data_type]?.split('(')[0] || record.data_type}数据达到${record.value}${DATA_TYPE_LABELS[record.data_type]?.match(/\((.+)\)/)?.[1] || ''}，超过${LEVEL_LABELS[level]}预警阈值（${th?.threshold_value || '-'}），记录时间${dayjs(record.recorded_at).format('YYYY-MM-DD HH:mm')}。请相关地区注意防范。`;
    warningForm.setFieldsValue({
      type: warningType,
      level,
      affected_area: record.station_name || '',
      content,
      suggested_measures: `1.密切关注${DATA_TYPE_LABELS[record.data_type]?.split('(')[0] || '监测'}数据变化；2.做好应急准备；3.及时通知相关部门`,
      valid_from: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      valid_to: dayjs().add(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      issuer: '值班员',
    });
    setCreateWarningModalOpen(true);
  }

  async function handleCreateWarning() {
    try {
      const values = await warningForm.validateFields();
      const payload = {
        type: values.type,
        level: values.level,
        affected_area: values.affected_area,
        content: values.content,
        suggested_measures: values.suggested_measures,
        valid_from: values.valid_from,
        valid_to: values.valid_to,
        issuer: values.issuer,
      };
      const result: any = await warningApi.create(payload);
      const newWarningId = result.id;
      await monitorApi.updateAlert(creatingWarningAlert.id, {
        research_status: 'converted',
        linked_warning_id: newWarningId,
      });
      setAlerts(prev => prev.map(a =>
        a.id === creatingWarningAlert.id
          ? { ...a, research_status: 'converted', linked_warning_id: newWarningId }
          : a
      ));
      message.success(`预警已创建（#${newWarningId}），命中记录已更新为"已转预警"`);
      setCreateWarningModalOpen(false);
      const wl = await warningApi.list().catch(() => ({ rows: [] }));
      setWarningList(wl?.rows || []);
    } catch (e: any) {
      if (e.errorFields) return;
      if (e.message) message.error(e.message);
    }
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃预警"
              value={overview.active_warnings || 0}
              prefix={<WarningFilled style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="阈值命中"
              value={overview.total_alerts || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ThunderboltFilled />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待回执"
              value={overview.pending_receipts || 0}
              prefix={<CloudFilled />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃渠道"
              value={overview.active_channels || 0}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <strong>多类型监测概览</strong>
                <Tag color="blue">{timeRange > 48 ? '7天' : timeRange + '小时'}</Tag>
              </Space>
            }
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadAll}>刷新实时数据</Button>
            }
          >
            {buildMultiTypeOverview()}
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={
              <Space>
                <span style={{ fontSize: 18 }}>{DATA_TYPE_ICONS[dataType]}</span>
                <strong>{DATA_TYPE_LABELS[dataType]}趋势变化</strong>
              </Space>
            }
            extra={
              <Space>
                <Button
                  type={timeRange === 24 ? 'primary' : 'default'}
                  onClick={() => handleTimeRangeChange(24)}
                >
                  24小时
                </Button>
                <Button
                  type={timeRange === 48 ? 'primary' : 'default'}
                  onClick={() => handleTimeRangeChange(48)}
                >
                  48小时
                </Button>
                <Button
                  type={timeRange === 168 ? 'primary' : 'default'}
                  onClick={() => handleTimeRangeChange(168)}
                >
                  7天
                </Button>
              </Space>
            }
          >
            <Tabs
              activeKey={dataType}
              onChange={setDataType}
              items={trendTabItems}
              style={{ marginBottom: 16 }}
            />
            <ReactECharts option={buildTrendOption()} style={{ height: 380 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <strong>各站点实时数值（全类型）</strong>
                <Tag color="blue">{realtime.length} 个监测点</Tag>
              </Space>
            }
            extra={
              <Select
                placeholder="按类型筛选"
                style={{ width: 120 }}
                allowClear
                onChange={(v) => setDataType(v || 'rainfall')}
                options={[
                  { value: 'rainfall', label: '🌧️ 降雨' },
                  { value: 'wind', label: '💨 风速' },
                  { value: 'temperature', label: '🌡️ 温度' },
                  { value: 'radar', label: '📡 雷达' },
                ]}
              />
            }
          >
            <Table
              size="small"
              dataSource={realtime}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              columns={realtimeColumns}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltFilled style={{ color: '#f5222d' }} />
                <strong>阈值命中记录（全类型）</strong>
                <Tag color="red">{alerts.length} 条命中</Tag>
              </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadAll}>刷新</Button>}
          >
            {alerts.length === 0 ? (
              <Alert message="暂无阈值命中记录，各监测指标正常" type="success" showIcon />
            ) : (
              <Table
                size="small"
                dataSource={alerts}
                rowKey="id"
                pagination={{ pageSize: 8, showSizeChanger: true }}
                columns={alertColumns}
              />
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card title={<strong>阈值配置（全类型）</strong>}>
            <Table
              size="small"
              dataSource={thresholds}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '数据类型',
                  dataIndex: 'data_type',
                  key: 'data_type',
                  width: 140,
                  render: (v: string) => (
                    <Space>
                      <span style={{ fontSize: 16 }}>{DATA_TYPE_ICONS[v]}</span>
                      <strong>{DATA_TYPE_LABELS[v]?.split('(')[0] || v}</strong>
                    </Space>
                  ),
                },
                {
                  title: '预警级别',
                  dataIndex: 'warning_level',
                  key: 'warning_level',
                  width: 100,
                  render: (v: string) => (
                    <Tag color={LEVEL_COLORS[v]} style={{ fontSize: 14, padding: '2px 12px' }}>
                      {LEVEL_LABELS[v] || v}
                    </Tag>
                  ),
                },
                {
                  title: '阈值',
                  dataIndex: 'threshold_value',
                  key: 'threshold_value',
                  width: 100,
                  render: (v: number) => <strong style={{ fontSize: 16 }}>{v}</strong>,
                },
                { title: '比较方式', dataIndex: 'comparison', key: 'comparison', width: 100 },
                { title: '说明', dataIndex: 'description', key: 'description' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="研判操作"
        open={researchModalOpen}
        onCancel={() => setResearchModalOpen(false)}
        onOk={handleResearchSave}
        okText="保存"

      >
        <Form form={researchForm} layout="vertical">
          <Form.Item name="research_status" label="研判状态" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'pending', label: '待研判' },
                { value: 'researching', label: '研判中' },
                { value: 'researched', label: '已研判' },
                { value: 'converted', label: '已转预警' },
              ]}
            />
          </Form.Item>
          <Form.Item name="handler" label="值班处理人">
            <Input placeholder="请输入处理人姓名" />
          </Form.Item>
          <Form.Item name="handle_result" label="处理结果">
            <Input.TextArea rows={3} placeholder="请输入处理结果摘要" />
          </Form.Item>
          <Form.Item name="linked_warning_id" label="关联预警">
            <Select
              allowClear
              placeholder="选择已有预警（可选）"
              options={warningList.map((w: any) => ({
                value: w.id,
                label: `预警#${w.id} - ${w.type || ''} ${w.level || ''}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: '#faad14' }} />
            <strong>从阈值命中创建预警</strong>
          </Space>
        }
        open={createWarningModalOpen}
        onCancel={() => setCreateWarningModalOpen(false)}
        onOk={handleCreateWarning}
        okText="提交并回写命中记录"
        width={750}
        maskClosable={false}
      >
        {creatingWarningAlert && (
          <Alert
            type="warning"
            showIcon
            message={
              <Space>
                <strong>以下数据已根据阈值命中自动带入，请核实后人工修订</strong>
                <Tag color="red">提交后将自动回写命中记录为"已转预警"</Tag>
              </Space>
            }
            description={
              <Descriptions size="small" column={4} style={{ marginTop: 8 }}>
                <Descriptions.Item label="来源站点">
                  <Space>
                    <EnvironmentOutlined />
                    <strong>{creatingWarningAlert.station_name}</strong>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="监测类型">
                  <Space>
                    <span>{DATA_TYPE_ICONS[creatingWarningAlert.data_type]}</span>
                    {DATA_TYPE_LABELS[creatingWarningAlert.data_type]?.split('(')[0]}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="命中数值">
                  <Space>
                    <strong style={{ fontSize: 18, color: LEVEL_COLORS[thresholds.find((t: any) => t.data_type === creatingWarningAlert.data_type && t.threshold_value <= creatingWarningAlert.value)?.warning_level || 'blue'] }}>
                      {creatingWarningAlert.value}
                    </strong>
                    <span style={{ color: '#999' }}>
                      {DATA_TYPE_LABELS[creatingWarningAlert.data_type]?.match(/\((.+)\)/)?.[1] || ''}
                    </span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="阈值级别">
                  <Tag color={LEVEL_COLORS[thresholds.find((t: any) => t.data_type === creatingWarningAlert.data_type && t.threshold_value <= creatingWarningAlert.value)?.warning_level || 'blue']}>
                    {LEVEL_LABELS[thresholds.find((t: any) => t.data_type === creatingWarningAlert.data_type && t.threshold_value <= creatingWarningAlert.value)?.warning_level || 'blue']}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="记录时间" span={2}>
                  <Space>
                    <ClockCircleOutlined />
                    {dayjs(creatingWarningAlert.recorded_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="研判结论" span={2}>
                  <Tag color="processing">阈值触发，建议发布预警</Tag>
                </Descriptions.Item>
              </Descriptions>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Divider orientation="left" style={{ margin: '12px 0' }}>
          <Space>
            <EditOutlined />
            <strong>预警信息人工修订</strong>
          </Space>
        </Divider>
        <Form form={warningForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="灾害类型" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: '暴雨', label: '暴雨' },
                    { value: '大风', label: '大风' },
                    { value: '高温', label: '高温' },
                    { value: '雷电', label: '雷电' },
                    { value: '冰雹', label: '冰雹' },
                    { value: '大雾', label: '大雾' },
                    { value: '霾', label: '霾' },
                    { value: '寒潮', label: '寒潮' },
                    { value: '干旱', label: '干旱' },
                    { value: '霜冻', label: '霜冻' },
                    { value: '台风', label: '台风' },
                    { value: '暴雪', label: '暴雪' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="预警级别" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'blue', label: '蓝色(IV级/一般)' },
                    { value: 'yellow', label: '黄色(III级/较重)' },
                    { value: 'orange', label: '橙色(II级/严重)' },
                    { value: 'red', label: '红色(I级/特别严重)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="affected_area" label="影响区域" rules={[{ required: true }]}>
            <Input placeholder="请输入影响区域，如：全市范围、东河区、工业园区等" />
          </Form.Item>
          <Form.Item name="content" label="预警内容" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细描述预警内容" />
          </Form.Item>
          <Form.Item name="suggested_measures" label="建议措施">
            <Input.TextArea rows={2} placeholder="请输入建议措施，支持分点描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valid_from" label="有效期起">
                <Input placeholder="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_to" label="有效期止">
                <Input placeholder="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="issuer" label="签发人">
            <Input placeholder="请输入签发人姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}