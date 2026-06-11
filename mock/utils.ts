import Mock from 'mockjs';

const Random = Mock.Random;

const generateUser = () => ({
  id: Random.integer(10000, 99999),
  phone: /^1[3-9]\d{9}$/,
  nickname: Random.cname(),
  avatar: '',
  userType: 1,
  realNameStatus: 1,
  realName: Random.cname(),
  createTime: Random.datetime(),
});

const generateHousehold = (serviceType: 'water' | 'electricity' | 'gas') => {
  const prefixMap = {
    water: 'W',
    electricity: 'E',
    gas: 'G',
  };
  const nameMap = {
    water: '水费',
    electricity: '电费',
    gas: '燃气费',
  };
  return {
    id: Random.integer(1, 100),
    userId: 1,
    householdNo: `${prefixMap[serviceType]}${Random.string('number', 10)}`,
    householdName: Random.cname(),
    serviceType,
    address: `${Random.province()}${Random.city()}${Random.county()}${Random.csentence(5, 10)}`,
    areaCode: Random.string('number', 6),
    areaName: Random.city(),
    isDefault: 0,
    createTime: Random.datetime(),
    arrearsAmount: Random.float(0, 500, 2, 2),
  };
};

const generateBill = (serviceType: 'water' | 'electricity' | 'gas') => {
  const status = Random.pick([0, 1, 2]);
  return {
    id: Random.integer(1, 1000),
    billNo: `B${Random.date('yyyyMMdd')}${Random.string('number', 6)}`,
    householdId: Random.integer(1, 10),
    householdNo: /^[WEG]\d{10}/,
    householdName: Random.cname(),
    serviceType,
    billingPeriod: `${Random.date('yyyy-MM')}`,
    totalAmount: Random.float(50, 500, 2, 2),
    payableAmount: 0,
    paidAmount: 0,
    status,
    billDate: Random.date(),
    dueDate: Random.date(),
    details: [
      {
        itemName: serviceType === 'electricity' ? '基础电费' : serviceType === 'water' ? '基础水费' : '基础气费',
        quantity: Random.float(10, 200, 2, 2),
        unit: serviceType === 'electricity' ? '度' : serviceType === 'water' ? '吨' : '立方',
        unitPrice: Random.float(0.5, 5, 2, 2),
        amount: Random.float(30, 300, 2, 2),
      },
      {
        itemName: '阶梯费用',
        amount: Random.float(10, 100, 2, 2),
      },
      {
        itemName: '违约金',
        amount: status === 2 ? Random.float(1, 50, 2, 2) : 0,
      },
    ],
  };
};

const generatePaymentRecord = () => {
  const types = ['water', 'electricity', 'gas'];
  const type = Random.pick(types);
  return {
    id: Random.integer(1, 10000),
    paymentNo: `P${Random.date('yyyyMMddHHmmss')}${Random.string('number', 4)}`,
    userId: 1,
    billIds: [Random.integer(1, 1000)],
    householdNos: [/^[WEG]\d{10}/],
    serviceTypes: [type],
    totalAmount: Random.float(50, 500, 2, 2),
    payMethod: Random.pick(['wechat', 'alipay', 'bank']),
    status: Random.pick([1, 2]),
    payTime: Random.datetime(),
    thirdPartyNo: Random.string('number', 20),
    createTime: Random.datetime(),
  };
};

const generateVoucher = () => ({
  id: Random.integer(1, 1000),
  voucherNo: `V${Random.date('yyyyMMdd')}${Random.string('number', 8)}`,
  paymentId: Random.integer(1, 10000),
  paymentNo: /^P\d{18}/,
  amount: Random.float(50, 500, 2, 2),
  fileUrl: '',
  createTime: Random.datetime(),
});

const generateAnnouncement = (type?: 'outage' | 'repair' | 'notice') => {
  const t = type || Random.pick(['outage', 'repair', 'notice']);
  const serviceType = Random.pick(['water', 'electricity', 'gas', 'all']);
  const titleMap = {
    outage: {
      water: '停水通知',
      electricity: '停电通知',
      gas: '停气通知',
      all: '设施检修通知',
    },
    repair: {
      water: '供水抢修公告',
      electricity: '供电抢修公告',
      gas: '燃气抢修公告',
      all: '紧急抢修公告',
    },
    notice: {
      water: '水费价格调整通知',
      electricity: '电费价格调整通知',
      gas: '燃气安全使用通知',
      all: '重要通知',
    },
  };
  return {
    id: Random.integer(1, 100),
    title: titleMap[t][serviceType as keyof typeof titleMap[typeof t]] + ' - ' + Random.csentence(5, 10),
    type: t,
    serviceType,
    summary: Random.csentence(10, 20),
    content: `<p>${Random.cparagraph(3, 5)}</p><p>${Random.cparagraph(2, 4)}</p>`,
    affectAreas: [Random.string('number', 6), Random.string('number', 6)],
    affectAreaNames: [Random.district(), Random.district()],
    status: Random.pick([0, 1, 2, 3, 4]),
    creatorName: Random.cname(),
    publishTime: Random.datetime(),
    createTime: Random.datetime(),
  };
};

const generateWorkOrder = () => {
  const types = ['consultation', 'complaint', 'suggestion', 'repair', 'other'];
  const type = Random.pick(types);
  const typeNameMap: Record<string, string> = {
    consultation: '咨询',
    complaint: '投诉',
    suggestion: '建议',
    repair: '报修',
    other: '其他',
  };
  return {
    id: Random.integer(1, 1000),
    orderNo: `WO${Random.date('yyyyMMdd')}${Random.string('number', 6)}`,
    userId: 1,
    userName: Random.cname(),
    userPhone: /^1[3-9]\d{9}$/,
    type,
    typeName: typeNameMap[type],
    title: `${typeNameMap[type]} - ${Random.csentence(5, 15)}`,
    content: Random.cparagraph(2, 4),
    images: [],
    status: Random.pick([0, 1, 2, 3, 4]),
    priority: Random.pick([0, 1, 2]),
    assigneeId: Random.integer(1, 20),
    assigneeName: Random.cname(),
    createTime: Random.datetime(),
    updateTime: Random.datetime(),
  };
};

const generateServiceOutlet = () => ({
  id: Random.integer(1, 50),
  name: `爱众客户服务中心(${Random.ctitle(3, 5)}店)`,
  address: `${Random.province()}${Random.city()}${Random.county()}${Random.street()}${Random.integer(1, 500)}号`,
  lng: Random.float(104, 106, 6, 6),
  lat: Random.float(30, 32, 6, 6),
  businessHours: '周一至周五 09:00-17:30，周六 09:00-12:00',
  serviceScope: '水费缴纳、电费缴纳、燃气费缴纳、户号过户、报修服务',
  contactPhone: /^0\d{2,3}-\d{7,8}/,
  services: ['水费缴纳', '电费缴纳', '燃气费缴纳', '户号变更', '报修服务', '咨询服务'],
});

const generateQueueStatus = () => ({
  outletId: Random.integer(1, 50),
  outletName: '',
  waitingCount: Random.integer(0, 30),
  processingCount: Random.integer(1, 5),
  avgWaitTime: Random.integer(5, 45),
  updateTime: Random.datetime(),
});

const generateAdminUser = () => ({
  id: Random.integer(1, 100),
  username: Random.word(6, 12),
  realName: Random.cname(),
  roleId: Random.integer(1, 10),
  roleName: Random.pick(['系统管理员', '运营管理员', '客服主管', '客服人员', '财务人员']),
  status: Random.pick([0, 1]),
  createTime: Random.datetime(),
});

export const mockData = {
  generateUser,
  generateHousehold,
  generateBill,
  generatePaymentRecord,
  generateVoucher,
  generateAnnouncement,
  generateWorkOrder,
  generateServiceOutlet,
  generateQueueStatus,
  generateAdminUser,
};

export default Mock;
