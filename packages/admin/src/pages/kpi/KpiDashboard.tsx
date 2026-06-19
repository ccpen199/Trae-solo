import { Card, Row, Col, Statistic, Typography, Table, Space, Tag, Button, App, Empty, Progress, Rate, DatePicker, Select, Avatar, Divider } from 'antd';
import {
  ClockCircleOutlined,
  SmileOutlined,
  ExportOutlined,
  ExclamationCircleOutlined,
  FrownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, USER_ROLES } from '@/store/user';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const communityOptions = [
  { label: '阳光花园小区', value: 'c1' },
  { label: '翠湖天地小区', value: 'c2' },
  { label: '金色家园小区', value: 'c3' },
];

const buildingOptions = [
  { label: '1栋', value: 'b1' },
  { label: '2栋', value: 'b2' },
  { label: '3栋', value: 'b3' },
];

const staffOptions = [
  { label: '李客服', value: 'staff1' },
  { label: '王师傅', value: 'staff2' },
  { label: '张工程', value: 'staff3' },
  { label: '刘物业', value: 'staff4' },
];

const timeoutTickets = [
  { id: 'TK-00101', title: '电梯故障（已超时48小时）', responseTime: 180, handler: '张工程', priority: '紧急' },
  { id: 'TK-00102', title: '主水管爆裂抢修（已超时24小时）', responseTime: 125, handler: '王师傅', priority: '紧急' },
  { id: 'TK-00103', title: '消防通道堵塞（已超时12小时）', responseTime: 89, handler: '李客服', priority: '高' },
];

const uncompletedTickets = [
  { id: 'TK-00201', title: '楼道灯维修', status: '处理中', duration: '6小时', handler: '王师傅' },
  { id: 'TK-00202', title: '门禁设备故障', status: '已分配', duration: '4小时', handler: '张工程' },
  { id: 'TK-00203', title: '垃圾分类宣传', status: '处理中', duration: '2小时', handler: '李客服' },
  { id: 'TK-00204', title: '绿化带修剪', status: '待处理', duration: '1小时', handler: '-' },
];

const badReviews = [
  { id: 'TK-00301', title: '维修后再次损坏', rating: 1, comment: '修了一周又坏了，态度也不好', reviewer: '陈居民', handler: '王师傅', time: '2026-06-18' },
  { id: 'TK-00302', title: '响应太慢', rating: 2, comment: '等了半天没人来处理', reviewer: '王业主', handler: '李客服', time: '2026-06-17' },
  { id: 'TK-00303', title: '问题没解决就关闭了', rating: 1, comment: '工单显示完成但问题还在', reviewer: '李住户', handler: '刘物业', time: '2026-06-16' },
];

const staffRankingData = [
  { key: '1', staffId: 'staff1', name: '李客服', handled: 89, completed: 85, rate: 95.5, score: 4.9, responseTime: 10, processTime: 45 },
  { key: '2', staffId: 'staff2', name: '王师傅', handled: 76, completed: 72, rate: 94.7, score: 4.8, responseTime: 12, processTime: 58 },
  { key: '3', staffId: 'staff3', name: '张工程', handled: 65, completed: 61, rate: 93.8, score: 4.2, responseTime: 15, processTime: 52 },
  { key: '4', staffId: 'staff4', name: '刘物业', handled: 52, completed: 48, rate: 92.3, score: 3.8, responseTime: 18, processTime: 65 },
];

function KpiBigCard({ title, value, suffix, prefix, valueColor, trend, trendLabel, detailTitle, detailList, onItemClick }: any) {
  return (
    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <Statistic
        title={<Space><span>{title}</span>{trendLabel && <Tag color={trend >= 0 ? 'green' : 'red'} style={{ fontSize: 11 }}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}</Tag>}</Space>}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ color: valueColor, fontSize: 36, fontWeight: 700 }}
      />
      {detailTitle && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{detailTitle}</Text>
          <div style={{ marginTop: 8 }}>
            {detailList.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  marginBottom: 6,
                  background: '#F8FAFC',
                  cursor: onItemClick ? 'pointer' : 'default',
                  fontSize: 12,
                }}
                onClick={() => onItemClick && onItemClick(item)}
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 12 }}>{item.title || item.name}</Text>
                    {item.priority && <Tag color={item.priority === '紧急' ? 'red' : 'orange'} style={{ fontSize: 10, padding: '0 4px' }}>{item.priority}</Tag>}
                  </div>
                  {item.comment && <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: item.comment }}>"{item.comment}"</Text>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
                    <span>{item.handler || item.reviewer}</span>
                    <span>{item.responseTime ? `响应${item.responseTime}分钟` : item.time || item.duration}</span>
                  </div>
                </Space>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default function KpiDashboard() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useUserStore();
  const [filters, setFilters] = useState<any>({ community: undefined, building: undefined, staff: undefined });

  const roleName = user?.role ? USER_ROLES[user.role]?.name || user.role : '未知';
  const isCommittee = user?.role === 'COMMITTEE';
  const isPropertyStaff = user?.role === 'PROPERTY_STAFF';
  const isNoPermission = user?.role === 'RESIDENT' || user?.role === 'SERVICE_PROVIDER';
  const staffUserId = 'staff2';

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
    const label = key === 'community' ? '小区' : key === 'building' ? '楼栋' : key === 'staff' ? '处理人员' : key;
    const valueText = value ? (Array.isArray(value) ? value.join(',') : value) : '全部';
    message.success(`KPI筛选条件变更：${label}=${valueText}，操作已留痕`);
  };

  const responseTime = isPropertyStaff ? 18.5 : isCommittee ? 18.2 : 15.5;
  const responseColor = responseTime <= 15 ? '#10B981' : responseTime <= 25 ? '#F59E0B' : '#EF4444';
  const completionRate = isPropertyStaff ? 90.2 : isCommittee ? 89.5 : 92.6;
  const satisfaction = isPropertyStaff ? 4.7 : isCommittee ? 4.3 : 4.8;
  const totalHandled = isPropertyStaff ? 76 : isCommittee ? 89 : 312;

  const responseTrend = isPropertyStaff ? 3.2 : isCommittee ? 1.5 : -8.3;
  const completionTrend = isPropertyStaff ? -1.8 : isCommittee ? -2.1 : 2.5;
  const satisfactionTrend = isPropertyStaff ? -0.1 : isCommittee ? -0.3 : 0.2;
  const totalTrend = isPropertyStaff ? 5.6 : isCommittee ? 4.2 : 12.5;

  const trendOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['06/12', '06/13', '06/14', '06/15', '06/16', '06/17', '06/18'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
    },
    yAxis: { type: 'value', name: '分钟', splitLine: { lineStyle: { color: '#F1F5F9' } } },
    series: [
      {
        name: '响应时长',
        type: 'line',
        smooth: true,
        data: isPropertyStaff ? [22, 15, 18, 20, 16, 18, 18.5] : isCommittee ? [20, 18, 22, 19, 17, 18, 18.2] : [12, 8, 15, 10, 18, 12, 15.5],
        itemStyle: { color: '#3B82F6' },
        areaStyle: { opacity: 0.15, color: '#3B82F6' },
        lineStyle: { width: 3 },
      },
    ],
  };

  const typeDistributionOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '42%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      data: isCommittee
        ? [{ value: 89, name: '投诉', itemStyle: { color: '#EF4444' } }, { value: 34, name: '建议', itemStyle: { color: '#10B981' } }]
        : [{ value: 156, name: '报修', itemStyle: { color: '#3B82F6' } }, { value: 89, name: '投诉', itemStyle: { color: '#EF4444' } }, { value: 67, name: '建议', itemStyle: { color: '#10B981' } }],
    }],
  };

  const staffRankingOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } } },
    yAxis: {
      type: 'category',
      data: isPropertyStaff ? ['王师傅'] : ['刘物业', '张工程', '王师傅', '李客服'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
    },
    series: [
      {
        name: '满意度',
        type: 'bar',
        stack: 'total',
        barWidth: 20,
        label: { show: true, position: 'inside', formatter: (p: any) => `⭐${p.value}` },
        data: isPropertyStaff ? [4.7] : [3.8, 4.2, 4.8, 4.9],
        itemStyle: { color: '#8B5CF6', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  const filteredStaff = isPropertyStaff
    ? staffRankingData.filter(s => s.staffId === staffUserId)
    : staffRankingData;

  const staffColumns = [
    { title: '处理人员', dataIndex: 'name', width: 100, render: (v: string) => <Space><Avatar size={28} style={{ backgroundColor: '#7C3AED', fontSize: 14 }}>{v[0]}</Avatar><Text strong>{v}</Text></Space> },
    { title: '处理工单数', dataIndex: 'handled', width: 100, sorter: (a: any, b: any) => a.handled - b.handled },
    { title: '完成工单数', dataIndex: 'completed', width: 100, sorter: (a: any, b: any) => a.completed - b.completed },
    { title: '完结率', dataIndex: 'rate', width: 100, render: (v: number) => <Progress percent={v} size="small" status={v >= 95 ? 'success' : v >= 90 ? 'active' : 'exception'} showInfo={false} /> },
    { title: '满意度', dataIndex: 'score', width: 120, render: (v: number) => <Rate disabled defaultValue={v} allowHalf style={{ fontSize: 14 }} /> },
    { title: '平均响应', dataIndex: 'responseTime', width: 100, render: (v: number) => <Tag color={v <= 15 ? 'green' : v <= 20 ? 'orange' : 'red'}>{v}分钟</Tag> },
    { title: '平均处理', dataIndex: 'processTime', width: 100, render: (v: number) => `${v}分钟` },
  ];

  const handleTicketClick = (item: any) => {
    navigate(`/tickets/${item.id}`);
    message.success(`已跳转工单【${item.id}】详情页，操作已留痕`);
  };

  const handleTypeClick = (params: any) => {
    if (params?.name) {
      navigate(`/tickets?type=${encodeURIComponent(params.name)}`);
      message.success(`已从工单类型分布下钻到【${params.name}】工单列表，操作已留痕`);
    }
  };

  const handleStaffClick = (staff: any) => {
    navigate(`/tickets?staffId=${staff.staffId}`);
    message.success(`已下钻查看【${staff.name}】的工单列表，操作已留痕`);
  };

  const handleExport = () => {
    message.success('KPI报表导出成功，包含响应时长、完结率、满意度、绩效排名等数据，操作已留痕');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Title level={4} style={{ margin: 0 }}>物业 KPI 看板</Title>
          <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
            登录身份：{roleName} · 已按分级权限过滤可见范围
          </Tag>
          {isCommittee && <Tag color="orange" icon={<ExclamationCircleOutlined />}>业委会监督视图</Tag>}
        </div>
        <Text type="secondary" style={{ fontSize: 14 }}>
          实时监控物业运营数据与服务质量 · 点击卡片下方明细或图表项可下钻查看详情
        </Text>
      </div>

      {isNoPermission ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description={<Tag color="magenta">此角色无KPI看板权限</Tag>} />
        </Card>
      ) : (
        <>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <Space size="large" wrap>
              <Space>
                <Text type="secondary">小区：</Text>
                <Select
                  allowClear
                  placeholder="全部小区"
                  style={{ width: 160 }}
                  options={communityOptions}
                  value={filters.community}
                  onChange={(v) => handleFilterChange('community', v)}
                  disabled={isPropertyStaff}
                />
              </Space>
              <Space>
                <Text type="secondary">楼栋：</Text>
                <Select
                  allowClear
                  placeholder="全部楼栋"
                  style={{ width: 140 }}
                  options={buildingOptions}
                  value={filters.building}
                  onChange={(v) => handleFilterChange('building', v)}
                  disabled={isPropertyStaff}
                />
              </Space>
              <Space>
                <Text type="secondary">时间范围：</Text>
                <RangePicker onChange={(v) => handleFilterChange('dateRange', v ? [v[0]?.format('YYYY-MM-DD'), v[1]?.format('YYYY-MM-DD')] : null)} />
              </Space>
              <Space>
                <Text type="secondary">处理人员：</Text>
                <Select
                  allowClear
                  placeholder="全部人员"
                  style={{ width: 140 }}
                  options={staffOptions}
                  value={filters.staff}
                  onChange={(v) => handleFilterChange('staff', v)}
                  disabled={isPropertyStaff}
                />
              </Space>
              <Button icon={<ExportOutlined />} type="primary" onClick={handleExport}>导出报表</Button>
            </Space>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <KpiBigCard
                title="平均响应时长"
                value={responseTime}
                suffix="分钟"
                prefix={<ClockCircleOutlined />}
                valueColor={responseColor}
                trend={responseTrend}
                trendLabel="同比上周"
                detailTitle="超时工单 Top 3（点击可跳转）"
                detailList={isCommittee ? timeoutTickets.filter(t => t.priority === '紧急') : timeoutTickets}
                onItemClick={handleTicketClick}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Statistic
                  title={<Space><span>完结率</span><Tag color="green" style={{ fontSize: 11 }}>{completionTrend >= 0 ? '↑' : '↓'} {Math.abs(completionTrend)}% 同比上周</Tag></Space>}
                  prefix={<CheckCircleOutlined />}
                  value={completionRate}
                  suffix="%"
                  valueStyle={{ color: completionRate >= 95 ? '#10B981' : completionRate >= 90 ? '#F59E0B' : '#EF4444', fontSize: 36, fontWeight: 700 }}
                />
                <Progress
                  percent={completionRate}
                  status={completionRate >= 95 ? 'success' : completionRate >= 90 ? 'active' : 'exception'}
                  style={{ marginTop: 4 }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>未完结工单（点击可跳转）</Text>
                <div style={{ marginTop: 8 }}>
                  {uncompletedTickets.slice(0, 4).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 6, background: '#F8FAFC', cursor: 'pointer', fontSize: 12 }}
                      onClick={() => handleTicketClick(item)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 12 }}>{item.title}</Text>
                        <Tag color={item.status === '待处理' ? 'warning' : 'processing'} style={{ fontSize: 10, padding: '0 4px' }}>{item.status}</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        <span>处理人：{item.handler}</span>
                        <span>已耗时{item.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Statistic
                  title={<Space><span>满意度</span><Tag color={satisfactionTrend >= 0 ? 'green' : 'red'} style={{ fontSize: 11 }}>{satisfactionTrend >= 0 ? '↑' : '↓'} {Math.abs(satisfactionTrend)} 同比上周</Tag></Space>}
                  prefix={<SmileOutlined />}
                  value={satisfaction}
                  suffix="分"
                  valueStyle={{ color: satisfaction >= 4.8 ? '#10B981' : satisfaction >= 4.5 ? '#F59E0B' : '#EF4444', fontSize: 36, fontWeight: 700 }}
                />
                <Rate disabled defaultValue={satisfaction} allowHalf style={{ fontSize: 18, marginTop: 4 }} />
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>差评工单（可复查，点击跳转）</Text>
                <div style={{ marginTop: 8 }}>
                  {badReviews.slice(0, 3).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 6, background: '#F8FAFC', cursor: 'pointer', fontSize: 12 }}
                      onClick={() => handleTicketClick(item)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <Text strong style={{ fontSize: 12 }}>{item.title}</Text>
                        <Rate disabled value={item.rating} style={{ fontSize: 12, color: '#EF4444' }} />
                      </div>
                      <FrownOutlined style={{ color: '#94A3B8' }} /> <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: item.comment }}>"{item.comment}"</Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        <span>处理人：{item.handler}</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <KpiBigCard
                title="处理总工单数"
                value={totalHandled}
                suffix="单"
                prefix={<FileTextOutlined />}
                valueColor="#3B82F6"
                trend={totalTrend}
                trendLabel="较上月"
                detailTitle="本月处理趋势"
                detailList={[
                  { title: '已完成工单', time: '285单', handler: '占比91%', priority: undefined },
                  { title: '处理中工单', time: '18单', handler: '占比6%', priority: undefined },
                  { title: '待分配工单', time: '9单', handler: '占比3%', priority: undefined },
                ]}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card title="7日响应时长趋势" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <ReactECharts option={trendOption} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} lg={7}>
              <Card title="工单类型分布（点击扇区下钻）" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <ReactECharts option={typeDistributionOption} style={{ height: 300 }} onEvents={{ click: handleTypeClick }} />
              </Card>
            </Col>
            <Col xs={24} lg={7}>
              <Card title="物业员工绩效排名（点击下钻）" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <ReactECharts
                  option={staffRankingOption}
                  style={{ height: 300 }}
                  onEvents={{
                    click: (params: any) => {
                      const staffName = params.name;
                      const staff = staffRankingData.find(s => s.name === staffName);
                      if (staff) handleStaffClick(staff);
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="物业人员绩效明细（点击行可下钻查看该员工工单）"
            size="small"
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginTop: 16 }}
          >
            <Table
              columns={staffColumns}
              dataSource={filteredStaff}
              pagination={false}
              size="middle"
              onRow={(record) => ({
                onClick: () => handleStaffClick(record),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </>
      )}
    </div>
  );
}
