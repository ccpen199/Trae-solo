import { Card, Row, Col, Typography, Space, Tag, List, Avatar, Badge, Button, App, Empty } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  KeyOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SmileOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, USER_ROLES } from '@/store/user';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const typeColorMap: Record<string, string> = {
  报修: '#3B82F6',
  投诉: '#EF4444',
  建议: '#10B981',
};

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'warning', text: '待处理' },
  ASSIGNED: { color: 'processing', text: '已分配' },
  PROCESSING: { color: 'processing', text: '处理中' },
};

const allTickets = [
  { id: 'TK-00001', type: '报修', title: '客厅灯不亮', status: 'PENDING', priority: '高', creator: '陈居民', createdAt: '10分钟前' },
  { id: 'TK-00002', type: '投诉', title: '楼下噪音扰民', status: 'PROCESSING', priority: '中', creator: '王业主', createdAt: '30分钟前' },
  { id: 'TK-00003', type: '建议', title: '建议增加健身器材', status: 'ASSIGNED', priority: '低', creator: '李住户', createdAt: '1小时前' },
  { id: 'TK-00004', type: '报修', title: '电梯故障', status: 'PROCESSING', priority: '紧急', creator: '赵先生', createdAt: '2小时前' },
  { id: 'TK-00005', type: '投诉', title: '垃圾分类不规范', status: 'PENDING', priority: '中', creator: '孙女士', createdAt: '3小时前' },
  { id: 'TK-00006', type: '报修', title: '水管漏水', status: 'PROCESSING', priority: '高', creator: '周师傅', createdAt: '4小时前' },
  { id: 'TK-00007', type: '建议', title: '绿化补种', status: 'ASSIGNED', priority: '低', creator: '吴主任', createdAt: '5小时前' },
  { id: 'TK-00008', type: '投诉', title: '停车位被占', status: 'PENDING', priority: '中', creator: '郑经理', createdAt: '6小时前' },
];

const recentAccessLogs = [
  { id: 'LOG-00001', user: '陈居民', device: '小区大门', time: '15:30', result: '通过', photo: '👨' },
  { id: 'LOG-00002', user: '访客张三', device: '1栋A单元门', time: '15:22', result: '通过', photo: '🧑' },
  { id: 'LOG-00003', user: '王业主', device: '小区东门', time: '15:15', result: '通过', photo: '👩' },
  { id: 'LOG-00004', user: '李住户', device: '2栋A单元门', time: '14:58', result: '通过', photo: '👴' },
  { id: 'LOG-00005', user: '外卖员', device: '小区大门', time: '14:40', result: '通过', photo: '👨‍🔧' },
];

const StatCard = ({ icon, title, value, suffix, color, trend, trendText, onClick }: any) => (
  <Card
    size="small"
    hoverable
    onClick={onClick}
    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}15`,
        color,
        fontSize: 24,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{value}</span>
          {suffix && <Text type="secondary">{suffix}</Text>}
        </div>
        {trend !== undefined && trend !== null && (
          <Text style={{ color: trend > 0 ? '#10B981' : '#EF4444', fontSize: 12 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendText}
          </Text>
        )}
      </div>
    </div>
  </Card>
);

const MiniKpiCard = ({ icon, title, value, color, onClick }: any) => (
  <Card
    size="small"
    hoverable
    onClick={onClick}
    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}15`,
        color,
        fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>{title}</Text>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{value}</div>
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useUserStore();

  const roleName = user?.role ? USER_ROLES[user.role]?.name || user.role : '未知';
  const nickname = user?.nickname || '用户';
  const todayStr = dayjs().format('YYYY年MM月DD日 dddd');

  const isServiceProvider = user?.role === 'SERVICE_PROVIDER';
  const isCommittee = user?.role === 'COMMITTEE';
  const isPropertyStaff = user?.role === 'PROPERTY_STAFF';
  const isResident = user?.role === 'RESIDENT';

  const trendOption = useMemo<echarts.EChartsOption>(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新工单', '已完成'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } } },
    series: [
      { name: '新工单', type: 'bar', data: isResident ? [1, 0, 1, 0, 2, 1, 0] : isPropertyStaff ? [4, 5, 3, 6, 4, 7, 3] : [12, 19, 15, 22, 18, 25, 14], itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } },
      { name: '已完成', type: 'bar', data: isResident ? [0, 0, 1, 0, 1, 1, 0] : isPropertyStaff ? [3, 5, 2, 5, 3, 6, 2] : [10, 17, 14, 20, 16, 22, 12], itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
    ],
  }), [isResident, isPropertyStaff]);

  const pieOption = useMemo<echarts.EChartsOption>(() => {
    const data = isCommittee
      ? [{ value: 89, name: '投诉', itemStyle: { color: '#EF4444' } }, { value: 34, name: '建议', itemStyle: { color: '#10B981' } }]
      : isResident
        ? [{ value: 3, name: '报修', itemStyle: { color: '#3B82F6' } }, { value: 1, name: '投诉', itemStyle: { color: '#EF4444' } }]
        : [
            { value: 156, name: '报修', itemStyle: { color: '#3B82F6' } },
            { value: 89, name: '投诉', itemStyle: { color: '#EF4444' } },
            { value: 67, name: '建议', itemStyle: { color: '#10B981' } },
          ];
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data,
      }],
    };
  }, [isCommittee, isResident]);

  const pendingTicketsTop5 = useMemo(() => {
    let list = allTickets;
    if (isResident) {
      list = allTickets.filter(t => t.creator === '陈居民').slice(0, 3);
    } else if (isPropertyStaff) {
      list = allTickets.filter(t => t.status !== 'PENDING').slice(0, 4);
    } else if (isCommittee) {
      list = allTickets.filter(t => t.type === '投诉');
    }
    return list.slice(0, 5);
  }, [isResident, isPropertyStaff, isCommittee]);

  const filteredRecentAccess = useMemo(() => {
    if (isResident) {
      return recentAccessLogs.filter(l => l.user === '陈居民' || l.user.includes('访客张三'));
    }
    if (isServiceProvider) return [];
    return recentAccessLogs;
  }, [isResident, isServiceProvider]);

  const handleStatClick = (name: string, path: string) => {
    navigate(path);
    message.success(`已从${name}下钻跳转，操作已留痕`);
  };

  const handleTicketClick = (id: string) => {
    navigate(`/tickets/${id}`);
    message.success(`已打开工单【${id}】详情，操作已留痕`);
  };

  const handleChartClick = (params: any) => {
    if (params?.name) {
      navigate(`/tickets?type=${encodeURIComponent(params.name)}`);
      message.success(`已从图表下钻到【${params.name}】工单列表，操作已留痕`);
    }
  };

  const onEvents = {
    click: handleChartClick,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Title level={4} style={{ margin: 0 }}>数据概览</Title>
          <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
            登录身份：{roleName} · 已按分级权限过滤可见范围
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 14 }}>
          你好，{nickname}（{roleName}） · 今天是{todayStr} · 数据已按你的权限范围显示
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<TeamOutlined />}
            title="居民总数"
            value={isResident ? '3' : isPropertyStaff ? '256' : '1,258'}
            suffix={isResident ? '人(家庭)' : '人'}
            trend={isResident ? null : 5.2}
            trendText="较上月"
            color="#3B82F6"
            onClick={() => handleStatClick('居民总数', '/community/buildings')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<FileTextOutlined />}
            title="工单处理中"
            value={isResident ? 1 : isPropertyStaff ? 7 : 42}
            suffix="单"
            trend={isResident ? null : 12.5}
            trendText="较上周"
            color="#10B981"
            onClick={() => handleStatClick('处理中工单', '/tickets?status=PROCESSING')}
          />
        </Col>
        {!isServiceProvider && (
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={<KeyOutlined />}
              title="在线设备"
              value={isResident ? 3 : isPropertyStaff ? 8 : 10}
              suffix="台"
              trend={0}
              color="#8B5CF6"
              onClick={() => handleStatClick('在线设备', '/access/devices')}
            />
          </Col>
        )}
        <Col xs={24} sm={12} md={isServiceProvider ? 12 : 6}>
          <StatCard
            icon={<ShopOutlined />}
            title="本月订单"
            value={isServiceProvider ? '156' : isResident ? '3' : '856'}
            suffix="单"
            trend={isResident ? null : 8.3}
            trendText="较上月"
            color="#F59E0B"
            onClick={() => handleStatClick('本月订单', '/service/orders')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="工单趋势（点击柱形可下钻）"
            size="small"
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            <ReactECharts option={trendOption} style={{ height: 320 }} onEvents={onEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="工单类型分布（点击扇区可下钻）"
            size="small"
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            <ReactECharts option={pieOption} style={{ height: 320 }} onEvents={onEvents} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近通行"
            size="small"
            extra={
              !isServiceProvider ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleStatClick('通行记录', '/access/logs')}
                >
                  查看全部 <RightOutlined />
                </Button>
              ) : null
            }
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            {isServiceProvider ? (
              <Empty description={<Tag color="magenta">服务商无门禁数据权限</Tag>} />
            ) : filteredRecentAccess.length === 0 ? (
              <Empty description="暂无通行记录" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={filteredRecentAccess}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar size={36} style={{ backgroundColor: '#E2E8F0', fontSize: 16 }}>{item.photo}</Avatar>}
                      title={<Space><Text>{item.user}</Text><Tag color={item.result === '通过' ? 'success' : 'error'}>{item.result}</Tag></Space>}
                      description={<Text type="secondary">{item.device}</Text>}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="待处理工单 TOP 5"
            size="small"
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            {pendingTicketsTop5.length === 0 ? (
              <Empty description="暂无待处理工单" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={pendingTicketsTop5}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 0' }}
                    onClick={() => handleTicketClick(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag color={typeColorMap[item.type]} style={{ borderRadius: 6, margin: 0 }}>
                          {item.type}
                        </Tag>
                      }
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Badge status={statusMap[item.status]?.color as any} text={statusMap[item.status]?.text} />
                        </Space>
                      }
                      description={<Text type="secondary">{item.creator} · {item.createdAt}</Text>}
                    />
                    <Tag color={item.priority === '紧急' ? 'red' : item.priority === '高' ? 'orange' : item.priority === '中' ? 'blue' : 'default'}>
                      {item.priority}
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {!isServiceProvider && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={8}>
            <MiniKpiCard
              icon={<ClockCircleOutlined />}
              title="平均响应时长"
              value={isResident ? '-' : isPropertyStaff ? '18.5' : '15.5'}
              suffix={!isResident ? '分钟' : ''}
              color="#F59E0B"
              onClick={() => !isResident && handleStatClick('KPI看板', '/kpi')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <MiniKpiCard
              icon={<CheckCircleOutlined />}
              title="工单完结率"
              value={isResident ? '-' : isPropertyStaff ? '90.2' : '92.6'}
              suffix={!isResident ? '%' : ''}
              color="#10B981"
              onClick={() => !isResident && handleStatClick('KPI看板', '/kpi')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <MiniKpiCard
              icon={<SmileOutlined />}
              title="满意度评分"
              value={isResident ? '-' : isPropertyStaff ? '4.7' : '4.8'}
              suffix={!isResident ? '星' : ''}
              color="#8B5CF6"
              onClick={() => !isResident && handleStatClick('KPI看板', '/kpi')}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}
