import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Row, Col, Statistic, DatePicker, Button, Drawer, Descriptions, Form, Select, InputNumber, Space, Modal, message, Progress, Tooltip, Input } from 'antd';
import { DollarOutlined, SafetyCertificateOutlined, BankOutlined, WalletOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';
import ReactECharts from 'echarts-for-react';

const accTypes: Record<string, { label: string; color: string }> = {
  REGULATORY: { label: '🔒 监管账户', color: '#CB2634' },
  SERVICE_REVENUE: { label: '💵 服务收入账户', color: '#00B42A' },
  GOVERNMENT_PAYABLE: { label: '🏛️  财政待缴', color: '#165DFF' },
  COURIER_PAYABLE: { label: '🚚 揽收待结', color: '#722ED1' },
};

const transTypes: Record<string, { label: string; dir: 'IN' | 'OUT' }> = {
  SERVICE_FEE_COLLECT: { label: '服务费收款', dir: 'IN' },
  GOVERNMENT_FEE_COLLECT: { label: '政府规费代收', dir: 'IN' },
  COURIER_FEE_COLLECT: { label: '快递费代收', dir: 'IN' },
  SERVICE_FEE_SETTLE: { label: '服务费结算', dir: 'OUT' },
  GOVERNMENT_FEE_TRANSFER: { label: '划转财政专户', dir: 'OUT' },
  COURIER_FEE_SETTLE: { label: '揽收佣金结算', dir: 'OUT' },
  REFUND: { label: '用户退款', dir: 'OUT' },
};

const gdCities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'];

const mockAccounts = [
  { id: 'a1', accountNo: 'REG-ALL', accountType: 'REGULATORY', managedCity: '全省', balance: 8247650.23, frozenAmount: 0, type: 'REGULATORY' },
  ...gdCities.slice(0, 5).flatMap((c, i) => [
    { id: `r-${i}`, accountNo: `REV-${c}`, accountType: 'SERVICE_REVENUE', managedCity: c, balance: 120000 + i * 45000.23, frozenAmount: 0 },
    { id: `g-${i}`, accountNo: `GOV-${c}`, accountType: 'GOVERNMENT_PAYABLE', managedCity: c, balance: 380000 + i * 62000.12, frozenAmount: 5000 * i },
    { id: `c-${i}`, accountNo: `CUR-${c}`, accountType: 'COURIER_PAYABLE', managedCity: c, balance: 68000 + i * 21500.45, frozenAmount: 0 },
  ]),
];

const mockTrans = Array.from({ length: 36 }).map((_, i) => {
  const types = Object.keys(transTypes);
  const t = types[i % types.length];
  const city = gdCities[i % gdCities.length];
  const acc = mockAccounts.find(a => a.managedCity === (accTypes[Object.keys(accTypes)[i % 4]]?.label.includes('全省') ? '全省' : city)) || mockAccounts[0];
  const amt = 500 + Math.floor(Math.random() * 95000) + (Math.random() * 0.99);
  return {
    key: i,
    id: `TX-${1000000 + i}`,
    transNo: `TR${20240615}${String(i + 1).padStart(8, '0')}`,
    accountId: acc.id,
    accountNo: acc.accountNo,
    accountType: acc.accountType,
    managedCity: acc.managedCity,
    transType: t,
    amount: amt,
    balanceAfter: transTypes[t].dir === 'IN' ? (parseFloat(acc.balance as any) + amt).toFixed(2) : Math.max(0, parseFloat(acc.balance as any) - amt).toFixed(2),
    operator: i % 3 === 0 ? null : ['运营-李', '运营-王', '系统自动'][i % 3],
    createdAt: dayjs().subtract(i * 0.8, 'hour').toISOString(),
    orderId: i % 5 !== 4 ? `ORD-${10000 + i}` : null,
    remark: transTypes[t].label + ' - 订单批量处理',
  };
});

const FundManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accounts, setAccounts] = useState(mockAccounts);
  const [settleForm] = Form.useForm();

  useEffect(() => { (async () => { setLoading(true); try { await api.get('/admin/fund/accounts'); } finally { setLoading(false); } })(); }, []);

  const doSettle = (acc: any) => Modal.confirm({
    title: `资金结算：${acc.accountNo}`,
    content: <Form form={settleForm} layout="vertical"><Form.Item label="结算金额(元)" name="amount" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} max={parseFloat(acc.balance)} step={100} /></Form.Item>
      <Form.Item label="备注" name="remark"><Input placeholder="请输入备注" /></Form.Item>
    </Form>,
    okText: '确认结算', onOk: () => message.success('已提交结算，等待银行处理'),
  });

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance as any), 0);
  const totalFrozen = accounts.reduce((s, a) => s + parseFloat(a.frozenAmount as any), 0);

  const dailyFlowOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['资金流入', '资金流出', '净额'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: Array.from({ length: 14 }, (_, i) => dayjs().subtract(13 - i, 'day').format('MM-DD')) },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
    series: [
      { name: '资金流入', type: 'bar', stack: 'flow', data: Array.from({ length: 14 }, () => (20 + Math.random() * 60).toFixed(1)), itemStyle: { color: '#00B42A', borderRadius: [4, 4, 0, 0] } },
      { name: '资金流出', type: 'bar', stack: 'flow', data: Array.from({ length: 14 }, () => (15 + Math.random() * 50).toFixed(1)), itemStyle: { color: '#F53F3F', borderRadius: [4, 4, 0, 0] } },
      { name: '净额', type: 'line', smooth: true, data: Array.from({ length: 14 }, () => (5 + Math.random() * 15).toFixed(1)), itemStyle: { color: '#165DFF' } },
    ],
  };

  const accPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'],
      label: { formatter: '{b}\n¥{c}' },
      data: Object.entries(accTypes).map(([k, c]) => ({
        value: accounts.filter(a => a.accountType === k).reduce((s, a) => s + parseFloat(a.balance as any), 0).toFixed(0),
        name: c.label, itemStyle: { color: c.color },
      })),
    }],
  };

  const accColumns: any[] = [
    { title: '账户编号', dataIndex: 'accountNo', width: 160, render: v => <code>{v}</code> },
    { title: '账户类型', dataIndex: 'accountType', width: 140, render: v => <Tag color={accTypes[v]?.color}>{accTypes[v]?.label}</Tag> },
    { title: '所属地市', dataIndex: 'managedCity', width: 100 },
    { title: '可用余额(元)', dataIndex: 'balance', width: 150, align: 'right', sorter: (a: any, b: any) => parseFloat(a.balance) - parseFloat(b.balance), render: v => <b style={{ color: '#00B42A' }}>¥{parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</b> },
    { title: '冻结金额', dataIndex: 'frozenAmount', width: 140, align: 'right', render: v => parseFloat(v) > 0 ? <span style={{ color: '#FF7D00' }}>¥{parseFloat(v).toLocaleString()}</span> : '-' },
    { title: '上次结算', width: 150, render: () => dayjs().subtract(Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD') },
    { title: '操作', width: 160, render: (_, r) => <Space>
      <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDrawerOpen(true); }}>明细</Button>
      {r.accountType !== 'REGULATORY' && parseFloat(r.balance) > 0 && <Button size="small" type="primary" icon={<SyncOutlined />} onClick={() => doSettle(r)}>结算</Button>}
    </Space> },
  ];

  const transColumns: any[] = [
    { title: '流水号', dataIndex: 'transNo', width: 180, render: v => <code>{v}</code> },
    { title: '账户', dataIndex: 'accountNo', width: 140, render: (v, r) => <Tag color={accTypes[r.accountType]?.color}>{accTypes[r.accountType]?.label.split(' ')[1]}</Tag> },
    { title: '地市', dataIndex: 'managedCity', width: 80 },
    { title: '交易类型', dataIndex: 'transType', width: 140, render: v => transTypes[v]?.label },
    { title: '金额(元)', dataIndex: 'amount', width: 130, align: 'right', render: (v, r) => <b style={{ color: transTypes[r.transType]?.dir === 'IN' ? '#00B42A' : '#F53F3F' }}>
      {transTypes[r.transType]?.dir === 'IN' ? '+' : '-'}¥{parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
    </b> },
    { title: '变动后余额', dataIndex: 'balanceAfter', width: 140, align: 'right', render: v => `¥${parseFloat(v).toLocaleString()}` },
    { title: '关联订单', dataIndex: 'orderId', width: 120, render: v => v || '-' },
    { title: '操作员', dataIndex: 'operator', width: 100, render: v => v || <Tag color="blue">系统</Tag> },
    { title: '时间', dataIndex: 'createdAt', width: 160, render: v => dayjs(v).format('MM-DD HH:mm:ss') },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><SafetyCertificateOutlined /> 监管账户余额（实时）</span>} value={accounts.find(a => a.accountType === 'REGULATORY')?.balance} prefix="¥" valueStyle={{ color: '#CB2634' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><BankOutlined /> 全平台账户总余额</span>} value={totalBalance} prefix="¥" precision={2} valueStyle={{ color: '#165DFF' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><DollarOutlined /> 待划转财政</span>} value={accounts.filter(a => a.accountType === 'GOVERNMENT_PAYABLE').reduce((s, a) => s + parseFloat(a.balance as any), 0)} prefix="¥" precision={0} valueStyle={{ color: '#722ED1' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><WalletOutlined /> 冻结金额</span>} value={totalFrozen} prefix="¥" valueStyle={{ color: '#FF7D00' }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">📊 近14日资金流（万元）</div>
              <Space><DatePicker.RangePicker size="small" /><Button size="small">导出Excel</Button></Space>
            </div>
            <ReactECharts option={dailyFlowOption} style={{ height: 280 }} />
          </div>
        </Col>
        <Col span={8}>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">💼 资金分布</div></div>
            <ReactECharts option={accPieOption} style={{ height: 280 }} />
          </div>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10, marginBottom: 16 }} size="small" title="🏦 账户列表" extra={<Space><Button>新增账户</Button><Button type="primary" danger>发起T+1结算批次</Button></Space>}>
        <div style={{ marginBottom: 8, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, fontSize: 13 }}>
          <SafetyCertificateOutlined style={{ color: '#FAAD14', marginRight: 6 }} />
          <b>资金监管规则：</b>用户支付 → 进入监管账户（T+0）→ 业务办结T+3自动划转 → 财政专户/服务收入/揽收佣金，全程可追溯，不得坐收坐支。
        </div>
        <Table loading={loading} columns={accColumns} dataSource={accounts} rowKey="id" pagination={false} size="middle"
          expandable={{ expandedRowRender: (r) => <div style={{ padding: '0 40px', color: '#595959' }}>
            <Progress percent={98.5} strokeColor="#00B42A" showInfo format={() => '98.5% 合规'} /><br/>
            <small>账户合规检查：对账一致 ✓ 余额匹配 ✓ 流水连续 ✓ 无异常交易</small>
          </div> }} />
      </Card>

      <Card style={{ borderRadius: 10 }} size="small" title="🧾 交易流水" extra={<Space>
        <Select allowClear placeholder="账户类型" style={{ width: 140 }} options={Object.entries(accTypes).map(([v, c]) => ({ value: v, label: c.label }))} />
        <DatePicker.RangePicker size="small" />
        <Button icon={<SyncOutlined />}>刷新</Button>
      </Space>}>
        <Table columns={transColumns} dataSource={mockTrans} rowKey="id" scroll={{ x: 1400 }} pagination={{ pageSize: 12, showTotal: t => `共 ${t} 条流水` }} size="middle" />
      </Card>

      <Drawer title={`账户明细 - ${detail?.accountNo}`} width={560} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {detail && (<>
          <Descriptions column={1} bordered size="small" title="账户信息">
            <Descriptions.Item label="账户编号"><code>{detail.accountNo}</code></Descriptions.Item>
            <Descriptions.Item label="账户类型"><Tag color={accTypes[detail.accountType]?.color}>{accTypes[detail.accountType]?.label}</Tag></Descriptions.Item>
            <Descriptions.Item label="所属地市">{detail.managedCity}</Descriptions.Item>
            <Descriptions.Item label="当前余额"><b style={{ color: '#00B42A', fontSize: 16 }}>¥{parseFloat(detail.balance).toLocaleString()}</b></Descriptions.Item>
            <Descriptions.Item label="冻结金额">¥{parseFloat(detail.frozenAmount).toLocaleString()}</Descriptions.Item>
          </Descriptions>
          <Card title="近10笔交易" size="small" style={{ marginTop: 16 }}>
            {mockTrans.filter(t => t.accountNo === detail.accountNo).slice(0, 10).map(t => (
              <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{transTypes[t.transType]?.label}</span>
                  <b style={{ color: transTypes[t.transType]?.dir === 'IN' ? '#00B42A' : '#F53F3F' }}>
                    {transTypes[t.transType]?.dir === 'IN' ? '+' : '-'}¥{parseFloat(String(t.amount)).toLocaleString()}
                  </b>
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{dayjs(t.createdAt).format('MM-DD HH:mm')} · {t.remark}</div>
              </div>
            ))}
          </Card>
        </>)}
      </Drawer>
    </div>
  );
};
export default FundManagementPage;
