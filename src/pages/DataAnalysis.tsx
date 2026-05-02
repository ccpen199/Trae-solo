import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Tabs } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { analyticsAPI } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DataAnalysis: React.FC = () => {
  const [salesData, setSalesData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [afterSalesData, setAfterSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    const [startDate, endDate] = dateRange;
    const params = {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD')
    };

    try {
      const [salesRes, profitRes, inventoryRes, afterSalesRes] = await Promise.all([
        analyticsAPI.getSales(params),
        analyticsAPI.getProfit(params),
        analyticsAPI.getInventory(),
        analyticsAPI.getAfterSales(params)
      ]);

      setSalesData(salesRes.data);
      setProfitData(profitRes.data);
      setInventoryData(inventoryRes.data);
      setAfterSalesData(afterSalesRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSalesChart = () => {
    if (!salesData?.sales) return null;

    const chart = echarts.init(document.getElementById('salesChart') as HTMLDivElement);
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['销量', '销售额'] },
      xAxis: {
        type: 'category',
        data: salesData.sales.map((s: any) => s.period)
      },
      yAxis: [
        { type: 'value', name: '订单数' },
        { type: 'value', name: '销售额', axisLabel: { formatter: '${value}' } }
      ],
      series: [
        { name: '订单数', type: 'bar', data: salesData.sales.map((s: any) => s.order_count) },
        { name: '销售额', type: 'line', yAxisIndex: 1, data: salesData.sales.map((s: any) => s.revenue) }
      ]
    };
    chart.setOption(option);
  };

  const renderProfitChart = () => {
    if (!profitData?.groupedRevenue) return null;

    const chart = echarts.init(document.getElementById('profitChart') as HTMLDivElement);
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '成本', '利润'] },
      xAxis: {
        type: 'category',
        data: profitData.groupedRevenue.map((g: any) => g.period)
      },
      yAxis: { type: 'value', axisLabel: { formatter: '${value}' } },
      series: [
        { name: '收入', type: 'bar', data: profitData.groupedRevenue.map((g: any) => g.revenue) },
        { name: '成本', type: 'bar', data: profitData.groupedRevenue.map((g: any) => g.cost) },
        { name: '利润', type: 'line', data: profitData.groupedRevenue.map((g: any) => g.profit) }
      ]
    };
    chart.setOption(option);
  };

  useEffect(() => {
    if (salesData) renderSalesChart();
    if (profitData) renderProfitChart();
  }, [salesData, profitData]);

  const inventoryColumns = [
    { title: 'SKU编码', dataIndex: 'sku_code', key: 'sku_code' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <span style={{ color: status === 'low_stock' ? '#f5222d' : '#52c41a' }}>
        {status === 'low_stock' ? '低库存' : '正常'}
      </span>
    )}
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>数据分析</h1>

      <div style={{ marginBottom: 24 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
        />
      </div>

      <Tabs
        items={[
          {
            key: 'sales',
            label: '销量分析',
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="总订单数"
                        value={salesData?.summary?.totalOrders || 0}
                        prefix={<ShoppingCartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="总销售额"
                        value={salesData?.summary?.totalRevenue || 0}
                        prefix={<DollarOutlined />}
                        precision={2}
                        prefix={<span>$</span>}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="平均订单价值"
                        value={salesData?.summary?.avgOrderValue || 0}
                        precision={2}
                        prefix={<span>$</span>}
                      />
                    </Card>
                  </Col>
                </Row>
                <Card title="销量趋势">
                  <div id="salesChart" style={{ height: 300 }} />
                </Card>
              </div>
            )
          },
          {
            key: 'profit',
            label: '利润分析',
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总收入" value={profitData?.summary?.totalRevenue || 0} precision={2} prefix={<span>$</span>} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总成本" value={profitData?.summary?.totalCost || 0} precision={2} prefix={<span>$</span>} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总利润" value={profitData?.summary?.totalProfit || 0} precision={2} prefix={<span>$</span>} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="利润率" value={profitData?.summary?.overallMargin || 0} precision={2} suffix="%" valueStyle={{ color: '#1890ff' }} />
                    </Card>
                  </Col>
                </Row>
                <Card title="成本构成">
                  <Row gutter={[16, 16]}>
                    {Object.entries(profitData?.costBreakdown || {}).map(([type, amount]) => (
                      <Col key={type} xs={12} sm={6}>
                        <Card size="small">
                          <Statistic title={type} value={amount as number} precision={2} prefix={<span>$</span>} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
                <Card title="利润趋势" style={{ marginTop: 16 }}>
                  <div id="profitChart" style={{ height: 300 }} />
                </Card>
              </div>
            )
          },
          {
            key: 'inventory',
            label: '库存分析',
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总SKU数" value={inventoryData?.summary?.totalSKUs || 0} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="低库存SKU" value={inventoryData?.summary?.lowStockCount || 0} valueStyle={{ color: '#f5222d' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总库存" value={inventoryData?.summary?.totalStock || 0} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <Statistic title="总价值" value={inventoryData?.summary?.totalValue || 0} precision={2} prefix={<span>$</span>} />
                    </Card>
                  </Col>
                </Row>
                <Card title="低库存预警">
                  <Table columns={inventoryColumns} dataSource={inventoryData?.inventory?.filter((i: any) => i.status === 'low_stock') || []} rowKey="id" pagination={{ pageSize: 10 }} />
                </Card>
              </div>
            )
          },
          {
            key: 'after-sales',
            label: '售后分析',
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="总售后单" value={afterSalesData?.afterSales || 0} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="退款总额" value={afterSalesData?.byType?.refund?.amount || 0} precision={2} prefix={<span>$</span>} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="退货总数" value={afterSalesData?.byType?.return?.count || 0} />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="售后类型分布">
                      <div>退款: {afterSalesData?.byType?.refund?.count || 0}</div>
                      <div>退货: {afterSalesData?.byType?.return?.count || 0}</div>
                      <div>纠纷: {afterSalesData?.byType?.dispute?.count || 0}</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="售后状态分布">
                      <div>待处理: {afterSalesData?.byStatus?.pending || 0}</div>
                      <div>处理中: {afterSalesData?.byStatus?.processing || 0}</div>
                      <div>已完成: {afterSalesData?.byStatus?.completed || 0}</div>
                      <div>已拒绝: {afterSalesData?.byStatus?.rejected || 0}</div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default DataAnalysis;