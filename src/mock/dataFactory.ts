import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import random from 'lodash-es/random';
import type {
  LandlordApplication,
  Property,
  Contract,
  CreditProfile,
  ServiceWorkOrder,
  EmergencyPlacement,
  AuditLog,
  DashboardMetrics,
  MapHeatmapPoint,
  CreditEvent,
  OrderTimelineItem,
  EmergencyTimelineItem,
  MetricCard,
  DataChangeItem,
  CreditDimensions,
  SettlementRecord,
  AuditActionType,
} from '@/types';
import { generateRandomId } from '@/utils';

/** 随机选择数组元素 */
function pick<T>(arr: T[]): T {
  return arr[random(0, arr.length - 1)];
}

/** 随机选择多个不重复数组元素 */
function pickMany<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = random(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/** 生成随机中国手机号 */
function randomPhone(): string {
  const prefixes = ['138', '139', '158', '159', '188', '189', '136', '137', '176', '177'];
  const prefix = pick(prefixes);
  const suffix = random(10000000, 99999999).toString();
  return prefix + suffix;
}

/** 生成随机18位身份证号(虚构) */
function randomIdCard(): string {
  const areas = ['310101', '310104', '310110', '310115', '330102', '330106', '110101', '110108', '440103', '440305'];
  const area = pick(areas);
  const birth = dayjs()
    .subtract(random(22, 65), 'year')
    .subtract(random(0, 365), 'day')
    .format('YYYYMMDD');
  const seq = random(100, 999).toString();
  const check = random(0, 9).toString();
  return area + birth + seq + check;
}

/** 生成随机姓名 */
function randomName(gender?: 'male' | 'female'): string {
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
  const maleNames = ['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '平', '刚', '文', '辉', '鹏', '斌', '波', '飞', '龙', '华'];
  const femaleNames = ['芳', '娜', '敏', '静', '丽', '艳', '娟', '莉', '玲', '萍', '霞', '颖', '璐', '瑶', '馨', '悦', '彤', '倩', '琳', '雪'];
  const surname = pick(surnames);
  const g = gender ?? (random(0, 1) === 0 ? 'male' : 'female');
  const given = g === 'male' ? pick(maleNames) + (random(0, 1) ? pick(maleNames) : '') : pick(femaleNames) + (random(0, 1) ? pick(femaleNames) : '');
  return surname + given;
}

/** 生成上海市范围内随机坐标(围绕市中心波动) */
function randomShanghaiCoords() {
  const shanghaiLat = 31.2304;
  const shanghaiLng = 121.4737;
  const lat = shanghaiLat + (random(-450, 450) / 10000);
  const lng = shanghaiLng + (random(-550, 550) / 10000);
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

/** 生成随机日期字符串(向前N天内) */
function randomDate(daysAgo: number, daysAfter: number = 0): string {
  const base = dayjs().subtract(random(0, daysAgo), 'day');
  const date = daysAfter > 0 ? base.add(random(0, daysAfter), 'day') : base;
  return date.subtract(random(0, 86400), 'second').format('YYYY-MM-DD HH:mm:ss');
}

const CITIES = ['上海市'];
const DISTRICTS = ['浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区'];
const BUSINESS_AREAS = [
  '陆家嘴', '人民广场', '徐家汇', '静安寺', '中山公园', '南京路',
  '淮海路', '张江高科', '五角场', '虹桥', '四川北路', '莘庄',
];
const COMMUNITIES = [
  '滨江花园', '翠湖天地', '仁恒滨江园', '世茂滨江花园', '汤臣一品',
  '中凯城市之光', '静安枫景苑', '古北壹号', '九间堂', '浦东星河湾',
  '万科翡翠雅宾利', '融创滨江壹号院', '绿城黄浦湾', '中海紫御豪庭',
];
const STREET_PREFIXES = ['陆家嘴环路', '世纪大道', '南京西路', '淮海中路', '愚园路', '衡山路', '武康路', '四川北路', '张杨路', '延安西路'];
const ORIENTATIONS: Property['orientation'][] = ['east', 'south', 'west', 'north', 'southeast', 'southwest', 'northeast', 'northwest'];
const DECORATIONS: Property['decoration'][] = ['rough', 'simple', 'standard', 'fine', 'luxury'];
const PROPERTY_TYPES: Property['propertyType'][] = ['apartment', 'house', 'villa', 'loft'];
const FACILITIES_LIST = ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '床', '衣柜', '沙发', '餐桌', '燃气灶', '抽油烟机', '微波炉', '洗碗机', '阳台', '独立卫浴', '电梯', '车位', '储物间', '健身房'];
const HIGHLIGHTS_LIST = ['近地铁', '精装修', '拎包入住', '押一付一', '免中介费', '可养宠物', 'loft复式', '江景房', '学区房', '电梯高层', '新小区', '朝南主卧', '独卫', '采光好', '交通便利'];
const PAYMENT_TYPES = ['押一付一', '押一付三', '押一付六', '押二付一', '押二付三', '半年付', '年付'];
const GUARANTEE_PLANS: Contract['guaranteePlan'][] = ['basic', 'standard', 'premium'];
const WORK_ORDER_TITLES: Record<string, string[]> = {
  repair: ['客厅空调不制冷', '厨房水管漏水', '卫生间马桶堵塞', '卧室灯不亮', '热水器不出热水', '门锁损坏无法开门', '窗户玻璃破裂', '抽油烟机故障', '冰箱不制冷', '洗衣机无法脱水'],
  cleaning: ['入住前深度保洁', '退租保洁', '日常清洁', '擦玻璃服务', '油烟机清洗', '空调滤网清洗'],
  move: ['同城搬家服务', '跨区搬家', '大件家具搬运', '钢琴搬运'],
  complaint: ['噪音扰民投诉', '邻里纠纷', '房东不退押金', '房屋质量问题投诉', '服务态度投诉'],
  consult: ['租金支付方式咨询', '合同续签咨询', '维修责任划分咨询', '转租政策咨询'],
  dispute: ['租金纠纷调解', '押金退还纠纷', '房屋维修责任纠纷', '提前退租纠纷'],
  checkout: ['退租验房交接', '退房费用结算'],
  checkin: ['入住交接验房', '水电燃气开通协助'],
};
const REPAIR_CATEGORIES = ['水电维修', '家电维修', '家具维修', '门窗维修', '墙面地面', '厨卫维修', '空调制冷', '锁具服务'];
const HOTEL_NAMES = ['如家精选酒店', '汉庭优佳酒店', '全季酒店', '桔子水晶酒店', '亚朵酒店', '和颐酒店', '希尔顿欢朋', '智选假日酒店', '锦江之星', '7天优品'];
const AUDIT_MODULES = ['房东准入', '房源管理', '合同管理', '信用管理', '工单服务', '应急安置', '财务管理', '系统配置', '用户管理'];
const AUDIT_BIZ_TYPES = ['LandlordApplication', 'Property', 'Contract', 'CreditProfile', 'ServiceWorkOrder', 'EmergencyPlacement', 'SettlementRecord', 'UserAccount'];
const AUDIT_ACTIONS: AuditActionType[] = ['create', 'update', 'delete', 'approve', 'reject', 'sign', 'assign', 'settle', 'export', 'login'];

/**
 * 生成房东申请数据
 * @param count 生成数量
 */
export function generateLandlordApplications(count: number = 20): LandlordApplication[] {
  const statuses: LandlordApplication['status'][] = ['pending', 'verifying', 'approved', 'rejected', 'cancelled'];
  const result: LandlordApplication[] = [];

  for (let i = 0; i < count; i++) {
    const status = pick(statuses);
    const currentStep = status === 'pending' ? 1 : status === 'verifying' ? random(2, 3) : status === 'approved' || status === 'rejected' ? 5 : random(1, 2);
    const progress = status === 'pending' ? random(5, 15) : status === 'verifying' ? random(30, 70) : status === 'cancelled' ? random(10, 50) : 100;
    const submitTime = randomDate(60);
    const district = pick(DISTRICTS);
    const area = random(35, 180);
    const bedrooms = random(1, 5);

    const app: LandlordApplication = {
      id: uuidv4(),
      applyNo: generateRandomId('FD'),
      landlordName: randomName(),
      landlordPhone: randomPhone(),
      landlordIdCard: randomIdCard(),
      propertyAddress: `上海市${district}${pick(STREET_PREFIXES)}${random(1, 2000)}号${random(1, 30)}栋${random(1, 40)}0${random(1, 9)}室`,
      city: '上海市',
      district,
      area,
      bedrooms,
      livingRooms: random(0, 2),
      bathrooms: random(1, Math.min(3, bedrooms)),
      expectedRent: Math.round(area * random(60, 180)),
      propertyCertImages: [
        `https://picsum.photos/seed/cert1-${i}/800/600`,
        `https://picsum.photos/seed/cert2-${i}/800/600`,
      ],
      idCardHoldingImage: `https://picsum.photos/seed/hold-${i}/800/1000`,
      status,
      progress,
      currentStep,
      totalSteps: 5,
      submitTime,
    };

    if (status !== 'pending') {
      app.propertyVerifyResult = {
        status: status === 'cancelled' ? 'pending' : pick(['processing', 'passed', 'passed', 'failed']),
        ownerNameMatched: random(0, 10) !== 0,
        ownerCertNoMatched: random(0, 10) !== 0,
        propertyUnitNoValid: random(0, 10) !== 0,
        hasMortgage: random(0, 100) < 30,
        hasSeizure: random(0, 100) < 5,
        hasObjection: random(0, 100) < 3,
        verifySource: pick(['government_api', 'third_party', 'manual']),
        verifyTime: randomDate(50),
      };
      app.faceVerifyResult = {
        status: status === 'cancelled' ? 'pending' : pick(['passed', 'passed', 'passed', 'failed']),
        similarity: random(72, 99),
        livenessPassed: random(0, 100) > 5,
        channel: pick(['alipay', 'wechat', 'ctid']),
        sessionId: uuidv4(),
        verifyTime: randomDate(50),
      };
    }

    if (status === 'approved' || status === 'rejected') {
      const passed = status === 'approved';
      const score = passed ? random(75, 98) : random(30, 60);
      app.verifyResult = {
        passed,
        score,
        riskLevel: score >= 85 ? 'low' : score >= 60 ? 'medium' : 'high',
        riskTags: passed
          ? pickMany(['产权清晰', '身份核验通过', '评分优秀', '无抵押查封', '社区优质'], random(1, 3))
          : pickMany(['存在抵押记录', '相似度偏低', '产权存疑', '资料不全', '有查封风险'], random(1, 3)),
        opinion: passed
          ? '综合审核通过，准予准入。'
          : '审核未通过，请补充完整资料后重新提交。',
        verifyTime: dayjs(submitTime).add(random(2, 72), 'hour').format('YYYY-MM-DD HH:mm:ss'),
      };
      app.completeTime = app.verifyResult.verifyTime;
      app.auditorName = randomName();
      app.auditorId = uuidv4();
      if (!passed) {
        app.rejectReason = pick(['产权资料不完整', '人脸相似度不足', '房产存在抵押风险', '手持证件照模糊不清', '信息填写有误']);
      }
    }

    result.push(app);
  }
  return result;
}

/**
 * 生成房源数据
 * @param count 生成数量
 */
export function generateProperties(count: number = 30): Property[] {
  const result: Property[] = [];
  const statuses: Property['status'][] = ['on_shelf', 'rented', 'off_shelf', 'pending', 'maintenance', 'violation'];
  const verifyStates: Property['verifyState'][] = ['verified', 'verified', 'verified', 'verifying', 'unverified', 'verification_failed'];

  for (let i = 0; i < count; i++) {
    const coords = randomShanghaiCoords();
    const district = pick(DISTRICTS);
    const bedrooms = random(1, 4);
    const buildingArea = random(25, 55) + bedrooms * random(10, 25);
    const usableArea = Math.round(buildingArea * random(75, 90) / 100);
    const monthlyRent = Math.round(buildingArea * random(70, 200));
    const depositMonths = pick([1, 1, 1, 2, 2, 3]);
    const status = pick(statuses);
    const createTime = randomDate(365);
    const totalFloor = random(6, 38);
    const floor = random(1, totalFloor);

    const p: Property = {
      id: uuidv4(),
      propertyNo: generateRandomId('FY'),
      title: `${pick(COMMUNITIES)} ${bedrooms}室${random(0, 2)}厅 近地铁 精装修`,
      landlordId: uuidv4(),
      landlordName: randomName(),
      landlordPhone: randomPhone(),
      propertyType: pick(PROPERTY_TYPES),
      address: `上海市${district}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
      city: '上海市',
      district,
      businessArea: pick(BUSINESS_AREAS),
      communityName: pick(COMMUNITIES),
      building: `${random(1, 30)}号楼`,
      unit: `${random(1, 4)}单元`,
      roomNo: `${random(1, 30)}0${random(1, 9)}室`,
      latitude: coords.lat,
      longitude: coords.lng,
      buildingArea,
      usableArea,
      bedrooms,
      livingRooms: random(0, 2),
      bathrooms: random(1, Math.min(3, bedrooms)),
      kitchens: 1,
      balconies: random(0, 2),
      totalFloor,
      floor,
      hasElevator: totalFloor > 7 ? true : random(0, 1) === 1,
      orientation: pick(ORIENTATIONS),
      decoration: pick(DECORATIONS),
      buildYear: random(1995, 2024),
      monthlyRent,
      depositMonths,
      depositAmount: monthlyRent * depositMonths,
      paymentType: pick(PAYMENT_TYPES),
      availableDate: dayjs().add(random(-10, 60), 'day').format('YYYY-MM-DD'),
      minLeaseTerm: pick([3, 6, 6, 12, 12, 12, 24]),
      verifyState: pick(verifyStates),
      status,
      coverImage: `https://picsum.photos/seed/house-${i}-cover/800/600`,
      images: Array.from({ length: random(4, 8) }, (_, j) => `https://picsum.photos/seed/house-${i}-${j}/800/600`),
      floorPlanUrl: `https://picsum.photos/seed/floor-${i}/800/600`,
      facilities: pickMany(FACILITIES_LIST, random(6, 14)),
      highlights: pickMany(HIGHLIGHTS_LIST, random(2, 5)),
      description: `本房源位于${district}核心地段，交通便利，周边配套齐全。房屋保养良好，精装修，拎包即可入住。`,
      priceIndex: {
        communityAvgPrice: Math.round(monthlyRent / buildingArea * random(90, 110) / 10),
        areaAvgPrice: Math.round(monthlyRent / buildingArea * random(85, 115) / 10),
        districtAvgPrice: Math.round(monthlyRent / buildingArea * random(80, 120) / 10),
        priceScore: Number((random(30, 100) / 10).toFixed(1)),
        yearOnYear: Number((random(-100, 150) / 10).toFixed(1)),
        monthOnMonth: Number((random(-50, 50) / 10).toFixed(1)),
        trend: Array.from({ length: 6 }, (_, m) => ({
          month: dayjs().subtract(5 - m, 'month').format('YYYY-MM'),
          price: Math.round(monthlyRent / buildingArea * random(92, 108) / 10),
        })),
      },
      commuteInfo: {
        nearestMetroDistance: random(100, 2000),
        nearestMetroName: `地铁${pick(['1', '2', '3', '4', '6', '7', '8', '9', '10', '11', '12', '13'])}号线${pick(['人民广场', '徐家汇', '静安寺', '陆家嘴', '世纪大道', '中山公园'])}站`,
        metroWalkTime: random(3, 25),
        cityCenterDistance: Number((random(10, 250) / 10).toFixed(1)),
        cityCenterDriveTime: random(8, 60),
        nearbyBusStops: random(1, 12),
        nearbyBikeStations: random(0, 8),
      },
      viewCount: random(0, 5000),
      favoriteCount: random(0, 300),
      appointmentCount: random(0, 80),
      createTime,
      updateTime: dayjs(createTime).add(random(0, 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
    };

    if (status === 'on_shelf' || status === 'rented') {
      p.onShelfTime = dayjs(createTime).add(random(1, 15), 'day').format('YYYY-MM-DD HH:mm:ss');
    }

    result.push(p);
  }
  return result;
}

/**
 * 生成合同数据
 * @param count 生成数量
 */
export function generateContracts(count: number = 20): Contract[] {
  const result: Contract[] = [];
  const statuses: Contract['status'][] = ['active', 'active', 'active', 'expiring_soon', 'expired', 'terminated', 'cancelled', 'pending_sign'];

  for (let i = 0; i < count; i++) {
    const status = pick(statuses);
    const leaseMonths = pick([6, 12, 12, 12, 18, 24, 36]);
    const startDate = dayjs().subtract(random(1, 400), 'day');
    const endDate = startDate.add(leaseMonths, 'month');
    const monthlyRent = random(2000, 15000);
    const depositMonths = pick([1, 2, 3]);
    const depositAmount = monthlyRent * depositMonths;
    const depositReductionRatio = random(0, 100) / 100;
    const tenantCreditScore = random(500, 980);
    const createTime = startDate.subtract(random(1, 20), 'day').format('YYYY-MM-DD HH:mm:ss');

    const settlementPlan = Array.from({ length: Math.ceil(leaseMonths / 1) }, (_, idx) => {
      const period = idx + 1;
      const due = startDate.add(idx, 'month');
      const isPast = dayjs().isAfter(due.add(5, 'day'));
      const isFuture = dayjs().isBefore(due);
      const statusChoice = isPast
        ? (random(0, 100) < 92 ? 'paid' as const : 'overdue' as const)
        : (isFuture ? 'pending' as const : (random(0, 1) ? 'pending' as const : 'paid' as const));
      return {
        id: uuidv4(),
        period,
        dueDate: due.format('YYYY-MM-DD'),
        amount: monthlyRent,
        rentStartDate: due.format('YYYY-MM-DD'),
        rentEndDate: due.add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
        status: statusChoice,
        paidDate: statusChoice === 'paid' ? due.add(random(0, 3), 'day').format('YYYY-MM-DD') : undefined,
        paidAmount: statusChoice === 'paid' ? monthlyRent : undefined,
        overdueDays: statusChoice === 'overdue' ? random(1, 30) : undefined,
        lateFee: statusChoice === 'overdue' ? Math.round(monthlyRent * random(1, 5) / 100) : undefined,
      };
    });

    const settlementRecords: SettlementRecord[] = settlementPlan
      .filter(s => s.status === 'paid')
      .map(s => ({
        id: uuidv4(),
        planItemId: s.id,
        type: 'rent',
        amount: s.paidAmount!,
        paymentMethod: pick<'alipay' | 'wechat' | 'bank_transfer'>(['alipay', 'wechat', 'bank_transfer']),
        transactionId: `TX${uuidv4().replace(/-/g, '').slice(0, 20).toUpperCase()}`,
        status: 'success',
        operatorName: '系统自动扣款',
        createTime: s.paidDate ? `${s.paidDate} ${String(random(0, 23)).padStart(2, '0')}:${String(random(0, 59)).padStart(2, '0')}:00` : createTime,
        paidTime: s.paidDate ? `${s.paidDate} ${String(random(0, 23)).padStart(2, '0')}:${String(random(0, 59)).padStart(2, '0')}:00` : undefined,
      }));

    if (random(0, 1)) {
      settlementRecords.unshift({
        id: uuidv4(),
        type: 'deposit',
        amount: Math.round(depositAmount * (1 - depositReductionRatio)),
        paymentMethod: pick<'alipay' | 'wechat' | 'bank_transfer'>(['alipay', 'wechat', 'bank_transfer']),
        transactionId: `TX${uuidv4().replace(/-/g, '').slice(0, 20).toUpperCase()}`,
        status: 'success',
        createTime,
        paidTime: createTime,
      });
    }

    result.push({
      id: uuidv4(),
      contractNo: generateRandomId('HT'),
      contractType: pick<'standard' | 'short_term' | 'long_term' | 'renewal'>(['standard', 'short_term', 'long_term', 'renewal']),
      title: `房屋租赁合同-${pick(COMMUNITIES)}`,
      propertyId: uuidv4(),
      propertyTitle: `${pick(COMMUNITIES)} ${random(1, 4)}室${random(0, 2)}厅`,
      propertyAddress: `上海市${pick(DISTRICTS)}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
      landlordId: uuidv4(),
      landlordName: randomName(),
      landlordPhone: randomPhone(),
      tenantId: uuidv4(),
      tenantName: randomName(),
      tenantPhone: randomPhone(),
      tenantIdCard: randomIdCard(),
      monthlyRent,
      depositAmount,
      depositReductionRatio,
      actualDepositAmount: Math.round(depositAmount * (1 - depositReductionRatio)),
      paymentType: pick(PAYMENT_TYPES),
      paymentCycle: '按月支付',
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      leaseMonths,
      status,
      caSignInfo: status !== 'cancelled' ? {
        taskId: uuidv4(),
        caProvider: pick(['e签宝', '法大大', '上上签', '契约锁']),
        landlordSignStatus: 'signed',
        landlordSignTime: startDate.subtract(random(1, 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
        tenantSignStatus: status === 'pending_sign' ? 'pending' : 'signed',
        tenantSignTime: status === 'pending_sign' ? undefined : startDate.subtract(random(1, 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
        platformSignStatus: status === 'pending_sign' ? 'pending' : 'signed',
        platformSignTime: status === 'pending_sign' ? undefined : startDate.subtract(random(1, 3), 'day').format('YYYY-MM-DD HH:mm:ss'),
        contractHash: `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').slice(0, 32)}`,
        evidenceNo: `CZ${generateRandomId('')}`,
        blockchainTxId: `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').slice(0, 32)}`,
      } : undefined,
      contractFileUrl: `https://example.com/contracts/${uuidv4()}.pdf`,
      settlementPlan,
      settlementRecords,
      creditDepositWaiver: tenantCreditScore >= 700,
      tenantCreditScore,
      guaranteePlan: pick(GUARANTEE_PLANS),
      guaranteeFee: Math.round(monthlyRent * random(3, 10) / 100),
      earlyTerminationPenalty: pick([1, 1, 2, 2, 3]),
      createTime,
      signTime: status !== 'cancelled' && status !== 'pending_sign'
        ? startDate.subtract(random(1, 5), 'day').format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      effectiveTime: status !== 'cancelled' && status !== 'pending_sign'
        ? startDate.format('YYYY-MM-DD 00:00:00')
        : undefined,
      terminateTime: status === 'terminated'
        ? startDate.add(random(1, leaseMonths - 1), 'month').format('YYYY-MM-DD HH:mm:ss')
        : undefined,
    });
  }
  return result;
}

/**
 * 生成信用档案
 * @param count 生成数量
 */
export function generateCreditProfiles(count: number = 20): CreditProfile[] {
  const result: CreditProfile[] = [];

  for (let i = 0; i < count; i++) {
    const identity = random(40, 100);
    const behavior = random(30, 100);
    const performance = random(25, 100);
    const reputation = random(35, 100);
    const social = random(30, 95);
    const weights = { identity: 0.25, behavior: 0.2, performance: 0.3, reputation: 0.15, social: 0.1 };
    const totalScore = Math.round(
      identity * weights.identity * 10
      + behavior * weights.behavior * 10
      + performance * weights.performance * 10
      + reputation * weights.reputation * 10
      + social * weights.social * 10
    );

    let level: CreditProfile['level'];
    if (totalScore >= 850) level = 'excellent';
    else if (totalScore >= 750) level = 'good';
    else if (totalScore >= 650) level = 'fair';
    else if (totalScore >= 500) level = 'poor';
    else level = 'very_poor';

    let depositReductionRatio: number;
    if (totalScore >= 900) depositReductionRatio = 1;
    else if (totalScore >= 800) depositReductionRatio = 0.7;
    else if (totalScore >= 750) depositReductionRatio = 0.5;
    else if (totalScore >= 700) depositReductionRatio = 0.3;
    else if (totalScore >= 650) depositReductionRatio = 0.15;
    else depositReductionRatio = 0;

    const totalContracts = random(0, 15);
    const totalBreaches = random(0, Math.max(0, Math.floor(totalContracts / 3)));
    const totalKeptPromises = totalContracts * 2 + random(0, 15) - totalBreaches;

    const recentEvents: CreditEvent[] = Array.from({ length: random(2, 6) }, () => {
      const types: CreditEvent['type'][] = ['rent_on_time', 'contract_sign', 'contract_complete', 'positive_review', 'rent_overdue', 'complaint', 'negative_review'];
      const type = pick(types);
      const positive = ['rent_on_time', 'contract_sign', 'contract_complete', 'positive_review', 'id_verify', 'face_verify', 'register'].includes(type);
      const scoreDelta = positive ? random(2, 15) : -random(5, 30);
      const titleMap: Record<string, string> = {
        register: '完成账号注册',
        id_verify: '实名认证通过',
        face_verify: '人脸认证通过',
        contract_sign: '签署租房合同',
        rent_on_time: '按时缴纳房租',
        rent_overdue: '房租逾期未缴',
        contract_breach: '合同违约行为',
        contract_complete: '合同履约完成',
        maintenance_abuse: '恶意报修行为',
        complaint: '收到用户投诉',
        positive_review: '收到房东好评',
        negative_review: '收到负面评价',
        appeal_result: '申诉处理结果',
        manual_adjust: '人工信用调整',
      };
      return {
        id: uuidv4(),
        userId: uuidv4(),
        type,
        title: titleMap[type] || '信用事件',
        description: positive ? '保持良好的履约行为，继续保持哦~' : '请遵守平台规则，维护良好的信用记录。',
        scoreDelta,
        scoreBefore: Math.max(300, totalScore - random(10, 50)),
        scoreAfter: Math.max(300, totalScore - random(0, 10)),
        relatedBizType: 'Contract',
        relatedBizId: uuidv4(),
        relatedContractNo: generateRandomId('HT'),
        eventTime: randomDate(90),
        source: pick<'system' | 'manual' | 'appeal'>(['system', 'system', 'manual']),
        affectedDimensions: (positive
          ? pickMany(['behavior', 'performance', 'reputation'], random(1, 2))
          : pickMany(['behavior', 'reputation', 'performance'], random(1, 2))) as (keyof CreditDimensions)[],
      };
    });

    result.push({
      id: uuidv4(),
      userId: uuidv4(),
      userType: pick<'landlord' | 'tenant'>(['landlord', 'tenant']),
      userName: randomName(),
      phone: randomPhone(),
      totalScore,
      level,
      dimensions: { identity, behavior, performance, reputation, social },
      weights: {
        identity: Math.round(weights.identity * 100) / 100,
        behavior: Math.round(weights.behavior * 100) / 100,
        performance: Math.round(weights.performance * 100) / 100,
        reputation: Math.round(weights.reputation * 100) / 100,
        social: Math.round(weights.social * 100) / 100,
      },
      depositReductionRatio,
      creditLimit: Math.round(totalScore * random(8, 15)),
      usedLimit: Math.round(totalScore * random(0, 6)),
      totalKeptPromises,
      totalBreaches,
      totalContracts,
      fulfillmentRate: totalContracts === 0 ? 100 : Math.round(((totalContracts - totalBreaches) / totalContracts) * 100),
      idVerified: identity >= 60,
      faceVerified: identity >= 75,
      verifiedTime: identity >= 60 ? randomDate(365) : undefined,
      updateTime: randomDate(7),
      recentEvents,
    });
  }
  return result;
}

/**
 * 生成工单数据
 * @param count 生成数量
 */
export function generateWorkOrders(count: number = 25): ServiceWorkOrder[] {
  const result: ServiceWorkOrder[] = [];
  const statuses: ServiceWorkOrder['status'][] = [
    'pending', 'accepted', 'assigned', 'processing', 'scheduled',
    'completed', 'completed', 'completed', 'to_rate', 'closed', 'cancelled',
  ];
  const urgencies: ServiceWorkOrder['urgency'][] = ['low', 'medium', 'medium', 'medium', 'high', 'urgent'];

  for (let i = 0; i < count; i++) {
    const type = pick<ServiceWorkOrder['type']>(['repair', 'repair', 'repair', 'cleaning', 'complaint', 'consult', 'dispute', 'move', 'checkout', 'checkin']);
    const titleList = WORK_ORDER_TITLES[type] || WORK_ORDER_TITLES.repair;
    const status = pick(statuses);
    const urgency = pick(urgencies);
    const urgencyIdx = { low: 0, medium: 1, high: 2, urgent: 3 }[urgency];
    const createTime = randomDate(30);
    const coords = randomShanghaiCoords();
    const district = pick(DISTRICTS);
    const slaResponseTime = [120, 60, 30, 15][urgencyIdx];
    const slaHandleTime = [1440, 720, 360, 120][urgencyIdx];

    const timeline: OrderTimelineItem[] = [];
    timeline.push({
      id: uuidv4(),
      time: createTime,
      type: 'create',
      title: '工单已创建',
      description: '等待客服受理',
      operatorName: '用户',
      operatorRole: pick<'tenant' | 'landlord'>(['tenant', 'landlord']),
    });

    if (status !== 'pending') {
      timeline.push({
        id: uuidv4(),
        time: dayjs(createTime).add(random(1, slaResponseTime - 5), 'minute').format('YYYY-MM-DD HH:mm:ss'),
        type: 'accept',
        title: '客服已受理',
        description: '工单已分配至对应业务组',
        operatorName: randomName(),
        operatorRole: '客服专员',
      });
    }

    const needEmergency = urgency === 'urgent' && type === 'repair' && random(0, 100) < 30;
    let engineerName = randomName();

    if (['assigned', 'processing', 'scheduled', 'completed', 'to_rate', 'closed'].includes(status)) {
      const dispatchTime = dayjs(timeline[1].time).add(random(5, 60), 'minute');
      timeline.push({
        id: uuidv4(),
        time: dispatchTime.format('YYYY-MM-DD HH:mm:ss'),
        type: 'dispatch',
        title: '已派单给工程师',
        description: `${engineerName} 将为您服务，联系电话:${randomPhone()}`,
        operatorName: randomName(),
        operatorRole: '调度员',
      });

      if (['scheduled', 'completed', 'to_rate', 'closed'].includes(status)) {
        timeline.push({
          id: uuidv4(),
          time: dispatchTime.add(random(1, 24), 'hour').format('YYYY-MM-DD HH:mm:ss'),
          type: 'process',
          title: '已预约上门时间',
          description: '工程师已联系客户确认上门时间',
          operatorName: engineerName,
          operatorRole: '服务工程师',
        });
      }

      if (['completed', 'to_rate', 'closed'].includes(status)) {
        const visitTime = dispatchTime.add(random(2, 72), 'hour');
        timeline.push({
          id: uuidv4(),
          time: visitTime.format('YYYY-MM-DD HH:mm:ss'),
          type: 'visit',
          title: '工程师已上门',
          description: '开始处理问题',
          operatorName: engineerName,
          operatorRole: '服务工程师',
          images: [`https://picsum.photos/seed/visit-${i}/600/400`],
        });

        const completeTime = visitTime.add(random(30, 300), 'minute');
        timeline.push({
          id: uuidv4(),
          time: completeTime.format('YYYY-MM-DD HH:mm:ss'),
          type: 'complete',
          title: '服务已完成',
          description: type === 'repair' ? '问题已修复，设备恢复正常' : '服务已完成，请确认',
          operatorName: engineerName,
          operatorRole: '服务工程师',
          images: type === 'repair' ? [
            `https://picsum.photos/seed/after-${i}-1/600/400`,
            `https://picsum.photos/seed/after-${i}-2/600/400`,
          ] : undefined,
        });
      }

      if (['closed'].includes(status)) {
        timeline.push({
          id: uuidv4(),
          time: dayjs().subtract(random(0, 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
          type: 'close',
          title: '工单已关闭',
          description: random(0, 1) ? '用户已评价，服务结束' : '超时未评价，自动关闭',
          operatorName: '系统',
          operatorRole: 'system',
        });
      }
    }

    if (status === 'cancelled') {
      timeline.push({
        id: uuidv4(),
        time: dayjs(createTime).add(random(1, 120), 'minute').format('YYYY-MM-DD HH:mm:ss'),
        type: 'close',
        title: '工单已取消',
        description: pick(['用户主动取消', '问题已自行解决', '信息有误需重新提交']),
        operatorName: '用户',
        operatorRole: pick<'tenant' | 'landlord'>(['tenant', 'landlord']),
      });
    }

    const hasAssignee = ['assigned', 'processing', 'scheduled', 'completed', 'to_rate', 'closed'].includes(status);
    const firstResponseTime = status !== 'pending' ? random(2, slaResponseTime - 1) : undefined;

    result.push({
      id: uuidv4(),
      orderNo: generateRandomId('GD'),
      type,
      title: pick(titleList),
      description: '详细问题描述：' + pick(titleList) + '，请尽快安排处理。',
      submitterId: uuidv4(),
      submitterName: randomName(),
      submitterPhone: randomPhone(),
      submitterRole: pick<'tenant' | 'landlord' | 'staff'>(['tenant', 'landlord']),
      propertyId: uuidv4(),
      propertyAddress: `上海市${district}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
      latitude: coords.lat,
      longitude: coords.lng,
      contractId: uuidv4(),
      contractNo: generateRandomId('HT'),
      status,
      urgency,
      attachments: type === 'repair' ? Array.from({ length: random(1, 3) }, (_, j) => `https://picsum.photos/seed/worder-${i}-${j}/600/400`) : [],
      tags: type === 'repair' ? pickMany(REPAIR_CATEGORIES, random(1, 2)) : [],
      assigneeEngineerId: hasAssignee ? uuidv4() : undefined,
      assigneeEngineerName: hasAssignee ? engineerName : undefined,
      assigneeEngineerPhone: hasAssignee ? randomPhone() : undefined,
      dispatchMode: hasAssignee ? pick<'auto' | 'manual' | 'grab'>(['auto', 'auto', 'manual']) : undefined,
      dispatchTime: hasAssignee ? timeline.find(t => t.type === 'dispatch')?.time : undefined,
      expectedVisitTime: ['scheduled', 'completed', 'to_rate', 'closed'].includes(status)
        ? dayjs(timeline[2].time).add(random(1, 48), 'hour').format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      actualVisitTime: ['completed', 'to_rate', 'closed'].includes(status)
        ? timeline.find(t => t.type === 'visit')?.time
        : undefined,
      completeTime: ['completed', 'to_rate', 'closed'].includes(status)
        ? timeline.find(t => t.type === 'complete')?.time
        : undefined,
      estimatedDuration: type === 'repair' ? random(30, 240) : random(30, 120),
      actualDuration: ['completed', 'to_rate', 'closed'].includes(status) ? random(20, 300) : undefined,
      needPayment: type === 'repair' && random(0, 100) < 25,
      estimatedCost: type === 'repair' ? random(0, 800) : random(0, 500),
      actualCost: ['completed', 'to_rate', 'closed'].includes(status) ? random(0, 1000) : undefined,
      costPayer: type === 'repair' ? pick<'tenant' | 'landlord' | 'platform' | 'shared'>(['landlord', 'landlord', 'platform', 'shared']) : undefined,
      category: type === 'repair' ? pick(REPAIR_CATEGORIES) : undefined,
      rootCause: type === 'repair' && ['completed', 'to_rate', 'closed'].includes(status)
        ? pick(['配件老化', '使用不当', '安装质量问题', '自然损耗', '外部因素'])
        : undefined,
      solution: type === 'repair' && ['completed', 'to_rate', 'closed'].includes(status)
        ? pick(['更换配件', '维修调试', '重新安装', '清理疏通', '整机更换'])
        : undefined,
      userRating: ['completed', 'to_rate', 'closed'].includes(status) && random(0, 100) < 70 ? pick([4, 5, 5, 5, 3]) : undefined,
      userComment: status === 'closed' ? pick(['服务态度很好，问题解决了', '效率高，下次还选你们', '一般般，有待改进', '非常满意，强烈推荐']) : undefined,
      slaResponseTime,
      slaHandleTime,
      firstResponseTime,
      slaMet: firstResponseTime ? firstResponseTime < slaResponseTime : undefined,
      needEmergencyPlacement: needEmergency,
      emergencyPlacementId: needEmergency ? uuidv4() : undefined,
      timeline,
      createTime,
      closeTime: status === 'closed' ? timeline.find(t => t.type === 'close')?.time : undefined,
    });
  }
  return result;
}

/**
 * 生成应急安置
 * @param count 生成数量
 */
export function generateEmergencyPlacements(count: number = 10): EmergencyPlacement[] {
  const result: EmergencyPlacement[] = [];
  const statuses: EmergencyPlacement['status'][] = ['placed', 'placed', 'extended', 'returned', 'settled', 'arranging', 'pending'];

  for (let i = 0; i < count; i++) {
    const status = pick(statuses);
    const originalCoords = randomShanghaiCoords();
    const hotelCoords = {
      lat: Number((originalCoords.lat + random(-200, 200) / 10000).toFixed(6)),
      lng: Number((originalCoords.lng + random(-200, 200) / 10000).toFixed(6)),
    };
    const checkIn = dayjs(randomDate(30));
    const stayDays = random(1, 14);
    const extendCount = status === 'extended' ? random(1, 3) : 0;
    const actualStayDays = stayDays + extendCount * random(1, 3);
    const hotelPrice = random(250, 800);
    const estimatedCost = hotelPrice * stayDays;
    const hotelStars = random(2, 5);
    const hotelName = pick(HOTEL_NAMES);
    const roomType = pick(['标准间', '大床房', '双床房', '家庭房', '豪华套房']);

    const timeline: EmergencyTimelineItem[] = [];
    timeline.push({
      id: uuidv4(),
      time: checkIn.subtract(random(30, 120), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'apply',
      title: '提交应急安置申请',
      description: '因房屋突发状况，需要临时安置',
      operatorName: randomName(),
    });
    timeline.push({
      id: uuidv4(),
      time: checkIn.subtract(random(10, 25), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'approve',
      title: '安置申请已批准',
      description: '已匹配附近合作酒店',
      operatorName: randomName(),
      costChange: estimatedCost,
    });
    if (['placed', 'extended', 'returned', 'settled'].includes(status)) {
      timeline.push({
        id: uuidv4(),
        time: checkIn.format('YYYY-MM-DD HH:mm:ss'),
        type: 'arrange',
        title: `已安排${hotelName}`,
        description: `已预订${hotelStars}星级酒店 ${roomType} ${actualStayDays}晚`,
        operatorName: '安置专员',
      });
      timeline.push({
        id: uuidv4(),
        time: checkIn.add(random(10, 60), 'minute').format('YYYY-MM-DD HH:mm:ss'),
        type: 'checkin',
        title: '已办理入住',
        description: '客户已顺利入住酒店',
        operatorName: '酒店前台',
      });
    }
    if (status === 'extended') {
      for (let e = 0; e < extendCount; e++) {
        timeline.push({
          id: uuidv4(),
          time: checkIn.add(stayDays + e * 2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          type: 'extend',
          title: `第${e + 1}次续住申请`,
          description: '因维修尚未完成，申请续住2晚',
          operatorName: randomName(),
          costChange: hotelPrice * 2,
        });
      }
    }
    if (['returned', 'settled'].includes(status)) {
      timeline.push({
        id: uuidv4(),
        time: checkIn.add(actualStayDays, 'day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'checkout',
        title: '已办理退房',
        description: `共入住${actualStayDays}晚，房屋维修已完成`,
        operatorName: '酒店前台',
      });
    }
    if (status === 'settled') {
      timeline.push({
        id: uuidv4(),
        time: checkIn.add(actualStayDays + random(1, 3), 'day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'settle',
        title: '费用已结算',
        description: '安置费用已完成结算和支付',
        operatorName: '财务专员',
        costChange: hotelPrice * actualStayDays,
      });
    }

    result.push({
      id: uuidv4(),
      placementNo: generateRandomId('YZ'),
      workOrderId: uuidv4(),
      workOrderNo: generateRandomId('GD'),
      applicantName: randomName(),
      applicantPhone: randomPhone(),
      originalPropertyId: uuidv4(),
      originalPropertyAddress: `上海市${pick(DISTRICTS)}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
      originalLatitude: originalCoords.lat,
      originalLongitude: originalCoords.lng,
      reason: pick(['水管爆裂全屋进水', '燃气泄漏需紧急疏散', '房屋火灾受损', '大面积电路故障', '结构性安全隐患', '严重虫害无法居住']),
      status,
      personCount: random(1, 4),
      hotelName,
      hotelAddress: `上海市${pick(DISTRICTS)}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
      hotelLatitude: hotelCoords.lat,
      hotelLongitude: hotelCoords.lng,
      hotelStars,
      roomType,
      roomNo: random(0, 100) > 10 ? `${random(1, 40)}${String(random(1, 28)).padStart(2, '0')}` : undefined,
      checkInTime: checkIn.format('YYYY-MM-DD HH:mm:ss'),
      expectedCheckOutTime: checkIn.add(stayDays, 'day').format('YYYY-MM-DD HH:mm:ss'),
      actualCheckOutTime: ['returned', 'settled'].includes(status)
        ? checkIn.add(actualStayDays, 'day').format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      stayDays,
      extendCount,
      estimatedCost,
      actualCost: ['returned', 'settled'].includes(status) ? hotelPrice * actualStayDays + random(0, 200) : undefined,
      costPayer: pick<'landlord' | 'platform' | 'shared' | 'insurance'>(['landlord', 'platform', 'shared', 'insurance']),
      insuranceClaimNo: random(0, 100) < 40 ? `BX${generateRandomId('')}` : undefined,
      checkInVoucherUrl: ['placed', 'extended', 'returned', 'settled'].includes(status) ? `https://example.com/vouchers/${uuidv4()}.pdf` : undefined,
      checkOutVoucherUrl: ['returned', 'settled'].includes(status) ? `https://example.com/vouchers/${uuidv4()}.pdf` : undefined,
      timeline,
      createTime: checkIn.subtract(random(60, 180), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      settlementTime: status === 'settled' ? timeline.find(t => t.type === 'settle')?.time : undefined,
    });
  }
  return result;
}

/**
 * 生成审计日志
 * @param count 生成数量
 */
export function generateAuditLogs(count: number = 30): AuditLog[] {
  const result: AuditLog[] = [];

  for (let i = 0; i < count; i++) {
    const module = pick(AUDIT_MODULES);
    const actionType = pick(AUDIT_ACTIONS);
    const success = random(0, 100) > 5;
    const operatorRole = pick(['超级管理员', '审核专员', '客服主管', '运营专员', '财务专员', '系统管理员', '调度员']);
    const deptMap: Record<string, string> = {
      '超级管理员': '技术部',
      '审核专员': '风控审核部',
      '客服主管': '客户服务部',
      '运营专员': '运营部',
      '财务专员': '财务部',
      '系统管理员': '技术部',
      '调度员': '运营部',
    };

    const dataChanges: DataChangeItem[] = actionType === 'update' ? [
      { field: 'status', fieldLabel: '状态', oldValue: 'pending', newValue: 'approved', changeType: 'modify' },
      { field: 'remark', fieldLabel: '备注', oldValue: '', newValue: '审核通过', changeType: 'add' },
    ] : actionType === 'create' ? [
      { field: 'id', fieldLabel: 'ID', oldValue: null, newValue: uuidv4(), changeType: 'add' },
    ] : [];

    const actionDescMap: Record<string, Record<string, string>> = {
      '房东准入': { create: '创建房东准入申请', update: '更新申请状态', approve: '审核通过准入申请', reject: '审核拒绝准入申请' },
      '房源管理': { create: '新增房源信息', update: '更新房源信息', delete: '删除房源记录' },
      '合同管理': { create: '创建新合同', sign: '完成合同签署', update: '更新合同条款', settle: '合同费用结算' },
      '信用管理': { update: '调整用户信用分' },
      '工单服务': { create: '创建服务工单', assign: '指派服务工程师', update: '更新工单状态', settle: '工单费用结算' },
      '应急安置': { create: '创建应急安置', approve: '审批安置申请', settle: '安置费用结算' },
      '财务管理': { settle: '租金结算', refund: '押金退还', export: '导出财务报表' },
      '系统配置': { update: '修改系统配置' },
      '用户管理': { create: '创建用户账号', update: '更新用户信息', login: '用户登录系统', logout: '用户登出' },
    };

    const descs = actionDescMap[module] || {};
    const actionDesc = descs[actionType] || `${actionType} 操作`;

    const urlMap: Record<string, string> = {
      create: 'POST', update: 'PUT', delete: 'DELETE', query: 'GET',
      export: 'GET', import: 'POST', approve: 'POST', reject: 'POST',
      sign: 'POST', login: 'POST', logout: 'POST', assign: 'POST', settle: 'POST', refund: 'POST',
    };

    result.push({
      id: uuidv4(),
      traceId: uuidv4().replace(/-/g, ''),
      operateTime: randomDate(7),
      operatorId: uuidv4(),
      operatorName: randomName(),
      operatorRole,
      operatorDept: deptMap[operatorRole],
      operatorIp: `${random(10, 255)}.${random(0, 255)}.${random(0, 255)}.${random(0, 255)}`,
      operatorUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      operatorLocation: random(0, 100) > 30 ? `上海市${pick(DISTRICTS)}` : '未知',
      module,
      bizType: pick(AUDIT_BIZ_TYPES),
      actionType,
      actionDesc,
      bizId: !['login', 'logout', 'export'].includes(actionType) ? uuidv4() : undefined,
      bizNo: !['login', 'logout', 'export'].includes(actionType) ? generateRandomId(pick(['FD', 'FY', 'HT', 'GD', 'YZ'])) : undefined,
      requestUrl: `/api/${module}/${actionType}`,
      requestMethod: urlMap[actionType],
      requestParams: success ? '{}' : undefined,
      responseSummary: success ? '操作成功' : '操作失败：参数校验错误',
      dataChanges,
      success,
      errorMsg: success ? undefined : pick(['参数校验失败', '权限不足', '资源不存在', '数据库操作失败', '网络超时']),
      duration: random(15, 5000),
    });
  }
  return result.sort((a, b) => dayjs(b.operateTime).valueOf() - dayjs(a.operateTime).valueOf());
}

/**
 * 生成看板指标数据
 */
export function generateDashboardMetrics(): DashboardMetrics {
  const today = {
    newApplications: random(15, 60),
    newContracts: random(10, 45),
    newWorkOrders: random(25, 120),
    rentTurnover: random(50000, 500000),
  };
  const weekOverWeek = {
    applications: Number((random(-250, 350) / 10).toFixed(1)),
    contracts: Number((random(-200, 300) / 10).toFixed(1)),
    workOrders: Number((random(-300, 400) / 10).toFixed(1)),
    rentTurnover: Number((random(-150, 400) / 10).toFixed(1)),
  };
  const totals = {
    activeProperties: random(1500, 5000),
    activeContracts: random(1200, 4500),
    totalServices: random(50000, 200000),
    totalRentTurnover: random(50000000, 200000000),
  };

  const metricCards: MetricCard[] = [
    {
      id: uuidv4(), key: 'newApplications', title: '今日新增申请', value: today.newApplications,
      unit: '单', valueType: 'number', change: weekOverWeek.applications,
      changeType: weekOverWeek.applications >= 0 ? 'up' : 'down', changePositive: weekOverWeek.applications >= 0,
      changeLabel: '周环比', icon: 'FilePlus2', theme: 'blue', sortOrder: 1,
    },
    {
      id: uuidv4(), key: 'newContracts', title: '今日新增合同', value: today.newContracts,
      unit: '份', valueType: 'number', change: weekOverWeek.contracts,
      changeType: weekOverWeek.contracts >= 0 ? 'up' : 'down', changePositive: weekOverWeek.contracts >= 0,
      changeLabel: '周环比', icon: 'FileSignature', theme: 'green', sortOrder: 2,
    },
    {
      id: uuidv4(), key: 'newWorkOrders', title: '今日新增工单', value: today.newWorkOrders,
      unit: '单', valueType: 'number', change: weekOverWeek.workOrders,
      changeType: weekOverWeek.workOrders >= 0 ? 'up' : 'down', changePositive: weekOverWeek.workOrders <= 0,
      changeLabel: '周环比', icon: 'Headphones', theme: 'orange', sortOrder: 3,
    },
    {
      id: uuidv4(), key: 'rentTurnover', title: '今日租金流水', value: today.rentTurnover,
      unit: '元', valueType: 'money', change: weekOverWeek.rentTurnover,
      changeType: weekOverWeek.rentTurnover >= 0 ? 'up' : 'down', changePositive: weekOverWeek.rentTurnover >= 0,
      changeLabel: '周环比', icon: 'DollarSign', theme: 'purple', sortOrder: 4,
    },
    {
      id: uuidv4(), key: 'activeProperties', title: '在租房源数', value: totals.activeProperties,
      unit: '套', valueType: 'number', icon: 'Home', theme: 'cyan', sortOrder: 5,
    },
    {
      id: uuidv4(), key: 'activeContracts', title: '履行中合同', value: totals.activeContracts,
      unit: '份', valueType: 'number', icon: 'FileCheck', theme: 'blue', sortOrder: 6,
    },
  ];

  return {
    today,
    weekOverWeek,
    totals,
    verification: {
      pendingApplications: random(30, 200),
      passRate: Number((random(780, 950) / 10).toFixed(1)),
      avgAuditHours: Number((random(12, 720) / 10).toFixed(1)),
    },
    contractPerformance: {
      fulfillmentRate: Number((random(920, 985) / 10).toFixed(1)),
      rentCollectionRate: Number((random(880, 970) / 10).toFixed(1)),
      overdueContracts: random(5, 80),
    },
    workOrderService: {
      pendingOrders: random(20, 150),
      avgResponseMinutes: random(8, 50),
      praiseRate: Number((random(900, 980) / 10).toFixed(1)),
      slaComplianceRate: Number((random(880, 970) / 10).toFixed(1)),
    },
    creditDeposit: {
      waiverUsers: random(500, 3500),
      totalWaiverAmount: random(5000000, 30000000),
      badDebtRate: Number((random(1, 80) / 100).toFixed(2)),
    },
    emergency: {
      activePlacements: random(3, 40),
      totalPlacements: random(200, 2000),
      responseWithin30Rate: Number((random(850, 980) / 10).toFixed(1)),
    },
    metricCards,
  };
}

/**
 * 生成热力图数据
 * @param count 生成数量
 */
export function generateHeatmapPoints(count: number = 100): MapHeatmapPoint[] {
  const result: MapHeatmapPoint[] = [];
  const categories: MapHeatmapPoint['category'][] = ['property', 'workorder', 'contract', 'repair'];
  const shanghaiLat = 31.2304;
  const shanghaiLng = 121.4737;

  for (let i = 0; i < count; i++) {
    const lat = shanghaiLat + (random(-600, 600) / 10000);
    const lng = shanghaiLng + (random(-700, 700) / 10000);
    const category = pick(categories);
    result.push({
      id: uuidv4(),
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      weight: random(1, 100),
      category,
      city: '上海市',
      district: pick(DISTRICTS),
      count: random(1, 50),
      name: category === 'property' ? pick(COMMUNITIES) : category === 'workorder' ? pick(REPAIR_CATEGORIES) : '区域中心',
      address: `上海市${pick(DISTRICTS)}${pick(STREET_PREFIXES)}${random(1, 2000)}号`,
    });
  }
  return result;
}
