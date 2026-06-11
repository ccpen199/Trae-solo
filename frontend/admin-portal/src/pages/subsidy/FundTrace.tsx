import { useState } from 'react';
import { Table, Card, Input, Tag, Steps, Space, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface FundRecord {
  id: string;
  policyName: string;
  totalAmount: number;
  grantedAmount: number;
  verifiedAmount: number;
  remainingAmount: number;
  flowNodes: { step: string; time: string; amount: number }[];
  updatedAt: string;
}

const mockData: FundRecord[] = [
  {
    id: 'FT001', policyName: '农村低保补助', totalAmount: 600000000, grantedAmount: 380000000, verifiedAmount: 320000000, remainingAmount: 220000000,
    flowNodes: [
      { step: '省级财政拨付', time: '2025-01-10', amount: 300000000 },
      { step: '市级转拨', time: '2025-01-15', amount: 300000000 },
      { step: '区县发放', time: '2025-01-20', amount: 380000000 },
      { step: '受助人到账', time: '2025-01-25', amount: 320000000 },
    ],
    updatedAt: '2025-06-08 10:00:00',
  },
  {
    id: 'FT002', policyName: '医疗保险补贴', totalAmount: 120000000, grantedAmount: 89000000, verifiedAmount: 82000000, remainingAmount: 31000000,
    flowNodes: [
      { step: '中央财政下达', time: '2025-02-01', amount: 80000000 },
      { step: '省级配套', time: '2025-02-05', amount: 40000000 },
      { step: '市级发放', time: '2025-02-10', amount: 89000000 },
      { step: '受助人到账', time: '2025-02-15', amount: 82000000 },
    ],
    updatedAt: '2025-06-07 14:00:00',
  },
  {
    id: 'FT003', policyName: '创业担保贷款贴息', totalAmount: 50000000, grantedAmount: 32000000, verifiedAmount: 28000000, remainingAmount: 18000000,
    flowNodes: [
      { step: '省级财政拨付', time: '2025-03-05', amount: 50000000 },
      { step: '担保机构审核', time: '2025-03-10', amount: 35000000 },
      { step: '银行放款', time: '2025-03-20', amount: 32000000 },
      { step: '贴息到账', time: '2025-03-25', amount: 28000000 },
    ],
    updatedAt: '2025-06-06 09:00:00',
  },
];

const trendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['拨付金额', '发放金额', '核销金额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v / 10000}万` } },
  series: [
    { name: '拨付金额', type: 'line', smooth: true, data: [5000, 4200, 3800, 4500, 3900, 4100], itemStyle: { color: '#1677ff' } },
    { name: '发放金额', type: 'line', smooth: true, data: [4500, 3800, 3500, 4100, 3600, 3800], itemStyle: { color: '#52c41a' } },
    { name: '核销金额', type: 'line', smooth: true, data: [4200, 3500, 3200, 3800, 3300, 3500], itemStyle: { color: '#faad14' } },
  ],
};

const FundTrace: React.FC = () => {
  const [data] = useState(mockData);
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const filteredData = data.filter((item) => item.policyName.includes(searchText));

  const formatAmount = (v: number) => `¥${(v / 10000).toLocaleString()}万`;

  const columns = [
    { title: '追踪ID', dataIndex: 'id', width: 80 },
    { title: '补贴政策', dataIndex: 'policyName', width: 160 },
    { title: '预算总额', dataIndex: 'totalAmount', width: 130, render: formatAmount },
    { title: '已拨付', dataIndex: 'grantedAmount', width: 120, render: formatAmount },
    { title: '已核销', dataIndex: 'verifiedAmount', width: 120, render: formatAmount },
    { title: '剩余', dataIndex: 'remainingAmount', width: 120, render: formatAmount },
    {
      title: '执行率', width: 100,
      render: (_: unknown, r: FundRecord) => {
        const rate = ((r.verifiedAmount / r.totalAmount) * 100).toFixed(1);
        return <Tag color={Number(rate) > 50 ? 'success' : 'warning'}>{rate}%</Tag>;
      },
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
  ];

  return (
    <div className="page-container">
      <Card title="资金趋势" bordered={false} style={{ marginBottom: 16 }}>
        <ReactEChartsCore echarts={echarts} option={trendOption} style={{ height: 280 }} />
      </Card>
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索补贴政策"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => setSearchText('')}>重置</Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys as string[]),
            expandedRowRender: (record) => (
              <div style={{ padding: '12px 24px' }}>
                <h4 style={{ marginBottom: 16 }}>资金流向</h4>
                <Steps
                  direction="vertical"
                  size="small"
                  items={record.flowNodes.map((node) => ({
                    title: node.step,
                    description: `${node.time} | ${formatAmount(node.amount)}`,
                  }))}
                />
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default FundTrace;
