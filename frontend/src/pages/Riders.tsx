import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Select,
  Button,
  Space,
  Modal,
  Descriptions,
  Progress,
  message,
  Badge,
  List,
  Divider,
  Tooltip,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CloudOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riderApi, creditApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function blurCoordinate(coord: number, decimals: number = 2): string {
  return coord.toFixed(decimals);
}

function Riders() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [detailModal, setDetailModal] = useState(false);
  const [currentRider, setCurrentRider] = useState<any>(null);
  const [trackData, setTrackData] = useState<any[]>([]);
  const [creditLevel, setCreditLevel] = useState<any>(null);
  const [reportStatus, setReportStatus] = useState<any>(null);
  const [offlineCache, setOfflineCache] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [anomalyRecords, setAnomalyRecords] = useState<any>(null);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const result: any = await riderApi.getList(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch (e) {
      message.error('加载骑士数据失败');
    }
    setLoading(false);
  };

  const viewDetail = async (id: number) => {
    try {
      const [rider, level, track, rStatus, cache, assigns, anomaly, cHistory]: any = await Promise.all([
        riderApi.getDetail(id),
        creditApi.getLevel(id),
        riderApi.getTrack(id, 2),
        riderApi.getReportStatus(id),
        riderApi.getOfflineCache(id),
        riderApi.getAssignments(id),
        riderApi.getAnomalyRecords(id),
        creditApi.getHistory(id, { page: 1, pageSize: 10 }),
      ]);
      setCurrentRider(rider);
      setCreditLevel(level);
      setTrackData(track || []);
      setReportStatus(rStatus || null);
      setOfflineCache(cache || []);
      setAssignments(assigns || []);
      setAnomalyRecords(anomaly || null);
      setCreditHistory(cHistory?.list || []);
      setDetailModal(true);
    } catch (e) {
      message.error('加载骑士详情失败');
    }
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { text: string; color: string; dot: string }> = {
      online: { text: '在线', color: 'success', dot: '#52c41a' },
      busy: { text: '忙碌', color: 'processing', dot: '#1890ff' },
      offline: { text: '离线', color: 'default', dot: '#bfbfbf' },
      rest: { text: '休息', color: 'warning', dot: '#faad14' },
    };
    const info = map[status] || { text: status, color: 'default', dot: '#999' };
    return (
      <Space size="small">
        <Badge color={info.dot} />
        {info.text}
      </Space>
    );
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { text: string; color: string }> = {
      fulltime: { text: '全职', color: 'blue' },
      parttime: { text: '兼职', color: 'green' },
    };
    const info = map[type] || { text: type, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v: string) => maskPhone(v),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v: string) => getTypeTag(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      width: 150,
      render: (v: number) => (
        <Space size="small">
          <Progress
            percent={v}
            size="small"
            style={{ width: 80 }}
            strokeColor={v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#f5222d'}
          />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '电量',
      dataIndex: 'battery',
      key: 'battery',
      width: 120,
      render: (v: number) => (
        <Space size="small">
          <Progress
            percent={v}
            size="small"
            style={{ width: 60 }}
            strokeColor={v > 50 ? '#52c41a' : v > 20 ? '#faad14' : '#f5222d'}
          />
          <span>{v}%</span>
        </Space>
      ),
    },
    {
      title: '履约率',
      dataIndex: 'fulfillment_rate',
      key: 'fulfillment_rate',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '接单意愿',
      dataIndex: 'willingness_coefficient',
      key: 'willingness_coefficient',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(0)}%`,
    },
    {
      title: '最后上线',
      dataIndex: 'last_online_at',
      key: 'last_online_at',
      width: 160,
      render: (t: number) => (t ? dayjs.unix(t).format('MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  const trackOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const d = trackData[p.dataIndex];
        return `
          <div>
            <div><b>${dayjs.unix(d.timestamp).format('HH:mm:ss')}</b></div>
            <div>速度: ${d.speed.toFixed(1)} km/h</div>
            <div>精度: ±${d.accuracy.toFixed(0)}m</div>
            <div>方向: ${d.heading.toFixed(0)}°</div>
          </div>
        `;
      },
    },
    xAxis: {
      type: 'category',
      data: trackData.map((d: any) => dayjs.unix(d.timestamp).format('HH:mm:ss')),
    },
    yAxis: [
      { type: 'value', name: '速度(km/h)' },
    ],
    series: [
      {
        name: '速度',
        type: 'line',
        smooth: true,
        data: trackData.map((d: any) => d.speed),
        areaStyle: { color: 'rgba(22, 119, 255, 0.2)' },
        markPoint: {
          data: trackData
            .filter((d: any, i: number) => i === 0 || i === trackData.length - 1)
            .map((d: any, i: number) => ({
              coord: [dayjs.unix(d.timestamp).format('HH:mm:ss'), d.speed],
              value: i === 0 ? '起点' : '终点',
            })),
        },
      },
    ],
  };

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="骑士状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(v) => {
                setFilters({ ...filters, status: v || '' });
                setPage(1);
              }}
            >
              <Option value="online">在线</Option>
              <Option value="busy">忙碌</Option>
              <Option value="offline">离线</Option>
              <Option value="rest">休息</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="骑士类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type || undefined}
              onChange={(v) => {
                setFilters({ ...filters, type: v || '' });
                setPage(1);
              }}
            >
              <Option value="fulltime">全职</Option>
              <Option value="parttime">兼职</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>
              搜索
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 名骑士`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="骑士详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
        width={820}
      >
        {currentRider && (
          <div>
            <Descriptions
              column={2}
              bordered
              size="small"
              title="基础信息"
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="ID">{currentRider.id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentRider.name}</Descriptions.Item>
              <Descriptions.Item label="手机号（脱敏）">
                <Space>
                  <span>{maskPhone(currentRider.phone)}</span>
                  <Tooltip title="根据《个人信息保护法》最小必要原则，手机号仅展示前3后4位">
                    <ExclamationCircleOutlined style={{ color: '#999', cursor: 'pointer' }} />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeTag(currentRider.type)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentRider.status)}</Descriptions.Item>
              <Descriptions.Item label="车辆类型">
                {currentRider.vehicle_type === 'electric' ? '电动车' : currentRider.vehicle_type}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              column={2}
              bordered
              size="small"
              title="位置信息（最小必要展示）"
              style={{ marginBottom: 12 }}
            >
              {currentRider.current_lat && currentRider.current_lng ? (
                <>
                  <Descriptions.Item label="大致区域" span={2}>
                    <Space>
                      <EnvironmentOutlined />
                      <span>朝阳区 · 国贸商圈附近</span>
                      <Tooltip title="精确经纬度已模糊化，仅保留2位小数（约1.1km精度），满足最小必要原则">
                        <ExclamationCircleOutlined style={{ color: '#999', cursor: 'pointer' }} />
                      </Tooltip>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="模糊坐标（脱敏）">
                    {blurCoordinate(currentRider.current_lat)}, {blurCoordinate(currentRider.current_lng)}
                  </Descriptions.Item>
                  <Descriptions.Item label="定位精度">
                    <Tag>仅业务授权可见</Tag>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label="当前位置" span={2}>
                  <span style={{ color: '#999' }}>离线中，无位置数据</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions
              column={2}
              bordered
              size="small"
              title="轨迹上报状态"
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="上报频率">
                <Space>
                  <ClockCircleOutlined />
                  <span>每15秒上报一次</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="上次上报时间">
                {reportStatus?.last_report_time
                  ? dayjs.unix(reportStatus.last_report_time).format('HH:mm:ss')
                  : '无上报记录'}
              </Descriptions.Item>
              <Descriptions.Item label="实际上报间隔">
                {reportStatus?.interval_seconds
                  ? `${reportStatus.interval_seconds}秒`
                  : '数据不足'}
              </Descriptions.Item>
              <Descriptions.Item label="上报状态">
                {reportStatus?.is_normal ? (
                  <Tag color="green">
                    <CheckCircleOutlined /> 正常上报
                  </Tag>
                ) : (
                  <Tag color="red">
                    <WarningOutlined /> 上报异常
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="离线接单缓存" span={2}>
                {offlineCache.length > 0 ? (
                  <Space>
                    <Tag color="orange">
                      <CloudOutlined /> {offlineCache.length} 条待同步
                    </Tag>
                    {offlineCache.slice(0, 3).map((c: any) => (
                      <Tag key={c.id}>
                        {c.action} 订单#{c.order_id}
                      </Tag>
                    ))}
                    {offlineCache.length > 3 && <Tag>+{offlineCache.length - 3}...</Tag>}
                  </Space>
                ) : (
                  <Tag color="green">
                    <CheckCircleOutlined /> 无离线缓存，数据已同步
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              column={2}
              bordered
              size="small"
              title="调度评分"
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="信用分" span={2}>
                <Space>
                  <Progress
                    percent={currentRider.credit_score}
                    strokeColor={
                      currentRider.credit_score >= 80
                        ? '#52c41a'
                        : currentRider.credit_score >= 60
                        ? '#faad14'
                        : '#f5222d'
                    }
                  />
                  <span style={{ fontWeight: 'bold' }}>{currentRider.credit_score}</span>
                  {creditLevel && (
                    <Tag color={creditLevel.level.color}>{creditLevel.level.level}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="电量">
                {currentRider.battery}%
              </Descriptions.Item>
              <Descriptions.Item label="履约率">
                {(currentRider.fulfillment_rate * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="接单意愿系数">
                {(currentRider.willingness_coefficient * 100).toFixed(0)}%
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs.unix(currentRider.created_at).format('YYYY-MM-DD')}
              </Descriptions.Item>
            </Descriptions>

            {creditLevel && creditLevel.level && creditLevel.level.benefits && (
              <Card
                size="small"
                title={`${creditLevel.level.level} - 权益`}
                style={{ marginTop: 12 }}
              >
                <Space wrap>
                  {creditLevel.level.benefits.map((b: string, i: number) => (
                    <Tag key={i} color="blue">
                      {b}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            <Card
              size="small"
              title="信用分变动原因"
              style={{ marginTop: 12 }}
            >
              {creditHistory.length > 0 ? (
                <Timeline
                  items={creditHistory.slice(0, 8).map((record: any) => ({
                    color: record.change_amount > 0 ? 'green' : 'red',
                    children: (
                      <div>
                        <Space>
                          <span style={{ fontWeight: 500 }}>
                            {record.change_amount > 0 ? '+' : ''}
                            {record.change_amount}分
                          </span>
                          <Tag>{record.change_type === 'on_time_delivery' ? '准时送达' :
                            record.change_type === 'good_review' ? '好评奖励' :
                            record.change_type === 'complaint' ? '申诉扣减' :
                            record.change_type === 'reward' ? '活动奖励' :
                            record.change_type === 'penalty' ? '处罚扣减' : record.change_type}
                          </Tag>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {dayjs.unix(record.created_at).format('MM-DD HH:mm')}
                          </span>
                        </Space>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                          {record.reason || '-'}
                          <span style={{ marginLeft: 8, color: '#999' }}>
                            ({record.before_score} → {record.after_score})
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div style={{ color: '#999', textAlign: 'center' }}>暂无变动记录</div>
              )}
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <SwapOutlined />
                  <span>派单匹配依据（近期）</span>
                </Space>
              }
              style={{ marginTop: 12 }}
            >
              {assignments.length > 0 ? (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={assignments}
                  rowKey="id"
                  columns={[
                    {
                      title: '订单',
                      dataIndex: 'order_no',
                      width: 140,
                      render: (v: string) => v || '-',
                    },
                    {
                      title: '商家',
                      dataIndex: 'merchant_name',
                      width: 120,
                      render: (v: string) => v || '-',
                    },
                    {
                      title: '匹配分',
                      dataIndex: 'score',
                      width: 80,
                      render: (v: number) => (
                        <span style={{ color: v > 0.7 ? '#52c41a' : v > 0.5 ? '#faad14' : '#f5222d', fontWeight: 500 }}>
                          {(v * 100).toFixed(0)}%
                        </span>
                      ),
                    },
                    {
                      title: '距离',
                      dataIndex: 'distance',
                      width: 80,
                      render: (v: number) => `${v.toFixed(2)}km`,
                    },
                    {
                      title: '结果',
                      dataIndex: 'status',
                      width: 80,
                      render: (v: string) => {
                        const map: Record<string, { text: string; color: string }> = {
                          pending: { text: '待响应', color: 'orange' },
                          accepted: { text: '已接受', color: 'green' },
                          rejected: { text: '已拒绝', color: 'red' },
                          timeout: { text: '超时', color: 'default' },
                        };
                        const info = map[v] || { text: v, color: 'default' };
                        return <Tag color={info.color}>{info.text}</Tag>;
                      },
                    },
                    {
                      title: '时间',
                      dataIndex: 'created_at',
                      width: 100,
                      render: (t: number) => dayjs.unix(t).format('MM-DD HH:mm'),
                    },
                  ]}
                />
              ) : (
                <div style={{ color: '#999', textAlign: 'center' }}>暂无派单记录</div>
              )}
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <WarningOutlined />
                  <span>异常复查记录</span>
                </Space>
              }
              style={{ marginTop: 12 }}
            >
              {anomalyRecords && (anomalyRecords.complaints?.length > 0 || anomalyRecords.creditRecords?.length > 0) ? (
                <div>
                  {anomalyRecords.complaints?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>申诉记录</div>
                      <List
                        size="small"
                        dataSource={anomalyRecords.complaints.slice(0, 5)}
                        renderItem={(item: any) => (
                          <List.Item>
                            <Space>
                              <Tag color={item.type === 'timeout' ? 'orange' : item.type === 'lost' ? 'red' : 'volcano'}>
                                {item.type === 'timeout' ? '超时' : item.type === 'lost' ? '丢件' :
                                 item.type === 'bad_review' ? '差评' : '服务'}
                              </Tag>
                              <span>{item.order_no || `订单#${item.order_id}`}</span>
                              <span style={{ color: '#666', fontSize: 12 }}>{item.reason}</span>
                            </Space>
                            <Tag color={item.status === 'resolved' ? 'green' : item.status === 'pending' ? 'red' : 'default'}>
                              {item.status === 'resolved' ? '已处理' : item.status === 'pending' ? '待处理' : '处理中'}
                            </Tag>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                  {anomalyRecords.creditRecords?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>扣分记录</div>
                      <List
                        size="small"
                        dataSource={anomalyRecords.creditRecords.slice(0, 5)}
                        renderItem={(item: any) => (
                          <List.Item>
                            <Space>
                              <Tag color="red">{item.change_amount}分</Tag>
                              <span style={{ fontSize: 12 }}>{item.reason || item.change_type}</span>
                            </Space>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {dayjs.unix(item.created_at).format('MM-DD HH:mm')}
                            </span>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#999', textAlign: 'center' }}>无异常记录</div>
              )}
            </Card>

            {trackData.length > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <EnvironmentOutlined />
                    <span>轨迹回放（近2小时 · 每15秒采样）</span>
                    <Tag>{trackData.length} 个轨迹点</Tag>
                  </Space>
                }
                style={{ marginTop: 12 }}
              >
                <ReactECharts option={trackOption} style={{ height: 220 }} />
                <div style={{ marginTop: 8, fontSize: 12, color: '#999', textAlign: 'center' }}>
                  轨迹采样间隔: 15秒 | 起止时间: {dayjs.unix(trackData[0]?.timestamp).format('HH:mm:ss')} ~ {dayjs.unix(trackData[trackData.length - 1]?.timestamp).format('HH:mm:ss')}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Riders;
