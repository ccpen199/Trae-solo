import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const safeParam = (params: any, key: string, defaultValue: any = 0) => {
  return params?.[key] !== undefined ? params[key] : defaultValue;
};

const outlets: any[] = [
  {
    id: 1,
    name: '爱众客户服务中心(锦华店)',
    shortName: '锦华店',
    district: '锦江区',
    address: '四川省成都市锦江区锦华路一段88号（锦华万达广场斜对面）',
    lng: 104.085,
    lat: 30.652,
    businessHours: '周一至周五 08:30-17:30，周六/周日 09:00-16:00，法定节假日 09:00-12:00',
    serviceScope: '锦江区全部区域、成华区猛追湾/双桥子片区、青羊区少城片区',
    contactPhone: '028-86668888',
    managerName: '李经理',
    serviceArea: '1200㎡',
    windowCount: 12,
    staffCount: 28,
    dailyCapacity: 450,
    established: '2018-06-01',
    facilities: ['自助缴费机×6', '24小时自助服务区', '母婴室', '无障碍通道', '免费WiFi', '休息等候区', '饮用水供应', '手机充电桩'],
    services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务', '发票打印', '大客户VIP服务'],
    serviceTypes: ['water', 'electricity', 'gas', 'all'],
    imageUrl: '',
    rating: 4.8,
    reviewCount: 1286,
  },
  {
    id: 2,
    name: '爱众客户服务中心(武侯店)',
    shortName: '武侯店',
    district: '武侯区',
    address: '四川省成都市武侯区人民南路四段120号（省体育馆旁）',
    lng: 104.061,
    lat: 30.638,
    businessHours: '周一至周五 08:30-17:30，周六 09:00-12:00，周日及节假日休息',
    serviceScope: '武侯区全部区域、高新区芳草/肖家河片区、锦江区督院街片区',
    contactPhone: '028-85556666',
    managerName: '王经理',
    serviceArea: '800㎡',
    windowCount: 8,
    staffCount: 20,
    dailyCapacity: 320,
    established: '2017-03-15',
    facilities: ['自助缴费机×4', '24小时自助服务区', '无障碍通道', '免费WiFi', '休息等候区', '饮用水供应'],
    services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务', '发票打印'],
    serviceTypes: ['water', 'electricity', 'gas'],
    imageUrl: '',
    rating: 4.6,
    reviewCount: 856,
  },
  {
    id: 3,
    name: '爱众客户服务中心(青羊店)',
    shortName: '青羊店',
    district: '青羊区',
    address: '四川省成都市青羊区蜀金路18号（金沙遗址公园附近）',
    lng: 104.032,
    lat: 30.674,
    businessHours: '周一至周五 09:00-17:00，周六 09:00-12:00，周日休息',
    serviceScope: '青羊区全部区域、金牛区茶店子/营门口片区、温江区涌泉街道',
    contactPhone: '028-87779999',
    managerName: '张经理',
    serviceArea: '650㎡',
    windowCount: 6,
    staffCount: 15,
    dailyCapacity: 240,
    established: '2019-09-10',
    facilities: ['自助缴费机×3', '24小时自助服务区', '母婴室', '无障碍通道', '免费WiFi', '休息等候区', '饮用水供应'],
    services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务'],
    serviceTypes: ['water', 'electricity', 'gas'],
    imageUrl: '',
    rating: 4.7,
    reviewCount: 642,
  },
  {
    id: 4,
    name: '爱众客户服务中心(高新店·旗舰店)',
    shortName: '高新店',
    district: '高新区',
    address: '四川省成都市高新区天府大道中段1388号（天府三街地铁口A出口100米）',
    lng: 104.062,
    lat: 30.581,
    businessHours: '周一至周五 08:30-18:00，周六/周日 09:00-17:00，法定节假日 09:00-15:00',
    serviceScope: '高新区全部区域、天府新区华阳/正兴片区、双流区西航港片区',
    contactPhone: '028-88887777',
    managerName: '刘经理',
    serviceArea: '2200㎡',
    windowCount: 18,
    staffCount: 42,
    dailyCapacity: 680,
    established: '2021-05-20',
    facilities: ['自助缴费机×10', '24小时智能服务区', 'VIP大客户中心', '母婴室', '无障碍通道', '免费WiFi', '咖啡茶水区', '手机充电桩', '儿童游乐区', '会议接待室'],
    services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务', '发票打印', '企业服务', '合同签订', '大客户VIP服务', '工程报装'],
    serviceTypes: ['water', 'electricity', 'gas', 'all'],
    imageUrl: '',
    rating: 4.9,
    reviewCount: 2458,
  },
  {
    id: 5,
    name: '爱众客户服务中心(成华店)',
    shortName: '成华店',
    district: '成华区',
    address: '四川省成都市成华区双林路88号（新华公园旁）',
    lng: 104.118,
    lat: 30.663,
    businessHours: '周一至周五 08:30-17:30，周六 09:00-16:00，周日休息',
    serviceScope: '成华区全部区域、锦江区牛市口/莲新片区、青白江区大弯街道',
    contactPhone: '028-84445555',
    managerName: '陈经理',
    serviceArea: '750㎡',
    windowCount: 7,
    staffCount: 18,
    dailyCapacity: 280,
    established: '2016-11-08',
    facilities: ['自助缴费机×3', '24小时自助服务区', '无障碍通道', '免费WiFi', '休息等候区', '饮用水供应', '手机充电桩'],
    services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务', '发票打印'],
    serviceTypes: ['water', 'electricity', 'gas'],
    imageUrl: '',
    rating: 4.5,
    reviewCount: 718,
  },
];

// 网点 → 今日窗口实时状态
const windowSchedules: Record<number, any[]> = {
  1: [
    { no: 1, type: '水费', staff: '张敏', status: 'working', current: 45, waiting: 3, servedToday: 78 },
    { no: 2, type: '水费', staff: '李军', status: 'working', current: 46, waiting: 2, servedToday: 62 },
    { no: 3, type: '电费', staff: '王丽', status: 'working', current: 128, waiting: 5, servedToday: 91 },
    { no: 4, type: '电费', staff: '赵刚', status: 'break', current: 0, waiting: 0, servedToday: 55 },
    { no: 5, type: '燃气', staff: '刘芳', status: 'working', current: 33, waiting: 1, servedToday: 47 },
    { no: 6, type: '综合', staff: '周红', status: 'working', current: 212, waiting: 4, servedToday: 103 },
  ],
  2: [
    { no: 1, type: '水费', staff: '孙丽', status: 'working', current: 12, waiting: 2, servedToday: 42 },
    { no: 2, type: '电费', staff: '吴强', status: 'working', current: 56, waiting: 3, servedToday: 68 },
    { no: 3, type: '燃气', staff: '郑伟', status: 'working', current: 89, waiting: 1, servedToday: 38 },
    { no: 4, type: '综合', staff: '黄丽', status: 'working', current: 23, waiting: 2, servedToday: 56 },
  ],
  3: [
    { no: 1, type: '水费', staff: '邓华', status: 'working', current: 5, waiting: 1, servedToday: 32 },
    { no: 2, type: '电费', staff: '韩梅', status: 'break', current: 0, waiting: 0, servedToday: 28 },
    { no: 3, type: '燃气', staff: '杨帆', status: 'working', current: 18, waiting: 1, servedToday: 35 },
  ],
  4: [
    { no: 1, type: '水费', staff: '许静', status: 'working', current: 112, waiting: 5, servedToday: 112 },
    { no: 2, type: '水费', staff: '何峰', status: 'working', current: 113, waiting: 4, servedToday: 98 },
    { no: 3, type: '电费', staff: '罗云', status: 'working', current: 256, waiting: 7, servedToday: 145 },
    { no: 4, type: '电费', staff: '谢兰', status: 'working', current: 257, waiting: 5, servedToday: 124 },
    { no: 5, type: '电费', staff: '唐杰', status: 'working', current: 258, waiting: 3, servedToday: 110 },
    { no: 6, type: '燃气', staff: '冯萍', status: 'working', current: 77, waiting: 2, servedToday: 82 },
    { no: 7, type: '燃气', staff: '董亮', status: 'working', current: 78, waiting: 3, servedToday: 75 },
    { no: 8, type: '综合', staff: '黄磊', status: 'working', current: 445, waiting: 8, servedToday: 156 },
    { no: 9, type: 'VIP', staff: '钱总', status: 'working', current: 3, waiting: 1, servedToday: 22 },
  ],
  5: [
    { no: 1, type: '水费', staff: '石涛', status: 'working', current: 8, waiting: 2, servedToday: 48 },
    { no: 2, type: '电费', staff: '戴军', status: 'working', current: 34, waiting: 3, servedToday: 61 },
    { no: 3, type: '燃气', staff: '贾敏', status: 'working', current: 15, waiting: 1, servedToday: 39 },
    { no: 4, type: '综合', staff: '魏红', status: 'break', current: 0, waiting: 0, servedToday: 32 },
  ],
};

// 排队状态生成函数
const buildQueue = (outletId: number) => {
  const outlet = outlets.find((o) => o.id === outletId);
  const wins = windowSchedules[outletId] || [];
  const waitingCount = wins.reduce((s, w) => s + w.waiting, 0);
  const processingCount = wins.filter((w) => w.status === 'working').length;
  const avgWaitTime = waitingCount > 0 ? Math.min(50, 5 + waitingCount * 3) : 0;
  const servedToday = wins.reduce((s, w) => s + w.servedToday, 0);
  const loadPercent = Math.min(100, Math.round((servedToday / (outlet?.dailyCapacity || 300)) * 100));
  return {
    outletId,
    outletName: outlet?.name || '服务中心',
    shortName: outlet?.shortName,
    waitingCount,
    processingCount,
    avgWaitTime,
    updateTime: Mock.Random.datetime(),
    servedToday,
    loadPercent,
    windows: wins,
    currentNumbers: wins.filter((w) => w.status === 'working').map((w) => w.current).sort((a, b) => a - b),
  };
};

export default [
  {
    url: '/api/outlet/list',
    method: 'get',
    response: ({ query }: any) => {
      let filtered = [...outlets];
      if (query.keyword) {
        filtered = filtered.filter(
          (o) => o.name.includes(query.keyword) || o.address.includes(query.keyword)
        );
      }
      if (query.district) {
        filtered = filtered.filter((o) => o.district === query.district || outlets.find((x) => x.id === o.id)?.district === query.district);
      }
      // 根据 district code 映射区域名称进行过滤
      const districtCodeNameMap: Record<string, string> = {
        '510104': '锦江区', '510105': '青羊区', '510106': '金牛区',
        '510107': '武侯区', '510108': '成华区', '510114': '高新区', '510109': '高新区',
      };
      if (query.district && districtCodeNameMap[query.district]) {
        filtered = filtered.filter((o) => o.district === districtCodeNameMap[query.district]);
      }
      if (query.serviceType && query.serviceType !== 'all') {
        filtered = filtered.filter((o) => o.serviceTypes?.includes(query.serviceType));
      }
      return {
        code: 0,
        message: 'success',
        data: filtered,
      };
    },
  },
  {
    url: '/api/outlet/:id',
    method: 'get',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const outlet = outlets.find((o) => o.id === id);
      return {
        code: 0,
        message: 'success',
        data: outlet || outlets[0],
      };
    },
  },
  {
    url: '/api/outlet/queue/:outletId',
    method: 'get',
    response: ({ params }: any) => {
      const outletId = Number(safeParam(params, 'outletId', 1));
      return {
        code: 0,
        message: 'success',
        data: buildQueue(outletId),
      };
    },
  },
  {
    url: '/api/outlet/queue/all',
    method: 'get',
    response: () => {
      const list = outlets.map((o) => buildQueue(o.id));
      return {
        code: 0,
        message: 'success',
        data: list,
      };
    },
  },
  {
    url: '/api/outlet/:outletId/windows',
    method: 'get',
    response: ({ params }: any) => {
      const outletId = Number(safeParam(params, 'outletId', 1));
      return {
        code: 0,
        message: 'success',
        data: windowSchedules[outletId] || [],
      };
    },
  },
  {
    url: '/api/outlet/appointment',
    method: 'post',
    response: () => {
      return {
        code: 0,
        message: '预约成功',
        data: {
          appointmentNo: 'APT' + Mock.Random.string('number', 12),
          queueNumber: 'A' + Mock.Random.integer(1, 300),
          qrCodeUrl: '',
          estimatedTime: Mock.Random.datetime(),
        },
      };
    },
  },
  {
    url: '/api/admin/outlet/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query;
      return {
        code: 0,
        message: 'success',
        data: {
          list: outlets,
          total: outlets.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/admin/outlet/create',
    method: 'post',
    response: ({ body }: any) => {
      const newOutlet = { id: outlets.length + 1, ...body };
      outlets.unshift(newOutlet);
      return {
        code: 0,
        message: '创建成功',
        data: newOutlet,
      };
    },
  },
  {
    url: '/api/admin/outlet/:id',
    method: 'put',
    response: ({ params, body }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const idx = outlets.findIndex((o) => o.id === id);
      if (idx > -1) outlets[idx] = { ...outlets[idx], ...body };
      return {
        code: 0,
        message: '更新成功',
        data: outlets[idx],
      };
    },
  },
  {
    url: '/api/admin/outlet/:id',
    method: 'delete',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const idx = outlets.findIndex((o) => o.id === id);
      if (idx > -1) outlets.splice(idx, 1);
      return {
        code: 0,
        message: '删除成功',
      };
    },
  },
] as MockMethod[];
