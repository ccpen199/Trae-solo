import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, Card, Row, Col, Statistic, Typography, App, Avatar, Drawer, Descriptions, DatePicker, Empty } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, USER_ROLES } from '@/store/user';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

const { Text } = Typography;

const authTypeMap: Record<string, { text: string; color: string }> = {
  QR_CODE: { text: '二维码', color: 'blue' },
  BLUETOOTH: { text: '蓝牙', color: 'cyan' },
  NFC: { text: 'NFC', color: 'purple' },
  FACE: { text: '人脸', color: 'orange' },
  TEMP: { text: '临时', color: 'magenta' },
  PERMANENT: { text: '常驻', color: 'green' },
};

const accessResultMap: Record<string, { text: string; color: string }> = {
  SUCCESS: { text: '通过', color: 'success' },
  FAIL: { text: '失败', color: 'error' },
  EXPIRED: { text: '已过期', color: 'error' },
};

const roleTagMap: Record<string, { text: string; color: string }> = {
  SUPER_ADMIN: { text: '超管', color: 'purple' },
  PROPERTY_ADMIN: { text: '物管', color: 'green' },
  PROPERTY_STAFF: { text: '物业员工', color: 'blue' },
  COMMITTEE: { text: '业委会', color: 'orange' },
  RESIDENT: { text: '居民', color: 'cyan' },
  SERVICE_PROVIDER: { text: '服务商', color: 'magenta' },
  VISITOR: { text: '访客', color: 'geekblue' },
};

const allLogs = Array.from({ length: 60 }, (_, i) => {
  const userRoles = ['RESIDENT', 'VISITOR', 'PROPERTY_STAFF', 'COMMITTEE', 'PROPERTY_ADMIN'];
  const results = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAIL', 'EXPIRED'];
  const authTypes = ['QR_CODE', 'BLUETOOTH', 'NFC', 'FACE', 'PERMANENT', 'TEMP'];
  const openMethods = ['扫码', '蓝牙', 'NFC', '人脸识别', '远程开门', '密码'];
  const devices = [
    { name: '小区大门', community: '阳光花园小区', building: null, unit: null },
    { name: '小区东门', community: '阳光花园小区', building: null, unit: null },
    { name: '1栋A单元门', community: '阳光花园小区', building: '1栋', unit: 'A单元' },
    { name: '1栋B单元门', community: '阳光花园小区', building: '1栋', unit: 'B单元' },
    { name: '2栋A单元门', community: '阳光花园小区', building: '2栋', unit: 'A单元' },
    { name: '2栋B单元门', community: '阳光花园小区', building: '2栋', unit: 'B单元' },
    { name: '3栋A单元门', community: '阳光花园小区', building: '3栋', unit: 'A单元' },
    { name: '西大门', community: '翠湖天地小区', building: null, unit: null },
    { name: '北大门', community: '金色家园小区', building: null, unit: null },
  ];
  const userNames = ['陈居民', '王业主', '李住户', '赵先生', '孙女士', '周师傅', '吴主任', '郑经理', '访客张三', '访客李四'];
  const photos = ['👨', '👩', '👴', '👵', '👨‍🔧', '👩‍💼', '👨‍🦳', '👩‍🦰', '🧑', '👨‍💻'];
  const notes = [null, null, null, null, null, '访客张三-业主陈先生邀请', '访客李四-业主王业主邀请', '装修工人-物业临时授权', '外卖配送', '快递员'];

  const role = userRoles[i % userRoles.length];
  const device = devices[i % devices.length];
  const idx = i % 10;

  return {
    id: `LOG-${String(i + 1).padStart(5, '0')}`,
    deviceName: device.name,
    userName: idx < 8 ? userNames[idx] : userNames[role === 'VISITOR' ? 8 + (i % 2) : idx % 8],
    userRole: role,
    phone: `138****${String(1000 + i).padStart(4, '0')}`,
    accessTime: dayjs('2026-06-19 08:00:00').subtract(Math.floor(i / 3), 'hour').subtract(i * 7, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    accessResult: results[i % results.length],
    authType: authTypes[i % authTypes.length],
    openMethod: openMethods[i % openMethods.length],
    photo: photos[idx],
    note: notes[i % notes.length],
    location: `${device.community}${device.building ? ` · ${device.building}${device.unit ? `·${device.unit}` : ''}` : ''}`,
    communityName: device.community,
    buildingName: device.building,
    unitName: device.unit,
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    inviter: role === 'VISITOR' ? '陈居民（1栋A单元）' : null,
    traceLog: [
      { time: dayjs('2026-06-19 08:00:00').subtract(i * 7, 'minute').subtract(30, 'second').format('HH:mm:ss'), action: '身份核验请求' },
      { time: dayjs('2026-06-19 08:00:00').subtract(i * 7, 'minute').subtract(15, 'second').format('HH:mm:ss'), action: '权限匹配检查' },
      { time: dayjs('2026-06-19 08:00:00').subtract(i * 7, 'minute').format('HH:mm:ss'), action: `核验结果：${results[i % results.length] === 'SUCCESS' ? '通过' : '拒绝'}` },
    ],
  };
});

const residentPhone = '138****0005';
const residentVisitorNotes = ['访客张三-业主陈先生邀请', '访客李四-业主陈先生邀请'];

export default function AccessLog() {
  const { message } = App.useApp();
  const { user } = useUserStore();
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);
  const [dateRange, setDateRange] = useState<any>(null);

  const roleName = user?.role ? USER_ROLES[user.role]?.name || user.role : '未知';

  const filteredData = useMemo(() => {
    if (!user) return [];
    const role = user.role;

    if (role === 'SERVICE_PROVIDER') return [];
    if (role === 'SUPER_ADMIN') return allLogs;

    if (role === 'PROPERTY_ADMIN' || role === 'COMMITTEE') {
      return allLogs.filter(l => user.communityIds?.some(cid => l.communityName.includes(cid === 'c1' ? '阳光花园' : cid === 'c2' ? '翠湖天地' : '金色家园')));
    }

    if (role === 'PROPERTY_STAFF') {
      return allLogs.filter(l => {
        const matchBuilding = user.buildingIds?.some(bid => l.buildingName?.includes(bid === 'b1' ? '1栋' : bid === 'b2' ? '2栋' : '3栋'));
        const matchPublic = l.buildingName === null;
        return matchBuilding || matchPublic;
      });
    }

    if (role === 'RESIDENT') {
      return allLogs.filter(l =>
        l.phone === residentPhone || residentVisitorNotes.includes(l.note || '')
      );
    }

    return allLogs;
  }, [user]);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayLogs = filteredData.filter(l => dayjs(l.accessTime).format('YYYY-MM-DD') === today);
    const todayCount = todayLogs.length;
    const abnormalCount = todayLogs.filter(l => l.accessResult !== 'SUCCESS').length;
    const visitorCount = todayLogs.filter(l => l.userRole === 'VISITOR').length;

    const hourCounts = new Array(24).fill(0);
    filteredData.forEach(l => {
      const h = dayjs(l.accessTime).hour();
      hourCounts[h]++;
    });
    let peakHour = 8;
    let peakCount = 0;
    hourCounts.forEach((c, h) => {
      if (c > peakCount) {
        peakCount = c;
        peakHour = h;
      }
    });

    return {
      todayCount,
      abnormalCount,
      visitorCount,
      peakHour: `${peakHour}:00-${peakHour + 1}:00`,
    };
  }, [filteredData]);

  const handleViewDetail = (record: any) => {
    setCurrentLog(record);
    setDetailDrawerOpen(true);
    message.success(`已打开通行记录【${record.id}】详情，操作已留痕`);
  };

  const handleExport = () => {
    message.success(`通行记录导出成功，共 ${filteredData.length} 条 CSV 数据，操作已留痕`);
  };

  const handleDateChange = (value: any) => {
    setDateRange(value);
    if (value) {
      message.success(`已按时间范围 ${value[0]?.format('YYYY-MM-DD')} ~ ${value[1]?.format('YYYY-MM-DD')} 筛选，操作已留痕`);
    }
  };

  const columns: any[] = [
    { title: '时间', dataIndex: 'accessTime', width: 180, sorter: (a: any, b: any) => a.accessTime.localeCompare(b.accessTime) },
    {
      title: '通行人员',
      dataIndex: 'userName',
      width: 260,
      render: (_: any, record: any) => (
        <Space>
          <Avatar size={36} style={{ backgroundColor: '#E2E8F0', fontSize: 18 }}>{record.photo}</Avatar>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong>{record.userName}</Text>
              {roleTagMap[record.userRole] && (
                <Tag color={roleTagMap[record.userRole].color} style={{ margin: 0, fontSize: 11 }}>
                  {roleTagMap[record.userRole].text}
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
        </Space>
      ),
    },
    { title: '设备位置', dataIndex: 'location', width: 200 },
    {
      title: '验证方式',
      dataIndex: 'authType',
      width: 100,
      render: (v: string) => authTypeMap[v] ? <Tag color={authTypeMap[v].color}>{authTypeMap[v].text}</Tag> : v,
    },
    {
      title: '授权类型',
      dataIndex: 'openMethod',
      width: 100,
      render: (v: string) => <Text type="secondary">{v}</Text>,
    },
    {
      title: '通行结果',
      dataIndex: 'accessResult',
      width: 100,
      render: (v: string) => (
        <Tag color={accessResultMap[v].color}>
          {accessResultMap[v].text}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      width: 220,
      ellipsis: true,
      render: (v: string) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '通行日志',
        subTitle: (
          <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
            登录身份：{roleName} · 已按分级权限过滤可见范围
          </Tag>
        ),
      }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="今日通行" value={stats.todayCount} valueStyle={{ color: '#3B82F6' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="异常通行" value={stats.abnormalCount} valueStyle={{ color: '#EF4444' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="访客通行" value={stats.visitorCount} valueStyle={{ color: '#8B5CF6' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="高峰时段" value={stats.peakHour} valueStyle={{ color: '#F59E0B', fontSize: 18 }} />
          </Card>
        </Col>
      </Row>

      {user?.role === 'SERVICE_PROVIDER' ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description={<Tag color="magenta">服务商角色无通行日志权限</Tag>} />
        </Card>
      ) : (
        <ProTable
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          search={{
            labelWidth: 100,
            onValuesChange: handleFilterChange,
            optionRender: ({ searchText, resetText }, { form }) => [
              <Space key="1">
                <DatePicker.RangePicker onChange={handleDateChange} value={dateRange} />
              </Space>,
              <Button key="2" type="primary" onClick={() => form?.submit()}>{searchText}</Button>,
              <Button key="3" onClick={() => { form?.reset(); setDateRange(null); message.success('筛选条件已重置，操作已留痕'); }}>{resetText}</Button>,
            ],
          }}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          toolBarRender={() => [
            <Button key="1" icon={<DownloadOutlined />} onClick={handleExport}>导出CSV</Button>,
          ]}
          scroll={{ x: 1350 }}
        />
      )}

      <Drawer
        title={`通行详情 - ${currentLog?.id || ''}`}
        width={520}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={
          <Button onClick={() => setDetailDrawerOpen(false)}>关闭</Button>
        }
      >
        {currentLog && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
              <Avatar size={64} style={{ backgroundColor: '#E2E8F0', fontSize: 32 }}>{currentLog.photo}</Avatar>
              <div>
                <Text strong style={{ fontSize: 18 }}>{currentLog.userName}</Text>
                <div style={{ marginTop: 4 }}>
                  {roleTagMap[currentLog.userRole] && (
                    <Tag color={roleTagMap[currentLog.userRole].color}>
                      {roleTagMap[currentLog.userRole].text}
                    </Tag>
                  )}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>手机号：{currentLog.phone}</div>
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="通行时间">{currentLog.accessTime}</Descriptions.Item>
              <Descriptions.Item label="设备位置">{currentLog.location}</Descriptions.Item>
              <Descriptions.Item label="验证方式">{currentLog.authType}</Descriptions.Item>
              <Descriptions.Item label="开门方式">{currentLog.openMethod}</Descriptions.Item>
              <Descriptions.Item label="授权类型">{authTypeMap[currentLog.authType]?.text || currentLog.authType}</Descriptions.Item>
              <Descriptions.Item label="核验结果">
                <Tag color={accessResultMap[currentLog.accessResult].color}>
                  {accessResultMap[currentLog.accessResult].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="IP地址"><Text code>{currentLog.ip}</Text></Descriptions.Item>
              {currentLog.inviter && <Descriptions.Item label="关联邀请人">{currentLog.inviter}</Descriptions.Item>}
              {currentLog.note && <Descriptions.Item label="备注">{currentLog.note}</Descriptions.Item>}
            </Descriptions>

            <div>
              <Text strong>操作轨迹</Text>
              <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #E2E8F0' }}>
                {currentLog.traceLog.map((t: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: 12, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -17, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }}></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.time}</Text>
                    <div style={{ marginTop: 2 }}>{t.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}
