import React, { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Statistic, Alert, List, Tag, Space
} from 'antd';
import { RiseOutlined, FallOutlined, WarningOutlined, BellOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../api';

const { Option } = Select;

function AdminPrices() {
  const [city, setCity] = useState('北京市');
  const [serviceType, setServiceType] = useState('labor');
  const [priceData, setPriceData] = useState<any>({});
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    fetchPriceTrends();
    fetchWarnings();
  }, [city, serviceType]);

  const fetchPriceTrends = async () => {
    try {
      const data = await api.get('/admin/price/trends', {
        params: { city, service_type: serviceType, days: 30 },
      });
      setPriceData(data);
    } catch (error) {
      console.error('Failed to fetch price trends:', error);
    }
  };

  const fetchWarnings = async () => {
    try {
      const data: any = await api.get('/admin/price/warnings');
      setWarnings(data.warnings || []);
    } catch (error) {
      console.error('Failed to fetch warnings:', error);
    }
  };

  const chartOption = {
    title: { text: `${city} - ${serviceType === 'labor' ? '用工服务' : serviceType === 'delivery' ? '找车服务' : '搬家服务'} 价格趋势`, left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均价格', '交易量'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: priceData.trends?.map((t: any) => t.date.slice(5)) || [],
    },
    yAxis: [
      { type: 'value', name: '价格(元)' },
      { type: 'value', name: '订单量' },
    ],
    series: [
      {
        name: '平均价格',
        type: 'line',
        data: priceData.trends?.map((t: any) => t.avg_price) || [],
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '交易量',
        type: 'bar',
        yAxisIndex: 1,
        data: priceData.trends?.map((t: any) => t.volume) || [],
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'orange';
      case 'danger': return 'red';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  const getWarningTypeText = (type: string) => {
    switch (type) {
      case 'price_surge': return '价格上涨';
      case 'price_drop': return '价格下跌';
      default: return '运力预警';
    }
  };

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>📈 价格波动监控</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select value={city} onChange={setCity} style={{ width: 150 }}>
            <Option value="北京市">北京市</Option>
            <Option value="上海市">上海市</Option>
            <Option value="广州市">广州市</Option>
            <Option value="深圳市">深圳市</Option>
          </Select>
          <Select value={serviceType} onChange={setServiceType} style={{ width: 150 }}>
            <Option value="labor">用工服务</Option>
            <Option value="delivery">找车服务</Option>
            <Option value="moving">搬家服务</Option>
          </Select>
        </Space>

        {priceData.warning && (
          <Alert
            message="价格波动预警"
            description="近7日价格波动超出正常范围，请关注市场变化"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="当前均价"
                value={priceData.current_avg || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
            <Statistic
              title="周变化率"
              value={priceData.weekly_change || 0}
              precision={2}
              suffix="%"
              valueStyle={{ color: (priceData.weekly_change || 0) > 0 ? '#f5222d' : '#52c41a' }}
              prefix={(priceData.weekly_change || 0) > 0 ? <RiseOutlined /> : <FallOutlined />}
            />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="预警数量"
                value={warnings.length || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未读预警"
                value={2}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <ReactECharts option={chartOption} style={{ height: 400 }} />
      </Card>

      <Card title="价格预警列表" extra={<Tag color="red">{warnings.length} 条预警</Tag>}>
        <List
          dataSource={warnings}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: item.severity === 'warning' ? '#fff7e6' : '#f0f5ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    <WarningOutlined style={{ color: item.severity === 'warning' ? '#fa8c16' : '#1890ff' }} />
                  </div>
                }
                title={
                  <Space>
                    <span>{item.message}</span>
                    <Tag color={getSeverityColor(item.severity)}>
                      {getWarningTypeText(item.type)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>城市: {item.city} | 服务类型: {item.service_type}</div>
                    <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 12 }}>
                      {item.created_at}
                    </div>
                  </div>
                }
              />
              <Space direction="vertical" align="end">
                <div>
                  当前: <span style={{ fontWeight: 600, color: '#fa8c16' }}>¥{item.current_price}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  基准: ¥{item.baseline_price}
                </div>
                <div style={{ fontSize: 12, color: item.change_percent > 0 ? '#f5222d' : '#52c41a' }}>
                  {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default AdminPrices;
