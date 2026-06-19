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
} from 'antd';
import { SearchOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riderApi, creditApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

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
      const [rider, level, track]: any = await Promise.all([
        riderApi.getDetail(id),
        creditApi.getLevel(id),
        riderApi.getTrack(id, 2),
      ]);
      setCurrentRider(rider);
      setCreditLevel(level);
      setTrackData(track || []);
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
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
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
      trigger: 'item',
      formatter: (p: any) =>
        `时间: ${p.data.time}<br/>速度: ${p.data.speed}km/h`,
    },
    xAxis: {
      type: 'category',
      data: trackData.map((d: any) => dayjs.unix(d.timestamp).format('HH:mm')),
    },
    yAxis: {
      type: 'value',
      name: '速度(km/h)',
    },
    series: [
      {
        name: '速度',
        type: 'line',
        smooth: true,
        data: trackData.map((d: any) => ({
          value: d.speed,
          time: dayjs.unix(d.timestamp).format('HH:mm:ss'),
          speed: d.speed.toFixed(1),
        })),
        areaStyle: { color: 'rgba(22, 119, 255, 0.2)' },
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
        width={700}
      >
        {currentRider && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="ID">{currentRider.id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentRider.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentRider.phone}</Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeTag(currentRider.type)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentRider.status)}</Descriptions.Item>
              <Descriptions.Item label="车辆类型">
                {currentRider.vehicle_type === 'electric' ? '电动车' : currentRider.vehicle_type}
              </Descriptions.Item>
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
              {currentRider.current_lat && currentRider.current_lng && (
                <Descriptions.Item label="当前位置" span={2}>
                  <Space>
                    <EnvironmentOutlined />
                    {currentRider.current_lat.toFixed(6)}, {currentRider.current_lng.toFixed(6)}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            {creditLevel && creditLevel.level && creditLevel.level.benefits && (
              <Card
                size="small"
                title={`${creditLevel.level.level} - 权益`}
                style={{ marginTop: 16 }}
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

            {trackData.length > 0 && (
              <Card size="small" title="近2小时速度轨迹" style={{ marginTop: 16 }}>
                <ReactECharts option={trackOption} style={{ height: 200 }} />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Riders;
