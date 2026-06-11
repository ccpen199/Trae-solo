import { Row, Col, Card, Statistic } from 'antd';
import {
  CloudServerOutlined,
  EyeOutlined,
  UserOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

const availabilityOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['可用性(%)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
  },
  yAxis: { type: 'value', min: 95, max: 100 },
  series: [
    {
      name: '可用性(%)',
      type: 'line',
      smooth: true,
      data: [99.8, 99.9, 99.7, 99.8, 99.6, 99.9, 99.8, 99.7, 99.9, 99.8, 99.9, 99.8],
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(22,119,255,0.3)' },
        { offset: 1, color: 'rgba(22,119,255,0.02)' },
      ]) },
      lineStyle: { color: '#1677ff', width: 2 },
      itemStyle: { color: '#1677ff' },
    },
  ],
};

const subsidyOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['发放金额(万元)', '核销金额(万元)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '发放金额(万元)',
      type: 'bar',
      data: [320, 280, 350, 410, 380, 420, 450, 390, 460, 430, 470, 500],
      itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '核销金额(万元)',
      type: 'bar',
      data: [290, 250, 310, 370, 340, 380, 400, 350, 420, 390, 430, 460],
      itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
    },
  ],
};

const categoryOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%' },
      data: [
        { value: 335, name: '社会保障' },
        { value: 274, name: '教育助学' },
        { value: 198, name: '医疗卫生' },
        { value: 165, name: '住房保障' },
        { value: 120, name: '就业创业' },
        { value: 88, name: '其他' },
      ],
    },
  ],
};

const topServiceOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: [
      '社保查询', '医保结算', '公积金查询', '户籍办理', '不动产登记',
      '税务申报', '交通违法处理', '婚姻登记', '出生登记', '教育缴费',
    ].reverse(),
  },
  series: [
    {
      type: 'bar',
      data: [12860, 11230, 9870, 8640, 7920, 7350, 6810, 5940, 5230, 4870].reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1677ff' },
          { offset: 1, color: '#69b1ff' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
    },
  ],
};

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={<span className="stat-title">服务总量</span>}
              value={12836}
              prefix={<CloudServerOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
              suffix="项"
            />
            <div className="stat-footer">
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 12.5% 较上月
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={<span className="stat-title">今日访问</span>}
              value={58423}
              prefix={<EyeOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="次"
            />
            <div className="stat-footer">
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 8.3% 较昨日
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={<span className="stat-title">在线用户</span>}
              value={2341}
              prefix={<UserOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
              suffix="人"
            />
            <div className="stat-footer">
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> 2.1% 较昨日
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={<span className="stat-title">活跃告警</span>}
              value={17}
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix="条"
            />
            <div className="stat-footer">
              <ArrowDownOutlined style={{ color: '#52c41a' }} /> 5.6% 较昨日
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card className="chart-card" title="服务可用性趋势" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={availabilityOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="chart-card" title="诉求类别分布" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={categoryOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card className="chart-card" title="补贴发放/核销统计" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={subsidyOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="chart-card" title="服务调用TOP10" bordered={false}>
            <ReactEChartsCore echarts={echarts} option={topServiceOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
