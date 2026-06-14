import { useState, useMemo, useCallback } from 'react';
import { Card, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import DrillBreadcrumb, { type BreadcrumbLevel } from './DrillBreadcrumb';
import {
  getRegionalDistribution,
  getCityDrillDown,
  getDistrictPlaces,
} from '@/services/api/analytics';
import { cities as cityList } from '@/utils/region';
import { formatNumber } from '@/utils/format';

interface Props {
  regionCode?: string;
  onDrillDown?: (params: { type: 'region' | 'duration'; title: string; cityCode?: string; hour?: number }) => void;
}

const colorPalette = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9', '#FF9A2E', '#F7BA1E'];

type DrillLevel = 'province' | 'city' | 'district' | 'place';

const RegionTab: React.FC<Props> = ({ regionCode, onDrillDown }) => {
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('province');
  const [drillPath, setDrillPath] = useState<BreadcrumbLevel[]>([
    { label: '山东省', value: '370000' },
  ]);
  const [selectedCityCode, setSelectedCityCode] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  const { data: regionalData } = useRequest(() => getRegionalDistribution(), {
    refreshDeps: [regionCode],
  });

  const { data: cityDrillData } = useRequest(
    () => getCityDrillDown({ cityCode: selectedCityCode }),
    { refreshDeps: [selectedCityCode], manual: !selectedCityCode }
  );

  const { data: districtPlacesData } = useRequest(
    () => getDistrictPlaces({ districtCode: selectedDistrictCode, districtName: selectedDistrictName }),
    { refreshDeps: [selectedDistrictCode], manual: !selectedDistrictCode }
  );

  const mapOption = useMemo((): EChartsOption => {
    const list = regionalData?.data || [];
    const sortedList = [...list].sort((a, b) => b.visitorCount - a.visitorCount);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px;',
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params as any;
          const item = list.find((d) => d.city === p.name);
          if (!item) return '';
          return `<b>${item.city}</b><br/>场所数: ${item.placeCount}<br/>上网人次: ${formatNumber(item.visitorCount)}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: sortedList.map((d) => d.city.replace('市', '')),
        axisLabel: { color: '#86909C', fontSize: 11, rotate: 30 },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '人次',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: sortedList.map((d, i) => ({
            value: d.visitorCount,
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: colorPalette[i % colorPalette.length] },
                  { offset: 1, color: colorPalette[i % colorPalette.length] + '66' },
                ],
              },
              borderRadius: [3, 3, 0, 0],
            },
          })),
          barMaxWidth: 30,
        },
      ],
    };
  }, [regionalData]);

  const districtBarOption = useMemo((): EChartsOption => {
    const list = cityDrillData?.data || [];
    const sorted = [...list].sort((a, b) => b.visitorCount - a.visitorCount);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: sorted.map((d) => d.districtName),
        axisLabel: { color: '#86909C', fontSize: 11, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((d) => d.visitorCount),
          barMaxWidth: 24,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#14C9C9' },
                { offset: 1, color: '#14C9C966' },
              ],
            },
          },
        },
      ],
    };
  }, [cityDrillData]);

  const handleProvinceBarClick = useCallback((params: any) => {
    if (params.componentType === 'series' && params.name) {
      const cityName = params.name + '市';
      const city = cityList.find((c) => c.name === cityName);
      if (city) {
        if (onDrillDown) {
          onDrillDown({ type: 'region', title: `${cityName} 区县明细`, cityCode: city.code });
        } else {
          setSelectedCityCode(city.code);
          setSelectedCityName(cityName);
          setDrillLevel('city');
          setDrillPath([
            { label: '山东省', value: '370000' },
            { label: cityName, value: city.code },
          ]);
        }
      }
    }
  }, [onDrillDown]);

  const handleDistrictClick = useCallback((params: any) => {
    if (params.componentType === 'series' && params.name && cityDrillData?.data) {
      const district = cityDrillData.data.find((d) => d.districtName === params.name);
      if (district) {
        setSelectedDistrictCode(district.districtCode);
        setSelectedDistrictName(district.districtName);
        setDrillLevel('district');
        setDrillPath((prev) => [
          ...prev.slice(0, 2),
          { label: district.districtName, value: district.districtCode },
        ]);
      }
    }
  }, [cityDrillData]);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index === 0) {
      setDrillLevel('province');
      setSelectedCityCode('');
      setSelectedCityName('');
      setSelectedDistrictCode('');
      setSelectedDistrictName('');
      setDrillPath([{ label: '山东省', value: '370000' }]);
    } else if (index === 1) {
      setDrillLevel('city');
      setSelectedDistrictCode('');
      setSelectedDistrictName('');
      setDrillPath((prev) => prev.slice(0, 2));
    }
  }, []);

  const regionalColumns = [
    { title: '地市', dataIndex: 'city', key: 'city', width: 100 },
    { title: '场所数', dataIndex: 'placeCount', key: 'placeCount', width: 90, sorter: (a: any, b: any) => a.placeCount - b.placeCount },
    {
      title: '总人次',
      dataIndex: 'visitorCount',
      key: 'visitorCount',
      width: 110,
      sorter: (a: any, b: any) => a.visitorCount - b.visitorCount,
      render: (v: number) => formatNumber(v),
    },
  ];

  const districtColumns = [
    { title: '区县', dataIndex: 'districtName', key: 'districtName', width: 100 },
    { title: '场所数', dataIndex: 'placeCount', key: 'placeCount', width: 90 },
    {
      title: '总人次',
      dataIndex: 'visitorCount',
      key: 'visitorCount',
      width: 110,
      sorter: (a: any, b: any) => a.visitorCount - b.visitorCount,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '平均时长',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 110,
      render: (v: number) => `${Math.floor(v / 60)}时${v % 60}分`,
    },
  ];

  const placeColumns = [
    { title: '场所名称', dataIndex: 'placeName', key: 'placeName', ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
    {
      title: '总人次',
      dataIndex: 'visitorCount',
      key: 'visitorCount',
      width: 100,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '平均时长',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 110,
      render: (v: number) => `${Math.floor(v / 60)}时${v % 60}分`,
    },
  ];

  return (
    <div>
      <DrillBreadcrumb items={drillPath} onNavigate={handleBreadcrumbNavigate} />

      {drillLevel === 'province' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <Card title="山东省16地市人次分布" className="chart-with-drill" style={{ flex: 2 }}>
            <span className="drill-hint">点击柱状图可下钻至区县</span>
            <ReactECharts
              option={mapOption}
              style={{ height: 400 }}
              notMerge
              lazyUpdate
              onEvents={{ click: handleProvinceBarClick }}
            />
          </Card>
          <Card title="地域排名" style={{ flex: 1 }}>
            <Table
              rowKey="city"
              columns={regionalColumns}
              dataSource={(regionalData?.data || [])
                .sort((a, b) => b.visitorCount - a.visitorCount)
                .map((d, i) => ({ ...d, rank: i + 1 }))}
              pagination={false}
              size="small"
              scroll={{ y: 380 }}
            />
          </Card>
        </div>
      )}

      {drillLevel === 'city' && (
        <div className="drill-panel">
          <Card title={`${selectedCityName} 区县分布`} className="chart-with-drill">
            <span className="drill-hint">点击柱状图可下钻至场所</span>
            <ReactECharts
              option={districtBarOption}
              style={{ height: 350 }}
              notMerge
              lazyUpdate
              onEvents={{ click: handleDistrictClick }}
            />
          </Card>
          <Card title={`${selectedCityName} 区县统计`} style={{ marginTop: 16 }}>
            <Table
              rowKey="districtCode"
              columns={districtColumns}
              dataSource={cityDrillData?.data || []}
              pagination={false}
              size="middle"
            />
          </Card>
        </div>
      )}

      {drillLevel === 'district' && (
        <div className="drill-panel">
          <Card title={`${selectedDistrictName} 场所列表`}>
            <Table
              rowKey="placeId"
              columns={placeColumns}
              dataSource={districtPlacesData?.data || []}
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
              size="middle"
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default RegionTab;
