import { useState, useMemo, useCallback } from 'react';
import { Card, Table, Modal } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import DrillBreadcrumb, { type BreadcrumbLevel } from './DrillBreadcrumb';
import {
  getDurationByHour,
  getDurationSegments,
  getPersonnelDetail,
} from '@/services/api/analytics';
import { formatDuration } from '@/utils/format';

interface Props {
  regionCode?: string;
  onDrillDown?: (params: { type: 'region' | 'duration'; title: string; cityCode?: string; hour?: number }) => void;
}

const colorPalette = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9'];

const DurationTab: React.FC<Props> = ({ regionCode, onDrillDown }) => {
  const [drillPath, setDrillPath] = useState<BreadcrumbLevel[]>([
    { label: '时长总览', value: 'overview' },
  ]);
  const [drillHour, setDrillHour] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: durationByHourData } = useRequest(() => getDurationByHour({ regionCode }), {
    refreshDeps: [regionCode],
  });

  const { data: segmentData } = useRequest(() => getDurationSegments({ regionCode }), {
    refreshDeps: [regionCode],
  });

  const { data: personnelData } = useRequest(
    () => getPersonnelDetail({ hour: drillHour || 12, regionCode }),
    { refreshDeps: [drillHour, regionCode], manual: drillHour === null }
  );

  const barOption = useMemo((): EChartsOption => {
    const list = durationByHourData?.data || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px;',
        formatter: (params: unknown) => {
          const ps = Array.isArray(params) ? params : [params];
          let html = `${ps[0] && 'name' in ps[0] ? (ps[0] as any).name : ''}<br/>`;
          ps.forEach((p: any) => {
            html += `${p.marker} ${p.seriesName}: ${formatDuration(p.value * 60)}<br/>`;
          });
          return html;
        },
      },
      legend: {
        top: 0,
        right: 0,
        icon: 'rect',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: '#86909C', fontSize: 12 },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: list.map((d) => `${d.hour}:00`),
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '时长(分钟)',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          name: '平均时长',
          type: 'bar',
          data: list.map((d) => d.avgDuration),
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#165DFF' },
                { offset: 1, color: '#165DFF66' },
              ],
            },
          },
        },
        {
          name: '最大时长',
          type: 'bar',
          data: list.map((d) => d.maxDuration),
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#FF7D00' },
                { offset: 1, color: '#FF7D0066' },
              ],
            },
          },
        },
      ],
    };
  }, [durationByHourData]);

  const pieOption = useMemo((): EChartsOption => {
    const list = segmentData?.data || [];
    return {
      color: colorPalette,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' },
          },
          data: list.map((d, i) => ({
            value: d.count,
            name: d.label,
            itemStyle: { color: colorPalette[i % colorPalette.length] },
          })),
        },
      ],
    };
  }, [segmentData]);

  const handleBarClick = useCallback((params: any) => {
    if (params.componentType === 'series' && params.dataIndex !== undefined) {
      const hour = params.dataIndex;
      if (onDrillDown) {
        onDrillDown({ type: 'duration', title: `${String(hour).padStart(2, '0')}:00 时段人员明细`, hour });
      } else {
        setDrillHour(hour);
        setDrillPath([
          { label: '时长总览', value: 'overview' },
          { label: `${hour}:00 时段人员明细`, value: String(hour) },
        ]);
        setDetailModalOpen(true);
      }
    }
  }, [onDrillDown]);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index === 0) {
      setDrillHour(null);
      setDrillPath([{ label: '时长总览', value: 'overview' }]);
    }
  }, []);

  const personnelColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      render: (v: string) => v ? `${v.slice(0, 6)}****${v.slice(-4)}` : '-',
    },
    { title: '场所', dataIndex: 'placeName', key: 'placeName', ellipsis: true },
    { title: '入场时间', dataIndex: 'entryTime', key: 'entryTime', width: 100 },
    {
      title: '上网时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (v: number) => formatDuration(v * 60),
    },
  ];

  const placeDurationColumns = [
    { title: '场所名称', dataIndex: 'placeName', key: 'placeName', ellipsis: true },
    { title: '所属区域', dataIndex: 'regionName', key: 'regionName', width: 120 },
    {
      title: '平均时长',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 110,
      sorter: (a: any, b: any) => a.avgDuration - b.avgDuration,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '最长时长',
      dataIndex: 'maxDuration',
      key: 'maxDuration',
      width: 110,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '最短时长',
      dataIndex: 'minDuration',
      key: 'minDuration',
      width: 110,
      render: (v: number) => formatDuration(v),
    },
  ];

  const placeDurationData = useMemo(() => {
    const list = durationByHourData?.data || [];
    const summary: Record<string, { placeName: string; regionName: string; durations: number[] }> = {};
    list.forEach((d) => {
      if (!summary['all']) {
        summary['all'] = { placeName: '全省汇总', regionName: '山东省', durations: [] };
      }
      summary['all'].durations.push(d.avgDuration);
    });
    return Object.values(summary).map((s) => ({
      ...s,
      avgDuration: s.durations.length ? Math.floor(s.durations.reduce((a, b) => a + b, 0) / s.durations.length) : 0,
      maxDuration: s.durations.length ? Math.max(...s.durations) : 0,
      minDuration: s.durations.length ? Math.min(...s.durations) : 0,
    }));
  }, [durationByHourData]);

  return (
    <div>
      <DrillBreadcrumb items={drillPath} onNavigate={handleBreadcrumbNavigate} />

      <div style={{ display: 'flex', gap: 16 }}>
        <Card title="各时段上网时长分布" className="chart-with-drill" style={{ flex: 2 }}>
          <span className="drill-hint" style={{ top: 48 }}>
            点击柱状图可查看该时段人员明细
          </span>
          <ReactECharts
            option={barOption}
            style={{ height: 320 }}
            notMerge
            lazyUpdate
            onEvents={{ click: handleBarClick }}
          />
        </Card>
        <Card title="时长分段统计" style={{ flex: 1 }}>
          <ReactECharts option={pieOption} style={{ height: 320 }} notMerge lazyUpdate />
        </Card>
      </div>

      <Card title="场所时长统计" style={{ marginTop: 16 }}>
        <Table
          rowKey="placeName"
          columns={placeDurationColumns}
          dataSource={placeDurationData}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={`${drillHour !== null ? String(drillHour).padStart(2, '0') : '12'}:00 时段人员明细`}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDrillHour(null);
          setDrillPath([{ label: '时长总览', value: 'overview' }]);
        }}
        footer={null}
        width={700}
      >
        <Table
          rowKey="idCard"
          columns={personnelColumns}
          dataSource={personnelData?.data || []}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default DurationTab;
