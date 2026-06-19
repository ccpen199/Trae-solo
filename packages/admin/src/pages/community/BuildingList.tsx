import { useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import {
  App, Popconfirm, Tag, Button, Space, Tree, Card, Drawer, Descriptions,
  Statistic, Row, Col, Progress, Empty, Typography,
} from 'antd';
import { useUserStore, USER_ROLES } from '@/store/user';

const { Title, Text } = Typography;

interface House {
  id: string;
  room: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  area: number;
  bindCount: number;
  status: '已入住' | '空置' | '出租';
}

interface Unit {
  id: string;
  name: string;
  deviceIds: string[];
  houses: House[];
}

interface Building {
  id: string;
  communityId: string;
  communityName: string;
  name: string;
  floorCount: number;
  units: Unit[];
  deviceCount: number;
  occupiedPct: number;
  createTime: string;
}

const BUILDINGS: Building[] = Array.from({ length: 6 }, (_, bIdx) => {
  const buildingIdx = bIdx + 1;
  const units: Unit[] = Array.from({ length: 2 }, (_, uIdx) => {
    const unitIdx = uIdx + 1;
    const houses: House[] = Array.from({ length: 18 }, (_, hIdx) => {
      const roomIdx = hIdx + 1;
      const statusArr: House['status'][] = ['已入住', '已入住', '已入住', '出租', '空置'];
      const status = statusArr[roomIdx % 5];
      return {
        id: `h${buildingIdx}0${unitIdx}${String(roomIdx).padStart(2, '0')}`,
        room: `${String(roomIdx).padStart(2, '0')}室`,
        ownerId: `U${String(100 + bIdx * 36 + uIdx * 18 + hIdx).padStart(5, '0')}`,
        ownerName: ['陈先生', '王女士', '李先生', '赵先生', '孙阿姨', '周师傅', '吴女士'][roomIdx % 7],
        ownerPhone: `138****${String(1000 + bIdx * 100 + uIdx * 50 + hIdx).padStart(4, '0')}`,
        area: [89, 92, 115, 128, 140][hIdx % 5],
        bindCount: status === '已入住' ? [1, 2, 3, 4][roomIdx % 4] : 0,
        status,
      };
    });
    return {
      id: `u${buildingIdx}0${unitIdx}`,
      name: `${unitIdx}单元`,
      deviceIds: [`D-${buildingIdx}${unitIdx}-A`, `D-${buildingIdx}${unitIdx}-B`],
      houses,
    };
  });
  const totalHouses = units.reduce((s, u) => s + u.houses.length, 0);
  const occupied = units.reduce((s, u) => s + u.houses.filter((h) => h.status !== '空置').length, 0);
  return {
    id: `b${buildingIdx}`,
    communityId: buildingIdx <= 3 ? 'c1' : 'c2',
    communityName: buildingIdx <= 3 ? '阳光花园小区' : '翠湖天地',
    name: `${buildingIdx}号楼`,
    floorCount: 18,
    units,
    deviceCount: units.reduce((s, u) => s + u.deviceIds.length, 0),
    occupiedPct: Math.round((occupied / totalHouses) * 100),
    createTime: `2024-0${(bIdx % 6) + 1}-01`,
  };
});

export default function BuildingList() {
  const { message } = App.useApp();
  const currentUser = useUserStore((s) => s.user);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(BUILDINGS[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailHouse, setDetailHouse] = useState<House | null>(null);

  const visibleBuildings = BUILDINGS.filter((b) => {
    if (!currentUser) return true;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.communityIds?.length) {
      if (!b.communityId || !currentUser.communityIds.includes(b.communityId)) return false;
    }
    if (currentUser.buildingIds?.length) {
      return currentUser.buildingIds.includes(b.id);
    }
    return true;
  });

  const visibleUnits = selectedBuilding?.units.filter((u) => {
    if (!currentUser) return true;
    if (['SUPER_ADMIN', 'PROPERTY_ADMIN', 'COMMITTEE'].includes(currentUser.role || '')) return true;
    if (currentUser.unitIds?.length) return currentUser.unitIds.includes(u.id);
    return true;
  }) || [];

  const canManage = currentUser && ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(currentUser.role);

  const treeData = visibleBuildings.map((b) => ({
    key: b.id,
    title: (
      <Space>
        <span style={{ fontWeight: 500 }}>{b.name}</span>
        <Tag color="green">{b.communityName}</Tag>
        <Tag color="blue">{b.deviceCount}台门禁</Tag>
        <Tag color="orange">入住率 {b.occupiedPct}%</Tag>
      </Space>
    ),
    children: b.units.map((u) => ({
      key: u.id,
      title: (
        <Space size={4}>
          <span>{u.name}</span>
          <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>{u.deviceIds.length}台设备</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{u.houses.length}户</Text>
        </Space>
      ),
      children: u.houses.map((h) => ({
        key: h.id,
        title: (
          <Space size={4} style={{ fontSize: 12 }}>
            <UserOutlined style={{ color: h.status === '空置' ? '#CBD5E1' : '#10B981' }} />
            <span>{h.room}</span>
            <Tag color={h.status === '已入住' ? 'green' : h.status === '出租' ? 'orange' : 'default'} style={{ fontSize: 10, margin: 0 }}>
              {h.status}
            </Tag>
            <Text type="secondary" style={{ fontSize: 10 }}>{h.ownerName} · {h.area}㎡</Text>
            <Button type="link" size="small" style={{ fontSize: 11, padding: 0, height: 'auto' }}
              onClick={(e) => { e.stopPropagation(); setDetailHouse(h); setDetailOpen(true); }}>
              <EyeOutlined /> 核验
            </Button>
          </Space>
        ),
      })),
    })),
  }));

  const stats = (() => {
    const totalB = visibleBuildings.length;
    const totalU = visibleBuildings.reduce((s, b) => s + b.units.length, 0);
    const totalH = visibleBuildings.reduce((s, b) => s + b.units.reduce((ss, u) => ss + u.houses.length, 0), 0);
    const totalD = visibleBuildings.reduce((s, b) => s + b.deviceCount, 0);
    const occ = visibleBuildings.length
      ? Math.round(visibleBuildings.reduce((s, b) => s + b.occupiedPct, 0) / visibleBuildings.length)
      : 0;
    return { totalB, totalU, totalH, totalD, occ };
  })();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
      <Card
        size="small"
        title={
          <Space>
            <span>楼栋 / 单元 / 房屋 树</span>
            <Tag color="purple">按当前角色分级可见：{USER_ROLES[currentUser?.role as keyof typeof USER_ROLES]?.name}</Tag>
          </Space>
        }
        style={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col span={12}><Statistic size="small" title="楼栋" value={stats.totalB} /></Col>
          <Col span={12}><Statistic size="small" title="单元" value={stats.totalU} /></Col>
          <Col span={12}><Statistic size="small" title="房屋" value={stats.totalH} /></Col>
          <Col span={12}><Statistic size="small" title="门禁设备" value={stats.totalD} /></Col>
        </Row>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <span>平均入住率</span><span>{stats.occ}%</span>
          </div>
          <Progress percent={stats.occ} showInfo={false} size="small" strokeColor="#10B981" />
        </div>
        <Tree
          showLine
          blockNode
          defaultExpandAll={false}
          expandedKeys={selectedBuilding ? [selectedBuilding.id, ...(selectedBuilding.units.map((u) => u.id))] : []}
          treeData={treeData}
          onSelect={(keys) => {
            const key = String(keys[0]);
            if (key.startsWith('b')) {
              setSelectedBuilding(BUILDINGS.find((b) => b.id === key) || null);
            }
          }}
        />
      </Card>

      <Card
        size="small"
        title={selectedBuilding ? (
          <Space>
            <Title level={5} style={{ margin: 0 }}>{selectedBuilding.name} · 房产与分级权限</Title>
            <Tag color="green">{selectedBuilding.communityName}</Tag>
            <Tag color="blue">{selectedBuilding.floorCount}层 / {selectedBuilding.deviceCount}台门禁</Tag>
            <Tag color="orange">入住率 {selectedBuilding.occupiedPct}%</Tag>
          </Space>
        ) : '请选择楼栋'}
        extra={
          <Space>
            {canManage && (
              <>
                <Button type="primary" icon={<PlusOutlined />} size="small">新增单元/房屋</Button>
                <Button icon={<EditOutlined />} size="small">编辑楼栋</Button>
              </>
            )}
          </Space>
        }
      >
        {!selectedBuilding ? <Empty description="请在左侧选择楼栋以查看详细" /> : (
          <div>
            <Row gutter={[12, 12]}>
              {visibleUnits.map((u) => {
                const occupied = u.houses.filter((h) => h.status !== '空置').length;
                return (
                  <Col xs={24} md={12} key={u.id}>
                    <Card
                      size="small"
                      type="inner"
                      title={
                        <Space>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          <Tag color="cyan">单元门禁: {u.deviceIds.join(', ')}</Tag>
                        </Space>
                      }
                      extra={<Tag color="green">{occupied}/{u.houses.length} 已入住</Tag>}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
                        {u.houses.map((h) => {
                          const isMine = currentUser?.houseIds?.includes(h.id);
                          return (
                            <div
                              key={h.id}
                              onClick={() => { setDetailHouse(h); setDetailOpen(true); }}
                              style={{
                                aspectRatio: '1 / 1',
                                borderRadius: 6,
                                background: h.status === '空置' ? '#F1F5F9'
                                  : h.status === '出租' ? '#FEF3C7'
                                    : isMine ? '#D1FAE5' : '#ECFDF5',
                                border: isMine ? '2px solid #10B981' : `1px solid ${h.status === '空置' ? '#E2E8F0' : '#BBF7D0'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: h.status === '空置' ? '#94A3B8' : '#166534',
                                fontWeight: 500,
                                transition: 'all .15s',
                              }}
                              title={`${h.room} ${h.ownerName} ${h.status} · 点击核验房产绑定`}
                            >
                              <div>{h.room.replace('室', '')}</div>
                              {isMine && <div style={{ fontSize: 9, color: '#059669' }}>★ 我家</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                        <Space size={4}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 2 }} />已入住</Space>
                        <Space size={4}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 2 }} />出租</Space>
                        <Space size={4}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 2 }} />空置</Space>
                        <Space size={4}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#D1FAE5', border: '2px solid #10B981', borderRadius: 2 }} />我绑定的房</Space>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div style={{ marginTop: 16, padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', fontSize: 12, color: '#166534' }}>
              <b>🔐 分级权限核验：</b> 登录身份「{USER_ROLES[currentUser?.role as keyof typeof USER_ROLES]?.name}」
              当前可见范围：
              {currentUser?.role === 'SUPER_ADMIN' && '全部小区 × 全部楼栋 × 全部房屋（全量管理）'}
              {currentUser?.role === 'PROPERTY_ADMIN' && `小区 ${currentUser.communityIds?.join(', ')} × 全部楼栋（物业总管）`}
              {currentUser?.role === 'PROPERTY_STAFF' && `仅 ${currentUser.buildingIds?.map((b) => b.replace('b', '') + '栋').join('、')} （维修师傅负责）`}
              {currentUser?.role === 'COMMITTEE' && '全部楼栋（业委会监督查看）'}
              {currentUser?.role === 'RESIDENT' && `仅高亮「★ 我家」标记的房屋：${currentUser.houseIds?.map((h) => h.replace(/h(\d)0(\d)(\d+)/, '$1栋$2单元$3室')).join('、') || '无绑定'}`}
              {currentUser?.role === 'SERVICE_PROVIDER' && '无权限（此菜单对服务商已在菜单层过滤，理论不可见）'}
            </div>
          </div>
        )}
      </Card>

      <Drawer
        title={`房屋绑定核验 · ${detailHouse?.id}`}
        width={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailHouse && (
          <div>
            <Descriptions title="房屋信息" column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="房屋编号">{detailHouse.id}</Descriptions.Item>
              <Descriptions.Item label="房号">{detailHouse.room}</Descriptions.Item>
              <Descriptions.Item label="所属楼栋">{selectedBuilding?.name}</Descriptions.Item>
              <Descriptions.Item label="面积">{detailHouse.area} ㎡</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={detailHouse.status === '已入住' ? 'green' : detailHouse.status === '出租' ? 'orange' : 'default'}>
                  {detailHouse.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="业主/住户 绑定关系（按房间分级授权）" column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="业主ID">{detailHouse.ownerId}</Descriptions.Item>
              <Descriptions.Item label="业主姓名">{detailHouse.ownerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailHouse.ownerPhone}</Descriptions.Item>
              <Descriptions.Item label="已绑定账户">
                {detailHouse.bindCount === 0 ? <Tag color="default">0 个（未入住）</Tag> : (
                  <>
                    <Tag color="green">业主（主账号）× 1</Tag>
                    {detailHouse.bindCount >= 2 && <Tag color="blue">家属 × 1</Tag>}
                    {detailHouse.bindCount >= 3 && <Tag color="cyan">租户 × 1</Tag>}
                    {detailHouse.bindCount >= 4 && <Tag color="purple">保姆/钟点工 × 1</Tag>}
                  </>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="已授权门禁点（根据楼栋和房间自动下发）">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Tag color="cyan">小区大门（必选）</Tag>
                  {selectedBuilding?.units
                    .filter((u) => u.houses.some((h) => h.id === detailHouse.id))
                    .flatMap((u) => u.deviceIds)
                    .map((d) => <Tag key={d} color="blue">单元门禁：{d}</Tag>)}
                  <Tag color="green">地库入口</Tag>
                  <Tag color="orange">电梯楼层权限：对应楼层</Tag>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Space>
              {canManage && (
                <>
                  <Button type="primary">调整绑定关系</Button>
                  <Button>查看历史操作</Button>
                  <Popconfirm title="确认解除绑定？" onConfirm={() => message.success('已解除该房屋与住户的绑定关系，操作已留痕')}>
                    <Button danger>解除房产绑定</Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
}
