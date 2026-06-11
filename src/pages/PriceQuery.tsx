import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Select, Button, Table, Tag, Space } from 'antd';
import { SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, SendOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { freightRateApi, type FreightRateItem } from '../api/freightRates';
import type { TrendType } from '../../shared/types';
import { formatMoney } from '../utils/format';

const cities = ['上海', '北京', '广州', '深圳', '杭州', '南京', '成都', '武汉', '重庆', '天津', '苏州', '郑州', '长沙', '西安', '合肥'];
const vehicleTypes = ['4.2米厢式', '6.8米厢式', '9.6米厢式', '13米半挂', '17.5米大板', '冷藏车', '平板车'];

const PriceQuery: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FreightRateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState<FreightRateItem | null>(null);
  const [searchParams, setSearchParams] = useState<{
    startCity?: string;
    endCity?: string;
    vehicleType?: string;
  }>({});
  const [appliedParams, setAppliedParams] = useState<{
    startCity?: string;
    endCity?: string;
    vehicleType?: string;
  }>({});
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await freightRateApi.getList({
        ...appliedParams,
        page,
        pageSize,
      });
      setData(res.data.list);
      setTotal(res.data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [appliedParams, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data.length > 0 && !selectedRow) {
      setSelectedRow(data[0]);
    }
  }, [data, selectedRow]);

  const handleSearch = () => {
    setPage(1);
    setSelectedRow(null);
    setAppliedParams({ ...searchParams });
  };

  const handleReset = () => {
    setSearchParams({});
    setAppliedParams({});
    setPage(1);
    setSelectedRow(null);
  };

  const handlePublish = (record: FreightRateItem) => {
    const params = new URLSearchParams({
      startCity: record.startCity,
      endCity: record.endCity,
      vehicleType: record.vehicleType,
      expectedPrice: String(record.currentPrice),
    });
    navigate(`/cargo/publish?${params.toString()}`);
  };

  const trendTag = (trend: TrendType, changePercent: number) => {
    switch (trend) {
      case 'up':
        return <Tag icon={<ArrowUpOutlined />} color="red">↑ {changePercent}%</Tag>;
      case 'down':
        return <Tag icon={<ArrowDownOutlined />} color="green">↓ {Math.abs(changePercent)}%</Tag>;
      case 'stable':
        return <Tag icon={<MinusOutlined />} color="blue">→ 持平</Tag>;
    }
  };

  const columns = [
    { title: '出发地', dataIndex: 'startCity', key: 'startCity', width: 100 },
    { title: '目的地', dataIndex: 'endCity', key: 'endCity', width: 100 },
    { title: '车型', dataIndex: 'vehicleType', key: 'vehicleType', width: 120 },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 120,
      render: (price: number) => <span className="font-semibold">{formatMoney(price)}</span>,
    },
    {
      title: '涨跌幅',
      key: 'change',
      width: 120,
      render: (_: unknown, record: FreightRateItem) => trendTag(record.trend, record.changePercent),
    },
    {
      title: '走势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (trend: TrendType) => {
        const labels: Record<TrendType, string> = { up: '上涨', down: '下跌', stable: '平稳' };
        const colors: Record<TrendType, string> = { up: 'red', down: 'green', stable: 'blue' };
        return <Tag color={colors[trend]}>{labels[trend]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: FreightRateItem) => (
        <Button
          type="link"
          size="small"
          icon={<SendOutlined />}
          onClick={(e) => { e.stopPropagation(); handlePublish(record); }}
          style={{ color: '#165DFF', padding: 0 }}
        >
          发布货源
        </Button>
      ),
    },
  ];

  const chartOption = selectedRow?.historicalPrices && selectedRow.historicalPrices.length > 0
    ? {
        tooltip: {
          trigger: 'axis' as const,
          formatter: (params: { name: string; value: number }[]) => {
            const p = params[0];
            return `${p.name}<br/>运价: ¥${p.value.toFixed(2)}`;
          },
        },
        xAxis: {
          type: 'category' as const,
          data: selectedRow.historicalPrices.map(p => p.date),
          axisLabel: { fontSize: 12 },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value' as const,
          axisLabel: { formatter: '¥{value}' },
        },
        series: [{
          data: selectedRow.historicalPrices.map(p => p.price),
          type: 'line' as const,
          smooth: true,
          lineStyle: { color: '#165DFF', width: 2 },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22,93,255,0.3)' },
                { offset: 1, color: 'rgba(22,93,255,0.02)' },
              ],
            },
          },
          itemStyle: { color: '#165DFF' },
        }],
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      }
    : null;

  return (
    <div className="space-y-6">
      <Card variant="borderless" className="card-shadow">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={7}>
            <Select
              placeholder="出发城市"
              allowClear
              showSearch
              className="w-full"
              value={searchParams.startCity}
              onChange={(val) => setSearchParams(prev => ({ ...prev, startCity: val }))}
              options={cities.map(c => ({ label: c, value: c }))}
            />
          </Col>
          <Col xs={24} sm={7}>
            <Select
              placeholder="目的城市"
              allowClear
              showSearch
              className="w-full"
              value={searchParams.endCity}
              onChange={(val) => setSearchParams(prev => ({ ...prev, endCity: val }))}
              options={cities.map(c => ({ label: c, value: c }))}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Select
              placeholder="车型选择"
              allowClear
              className="w-full"
              value={searchParams.vehicleType}
              onChange={(val) => setSearchParams(prev => ({ ...prev, vehicleType: val }))}
              options={vehicleTypes.map(t => ({ label: t, value: t }))}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ background: '#165DFF' }}
              >
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" className="card-shadow" title="运价列表">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          onRow={(record) => ({
            onClick: () => setSelectedRow(record),
            style: {
              cursor: 'pointer',
              background: selectedRow?.id === record.id ? '#f0f5ff' : undefined,
            },
          })}
        />
      </Card>

      {chartOption && (
        <Card
          variant="borderless"
          className="card-shadow"
          title={`历史价格走势 - ${selectedRow?.startCity} → ${selectedRow?.endCity} (${selectedRow?.vehicleType})`}
        >
          <ReactECharts option={chartOption} style={{ height: 350 }} />
        </Card>
      )}

      {!chartOption && selectedRow && (
        <Card variant="borderless" className="card-shadow" title="历史价格走势">
          <div className="flex items-center justify-center h-48 text-gray-400">
            暂无历史价格数据
          </div>
        </Card>
      )}
    </div>
  );
};

export default PriceQuery;
