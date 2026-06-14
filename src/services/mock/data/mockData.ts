import Mock from 'mockjs';
import type { UserInfo } from '../../../stores/useUserStore';
import type { RoutePermission, ButtonPermission } from '../../../stores/usePermissionStore';
import type { Place } from '../../api/place';
import type { VerificationRecord } from '../../api/verification';
import type { Reservation, ReservationConfig } from '../../api/reservation';
import type { Alarm } from '../../api/alarm';
import type { InspectionTask } from '../../api/inspection';
import type {
  OverviewData,
  VisitorTrendData,
  PlaceRankingData,
  RevenueData,
  RegionalDistributionData,
  DashboardOverview,
  MapHeatData,
  RealtimeAlarm,
  TrendData,
  RegionRankingItem,
  PlaceTypeItem,
} from '../../api/analytics';
import type { SystemUser, Role, OperationLog } from '../../api/system';

const Random = Mock.Random;

Random.extend({
  placeType: function () {
    const types = ['scenic', 'museum', 'library', 'theater', 'gym', 'other'];
    return this.pick(types);
  },
  placeTypeName: function (type: string) {
    const names: Record<string, string> = {
      scenic: '景区景点',
      museum: '博物馆',
      library: '图书馆',
      theater: '剧院剧场',
      gym: '体育场馆',
      other: '其他场所',
    };
    return names[type] || '其他场所';
  },
  placeStatus: function () {
    const statuses = ['pending', 'approved', 'rejected', 'suspended'];
    return this.pick(statuses);
  },
  placeStatusName: function (status: string) {
    const names: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      suspended: '已停用',
    };
    return names[status] || '未知';
  },
  shandongCity: function () {
    const cities = [
      '济南市', '青岛市', '淄博市', '枣庄市', '东营市',
      '烟台市', '潍坊市', '济宁市', '泰安市', '威海市',
      '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市',
    ];
    return this.pick(cities);
  },
  shandongDistrict: function (city: string) {
    const districts: Record<string, string[]> = {
      '济南市': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区', '莱芜区', '钢城区', '平阴县', '商河县'],
      '青岛市': ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区', '即墨区', '胶州市', '平度市', '莱西市'],
      '淄博市': ['张店区', '淄川区', '博山区', '临淄区', '周村区', '桓台县', '高青县', '沂源县'],
      '枣庄市': ['市中区', '薛城区', '峄城区', '台儿庄区', '山亭区', '滕州市'],
      '东营市': ['东营区', '河口区', '垦利区', '利津县', '广饶县'],
      '烟台市': ['芝罘区', '福山区', '牟平区', '莱山区', '蓬莱区', '龙口市', '莱阳市', '莱州市', '招远市', '栖霞市', '海阳市'],
      '潍坊市': ['潍城区', '寒亭区', '坊子区', '奎文区', '临朐县', '昌乐县', '青州市', '诸城市', '寿光市', '安丘市', '高密市', '昌邑市'],
      '济宁市': ['任城区', '兖州区', '微山县', '鱼台县', '金乡县', '嘉祥县', '汶上县', '泗水县', '梁山县', '曲阜市', '邹城市'],
      '泰安市': ['泰山区', '岱岳区', '宁阳县', '东平县', '新泰市', '肥城市'],
      '威海市': ['环翠区', '文登区', '荣成市', '乳山市'],
      '日照市': ['东港区', '岚山区', '五莲县', '莒县'],
      '临沂市': ['兰山区', '罗庄区', '河东区', '沂南县', '郯城县', '沂水县', '兰陵县', '费县', '平邑县', '莒南县', '蒙阴县', '临沭县'],
      '德州市': ['德城区', '陵城区', '宁津县', '庆云县', '临邑县', '齐河县', '平原县', '夏津县', '武城县', '乐陵市', '禹城市'],
      '聊城市': ['东昌府区', '茌平区', '阳谷县', '莘县', '东阿县', '冠县', '高唐县', '临清市'],
      '滨州市': ['滨城区', '沾化区', '惠民县', '阳信县', '无棣县', '博兴县', '邹平市'],
      '菏泽市': ['牡丹区', '定陶区', '曹县', '单县', '成武县', '巨野县', '郓城县', '鄄城县', '东明县'],
    };
    return this.pick(districts[city] || ['未知区县']);
  },
  alarmType: function () {
    const types = ['overcrowd', 'fire', 'intrusion', 'equipment', 'system', 'other'];
    return this.pick(types);
  },
  alarmTypeName: function (type: string) {
    const names: Record<string, string> = {
      overcrowd: '人员拥挤',
      fire: '消防安全',
      intrusion: '入侵检测',
      equipment: '设备异常',
      system: '系统告警',
      other: '其他告警',
    };
    return names[type] || '其他告警';
  },
  alarmLevel: function () {
    const levels = ['low', 'medium', 'high', 'critical'];
    return this.pick(levels);
  },
  alarmLevelName: function (level: string) {
    const names: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    };
    return names[level] || '未知';
  },
  alarmStatus: function () {
    const statuses = ['pending', 'processing', 'resolved', 'ignored'];
    return this.pick(statuses);
  },
  alarmStatusName: function (status: string) {
    const names: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      ignored: '已忽略',
    };
    return names[status] || '未知';
  },
  inspectionType: function () {
    const types = ['routine', 'special', 'complaint', 'emergency'];
    return this.pick(types);
  },
  inspectionTypeName: function (type: string) {
    const names: Record<string, string> = {
      routine: '日常巡检',
      special: '专项检查',
      complaint: '投诉核查',
      emergency: '应急检查',
    };
    return names[type] || '其他';
  },
  inspectionPriority: function () {
    const priorities = ['low', 'medium', 'high'];
    return this.pick(priorities);
  },
  inspectionPriorityName: function (priority: string) {
    const names: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    };
    return names[priority] || '中';
  },
  inspectionStatus: function () {
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    return this.pick(statuses);
  },
  inspectionStatusName: function (status: string) {
    const names: Record<string, string> = {
      pending: '待执行',
      in_progress: '执行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return names[status] || '未知';
  },
  verificationType: function () {
    const types = ['id_card', 'face', 'ticket'];
    return this.pick(types);
  },
  verificationTypeName: function (type: string) {
    const names: Record<string, string> = {
      id_card: '身份证核验',
      face: '人脸核验',
      ticket: '门票核验',
    };
    return names[type] || '其他核验';
  },
  verificationStatus: function () {
    const statuses = ['success', 'failed', 'pending'];
    return this.pick(statuses);
  },
  verificationStatusName: function (status: string) {
    const names: Record<string, string> = {
      success: '核验成功',
      failed: '核验失败',
      pending: '核验中',
    };
    return names[status] || '未知';
  },
  reservationStatus: function () {
    const statuses = ['pending', 'confirmed', 'cancelled', 'used', 'expired'];
    return this.pick(statuses);
  },
  reservationStatusName: function (status: string) {
    const names: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      used: '已使用',
      expired: '已过期',
    };
    return names[status] || '未知';
  },
  timeSlot: function () {
    const slots = [
      '08:00-10:00', '10:00-12:00', '12:00-14:00',
      '14:00-16:00', '16:00-18:00', '18:00-20:00',
    ];
    return this.pick(slots);
  },
});

export const mockUserInfo: UserInfo = {
  id: '1',
  username: 'admin',
  realName: '系统管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  phone: '13800138000',
  email: 'admin@shandong.gov.cn',
  department: '山东省文化和旅游厅',
  role: '超级管理员',
  roleId: '1',
  permissions: ['*'],
};

export const mockRoutes: RoutePermission[] = [
  {
    path: '/dashboard',
    name: '数据概览',
    icon: 'DashboardOutlined',
  },
  {
    path: '/place',
    name: '场所管理',
    icon: 'ShopOutlined',
    children: [
      { path: '/place/list', name: '场所列表' },
      { path: '/place/review', name: '审核管理' },
    ],
  },
  {
    path: '/reservation',
    name: '预约管理',
    icon: 'CalendarOutlined',
    children: [
      { path: '/reservation/list', name: '预约列表' },
      { path: '/reservation/config', name: '预约配置' },
    ],
  },
  {
    path: '/verification',
    name: '核验管理',
    icon: 'QrcodeOutlined',
    children: [
      { path: '/verification/list', name: '核验记录' },
      { path: '/verification/realname', name: '实名核验' },
    ],
  },
  {
    path: '/alarm',
    name: '告警管理',
    icon: 'BellOutlined',
    children: [
      { path: '/alarm/list', name: '告警列表' },
      { path: '/alarm/detail', name: '告警详情', hidden: true },
    ],
  },
  {
    path: '/inspection',
    name: '巡检管理',
    icon: 'ClipboardListOutlined',
    children: [
      { path: '/inspection/list', name: '任务列表' },
      { path: '/inspection/create', name: '创建任务' },
    ],
  },
  {
    path: '/analytics',
    name: '数据分析',
    icon: 'BarChartOutlined',
    children: [
      { path: '/analytics/overview', name: '经营数据' },
      { path: '/analytics/reports', name: '统计报表' },
    ],
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'SettingOutlined',
    children: [
      { path: '/system/users', name: '用户管理' },
      { path: '/system/roles', name: '角色权限' },
      { path: '/system/logs', name: '日志审计' },
    ],
  },
];

export const mockButtons: ButtonPermission[] = [
  { key: 'place:add', name: '新增场所' },
  { key: 'place:edit', name: '编辑场所' },
  { key: 'place:delete', name: '删除场所' },
  { key: 'place:review', name: '审核场所' },
  { key: 'place:export', name: '导出场所' },
  { key: 'reservation:verify', name: '核销预约' },
  { key: 'reservation:cancel', name: '取消预约' },
  { key: 'alarm:handle', name: '处理告警' },
  { key: 'alarm:ignore', name: '忽略告警' },
  { key: 'inspection:create', name: '创建任务' },
  { key: 'inspection:execute', name: '执行任务' },
  { key: 'inspection:cancel', name: '取消任务' },
  { key: 'system:user:add', name: '新增用户' },
  { key: 'system:user:edit', name: '编辑用户' },
  { key: 'system:user:delete', name: '删除用户' },
  { key: 'system:role:add', name: '新增角色' },
  { key: 'system:role:edit', name: '编辑角色' },
  { key: 'system:role:delete', name: '删除角色' },
];

const placeNames = [
  '泰山风景名胜区', '曲阜三孔景区', '崂山风景区', '蓬莱阁景区', '刘公岛景区',
  '南山旅游景区', '沂蒙山旅游区', '台儿庄古城景区', '天下第一泉景区', '龙口南山景区',
  '山东省博物馆', '济南市博物馆', '青岛市博物馆', '淄博市博物馆', '潍坊市博物馆',
  '山东省图书馆', '济南市图书馆', '青岛市图书馆', '烟台市图书馆', '临沂市图书馆',
  '山东大剧院', '青岛大剧院', '济南省会大剧院', '烟台大剧院', '潍坊大剧院',
  '山东省体育中心', '青岛国信体育场', '济南奥体中心', '烟台体育公园', '临沂体育场',
];

export const generateMockPlaces = (count: number): Place[] => {
  return Mock.mock({
    [`list|${count}`]: [
      {
        'id|+1': 1,
        name: () => Random.pick(placeNames),
        type: () => Random.placeType(),
        typeName: function () {
          return Random.placeTypeName(this.type);
        },
        address: '@ctitle(10, 30)',
        province: '山东省',
        city: () => Random.shandongCity(),
        district: function () {
          return Random.shandongDistrict(this.city);
        },
        contact: '@cname',
        phone: /^1[3-9]\d{9}$/,
        businessHours: '08:00-18:00',
        description: '@ctitle(20, 100)',
        images: () => [
          `https://picsum.photos/400/300?random=${Random.integer(1, 1000)}`,
          `https://picsum.photos/400/300?random=${Random.integer(1, 1000)}`,
        ],
        'capacity|100-10000': 1,
        'currentCount|0-5000': 1,
        status: () => Random.placeStatus(),
        statusName: function () {
          return Random.placeStatusName(this.status);
        },
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        updatedAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        approvedAt: function () {
          return this.status === 'approved' ? Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined;
        },
        approvedBy: function () {
          return this.status === 'approved' ? '@cname' : undefined;
        },
        rejectReason: function () {
          return this.status === 'rejected' ? '@ctitle(10, 30)' : undefined;
        },
        longitude: () => Random.float(114.8, 122.7, 6, 6),
        latitude: () => Random.float(34.4, 38.4, 6, 6),
      },
    ],
  }).list;
};

export const mockPlaces: Place[] = generateMockPlaces(50);

export const generateMockVerifications = (count: number, places: Place[]): VerificationRecord[] => {
  return Mock.mock({
    [`list|${count}`]: [
      {
        id: () => Random.guid(),
        placeId: () => Random.pick(places).id,
        placeName: function () {
          const place = places.find((p) => p.id === this.placeId);
          return place?.name || '未知场所';
        },
        type: () => Random.verificationType(),
        typeName: function () {
          return Random.verificationTypeName(this.type);
        },
        name: '@cname',
        idCard: () => Random.id(),
        phone: /^1[3-9]\d{9}$/,
        status: () => Random.verificationStatus(),
        statusName: function () {
          return Random.verificationStatusName(this.status);
        },
        verifyTime: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        operator: '@cname',
        remark: () => (Random.boolean() ? '@ctitle(5, 20)' : undefined),
      },
    ],
  }).list;
};

export const mockVerifications: VerificationRecord[] = generateMockVerifications(100, mockPlaces);

export const generateMockReservations = (count: number, places: Place[]): Reservation[] => {
  return Mock.mock({
    [`list|${count}`]: [
      {
        id: () => Random.guid(),
        orderNo: () => 'RES' + Random.datetime('yyyyMMddHHmmss') + Random.integer(1000, 9999),
        placeId: () => Random.pick(places).id,
        placeName: function () {
          const place = places.find((p) => p.id === this.placeId);
          return place?.name || '未知场所';
        },
        visitorName: '@cname',
        visitorPhone: /^1[3-9]\d{9}$/,
        visitorIdCard: () => Random.id(),
        'visitorCount|1-10': 1,
        visitDate: () => Random.date('yyyy-MM-dd'),
        visitTimeSlot: () => Random.timeSlot(),
        status: () => Random.reservationStatus(),
        statusName: function () {
          return Random.reservationStatusName(this.status);
        },
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        confirmedAt: function () {
          return this.status === 'confirmed' || this.status === 'used'
            ? Random.datetime('yyyy-MM-dd HH:mm:ss')
            : undefined;
        },
        usedAt: function () {
          return this.status === 'used' ? Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined;
        },
        cancelledAt: function () {
          return this.status === 'cancelled' ? Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined;
        },
        cancelReason: function () {
          return this.status === 'cancelled' ? '@ctitle(10, 30)' : undefined;
        },
        remark: () => (Random.boolean() ? '@ctitle(5, 20)' : undefined),
      },
    ],
  }).list;
};

export const mockReservations: Reservation[] = generateMockReservations(80, mockPlaces);

export const generateMockReservationConfig = (place: Place): ReservationConfig => {
  return {
    id: Random.guid(),
    placeId: place.id,
    placeName: place.name,
    maxDailyCapacity: Random.integer(500, 5000),
    maxPerReservation: Random.integer(5, 20),
    minAdvanceDays: Random.integer(0, 3),
    maxAdvanceDays: Random.integer(7, 30),
    timeSlots: [
      '08:00-10:00', '10:00-12:00', '12:00-14:00',
      '14:00-16:00', '16:00-18:00',
    ],
    enabled: Random.boolean(),
    createdAt: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updatedAt: Random.datetime('yyyy-MM-dd HH:mm:ss'),
  };
};

export const generateMockAlarms = (count: number, places: Place[]): Alarm[] => {
  const titles = {
    overcrowd: ['游客数量超过承载上限', '区域人员密度过高', '入口处出现拥挤'],
    fire: ['烟雾探测器报警', '温度异常升高', '消防通道被占用'],
    intrusion: ['周界入侵检测报警', '监控区域异常移动', '门禁系统异常开启'],
    equipment: ['监控设备离线', '门禁系统故障', '报警按钮触发'],
    system: ['网络连接中断', '服务器CPU使用率过高', '数据库连接异常'],
    other: ['异常情况需要核实', '游客投诉需处理', '设备状态异常'],
  };

  return Mock.mock({
    [`list|${count}`]: [
      {
        id: () => Random.guid(),
        alarmNo: () => 'ALM' + Random.datetime('yyyyMMddHHmmss') + Random.integer(100, 999),
        placeId: () => Random.pick(places).id,
        placeName: function () {
          const place = places.find((p) => p.id === this.placeId);
          return place?.name || '未知场所';
        },
        type: () => Random.alarmType(),
        typeName: function () {
          return Random.alarmTypeName(this.type);
        },
        level: () => Random.alarmLevel(),
        levelName: function () {
          return Random.alarmLevelName(this.level);
        },
        title: function () {
          return Random.pick(titles[this.type as keyof typeof titles] || titles.other);
        },
        description: '@ctitle(20, 50)',
        location: '@ctitle(5, 15)',
        images: () => [
          `https://picsum.photos/300/200?random=${Random.integer(1, 1000)}`,
        ],
        status: () => Random.alarmStatus(),
        statusName: function () {
          return Random.alarmStatusName(this.status);
        },
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        startedAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        handledAt: function () {
          return this.status !== 'pending' ? Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined;
        },
        handler: function () {
          return this.status !== 'pending' ? '@cname' : undefined;
        },
        handleMethod: function () {
          return this.status !== 'pending' ? '@ctitle(10, 30)' : undefined;
        },
        handleResult: function () {
          return this.status !== 'pending' ? '@ctitle(10, 50)' : undefined;
        },
        handleDuration: function () {
          return this.status !== 'pending' ? Random.integer(5, 300) : undefined;
        },
      },
    ],
  }).list;
};

export const mockAlarms: Alarm[] = generateMockAlarms(60, mockPlaces);

export const generateMockInspections = (count: number, places: Place[]): InspectionTask[] => {
  const categories = ['消防安全', '环境卫生', '设施设备', '服务质量', '应急预案'];
  const itemNames = [
    '消防通道是否畅通', '灭火器是否有效', '监控设备是否正常',
    '卫生清洁是否到位', '标识标牌是否完整', '应急预案是否完善',
    '工作人员是否持证上岗', '安全出口是否畅通', '应急照明是否正常',
  ];

  return Mock.mock({
    [`list|${count}`]: [
      {
        id: () => Random.guid(),
        taskNo: () => 'INSP' + Random.datetime('yyyyMMddHHmmss') + Random.integer(100, 999),
        title: '@ctitle(10, 20)',
        type: () => Random.inspectionType(),
        typeName: function () {
          return Random.inspectionTypeName(this.type);
        },
        priority: () => Random.inspectionPriority(),
        priorityName: function () {
          return Random.inspectionPriorityName(this.priority);
        },
        placeId: () => Random.pick(places).id,
        placeName: function () {
          const place = places.find((p) => p.id === this.placeId);
          return place?.name || '未知场所';
        },
        inspector: '@cname',
        inspectorId: () => Random.integer(1, 20).toString(),
        status: () => Random.inspectionStatus(),
        statusName: function () {
          return Random.inspectionStatusName(this.status);
        },
        description: '@ctitle(20, 50)',
        checkItems: () =>
          Mock.mock({
            [`list|${Random.integer(3, 8)}`]: [
              {
                id: () => Random.guid(),
                name: () => Random.pick(itemNames),
                category: () => Random.pick(categories),
                status: function () {
                  return this.status === 'completed'
                    ? Random.pick(['pass', 'fail', 'na'])
                    : 'na';
                },
                remark: () => (Random.boolean() ? '@ctitle(5, 20)' : undefined),
                images: () =>
                  Random.boolean()
                    ? [`https://picsum.photos/200/150?random=${Random.integer(1, 1000)}`]
                    : [],
              },
            ],
          }).list,
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        startTime: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        deadline: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        completedAt: function () {
          return this.status === 'completed' ? Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined;
        },
        result: function () {
          return this.status === 'completed' ? '@ctitle(20, 50)' : undefined;
        },
        score: function () {
          return this.status === 'completed' ? Random.integer(60, 100) : undefined;
        },
        remark: () => (Random.boolean() ? '@ctitle(10, 30)' : undefined),
      },
    ],
  }).list;
};

export const mockInspections: InspectionTask[] = generateMockInspections(40, mockPlaces);

export const mockOverview: OverviewData = {
  totalPlaces: mockPlaces.length,
  totalVisitors: Random.integer(100000, 500000),
  totalRevenue: Random.integer(5000000, 20000000),
  totalReservations: mockReservations.length,
  totalVerifications: mockVerifications.length,
  totalAlarms: mockAlarms.length,
  totalInspections: mockInspections.length,
  todayVisitors: Random.integer(1000, 5000),
  todayRevenue: Random.integer(50000, 200000),
  todayReservations: Random.integer(50, 200),
  pendingAlarms: mockAlarms.filter((a) => a.status === 'pending').length,
  pendingInspections: mockInspections.filter((i) => i.status === 'pending').length,
};

export const generateMockVisitorTrend = (days: number): VisitorTrendData[] => {
  const data: VisitorTrendData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      visitorCount: Random.integer(500, 5000),
      reservationCount: Random.integer(50, 300),
    });
  }
  return data;
};

export const mockVisitorTrend: VisitorTrendData[] = generateMockVisitorTrend(30);

export const generateMockPlaceRanking = (count: number, places: Place[]): PlaceRankingData[] => {
  return places.slice(0, count).map((place) => ({
    placeId: place.id,
    placeName: place.name,
    visitorCount: Random.integer(1000, 50000),
    revenue: Random.integer(100000, 5000000),
    growthRate: Random.float(-20, 50, 2, 2),
  }));
};

export const mockPlaceRanking: PlaceRankingData[] = generateMockPlaceRanking(10, mockPlaces);

export const generateMockRevenueData = (months: number): RevenueData[] => {
  const data: RevenueData[] = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    data.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      ticketRevenue: Random.integer(100000, 1000000),
      merchandiseRevenue: Random.integer(50000, 500000),
      cateringRevenue: Random.integer(30000, 300000),
      otherRevenue: Random.integer(10000, 100000),
    });
  }
  return data;
};

export const mockRevenueData: RevenueData[] = generateMockRevenueData(12);

export const generateMockRegionalDistribution = (): RegionalDistributionData[] => {
  const cities = [
    '济南市', '青岛市', '淄博市', '枣庄市', '东营市',
    '烟台市', '潍坊市', '济宁市', '泰安市', '威海市',
    '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市',
  ];
  return cities.map((city) => ({
    city,
    placeCount: Random.integer(5, 50),
    visitorCount: Random.integer(10000, 200000),
    revenue: Random.integer(500000, 10000000),
  }));
};

export const mockRegionalDistribution: RegionalDistributionData[] = generateMockRegionalDistribution();

export const generateMockSystemUsers = (count: number): SystemUser[] => {
  const departments = [
    '办公室', '政策法规处', '规划发展处', '财务处', '人事处',
    '市场推广处', '资源开发处', '行业管理处', '市场管理处', '科技教育处',
  ];
  const roles = [
    { id: '1', name: '超级管理员' },
    { id: '2', name: '系统管理员' },
    { id: '3', name: '审核员' },
    { id: '4', name: '巡检员' },
    { id: '5', name: '数据分析员' },
  ];

  return Mock.mock({
    [`list|${count}`]: [
      {
        'id|+1': 1,
        username: () => Random.word(5, 12),
        realName: '@cname',
        avatar: () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${Random.word()}`,
        phone: /^1[3-9]\d{9}$/,
        email: () => `${Random.word(5, 10)}@shandong.gov.cn`,
        department: () => Random.pick(departments),
        roleId: function () {
          return Random.pick(roles).id;
        },
        roleName: function () {
          const role = roles.find((r) => r.id === this.roleId);
          return role?.name || '普通用户';
        },
        status: () => (Math.random() > 0.1 ? 'active' : 'disabled'),
        statusName: function () {
          return this.status === 'active' ? '正常' : '禁用';
        },
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
        lastLoginAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
      },
    ],
  }).list;
};

export const mockSystemUsers: SystemUser[] = generateMockSystemUsers(30);

export const mockRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限',
    permissions: ['*'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: '2',
    name: '系统管理员',
    code: 'admin',
    description: '管理用户和角色权限',
    permissions: ['system:*', 'place:*', 'alarm:*', 'inspection:*'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: '3',
    name: '审核员',
    code: 'reviewer',
    description: '负责场所审核工作',
    permissions: ['place:review', 'place:list', 'place:detail'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: '4',
    name: '巡检员',
    code: 'inspector',
    description: '负责现场巡检工作',
    permissions: ['inspection:*', 'place:list', 'place:detail', 'alarm:handle'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: '5',
    name: '数据分析员',
    code: 'analyst',
    description: '负责数据分析和报表生成',
    permissions: ['analytics:*', 'place:list', 'place:detail'],
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
];

const modules = [
  '认证模块', '场所管理', '预约管理', '核验管理', '告警管理',
  '巡检管理', '数据分析', '用户管理', '角色管理', '日志管理',
];
const operations = [
  '登录系统', '退出登录', '查询列表', '查看详情', '新增数据',
  '编辑数据', '删除数据', '审核通过', '审核拒绝', '导出数据',
  '处理告警', '执行巡检', '生成报表', '重置密码', '分配权限',
];

export const generateMockOperationLogs = (count: number, users: SystemUser[]): OperationLog[] => {
  return Mock.mock({
    [`list|${count}`]: [
      {
        id: () => Random.guid(),
        userId: function () {
          return Random.pick(users).id;
        },
        username: function () {
          const user = users.find((u) => u.id === this.userId);
          return user?.username || 'unknown';
        },
        realName: function () {
          const user = users.find((u) => u.id === this.userId);
          return user?.realName || '未知用户';
        },
        operation: () => Random.pick(operations),
        module: () => Random.pick(modules),
        method: () => Random.pick(['GET', 'POST', 'PUT', 'DELETE']),
        params: () => JSON.stringify({ id: Random.integer(1, 100) }),
        ip: () => Random.ip(),
        location: () => `${Random.shandongCity()} ${Random.shandongDistrict(Random.shandongCity())}`,
        userAgent: () => Random.pick([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        ]),
        status: () => (Math.random() > 0.05 ? 'success' : 'failed'),
        'duration|10-5000': 1,
        createdAt: () => Random.datetime('yyyy-MM-dd HH:mm:ss'),
      },
    ],
  }).list;
};

export const mockOperationLogs: OperationLog[] = generateMockOperationLogs(200, mockSystemUsers);

export const successResponse = <T>(data: T, message = '操作成功') => ({
  code: 200,
  message,
  data,
  timestamp: Date.now(),
});

export const errorResponse = (code: number, message: string) => ({
  code,
  message,
  data: null,
  timestamp: Date.now(),
});

export const mockDashboardOverview: DashboardOverview = {
  totalPlaces: 12580,
  onlinePlaces: 11896,
  todayVisitors: 358642,
  pendingAlarms: 128,
  inspectionCompletionRate: 94.5,
  placeCountTrend: 12.5,
  onlineRateTrend: 3.2,
  visitorTrend: 8.7,
  alarmTrend: -5.3,
  inspectionTrend: 2.1,
};

const shandongCityCodes = [
  { code: '370100', name: '济南市' },
  { code: '370200', name: '青岛市' },
  { code: '370300', name: '淄博市' },
  { code: '370400', name: '枣庄市' },
  { code: '370500', name: '东营市' },
  { code: '370600', name: '烟台市' },
  { code: '370700', name: '潍坊市' },
  { code: '370800', name: '济宁市' },
  { code: '370900', name: '泰安市' },
  { code: '371000', name: '威海市' },
  { code: '371100', name: '日照市' },
  { code: '371300', name: '临沂市' },
  { code: '371400', name: '德州市' },
  { code: '371500', name: '聊城市' },
  { code: '371600', name: '滨州市' },
  { code: '371700', name: '菏泽市' },
];

export const generateMockMapHeatData = (regionCode?: string, level?: string): MapHeatData[] => {
  if (!regionCode || regionCode === '370000') {
    return shandongCityCodes.map((city) => {
      const placeCount = Random.integer(300, 1500);
      const onlineCount = Math.floor(placeCount * Random.float(0.85, 0.98));
      return {
        name: city.name,
        code: city.code,
        value: Random.integer(50, 100),
        placeCount,
        onlineCount,
        visitorCount: Random.integer(10000, 80000),
        alarmCount: Random.integer(5, 50),
        level: 'city',
      };
    });
  }

  const city = shandongCityCodes.find((c) => c.code === regionCode);
  if (city) {
    const districts = [
      '历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区', '莱芜区', '钢城区', '平阴县', '商河县',
    ];
    return districts.slice(0, Random.integer(6, 10)).map((district, index) => {
      const placeCount = Random.integer(50, 300);
      const onlineCount = Math.floor(placeCount * Random.float(0.85, 0.98));
      return {
        name: district,
        code: `${regionCode}${String(index + 1).padStart(2, '0')}`,
        value: Random.integer(30, 100),
        placeCount,
        onlineCount,
        visitorCount: Random.integer(1000, 20000),
        alarmCount: Random.integer(1, 15),
        level: 'district',
      };
    });
  }

  return [];
};

export const mockMapHeatData: MapHeatData[] = generateMockMapHeatData();

const alarmLevelMap: Record<string, { level: RealtimeAlarm['level']; levelName: string }> = {
  critical: { level: 'critical', levelName: '紧急' },
  major: { level: 'major', levelName: '重大' },
  minor: { level: 'minor', levelName: '一般' },
  warning: { level: 'warning', levelName: '警告' },
  info: { level: 'info', levelName: '提示' },
};

const alarmTypeNames: Record<string, string> = {
  overcrowd: '人员拥挤',
  fire: '消防安全',
  intrusion: '入侵检测',
  equipment: '设备异常',
  system: '系统告警',
  other: '其他告警',
};

export const generateMockRealtimeAlarms = (limit: number = 10): RealtimeAlarm[] => {
  const alarmContents = [
    '游客数量已达承载上限90%',
    '监控区域检测到异常烟雾',
    '消防通道被占用，请立即处理',
    '门禁系统检测到非法闯入',
    '3号监控摄像头离线',
    '服务器CPU使用率超过85%',
    '网络连接中断，请检查网络',
    '游客投诉服务态度问题',
    '停车场车位已满',
    '检票口设备故障',
    '应急照明系统测试告警',
    '广播系统音量异常',
  ];

  const levels = Object.keys(alarmLevelMap);
  const types = Object.keys(alarmTypeNames);

  const alarms: RealtimeAlarm[] = [];
  for (let i = 0; i < limit; i++) {
    const levelKey = levels[Random.integer(0, levels.length - 1)];
    const typeKey = types[Random.integer(0, types.length - 1)];
    const place = Random.pick(mockPlaces);
    const date = new Date();
    date.setMinutes(date.getMinutes() - Random.integer(0, 60));

    alarms.push({
      id: Random.guid(),
      placeName: place?.name || '未知场所',
      alarmType: alarmTypeNames[typeKey],
      level: alarmLevelMap[levelKey].level,
      levelName: alarmLevelMap[levelKey].levelName,
      content: alarmContents[Random.integer(0, alarmContents.length - 1)],
      time: date.toLocaleString('zh-CN', { hour12: false }),
      status: Random.pick(['pending', 'processing', 'resolved']),
    });
  }

  return alarms.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const mockRealtimeAlarms: RealtimeAlarm[] = generateMockRealtimeAlarms(10);

export const generateMockTrendData = (days: number = 7): TrendData[] => {
  const data: TrendData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      visitorCount: Random.integer(200000, 500000),
      alarmCount: Random.integer(50, 200),
      placeActivity: Random.integer(70, 100),
    });
  }
  return data;
};

export const mockTrendData: TrendData[] = generateMockTrendData(7);

export const generateMockRegionRanking = (limit: number = 10): RegionRankingItem[] => {
  return shandongCityCodes
    .map((city) => ({
      regionName: city.name,
      regionCode: city.code,
      placeCount: Random.integer(300, 1500),
      alarmCount: Random.integer(10, 100),
      onlineRate: Random.float(85, 99, 1, 1),
    }))
    .sort((a, b) => b.placeCount - a.placeCount)
    .slice(0, limit);
};

export const mockRegionRanking: RegionRankingItem[] = generateMockRegionRanking(10);

export const generateMockPlaceTypeDistribution = (): PlaceTypeItem[] => {
  const placeTypes = [
    { type: 'internet_bar', typeName: '网吧', baseCount: 3500 },
    { type: 'game_hall', typeName: '游戏厅', baseCount: 1800 },
    { type: 'ktv', typeName: 'KTV', baseCount: 2200 },
    { type: 'scenic', typeName: '景区景点', baseCount: 1500 },
    { type: 'museum', typeName: '博物馆', baseCount: 800 },
    { type: 'library', typeName: '图书馆', baseCount: 600 },
    { type: 'theater', typeName: '剧院剧场', baseCount: 500 },
    { type: 'gym', typeName: '体育场馆', baseCount: 900 },
    { type: 'hotel', typeName: '酒店住宿', baseCount: 1200 },
    { type: 'other', typeName: '其他场所', baseCount: 400 },
  ];

  const total = placeTypes.reduce((sum, t) => sum + t.baseCount, 0);

  return placeTypes.map((t) => ({
    type: t.type,
    typeName: t.typeName,
    count: Math.floor(t.baseCount * Random.float(0.9, 1.1)),
    percentage: Number(((t.baseCount / total) * 100).toFixed(1)),
  }));
};

export const mockPlaceTypeDistribution: PlaceTypeItem[] = generateMockPlaceTypeDistribution();

export const generateMockHourlyDistribution = (date?: string): { hour: number; count: number }[] => {
  const pattern = [0, 0, 0, 0, 0, 0, 5, 30, 120, 280, 350, 400, 380, 320, 350, 420, 480, 500, 450, 380, 260, 150, 60, 15];
  return pattern.map((base, hour) => ({
    hour,
    count: Math.floor(base * (0.8 + Math.random() * 0.4)),
  }));
};

export const generateMockDurationSegments = (): { segment: string; label: string; count: number; percentage: number }[] => {
  const raw = [
    { segment: '<1h', label: '1小时以内', base: 1200 },
    { segment: '1-2h', label: '1-2小时', base: 3500 },
    { segment: '2-4h', label: '2-4小时', base: 5200 },
    { segment: '4-6h', label: '4-6小时', base: 2800 },
    { segment: '>6h', label: '6小时以上', base: 800 },
  ];
  const items = raw.map((r) => ({ ...r, count: Math.floor(r.base * (0.85 + Math.random() * 0.3)) }));
  const total = items.reduce((s, i) => s + i.count, 0);
  return items.map((i) => ({ ...i, percentage: Number(((i.count / total) * 100).toFixed(1)) }));
};

export const generateMockDurationByHour = (): { hour: number; avgDuration: number; maxDuration: number; minDuration: number }[] => {
  return Array.from({ length: 24 }, (_, hour) => {
    const isActive = hour >= 7 && hour <= 22;
    return {
      hour,
      avgDuration: isActive ? Math.floor(30 + Math.random() * 150) : Math.floor(Math.random() * 20),
      maxDuration: isActive ? Math.floor(180 + Math.random() * 240) : Math.floor(Math.random() * 30),
      minDuration: isActive ? Math.floor(5 + Math.random() * 20) : 0,
    };
  });
};

export const generateMockPersonnelDetail = (hour: number): { name: string; idCard: string; duration: number; placeName: string; entryTime: string }[] => {
  const count = Math.floor(Math.random() * 10) + 3;
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '吴', '周'];
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '洋', '勇'];
  return Array.from({ length: count }, (_, i) => ({
    name: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
    idCard: `3701${String(1990 + Math.floor(Math.random() * 15)).slice(2)}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    duration: Math.floor(15 + Math.random() * 300),
    placeName: Random.pick(placeNames),
    entryTime: `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  }));
};

export const generateMockCityDrillDown = (cityCode: string): { districtName: string; districtCode: string; placeCount: number; visitorCount: number; avgDuration: number }[] => {
  const cityDistricts: Record<string, string[]> = {
    '370100': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区', '莱芜区', '钢城区'],
    '370200': ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区', '即墨区', '胶州市', '平度市', '莱西市'],
    '370300': ['张店区', '淄川区', '博山区', '临淄区', '周村区', '桓台县', '高青县', '沂源县'],
    '370400': ['市中区', '薛城区', '峄城区', '台儿庄区', '山亭区', '滕州市'],
    '370500': ['东营区', '河口区', '垦利区', '利津县', '广饶县'],
    '370600': ['芝罘区', '福山区', '牟平区', '莱山区', '蓬莱区', '龙口市', '莱阳市', '莱州市', '招远市', '栖霞市', '海阳市'],
    '370700': ['潍城区', '寒亭区', '坊子区', '奎文区', '临朐县', '昌乐县', '青州市', '诸城市', '寿光市', '安丘市', '高密市', '昌邑市'],
    '370800': ['任城区', '兖州区', '微山县', '鱼台县', '金乡县', '嘉祥县', '汶上县', '泗水县', '梁山县', '曲阜市', '邹城市'],
    '370900': ['泰山区', '岱岳区', '宁阳县', '东平县', '新泰市', '肥城市'],
    '371000': ['环翠区', '文登区', '荣成市', '乳山市'],
    '371100': ['东港区', '岚山区', '五莲县', '莒县'],
    '371300': ['兰山区', '罗庄区', '河东区', '沂南县', '郯城县', '沂水县', '兰陵县', '费县', '平邑县', '莒南县', '蒙阴县', '临沭县'],
    '371400': ['德城区', '陵城区', '宁津县', '庆云县', '临邑县', '齐河县', '平原县', '夏津县', '武城县', '乐陵市', '禹城市'],
    '371500': ['东昌府区', '茌平区', '阳谷县', '莘县', '东阿县', '冠县', '高唐县', '临清市'],
    '371600': ['滨城区', '沾化区', '惠民县', '阳信县', '无棣县', '博兴县', '邹平市'],
    '371700': ['牡丹区', '定陶区', '曹县', '单县', '成武县', '巨野县', '郓城县', '鄄城县', '东明县'],
  };
  const districts = cityDistricts[cityCode] || ['未知区县'];
  return districts.map((name, i) => ({
    districtName: name,
    districtCode: `${cityCode}${String(i + 1).padStart(2, '0')}`,
    placeCount: Math.floor(20 + Math.random() * 200),
    visitorCount: Math.floor(500 + Math.random() * 15000),
    avgDuration: Math.floor(60 + Math.random() * 180),
  }));
};

export const generateMockDistrictPlaces = (districtCode: string, districtName: string): { placeId: string; placeName: string; visitorCount: number; avgDuration: number; type: string }[] => {
  const count = Math.floor(5 + Math.random() * 15);
  const types = ['网吧', '游戏厅', 'KTV'];
  return Array.from({ length: count }, (_, i) => ({
    placeId: `${districtCode}${String(i + 1).padStart(3, '0')}`,
    placeName: `${districtName}${types[i % 3]}${i + 1}号`,
    visitorCount: Math.floor(50 + Math.random() * 500),
    avgDuration: Math.floor(60 + Math.random() * 180),
    type: types[i % 3],
  }));
};

export const generateMockPersonnelProfile = (): {
  ageDistribution: { range: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  identityTypes: { type: string; typeName: string; count: number; percentage: number }[];
  minorTrend: { date: string; ratio: number }[];
} => {
  const ageRaw = [
    { range: '18岁以下', base: 800 },
    { range: '18-25岁', base: 4500 },
    { range: '26-35岁', base: 3800 },
    { range: '36-45岁', base: 2200 },
    { range: '46-55岁', base: 1200 },
    { range: '55岁以上', base: 500 },
  ];
  const ageItems = ageRaw.map((r) => ({ ...r, count: Math.floor(r.base * (0.85 + Math.random() * 0.3)) }));
  const ageTotal = ageItems.reduce((s, i) => s + i.count, 0);
  const ageDistribution = ageItems.map((i) => ({ ...i, percentage: Number(((i.count / ageTotal) * 100).toFixed(1)) }));

  const maleCount = Math.floor(8000 + Math.random() * 2000);
  const femaleCount = Math.floor(3000 + Math.random() * 1000);
  const genderTotal = maleCount + femaleCount;
  const genderDistribution = [
    { gender: '男', count: maleCount, percentage: Number(((maleCount / genderTotal) * 100).toFixed(1)) },
    { gender: '女', count: femaleCount, percentage: Number(((femaleCount / genderTotal) * 100).toFixed(1)) },
  ];

  const idRaw = [
    { type: 'local', typeName: '本地', base: 9000 },
    { type: 'nonlocal', typeName: '外地', base: 3500 },
    { type: 'hk_mo_tw', typeName: '港澳台', base: 200 },
    { type: 'foreign', typeName: '外籍', base: 100 },
  ];
  const idItems = idRaw.map((r) => ({ ...r, count: Math.floor(r.base * (0.85 + Math.random() * 0.3)) }));
  const idTotal = idItems.reduce((s, i) => s + i.count, 0);
  const identityTypes = idItems.map((i) => ({ ...i, percentage: Number(((i.count / idTotal) * 100).toFixed(1)) }));

  const today = new Date();
  const minorTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      ratio: Number((0.5 + Math.random() * 2.5).toFixed(2)),
    };
  });

  return { ageDistribution, genderDistribution, identityTypes, minorTrend };
};

export const generateMockReportStatus = (): {
  placeId: string;
  placeName: string;
  regionName: string;
  status: 'submitted' | 'not_submitted' | 'overdue';
  reportTime: string | null;
  reporter: string | null;
  integrity: 'complete' | 'incomplete' | 'failed';
  integrityDetail: string;
}[] => {
  const statuses: Array<'submitted' | 'not_submitted' | 'overdue'> = ['submitted', 'not_submitted', 'overdue'];
  const integrityOptions: Array<'complete' | 'incomplete' | 'failed'> = ['complete', 'incomplete', 'failed'];
  const integrityDetails: Record<string, string[]> = {
    complete: ['数据完整，校验通过'],
    incomplete: ['缺少时长统计数据', '缺少人次明细', '部分时段数据缺失', '未成年拦截数据未填写'],
    failed: ['数据格式异常', '总人次与明细不匹配', '上报数据与系统采集差异超10%'],
  };
  return placeNames.slice(0, 25).map((name, i) => {
    const status = statuses[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2];
    const integrity = status === 'submitted'
      ? (i % 5 === 0 ? 'incomplete' : 'complete')
      : (i % 4 === 0 ? 'failed' : 'incomplete');
    const reporterNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    return {
      placeId: `P${String(i + 1).padStart(4, '0')}`,
      placeName: name,
      regionName: `${Random.shandongCity()} ${Random.shandongDistrict(Random.shandongCity())}`,
      status,
      reportTime: status === 'submitted'
        ? `2025-06-0${1 + (i % 9)} ${9 + (i % 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
        : null,
      reporter: status === 'submitted' ? Random.pick(reporterNames) : null,
      integrity,
      integrityDetail: Random.pick(integrityDetails[integrity]),
    };
  });
};
