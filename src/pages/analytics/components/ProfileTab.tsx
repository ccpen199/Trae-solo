import { useMemo } from 'react';
import { Card, Row, Col } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import { getPersonnelProfile } from '@/services/api/analytics';

interface Props {
  regionCode?: string;
}

const colorPalette = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9'];

const ProfileTab: React.FC<Props> = ({ regionCode }) => {
  const { data: profileData } = useRequest(() => getPersonnelProfile({ regionCode }), {
    refreshDeps: [regionCode],
  });

  const profile = profileData?.data;

  const ageOption = useMemo((): EChartsOption => {
    const list = profile?.ageDistribution || [];
    return {
      color: colorPalette,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 20, containLabel: true },
      xAxis: {
        type: 'category',
        data: list.map((d) => d.range),
        axisLabel: { color: '#86909C', fontSize: 12 },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '人数',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: list.map((d, i) => ({
            value: d.count,
            itemStyle: {
              color: colorPalette[i % colorPalette.length],
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barMaxWidth: 40,
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12,
            color: '#86909C',
          },
        },
      ],
    };
  }, [profile]);

  const genderOption = useMemo((): EChartsOption => {
    const list = profile?.genderDistribution || [];
    const total = list.reduce((s, d) => s + d.count, 0);
    return {
      color: ['#165DFF', '#F53F3F'],
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
      },
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: '38%',
            style: {
              text: '总人数',
              fontSize: 12,
              fill: '#86909C',
              align: 'center',
            },
          },
          {
            type: 'text',
            left: 'center',
            top: '50%',
            style: {
              text: total.toLocaleString(),
              fontSize: 22,
              fontWeight: 600,
              fill: '#1D2129',
              align: 'center',
            },
          },
        ],
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 12,
            color: '#86909C',
          },
          data: list.map((d, i) => ({
            value: d.count,
            name: d.gender,
            itemStyle: { color: ['#165DFF', '#F53F3F'][i] },
          })),
        },
      ],
    };
  }, [profile]);

  const identityOption = useMemo((): EChartsOption => {
    const list = profile?.identityTypes || [];
    return {
      color: colorPalette,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
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
          radius: ['35%', '60%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: list.map((d, i) => ({
            value: d.count,
            name: d.typeName,
            itemStyle: { color: colorPalette[i % colorPalette.length] },
          })),
        },
      ],
    };
  }, [profile]);

  const minorOption = useMemo((): EChartsOption => {
    const list = profile?.minorTrend || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params as any;
          return `${p.name}<br/>${p.marker} 未成年人占比: ${p.value}%`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: list.map((d) => d.date.slice(5)),
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '占比(%)',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: list.map((d) => d.ratio),
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          lineStyle: { width: 2, color: '#F53F3F' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,63,63,0.15)' },
                { offset: 1, color: 'rgba(245,63,63,0.01)' },
              ],
            },
          },
          markLine: {
            silent: true,
            data: [{ yAxis: 2, label: { formatter: '警戒线 2%', position: 'end' }, lineStyle: { color: '#F53F3F', type: 'dashed' } }],
          },
        },
      ],
    };
  }, [profile]);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="年龄分布">
            <ReactECharts option={ageOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="性别比例">
            <ReactECharts option={genderOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="身份类型分布">
            <ReactECharts option={identityOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="未成年人占比趋势">
            <ReactECharts option={minorOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileTab;
