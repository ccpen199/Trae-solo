import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, Tag, Space, Badge, Typography, App, Card, Row, Col, Statistic, Modal, QRCode, Empty, Popconfirm, Divider } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, ReloadOutlined, ExportOutlined, UnlockOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, USER_ROLES } from '@/store/user';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const deviceTypeMap: Record<string, { text: string; color: string }> = {
  QRCODE: { text: '二维码', color: 'blue' },
  BLUETOOTH: { text: '蓝牙', color: 'cyan' },
  NFC: { text: 'NFC', color: 'purple' },
  FACE: { text: '人脸', color: 'orange' },
};

const deviceTypes = [
  { label: '二维码', value: 'QRCODE' },
  { label: '蓝牙', value: 'BLUETOOTH' },
  { label: 'NFC', value: 'NFC' },
  { label: '人脸识别', value: 'FACE' },
];

const communityNameMap: Record<string, string> = {
  c1: '阳光花园小区',
  c2: '翠湖天地小区',
  c3: '金色家园小区',
};

const buildingNameMap: Record<string, string> = {
  b1: '1栋',
  b2: '2栋',
  b3: '3栋',
};

const unitNameMap: Record<string, string> = {
  u101: '1栋A单元',
  u102: '1栋B单元',
  u201: '2栋A单元',
  u202: '2栋B单元',
  u301: '3栋A单元',
};

const allDevices = [
  { id: 'DEV-001', name: '小区大门', communityId: 'c1', communityName: '阳光花园小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'QRCODE', online: true, lastHeartbeat: '2026-06-19 15:30:00', todayCount: 328, authorizedCount: 1258 },
  { id: 'DEV-002', name: '小区东门', communityId: 'c1', communityName: '阳光花园小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'FACE', online: true, lastHeartbeat: '2026-06-19 15:28:00', todayCount: 156, authorizedCount: 1258 },
  { id: 'DEV-003', name: '地下车库入口', communityId: 'c1', communityName: '阳光花园小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'BLUETOOTH', online: false, lastHeartbeat: '2026-06-18 22:15:00', todayCount: 89, authorizedCount: 856 },
  { id: 'DEV-004', name: '1栋A单元门', communityId: 'c1', communityName: '阳光花园小区', buildingId: 'b1', buildingName: '1栋', unitId: 'u101', deviceType: 'NFC', online: true, lastHeartbeat: '2026-06-19 15:29:00', todayCount: 76, authorizedCount: 128 },
  { id: 'DEV-005', name: '1栋B单元门', communityId: 'c1', communityName: '阳光花园小区', buildingId: 'b1', buildingName: '1栋', unitId: 'u102', deviceType: 'FACE', online: true, lastHeartbeat: '2026-06-19 15:25:00', todayCount: 65, authorizedCount: 112 },
  { id: 'DEV-006', name: '2栋A单元门', communityId: 'c1', communityName: '阳光花园小区', buildingId: 'b2', buildingName: '2栋', unitId: 'u201', deviceType: 'QRCODE', online: true, lastHeartbeat: '2026-06-19 15:30:00', todayCount: 82, authorizedCount: 145 },
  { id: 'DEV-007', name: '2栋B单元门', communityId: 'c1', communityName: '阳光花园小区', buildingId: 'b2', buildingName: '2栋', unitId: 'u202', deviceType: 'BLUETOOTH', online: true, lastHeartbeat: '2026-06-19 15:22:00', todayCount: 58, authorizedCount: 98 },
  { id: 'DEV-008', name: '3栋A单元门', communityId: 'c1', communityName: '阳光花园小区', buildingId: 'b3', buildingName: '3栋', unitId: 'u301', deviceType: 'NFC', online: false, lastHeartbeat: '2026-06-19 08:10:00', todayCount: 23, authorizedCount: 156 },
  { id: 'DEV-009', name: '西大门', communityId: 'c2', communityName: '翠湖天地小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'QRCODE', online: true, lastHeartbeat: '2026-06-19 15:30:00', todayCount: 210, authorizedCount: 980 },
  { id: 'DEV-010', name: '健身中心入口', communityId: 'c2', communityName: '翠湖天地小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'FACE', online: true, lastHeartbeat: '2026-06-19 15:28:00', todayCount: 45, authorizedCount: 980 },
  { id: 'DEV-011', name: '北大门', communityId: 'c3', communityName: '金色家园小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'QRCODE', online: true, lastHeartbeat: '2026-06-19 15:29:00', todayCount: 178, authorizedCount: 756 },
  { id: 'DEV-012', name: '儿童乐园入口', communityId: 'c3', communityName: '金色家园小区', buildingId: null, buildingName: null, unitId: null, deviceType: 'BLUETOOTH', online: true, lastHeartbeat: '2026-06-19 15:30:00', todayCount: 34, authorizedCount: 756 },
];

const residentAuthorizedDeviceIds = ['DEV-001', 'DEV-002', 'DEV-004'];

export default function AccessDevice() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useUserStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [doorModalOpen, setDoorModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [devices, setDevices] = useState(allDevices);

  const roleName = user?.role ? USER_ROLES[user.role]?.name || user.role : '未知';

  const filteredData = useMemo(() => {
    if (!user) return [];
    const role = user.role;

    if (role === 'SERVICE_PROVIDER') return [];
    if (role === 'SUPER_ADMIN') return devices;

    if (role === 'PROPERTY_ADMIN' || role === 'COMMITTEE') {
      return devices.filter(d => user.communityIds?.includes(d.communityId));
    }

    if (role === 'PROPERTY_STAFF') {
      return devices.filter(d =>
        user.buildingIds?.includes(d.buildingId || '') || d.buildingId === null
      );
    }

    if (role === 'RESIDENT') {
      return devices.filter(d =>
        (user.unitIds?.includes(d.unitId || '') || residentAuthorizedDeviceIds.includes(d.id))
      );
    }

    return devices;
  }, [user, devices]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const online = filteredData.filter(d => d.online).length;
    const offline = total - online;
    const offlineRate = total > 0 ? ((offline / total) * 100).toFixed(1) : '0';
    const todayCount = filteredData.reduce((sum, d) => sum + d.todayCount, 0);
    return { total, online, offlineRate, todayCount };
  }, [filteredData]);

  const handleRemoteOpen = (record: any) => {
    setCurrentDevice(record);
    setDoorModalOpen(true);
    message.success(`已对设备【${record.name}】发起远程开门请求，操作已留痕`);
  };

  const handleEdit = (record: any) => {
    message.success(`已打开设备【${record.name}】的编辑窗口，操作已留痕`);
  };

  const handleDisable = (record: any) => {
    setDevices((prev) => prev.map(d => d.id === record.id ? { ...d, online: false } : d));
    message.success(`设备【${record.name}】已停用，操作已留痕`);
  };

  const handleBatchRestart = () => {
    message.success(`已向 ${filteredData.filter(d => d.online).length} 台在线设备下发重启指令，操作已留痕`);
  };

  const handleExport = () => {
    message.success(`设备清单导出成功，共 ${filteredData.length} 条记录，操作已留痕`);
  };

  const handleCreateSubmit = async (values: any) => {
    message.success(`新增设备【${values.name}】成功，操作已留痕`);
    return true;
  };

  const columns: any[] = [
    {
      title: '设备名/位置',
      dataIndex: 'name',
      width: 220,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            {record.communityName}{record.buildingName ? ` · ${record.buildingName}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'deviceType',
      width: 100,
      render: (val: string) => {
        const cfg = deviceTypeMap[val];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '在线状态',
      dataIndex: 'online',
      width: 110,
      render: (val: boolean) => (
        <Badge
          status={val ? 'success' : 'error'}
          text={val ? '在线' : '离线'}
        />
      ),
    },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', width: 180 },
    {
      title: '今日通行',
      dataIndex: 'todayCount',
      width: 110,
      render: (v: number) => <Text strong style={{ color: '#3B82F6' }}>{v}</Text>,
    },
    {
      title: '已授权人数',
      dataIndex: 'authorizedCount',
      width: 110,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<UnlockOutlined />} onClick={() => handleRemoteOpen(record)}>远程开门</Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { navigate(`/access/logs?deviceId=${record.id}`); message.success('已跳转到通行记录页，操作已留痕'); }}>通行记录</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认停用"
            description={`确定要停用设备【${record.name}】吗？`}
            onConfirm={() => handleDisable(record)}
          >
            <Button type="link" size="small" danger icon={<StopOutlined />}>停用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '门禁设备管理',
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
            <Statistic title="设备总数" value={stats.total} suffix="台" valueStyle={{ color: '#7C3AED' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="在线数" value={stats.online} suffix="台" valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="离线率" value={stats.offlineRate} suffix="%" valueStyle={{ color: Number(stats.offlineRate) > 20 ? '#EF4444' : '#F59E0B' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title="今日通行次数" value={stats.todayCount} valueStyle={{ color: '#3B82F6' }} />
          </Card>
        </Col>
      </Row>

      {user?.role === 'SERVICE_PROVIDER' ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description={<Tag color="magenta">服务商角色无门禁管理权限</Tag>} />
        </Card>
      ) : (
        <ProTable
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          search={{ labelWidth: 100 }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          toolBarRender={() => [
            <Button key="1" type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新增设备</Button>,
            <Button key="2" icon={<ReloadOutlined />} onClick={handleBatchRestart}>批量重启</Button>,
            <Button key="3" icon={<ExportOutlined />} onClick={handleExport}>导出设备清单</Button>,
          ]}
          scroll={{ x: 1250 }}
        />
      )}

      <ModalForm
        title="新增门禁设备"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={handleCreateSubmit}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="name" label="设备名称" placeholder="如：1栋A单元门" rules={[{ required: true }]} />
        <ProFormSelect name="deviceType" label="设备类型" options={deviceTypes} rules={[{ required: true }]} />
        <ProFormSelect name="communityId" label="所属小区" options={Object.entries(communityNameMap).map(([v, l]) => ({ label: l, value: v }))} rules={[{ required: true }]} />
        <ProFormSelect name="buildingId" label="所属楼栋" options={Object.entries(buildingNameMap).map(([v, l]) => ({ label: l, value: v }))} placeholder="不选表示公共区域设备" />
        <ProFormSelect name="unitId" label="所属单元" options={Object.entries(unitNameMap).map(([v, l]) => ({ label: l, value: v }))} />
        <ProFormTextArea name="remark" label="备注" rows={3} />
      </ModalForm>

      <Modal
        title={`远程开门 - ${currentDevice?.name || ''}`}
        open={doorModalOpen}
        onCancel={() => setDoorModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDoorModalOpen(false)}>关闭</Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Divider>扫码开门码（5分钟内有效）</Divider>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <QRCode
              value={`door:${currentDevice?.id}:${Date.now()}`}
              size={200}
              level="H"
              color="#7C3AED"
              bgColor="#ffffff"
            />
          </div>
          <Text type="secondary">设备ID：{currentDevice?.id}</Text>
        </div>
      </Modal>
    </PageContainer>
  );
}
