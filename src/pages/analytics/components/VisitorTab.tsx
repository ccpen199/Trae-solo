import { useState, useMemo, useCallback } from 'react';
import { Card, Table, Button, Segmented, message } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import DrillBreadcrumb, { type BreadcrumbLevel } from './DrillBreadcrumb';
import {
  getVisitorTrend,
  getHourlyDistribution,
  getPlaceRankingTable,
} from '@/services/api/analytics';
import { formatNumber, formatDuration } from '@/utils/format';

interface Props {
  regionCode?: string;
  period: string;
}

const VisitorTab: React.FC<Props> = ({ regionCode, period }) => {
  const [drillPath, setDrillPath] = useState<BreadcrumbLevel[]>([
    { label: '趋势总览', value: 'overview' },
  ]);
  const [drillDate, setDrillDate] = useState<string>('');

  const { data: trendData } = useRequest(() => getVisitorTrend({ placeId: undefined }), {
    refreshDeps: [period, regionCode],
  });

  const { data: hourlyData } = useRequest(
    () => getHourlyDistribution({ date: drillDate, regionCode }),
    { refreshDeps: [drillDate, regionCode], manual: !drillDate }
  );

  const { data: rankingData } = useRequest(() => getPlaceRankingTable({ regionCode, limit: 20 }), {
    refreshDeps: [regionCode],
  });

  const trendChartData = useMemo(() => {
    const list = trendData?.data || [];
    return {
      xAxisData: list.map((d) => d.date),
      series: [
        { name: '上网人次', data: list.map((d) => d.visitorCount) },
        { name: '预约人次', data: list.map((d) => d.reservationCount) },
      ],
    };
  }, [trendData]);

  const hourlyChartData = useMemo(() => {
    const list = hourlyData?.data || [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const values = hours.map((h) => {
      const found = list.find((d) => d.hour === h);
      return found ? found.count : 0;
    });
    return { hours, values };
  }, [hourlyData]);

  const trendOption = useMemo((): EChartsOption => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px;',
      },
      legend: {
        top: 0,
        right: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#86909C', fontSize: 12 },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendChartData.xAxisData,
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          name: '上网人次',
          type: 'line',
          smooth: true,
          data: trendChartData.series[0].data,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: '#165DFF' },
          areaStyle: { opacity: 0.1 },
          emphasis: { focus: 'series' },
        },
        {
          name: '预约人次',
          type: 'line',
          smooth: true,
          data: trendChartData.series[1].data,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: '#00B42A' },
          areaStyle: { opacity: 0.1 },
          emphasis: { focus: 'series' },
        },
      ],
    };
  }, [trendChartData]);

  const hourlyOption = useMemo((): EChartsOption => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px;',
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params as { name: string; value: number };
          return `${p.name}:00 - ${formatNumber(p.value)} 人次`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 20, containLabel: true },
      xAxis: {
        type: 'category',
        data: hourlyChartData.hours.map((h) => `${h}:00`),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: hourlyChartData.values,
          barMaxWidth: 24,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#165DFF' },
                { offset: 1, color: '#165DFF66' },
              ],
            },
          },
        },
      ],
    };
  }, [hourlyChartData]);

  const handleTrendClick = useCallback((params: any) => {
    if (params.componentType === 'series' && params.name) {
      setDrillDate(params.name);
      setDrillPath([
        { label: '趋势总览', value: 'overview' },
        { label: `${params.name} 24小时分布`, value: params.name },
      ]);
    }
  }, []);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index === 0) {
      setDrillDate('');
      setDrillPath([{ label: '趋势总览', value: 'overview' }]);
    }
  }, []);

  const rankingColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '场所名称', dataIndex: 'placeName', key: 'placeName', ellipsis: true },
    { title: '所属区域', dataIndex: 'regionName', key: 'regionName', width: 120 },
    {
      title: '今日人次',
      dataIndex: 'todayVisitors',
      key: 'todayVisitors',
      width: 110,
      sorter: (a: any, b: any) => a.todayVisitors - b.todayVisitors,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '累计时长',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      width: 120,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '活跃率',
      dataIndex: 'activeRate',
      key: 'activeRate',
      width: 100,
      sorter: (a: any, b: any) => a.activeRate - b.activeRate,
      render: (v: number) => `${v.toFixed(1)}%`,
    },
  ];

  const handleExport = () => {
    message.success('导出成功，文件已下载');
  };

  return (
    <div>
      <DrillBreadcrumb items={drillPath} onNavigate={handleBreadcrumbNavigate} />

      {!drillDate ? (
        <Card
          title="上网人次趋势"
          className="chart-with-drill"
          extra={
            <Segmented
              size="small"
              options={[
                { label: '7天', value: 7 },
                { label: '30天', value: 30 },
              ]}
            />
          }
        >
          <span className="drill-hint">
            <DownOutlined /> 点击数据点可下钻至24小时分布
          </span>
          <ReactECharts
            option={trendOption}
            style={{ height: 320 }}
            notMerge
            lazyUpdate
            onEvents={{ click: handleTrendClick }}
          />
        </Card>
      ) : (
        <div className="drill-panel">
          <Card title={`${drillDate} 24小时人次分布`}>
            <ReactECharts option={hourlyOption} style={{ height: 320 }} notMerge lazyUpdate />
          </Card>
        </div>
      )}

      <Card
        title="场所人次明细"
        style={{ marginTop: 16 }}
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        }
      >
        <Table
          rowKey="placeId"
          columns={rankingColumns}
          dataSource={rankingData?.data || []}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default VisitorTab;
