import { useState } from 'react';
import { ProTable, ModalForm, ProFormSelect, ProFormText, ProFormCheckbox } from '@ant-design/pro-components';
import { Tag, Space, Button, Switch, App, Popconfirm, Drawer, Descriptions, Avatar } from 'antd';
import {
  EditOutlined, DeleteOutlined, KeyOutlined, EyeOutlined,
  ApartmentOutlined, HomeOutlined, ShopOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useUserStore, USER_ROLES } from '@/store/user';

const roleMap: Record<string, { text: string; color: string; icon: any }> = {
  SUPER_ADMIN: { text: '超级管理员', color: 'magenta', icon: SafetyCertificateOutlined },
  PROPERTY_ADMIN: { text: '物业管理员', color: 'green', icon: ApartmentOutlined },
  PROPERTY_STAFF: { text: '物业员工', color: 'blue', icon: ApartmentOutlined },
  COMMITTEE: { text: '业委会', color: 'gold', icon: SafetyCertificateOutlined },
  RESIDENT: { text: '居民', color: 'default', icon: HomeOutlined },
  SERVICE_PROVIDER: { text: 'O2O服务商', color: 'orange', icon: ShopOutlined },
};

const scopeMap: Record<string, string> = {
  ALL: '全平台',
  COMMUNITY: '按小区',
  BUILDING: '按楼栋',
  UNIT: '按单元',
  HOUSE: '按房屋',
  PROVIDER: '按服务商',
};

const ALL_USERS = [
  {
    id: 'U00001', phone: '13800000001', nickname: '超级管理员', realName: '系统管理员',
    role: 'SUPER_ADMIN', status: true, communityIds: ['c1', 'c2'], buildingIds: [], unitIds: [], houseIds: [],
    scope: 'ALL', scopeText: '全平台（3个小区 × 36栋）',
    communityName: '-', houseInfo: '-', houseCount: 0,
    createdAt: '2024-01-01', lastLoginAt: '2026-06-19 09:30',
  },
  {
    id: 'U00002', phone: '13800000002', nickname: '物业-李经理', realName: '李明',
    role: 'PROPERTY_ADMIN', status: true, communityIds: ['c1'], buildingIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'],
    unitIds: [], houseIds: [],
    scope: 'COMMUNITY', scopeText: '阳光花园（6栋 × 12单元 × 216套）',
    communityName: '阳光花园小区', houseInfo: '-', houseCount: 0,
    createdAt: '2024-02-10', lastLoginAt: '2026-06-19 08:15',
  },
  {
    id: 'U00003', phone: '13800000003', nickname: '维修-王师傅', realName: '王强',
    role: 'PROPERTY_STAFF', status: true, communityIds: ['c1'], buildingIds: ['b1', 'b2'],
    unitIds: ['u101', 'u102', 'u201', 'u202'], houseIds: [],
    scope: 'BUILDING', scopeText: '阳光花园 1栋、2栋（4单元 × 72套）',
    communityName: '阳光花园小区', houseInfo: '1栋、2栋', houseCount: 0,
    createdAt: '2024-03-05', lastLoginAt: '2026-06-18 17:42',
  },
  {
    id: 'U00004', phone: '13800000004', nickname: '业委会-张主任', realName: '张桂芳',
    role: 'COMMITTEE', status: true, communityIds: ['c1'], buildingIds: [], unitIds: [], houseIds: [],
    scope: 'COMMUNITY', scopeText: '阳光花园（监督）',
    communityName: '阳光花园小区', houseInfo: '3栋2单元1802', houseCount: 1,
    createdAt: '2024-04-12', lastLoginAt: '2026-06-17 21:08',
  },
  {
    id: 'U00005', phone: '13800000005', nickname: '1栋-陈先生', realName: '陈先生',
    role: 'RESIDENT', status: true, communityIds: ['c1'], buildingIds: ['b1'], unitIds: ['u101'],
    houseIds: ['h10101', 'h10102'],
    scope: 'HOUSE', scopeText: '阳光花园 1栋1单元 101、102',
    communityName: '阳光花园小区', houseInfo: '1栋1单元101/102', houseCount: 2,
    createdAt: '2024-05-20', lastLoginAt: '2026-06-19 07:10',
  },
  {
    id: 'U00006', phone: '13800000006', nickname: '优家家政-刘总', realName: '刘振华',
    role: 'SERVICE_PROVIDER', status: true, communityIds: ['c1', 'c2'], buildingIds: [], unitIds: [], houseIds: [],
    scope: 'PROVIDER', scopeText: '服务商：优家家政（sp001）',
    communityName: '已入驻2个小区', houseInfo: '-', houseCount: 0, providerId: 'sp001',
    createdAt: '2024-06-01', lastLoginAt: '2026-06-18 22:33',
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const bIdx = (i % 6) + 1;
    const uIdx = (i % 2) + 1;
    const hIdx = (i % 18) + 1;
    return {
      id: `U${String(10 + i).padStart(5, '0')}`,
      phone: `138****${String(1010 + i)}`,
      nickname: `${bIdx}栋-${['陈', '王', '李', '赵', '孙', '周', '吴', '郑'][i % 8]}${['先生', '女士', '阿姨', '师傅'][i % 4]}`,
      realName: ['陈XX', '王XX', '李XX', '赵XX', '孙XX', '周XX'][i % 6],
      role: ['RESIDENT', 'RESIDENT', 'RESIDENT', 'RESIDENT', 'PROPERTY_STAFF', 'SERVICE_PROVIDER'][i % 6],
      status: i % 11 !== 10,
      communityIds: ['c1'],
      buildingIds: [`b${bIdx}`],
      unitIds: [`u${bIdx}0${uIdx}`],
      houseIds: [`h${bIdx}0${uIdx}${String(hIdx).padStart(2, '0')}`],
      scope: 'HOUSE',
      scopeText: `阳光花园 ${bIdx}栋${uIdx}单元 ${String(hIdx).padStart(2, '0')}室`,
      communityName: '阳光花园小区',
      houseInfo: `${bIdx}栋${uIdx}单元${String(hIdx).padStart(2, '0')}`,
      houseCount: 1,
      createdAt: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      lastLoginAt: `2026-06-${String(19 - (i % 15)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
    };
  }),
];

export default function UserList() {
  const { message } = App.useApp();
  const currentUser = useUserStore((s) => s.user);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const visibleUsers = ALL_USERS.filter((u) => {
    if (!currentUser) return true;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'PROPERTY_ADMIN') return u.communityIds?.some((c) => currentUser.communityIds?.includes(c));
    if (currentUser.role === 'COMMITTEE') return ['RESIDENT', 'COMMITTEE'].includes(u.role) && u.communityIds?.some((c) => currentUser.communityIds?.includes(c));
    if (currentUser.role === 'PROPERTY_STAFF') return ['RESIDENT', 'PROPERTY_STAFF'].includes(u.role) && u.buildingIds?.some((b) => currentUser.buildingIds?.includes(b));
    if (currentUser.role === 'RESIDENT') return u.id === currentUser.id;
    return false;
  });

  const canEdit = currentUser && ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(currentUser.role);

  const openDetail = (record: any) => {
    setCurrentRow(record);
    setDetailOpen(true);
  };

  const columns: any[] = [
    { title: '用户ID', dataIndex: 'id', width: 90 },
    {
      title: '用户信息',
      width: 200,
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 500, color: '#0F172A' }}>{r.nickname}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{r.phone} · {r.realName}</div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 130,
      render: (v: string) => {
        const info = roleMap[v] || { text: v, color: 'default', icon: HomeOutlined };
        const Icon = info.icon;
        return <Tag color={info.color} icon={<Icon style={{ fontSize: 11 }} />}>{info.text}</Tag>;
      },
    },
    {
      title: '数据范围（分级权限）',
      dataIndex: 'scopeText',
      width: 240,
      render: (v: string, r: any) => (
        <div>
          <Tag color="geekblue" style={{ marginBottom: 4 }}>{scopeMap[r.scope] || r.scope}</Tag>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{v}</div>
        </div>
      ),
    },
    { title: '所属小区', dataIndex: 'communityName', width: 130 },
    { title: '绑定房产', dataIndex: 'houseInfo', width: 150 },
    { title: '房产数', dataIndex: 'houseCount', width: 70, render: (v: number) => v ? `${v}套` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (val: boolean) => (
        <Switch
          size="small"
          checked={val}
          disabled={!canEdit}
          onChange={(checked) => message.success(checked ? '已启用该用户' : '已禁用该用户')}
        />
      ),
    },
    { title: '最后登录', dataIndex: 'lastLoginAt', width: 140 },
    {
      title: '操作',
      key: 'action',
      width: 230,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>详情</Button>
          {canEdit && (
            <>
              <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => { setCurrentRow(record); setAuthOpen(true); }}>授权</Button>
              <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
              <Popconfirm title="确认删除该用户？" onConfirm={() => message.success('删除成功')}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="用户管理"
        columns={columns}
        dataSource={visibleUsers}
        rowKey="id"
        search={{
          labelWidth: 90,
          searchText: '筛选',
          defaultCollapsed: false,
          optionRender: (searchConfig) => [searchConfig?.reset, searchConfig?.submit],
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位用户（仅显示当前登录身份可见范围）` }}
        scroll={{ x: 1500 }}
        toolBarRender={() => [
          <Tag key="scope" color="purple">
            登录身份：{USER_ROLES[currentUser?.role as keyof typeof USER_ROLES]?.name} · 已按分级权限过滤可见数据
          </Tag>,
          canEdit ? <Button key="add" type="primary">新增用户</Button> : null,
        ]}
      />

      <Drawer
        title="用户详情与权限范围"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {currentRow && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar size={56} style={{ backgroundColor: roleMap[currentRow.role]?.color || '#10B981' }}>
                {currentRow.nickname?.charAt(0)}
              </Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#0F172A' }}>{currentRow.nickname}</div>
                <div style={{ color: '#64748B' }}>{currentRow.phone} · {currentRow.realName}</div>
                <div style={{ marginTop: 4 }}>
                  <Tag color={roleMap[currentRow.role]?.color}>{roleMap[currentRow.role]?.text || currentRow.role}</Tag>
                  <Tag color="geekblue">权限级别：{scopeMap[currentRow.scope]}</Tag>
                  <Tag color={currentRow.status ? 'green' : 'default'}>{currentRow.status ? '已启用' : '已禁用'}</Tag>
                </div>
              </div>
            </div>

            <Descriptions title="基础信息" column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="用户ID">{currentRow.id}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentRow.phone}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{currentRow.createdAt}</Descriptions.Item>
              <Descriptions.Item label="最后登录">{currentRow.lastLoginAt}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="分级权限范围（核验：不同角色可看的数据边界）" column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="可访问小区">
                {currentRow.communityIds?.length ? currentRow.communityIds.map((c: string) => (
                  <Tag key={c} color="green">小区#{c}</Tag>
                )) : <span style={{ color: '#94A3B8' }}>未绑定</span>}
              </Descriptions.Item>
              <Descriptions.Item label="可访问楼栋">
                {currentRow.buildingIds?.length ? currentRow.buildingIds.map((b: string) => (
                  <Tag key={b} color="blue">{b.replace('b', '')}栋</Tag>
                )) : <span style={{ color: '#94A3B8' }}>- 无楼栋限制或未绑定 -</span>}
              </Descriptions.Item>
              <Descriptions.Item label="可访问单元">
                {currentRow.unitIds?.length ? currentRow.unitIds.map((u: string) => (
                  <Tag key={u} color="cyan">{u.replace(/u(\d)0(\d)/, '$1栋$2单元')}</Tag>
                )) : <span style={{ color: '#94A3B8' }}>- 无单元限制或未绑定 -</span>}
              </Descriptions.Item>
              <Descriptions.Item label="绑定房屋（可操作门禁）">
                {currentRow.houseIds?.length ? currentRow.houseIds.map((h: string) => (
                  <Tag key={h} color="purple">{h.replace(/h(\d)0(\d)(\d+)/, '$1栋$2单元$3室')}</Tag>
                )) : <span style={{ color: '#94A3B8' }}>无绑定房屋</span>}
              </Descriptions.Item>
              <Descriptions.Item label="其他范围">
                {currentRow.providerId ? <Tag color="orange">服务商ID: {currentRow.providerId}</Tag> : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="权限核验说明" column={1} size="small" bordered>
              <Descriptions.Item label="📌 可操作的工单">
                {currentRow.role === 'SUPER_ADMIN' && '所有工单可操作'}
                {currentRow.role === 'PROPERTY_ADMIN' && '所管小区下的全部工单'}
                {currentRow.role === 'PROPERTY_STAFF' && `分配给该员工的 + ${currentRow.buildingIds?.length || 0}栋楼栋内工单`}
                {currentRow.role === 'RESIDENT' && '仅本人提交的工单'}
                {currentRow.role === 'COMMITTEE' && '仅可查看投诉类工单'}
                {currentRow.role === 'SERVICE_PROVIDER' && '无权限（非业务范围）'}
              </Descriptions.Item>
              <Descriptions.Item label="📌 可看的门禁与通行">
                {currentRow.role === 'SUPER_ADMIN' && '所有设备 + 全部通行日志'}
                {currentRow.role === 'PROPERTY_ADMIN' && '所管小区下全部设备 + 全部日志'}
                {currentRow.role === 'PROPERTY_STAFF' && `${currentRow.buildingIds?.length || 0}栋楼栋内设备 + 对应日志`}
                {currentRow.role === 'RESIDENT' && '仅绑定房屋对应门禁设备（无日志）'}
                {currentRow.role === 'COMMITTEE' && '全部设备 + 全部日志（仅查看）'}
                {currentRow.role === 'SERVICE_PROVIDER' && '无权限'}
              </Descriptions.Item>
              <Descriptions.Item label="📌 可看的服务/订单/佣金">
                {currentRow.role === 'SUPER_ADMIN' && '所有服务商 + 所有商品 + 所有订单 + 所有佣金'}
                {currentRow.role === 'PROPERTY_ADMIN' && '所管小区下服务商/商品/订单 + 全部佣金'}
                {currentRow.role === 'SERVICE_PROVIDER' && `仅自己服务商（${currentRow.providerId || '-'}）的商品/订单/佣金`}
                {currentRow.role === 'RESIDENT' && '仅商品列表 + 本人订单'}
                {currentRow.role === 'COMMITTEE' && '仅可查看服务评分'}
                {currentRow.role === 'PROPERTY_STAFF' && '无权限'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      <ModalForm
        title={`门禁与数据范围授权 - ${currentRow?.nickname}`}
        open={authOpen}
        onOpenChange={setAuthOpen}
        onFinish={async () => {
          message.success('授权已更新，操作已留痕');
          return true;
        }}
      >
        <ProFormSelect label="授权小区" mode="multiple" options={[
          { label: '阳光花园小区', value: 'c1' },
          { label: '翠湖天地', value: 'c2' },
          { label: '金色家园', value: 'c3' },
        ]} />
        <ProFormSelect label="授权楼栋（空=无楼栋限制）" mode="multiple" options={[
          { label: '1栋', value: 'b1' }, { label: '2栋', value: 'b2' }, { label: '3栋', value: 'b3' },
          { label: '4栋', value: 'b4' }, { label: '5栋', value: 'b5' }, { label: '6栋', value: 'b6' },
        ]} />
        <ProFormSelect label="授权单元" mode="multiple" options={[
          { label: '1栋1单元', value: 'u101' }, { label: '1栋2单元', value: 'u102' },
          { label: '2栋1单元', value: 'u201' }, { label: '2栋2单元', value: 'u202' },
        ]} />
        <ProFormText label="绑定房号（逗号分隔）" placeholder="1-1-101, 1-1-102" />
        <ProFormCheckbox.Group label="门禁权限" options={[
          '小区大门', '1栋单元门', '2栋单元门', '车库入口', '电梯刷卡', '健身室',
        ]} />
      </ModalForm>
    </>
  );
}
