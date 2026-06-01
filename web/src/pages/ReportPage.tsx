import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Statistic, DatePicker, Space, Select, Tabs, message, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { reportApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const LEVEL_LABELS: Record<string, string> = {
  blue: '蓝色',
  yellow: '黄色',
  orange: '橙色',
  red: '红色',
};

const LEVEL_COLORS: Record<string, string> = {
  blue: '#1890ff',
  yellow: '#faad14',
  orange: '#fa8c16',
  red: '#f5222d',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  cancelled: '已解除',
  expired: '已过期',
};

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>({});
  const [warningStats, setWarningStats] = useState<any[]>([]);
  const [publishStats, setPublishStats] = useState<any[]>([]);
  const [receiptStats, setReceiptStats] = useState<any>({ rows: [], total: 0 });
  const [timeliness, setTimeliness] = useState<any>({ rows: [], avg_delay_minutes: 0 });
  const [coverage, setCoverage] = useState<any>({ rows: [], avg_coverage_rate: 0 });
  const [hitAccuracy, setHitAccuracy] = useState<any[]>([]);
  const [cancellationLog, setCancellationLog] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [ov, ws, ps, rs, tl, cv, ha, cl]: any[] = await Promise.all([
        reportApi.overview(),
        reportApi.warningStats(),
        reportApi.publishStats(),
        reportApi.receiptStats(),
        reportApi.timeliness(),
        reportApi.coverage(),
        reportApi.hitAccuracy(),
        reportApi.cancellationLog(),
      ]);
      setOverview(ov);
      setWarningStats(ws);
      setPublishStats(ps);
      setReceiptStats(rs);
      setTimeliness(tl);
      setCoverage(cv);
      setHitAccuracy(ha);
      setCancellationLog(cl);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function buildWarningTypeChart() {
    const typeMap: Record<string, number> = {};
    warningStats.forEach((r: any) => {
      typeMap[r.type] = (typeMap[r.type] || 0) + r.count;
    });
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
      }],
    };
  }

  function buildPublishChart() {
    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { top: 20, right: 20, bottom: 40, left: 60 },
      xAxis: { type: 'category', data: publishStats.map((r: any) => r.channel_name) },
      yAxis: { type: 'value', name: '数量' },
      series: [
        { name: '发送数', type: 'bar', data: publishStats.map((r: any) => r.publish_count) },
        { name: '成功数', type: 'bar', data: publishStats.map((r: any) => r.total_success) },
        { name: '失败数', type: 'bar', data: publishStats.map((r: any) => r.total_fail) },
      ],
    };
  }

  function buildReceiptChart() {
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: receiptStats.rows?.map((r: any) => ({
          name: r.confirm_status === 'pending' ? '待确认' :
            r.confirm_status === 'confirmed' ? '已确认' :
            r.confirm_status === 'forwarded' ? '已转发' :
            r.confirm_status === 'acted' ? '已处置' :
            r.confirm_status === 'no_response' ? '未响应' : r.confirm_status,
          value: r.count,
        })) || [],
      }],
    };
  }

  function buildCoverageChart() {
    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, right: 20, bottom: 40, left: 60 },
      xAxis: { type: 'category', data: coverage.rows?.map((r: any) => `#${r.id}`) || [] },
      yAxis: { type: 'value', name: '覆盖率(%)', max: 100 },
      series: [{
        type: 'bar',
        data: coverage.rows?.map((r: any) => r.coverage_rate) || [],
        itemStyle: { color: '#52c41a' },
      }],
    };
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="活跃预警" value={overview.active_warnings || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="总发布次数" value={overview.total_publishes || 0} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="平均发布时效" value={timeliness.avg_delay_minutes || 0} suffix="分钟" /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="平均覆盖率" value={coverage.avg_coverage_rate || 0} suffix="%" /></Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="预警类型分布">
            <ReactECharts option={buildWarningTypeChart()} style={{ height: 280 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="回执状态分布">
            <ReactECharts option={buildReceiptChart()} style={{ height: 280 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="各渠道发布统计">
            <ReactECharts option={buildPublishChart()} style={{ height: 300 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="预警覆盖率">
            <ReactECharts option={buildCoverageChart()} style={{ height: 300 }} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="发布时效明细">
            <Table
              size="small"
              dataSource={timeliness.rows}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '预警ID', dataIndex: 'id', key: 'id' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '级别', dataIndex: 'level', key: 'level', render: (v: string) => <Tag color={LEVEL_COLORS[v]}>{LEVEL_LABELS[v] || v}</Tag> },
                { title: '影响区域', dataIndex: 'affected_area', key: 'affected_area' },
                { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss') },
                { title: '发布时间', dataIndex: 'published_at', key: 'published_at', render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-' },
                { title: '延迟(秒)', dataIndex: 'delay_seconds', key: 'delay_seconds', sorter: (a: any, b: any) => a.delay_seconds - b.delay_seconds },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="阈值命中准确率">
            <Table
              size="small"
              dataSource={hitAccuracy}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '数据类型', dataIndex: 'data_type', key: 'data_type' },
                { title: '级别', dataIndex: 'warning_level', key: 'warning_level', render: (v: string) => <Tag color={LEVEL_COLORS[v]}>{LEVEL_LABELS[v] || v}</Tag> },
                { title: '阈值', dataIndex: 'threshold_value', key: 'threshold_value' },
                { title: '总读数', dataIndex: 'total_readings', key: 'total_readings' },
                { title: '命中数', dataIndex: 'hit_count', key: 'hit_count', render: (v: number) => <Tag color={v > 0 ? 'red' : 'default'}>{v}</Tag> },
                {
                  title: '命中率',
                  key: 'rate',
                  render: (_: any, r: any) => r.total_readings > 0 ? `${(r.hit_count * 100.0 / r.total_readings).toFixed(2)}%` : '-',
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="预警解除记录">
            <Table
              size="small"
              dataSource={cancellationLog}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '级别', dataIndex: 'level', key: 'level', render: (v: string) => <Tag color={LEVEL_COLORS[v]}>{LEVEL_LABELS[v] || v}</Tag> },
                { title: '影响区域', dataIndex: 'affected_area', key: 'affected_area' },
                { title: '签发人', dataIndex: 'issuer', key: 'issuer' },
                { title: '生效时长(秒)', dataIndex: 'active_duration_seconds', key: 'active_duration_seconds' },
                { title: '解除时间', dataIndex: 'updated_at', key: 'updated_at', render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}