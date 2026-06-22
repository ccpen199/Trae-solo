import dayjs from 'dayjs';
import type {
  Property,
  Tenant,
  Bill,
  LeaseTemplate,
  OperationLogEntry,
  Meter,
  FeeItem,
} from '@/types';
import { uid } from '@/types';

const now = dayjs();

function monthsAgo(n: number): string {
  return now.subtract(n, 'month').format('YYYY-MM-DD');
}
function startOfMonth(offset = 0): string {
  return now.add(offset, 'month').startOf('month').format('YYYY-MM-DD');
}
function endOfMonth(offset = 0): string {
  return now.add(offset, 'month').endOf('month').format('YYYY-MM-DD');
}
function plusDays(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
}

const metersA = (): Meter[] => [
  {
    id: uid('m_'),
    type: 'water',
    meterNo: 'W-2024001',
    unitPrice: 5.0,
    tieredPricing: [
      { from: 0, to: 10, price: 4.5 },
      { from: 10, to: 20, price: 5.5 },
      { from: 20, price: 7.5 },
    ],
    lastReading: 428,
    lastReadingDate: startOfMonth(-1),
  },
  {
    id: uid('m_'),
    type: 'electricity',
    meterNo: 'E-2024001',
    unitPrice: 0.65,
    tieredPricing: [
      { from: 0, to: 200, price: 0.55 },
      { from: 200, to: 400, price: 0.68 },
      { from: 400, price: 0.88 },
    ],
    lastReading: 10842,
    lastReadingDate: startOfMonth(-1),
  },
  {
    id: uid('m_'),
    type: 'gas',
    meterNo: 'G-2024001',
    unitPrice: 2.8,
    lastReading: 312,
    lastReadingDate: startOfMonth(-1),
  },
];

const metersB = (): Meter[] => [
  {
    id: uid('m_'),
    type: 'water',
    meterNo: 'W-2024002',
    unitPrice: 5.0,
    lastReading: 205,
    lastReadingDate: startOfMonth(-1),
  },
  {
    id: uid('m_'),
    type: 'electricity',
    meterNo: 'E-2024002',
    unitPrice: 0.65,
    lastReading: 5620,
    lastReadingDate: startOfMonth(-1),
  },
];

const metersC = (): Meter[] => [
  {
    id: uid('m_'),
    type: 'water',
    meterNo: 'W-2024003',
    unitPrice: 4.8,
    lastReading: 108,
    lastReadingDate: startOfMonth(-1),
  },
  {
    id: uid('m_'),
    type: 'electricity',
    meterNo: 'E-2024003',
    unitPrice: 0.6,
    lastReading: 3015,
    lastReadingDate: startOfMonth(-1),
  },
  {
    id: uid('m_'),
    type: 'gas',
    meterNo: 'G-2024003',
    unitPrice: 2.6,
    lastReading: 88,
    lastReadingDate: startOfMonth(-1),
  },
];

const metersD = (): Meter[] => [
  {
    id: uid('m_'),
    type: 'water',
    meterNo: 'W-2024004',
    unitPrice: 5.0,
    lastReading: 0,
    lastReadingDate: startOfMonth(-1),
  },
];

export const mockProperties: Property[] = [
  {
    id: 'prop_001',
    title: '国贸CBD精装两居',
    address: '北京市朝阳区建国路88号现代城15栋2301',
    area: 89,
    layout: '2室1厅1卫',
    floor: '23/32',
    decoration: '精装修',
    monthlyRent: 7800,
    status: 'rented',
    landlordPhone: '13800000001',
    meters: metersA(),
    createdAt: monthsAgo(11),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'prop_002',
    title: '望京SOHO阳光一居',
    address: '北京市朝阳区望京街9号望京SOHO T2-1105',
    area: 58,
    layout: '1室1厅1卫',
    floor: '11/28',
    decoration: '精装修',
    monthlyRent: 5500,
    status: 'rented',
    landlordPhone: '13800000001',
    meters: metersB(),
    createdAt: monthsAgo(9),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'prop_003',
    title: '回龙观温馨三居室',
    address: '北京市昌平区回龙观东大街33号龙跃苑3区6栋3单元501',
    area: 112,
    layout: '3室2厅2卫',
    floor: '5/6',
    decoration: '简装',
    monthlyRent: 6200,
    status: 'rented',
    landlordPhone: '13800000001',
    meters: metersC(),
    createdAt: monthsAgo(7),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'prop_004',
    title: '五道口学区房两居',
    address: '北京市海淀区成府路28号华清嘉园8栋1202',
    area: 76,
    layout: '2室1厅1卫',
    floor: '12/18',
    decoration: '精装',
    monthlyRent: 8800,
    status: 'vacant',
    landlordPhone: '13800000001',
    meters: metersD(),
    createdAt: monthsAgo(5),
    updatedAt: startOfMonth(0),
  },
  {
    id: 'prop_005',
    title: '双井地铁口LOFT',
    address: '北京市朝阳区广渠路31号合生汇国际公寓B座1506',
    area: 65,
    layout: 'LOFT 1居',
    floor: '15/22',
    decoration: '豪装',
    monthlyRent: 9200,
    status: 'maintenance',
    landlordPhone: '13800000001',
    meters: metersB(),
    createdAt: monthsAgo(3),
    updatedAt: startOfMonth(0),
  },
  {
    id: 'prop_006',
    title: '通州北苑精装三居',
    address: '北京市通州区新华大街50号万达广场3号楼1203',
    area: 105,
    layout: '3室2厅1卫',
    floor: '12/25',
    decoration: '精装',
    monthlyRent: 5800,
    status: 'vacant',
    landlordPhone: '13800000001',
    meters: metersC(),
    createdAt: monthsAgo(2),
    updatedAt: startOfMonth(0),
  },
];

export const mockTenants: Tenant[] = [
  {
    id: 'ten_001',
    name: '李明华',
    phone: '13912345678',
    idCard: {
      name: '李明华',
      gender: '男',
      nation: '汉',
      birth: '1992-03-15',
      address: '北京市朝阳区建国路88号现代城15栋2301',
      idNo: '110105199203158817',
      issuingAuthority: '朝阳分局',
      validPeriod: '2020.03.15-2040.03.15',
    },
    faceVerify: { passed: true, score: 0.96, timestamp: monthsAgo(10) },
    verifyStatus: 'verified',
    status: 'living',
    propertyId: 'prop_001',
    moveInDate: startOfMonth(-10),
    emergencyContact: '13912345679',
    remark: '职业：互联网工程师 · 优秀租客',
    createdAt: monthsAgo(10),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'ten_002',
    name: '王思琪',
    phone: '13887654321',
    idCard: {
      name: '王思琪',
      gender: '女',
      nation: '汉',
      birth: '1995-08-22',
      address: '上海市浦东新区世纪大道100号',
      idNo: '310115199508225647',
      issuingAuthority: '浦东分局',
      validPeriod: '2021.08.22-2041.08.22',
    },
    faceVerify: { passed: true, score: 0.92, timestamp: monthsAgo(8) },
    verifyStatus: 'verified',
    status: 'living',
    propertyId: 'prop_002',
    moveInDate: startOfMonth(-8),
    remark: '职业：设计师 · 季付租客',
    createdAt: monthsAgo(8),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'ten_003',
    name: '张晓明',
    phone: '13700001234',
    idCard: {
      name: '张晓明',
      gender: '男',
      nation: '汉',
      birth: '1988-11-05',
      address: '河北省石家庄市桥西区中山西路100号',
      idNo: '130104198811058832',
      issuingAuthority: '桥西分局',
      validPeriod: '2019.11.05-2039.11.05',
    },
    faceVerify: { passed: true, score: 0.89, timestamp: monthsAgo(6) },
    verifyStatus: 'verified',
    status: 'living',
    propertyId: 'prop_003',
    moveInDate: startOfMonth(-6),
    emergencyContact: '13700005678',
    remark: '一家五口 · 半年付',
    createdAt: monthsAgo(6),
    updatedAt: startOfMonth(-1),
  },
  {
    id: 'ten_004',
    name: '陈美琳',
    phone: '13622223333',
    idCard: {
      name: '陈美琳',
      gender: '女',
      nation: '汉',
      birth: '1998-01-20',
      address: '湖南省长沙市岳麓区麓山南路1号',
      idNo: '430104199801208865',
      issuingAuthority: '岳麓分局',
      validPeriod: '2022.01.20-2042.01.20',
    },
    faceVerify: { passed: false, score: 0.42, timestamp: monthsAgo(1) },
    verifyStatus: 'ocr_done',
    status: 'pending',
    moveInDate: startOfMonth(1),
    remark: '新租客 · 待完成人脸核验',
    createdAt: monthsAgo(1),
    updatedAt: startOfMonth(0),
  },
  {
    id: 'ten_005',
    name: '赵小龙',
    phone: '13555556666',
    idCard: {
      name: '赵小龙',
      gender: '男',
      nation: '汉',
      birth: '1990-06-18',
      address: '山东省济南市历下区泉城路88号',
      idNo: '370102199006188854',
      issuingAuthority: '历下分局',
      validPeriod: '2020.06.18-2040.06.18',
    },
    faceVerify: { passed: true, score: 0.94, timestamp: monthsAgo(12) },
    verifyStatus: 'verified',
    status: 'moved',
    propertyId: 'prop_005',
    moveInDate: startOfMonth(-12),
    moveOutDate: endOfMonth(-1),
    remark: '已退租 · 退房验收完成',
    createdAt: monthsAgo(12),
    updatedAt: endOfMonth(-1),
  },
];

function buildRentItem(monthlyRent: number, offset: number): FeeItem {
  return {
    id: uid('fee_'),
    type: 'rent',
    name: `房屋租金 (${now.add(offset, 'month').format('YYYY年MM月')})`,
    amount: monthlyRent,
    calculation: `${startOfMonth(offset)} ~ ${endOfMonth(offset)} 月租`,
  };
}
function buildWaterItem(readingStart: number, readingEnd: number, offset = 0): FeeItem {
  const usage = readingEnd - readingStart;
  const amount = Math.round(usage * 5.0 * 100) / 100;
  return {
    id: uid('fee_'),
    type: 'water',
    name: `水费 (${now.add(offset, 'month').format('YYYY-MM')})`,
    amount,
    calculation: `(${readingEnd}-${readingStart})×5.00`,
    readingStart,
    readingEnd,
    usage,
  };
}
function buildElectricItem(readingStart: number, readingEnd: number, offset = 0): FeeItem {
  const usage = readingEnd - readingStart;
  const amount = Math.round(usage * 0.65 * 100) / 100;
  return {
    id: uid('fee_'),
    type: 'electricity',
    name: `电费 (${now.add(offset, 'month').format('YYYY-MM')})`,
    amount,
    calculation: `(${readingEnd}-${readingStart})×0.65`,
    readingStart,
    readingEnd,
    usage,
  };
}
function buildGasItem(readingStart: number, readingEnd: number, offset = 0): FeeItem {
  const usage = readingEnd - readingStart;
  const amount = Math.round(usage * 2.8 * 100) / 100;
  return {
    id: uid('fee_'),
    type: 'gas',
    name: `燃气费 (${now.add(offset, 'month').format('YYYY-MM')})`,
    amount,
    calculation: `(${readingEnd}-${readingStart})×2.80`,
    readingStart,
    readingEnd,
    usage,
  };
}
function buildPropertyFee(monthlyRent: number): FeeItem {
  const fee = Math.round(monthlyRent * 0.03 * 100) / 100;
  return {
    id: uid('fee_'),
    type: 'property',
    name: '物业费',
    amount: fee,
    calculation: `月租3%`,
  };
}

function makeBill(params: {
  no: number;
  propId: string;
  tenantId: string;
  offset: number;
  monthlyRent: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  utilities?: { water?: [number, number]; elec?: [number, number]; gas?: [number, number] };
}): Bill {
  const items: FeeItem[] = [buildRentItem(params.monthlyRent, params.offset)];
  if (params.utilities?.water) items.push(buildWaterItem(...params.utilities.water, params.offset));
  if (params.utilities?.elec) items.push(buildElectricItem(...params.utilities.elec, params.offset));
  if (params.utilities?.gas) items.push(buildGasItem(...params.utilities.gas, params.offset));
  items.push(buildPropertyFee(params.monthlyRent));
  const total = items.reduce((s, it) => s + it.amount, 0);
  return {
    id: `bill_${params.no.toString().padStart(3, '0')}`,
    billNo: `BL${now.add(params.offset, 'month').format('YYYYMM')}${String(
      1000 + params.no
    )}`,
    propertyId: params.propId,
    tenantId: params.tenantId,
    periodStart: startOfMonth(params.offset),
    periodEnd: endOfMonth(params.offset),
    dueDate: params.dueDate,
    cycleType: 'monthly',
    autoRenew: true,
    items,
    totalAmount: Math.round(total * 100) / 100,
    paidAmount:
      params.status === 'paid'
        ? Math.round(total * 100) / 100
        : params.status === 'partial'
          ? Math.round(total * 5000) / 100
          : 0,
    status: params.status,
    payments:
      params.status !== 'pending'
        ? [
            {
              id: uid('pay_'),
              amount:
                params.status === 'paid'
                  ? Math.round(total * 100) / 100
                  : Math.round(total * 5000) / 100,
              method: 'transfer',
              paidAt: plusDays(startOfMonth(params.offset), 5),
              remark: params.status === 'paid' ? '银行转账全额支付' : '首付款50%',
              operator: '房东（管理员）',
            },
          ]
        : [],
    createdAt: startOfMonth(params.offset),
    updatedAt: startOfMonth(params.offset),
  };
}

export const mockBills: Bill[] = [
  makeBill({
    no: 1,
    propId: 'prop_001',
    tenantId: 'ten_001',
    offset: 0,
    monthlyRent: 7800,
    dueDate: plusDays(startOfMonth(0), 10),
    status: 'pending',
    utilities: { water: [428, 445], elec: [10842, 11085], gas: [312, 328] },
  }),
  makeBill({
    no: 2,
    propId: 'prop_002',
    tenantId: 'ten_002',
    offset: 0,
    monthlyRent: 5500,
    dueDate: plusDays(startOfMonth(0), 10),
    status: 'partial',
    utilities: { water: [205, 220], elec: [5620, 5812] },
  }),
  makeBill({
    no: 3,
    propId: 'prop_003',
    tenantId: 'ten_003',
    offset: 0,
    monthlyRent: 6200,
    dueDate: plusDays(startOfMonth(0), 2),
    status: 'overdue',
    utilities: { water: [108, 126], elec: [3015, 3280], gas: [88, 105] },
  }),
  makeBill({
    no: 4,
    propId: 'prop_001',
    tenantId: 'ten_001',
    offset: -1,
    monthlyRent: 7800,
    dueDate: plusDays(startOfMonth(-1), 10),
    status: 'paid',
    utilities: { water: [410, 428], elec: [10610, 10842], gas: [298, 312] },
  }),
  makeBill({
    no: 5,
    propId: 'prop_002',
    tenantId: 'ten_002',
    offset: -1,
    monthlyRent: 5500,
    dueDate: plusDays(startOfMonth(-1), 10),
    status: 'paid',
    utilities: { water: [190, 205], elec: [5440, 5620] },
  }),
  makeBill({
    no: 6,
    propId: 'prop_003',
    tenantId: 'ten_003',
    offset: -1,
    monthlyRent: 6200,
    dueDate: plusDays(startOfMonth(-1), 10),
    status: 'paid',
    utilities: { water: [92, 108], elec: [2820, 3015], gas: [72, 88] },
  }),
  makeBill({
    no: 7,
    propId: 'prop_001',
    tenantId: 'ten_001',
    offset: -2,
    monthlyRent: 7800,
    dueDate: plusDays(startOfMonth(-2), 10),
    status: 'paid',
    utilities: { water: [396, 410], elec: [10400, 10610], gas: [285, 298] },
  }),
  makeBill({
    no: 8,
    propId: 'prop_002',
    tenantId: 'ten_002',
    offset: -2,
    monthlyRent: 5500,
    dueDate: plusDays(startOfMonth(-2), 10),
    status: 'paid',
    utilities: { water: [178, 190], elec: [5280, 5440] },
  }),
  makeBill({
    no: 9,
    propId: 'prop_001',
    tenantId: 'ten_001',
    offset: -3,
    monthlyRent: 7800,
    dueDate: plusDays(startOfMonth(-3), 10),
    status: 'paid',
    utilities: { water: [385, 396], elec: [10200, 10400], gas: [270, 285] },
  }),
];

export const mockLeaseTemplates: LeaseTemplate[] = [
  {
    id: 'tpl_001',
    name: '标准租赁合同',
    description: '适用于长租（≥6个月），含完整押金条款、违约责任、维修义务，完全符合《民法典》租赁合同章节。',
    category: 'standard',
    variables: [
      'landlordName',
      'landlordIdNo',
      'tenantName',
      'tenantIdNo',
      'propertyAddress',
      'propertyArea',
      'startDate',
      'endDate',
      'monthlyRent',
      'deposit',
      'payCycle',
      'dueDay',
    ],
    createdAt: monthsAgo(12),
    content: `# 房屋租赁合同

## 第一条 当事人
甲方（出租人）：{{landlordName}} 身份证号：{{landlordIdNo}}
乙方（承租人）：{{tenantName}} 身份证号：{{tenantIdNo}}

依据《中华人民共和国民法典》第七百零三条至第七百三十四条，甲乙双方在平等、自愿、公平、诚实信用原则下，就房屋租赁事宜订立本合同，以资共同遵守。

## 第二条 租赁标的
甲方将坐落于：{{propertyAddress}}，建筑面积：{{propertyArea}}平方米的房屋出租给乙方使用。
房屋用途：居住。未经甲方书面同意，乙方不得擅自改变用途。

## 第三条 租赁期限
- 起租日：{{startDate}}
- 到期日：{{endDate}}
*提示：租赁期限不得超过20年（《民法典》第705条），超过部分无效。*

## 第四条 租金及支付方式
- 月租金：人民币 {{monthlyRent}} 元整
- 支付周期：{{payCycle}}
- 最迟支付日：每周期第{{dueDay}}日前
- 支付方式：银行转账 / 微信 / 支付宝

## 第五条 押金条款
- 履约押金：人民币 {{deposit}} 元整（不超过月租金的20%，《民法典》第586条）
- 押金支付：合同签署当日一次性支付
- 押金返还：租赁期满且乙方结清全部费用、房屋无损后30日内无息返还
- 押金扣除：甲方有权从押金中扣除乙方欠缴租金、违约金、房屋损毁赔偿金

## 第六条 费用承担
1. 租赁期内，水费、电费、燃气费、供暖费、上网费、有线电视费由乙方承担；
2. 物业费、房屋本体维修基金由甲方承担；
3. 乙方须在每期租金支付日一并提交当期水电气读数。

## 第七条 维修义务（《民法典》第712-713条）
1. 房屋主体结构、固有设施（门窗、水电管线、厨卫固定装置）由甲方负责维修；
2. 乙方添置的可移动物品由乙方自行维修；
3. 因乙方使用不当导致的损坏，由乙方承担维修及赔偿责任；
4. 甲方应在接到维修通知后72小时内派员维修，逾期乙方可自行维修，费用由甲方承担。

## 第八条 违约责任
1. **逾期付款**：乙方逾期支付租金，每逾期一日按应付未付金额的0.05%支付违约金；逾期超过15日，甲方有权解除合同（《民法典》第722条）。
2. **提前退租**：乙方提前退租，须向甲方支付[1个月租金]作为违约金；甲方有权扣除押金不足部分。
3. **甲方提前收房**：甲方无正当理由提前收回房屋，须向乙方支付[1个月租金]作为违约金，并返还剩余租金及押金。
4. **擅自转租**：乙方未经甲方书面同意转租，甲方有权解除合同，并要求乙方支付[1个月租金]违约金（《民法典》第716条）。

## 第九条 其他约定
- 买卖不破租赁：租赁期内甲方转让房屋的，本合同对受让人继续有效（《民法典》第725条）。
- 优先购买权：甲方出卖房屋应提前15日通知乙方，乙方享有同等条件下优先购买权（《民法典》第726条）。
- 争议解决：协商不成的，向房屋所在地人民法院提起诉讼。

本合同一式两份，甲乙双方各执一份，自签字之日起生效。

甲方（签字）：__________  日期：______
乙方（签字）：__________  日期：______`,
  },
  {
    id: 'tpl_002',
    name: '简版租赁合同',
    description: '适用于短租/亲友租房，条款精简，保留核心权利义务与民法典必备条款。',
    category: 'simple',
    variables: [
      'landlordName',
      'tenantName',
      'propertyAddress',
      'startDate',
      'endDate',
      'monthlyRent',
      'deposit',
    ],
    createdAt: monthsAgo(10),
    content: `# 简版房屋租赁合同

出租人（甲方）：{{landlordName}}
承租人（乙方）：{{tenantName}}

根据《中华人民共和国民法典》相关规定，双方就房屋租赁达成如下协议：

1. **房屋位置**：{{propertyAddress}}
2. **租赁期限**：{{startDate}} 至 {{endDate}}
3. **租金**：每月人民币 {{monthlyRent}} 元整，每月5日前支付。
4. **押金**：人民币 {{deposit}} 元整（≤月租金20%），合同期满无违约无息退还。
5. **费用**：水电气及生活杂费由乙方承担。
6. **维修**：房屋固有设施甲方负责，乙方人为损坏乙方赔偿。
7. **违约**：任何一方提前解约需支付1个月租金违约金。
8. **争议**：房屋所在地法院管辖。

甲方签字：__________  乙方签字：__________
签约日期：____________`,
  },
  {
    id: 'tpl_003',
    name: '合租协议',
    description: '适用于多人合租同一房源，明确各房间使用范围、公共区域规则与费用分摊。',
    category: 'shared',
    variables: [
      'landlordName',
      'tenantA',
      'tenantB',
      'propertyAddress',
      'roomA',
      'roomB',
      'startDate',
      'endDate',
      'rentA',
      'rentB',
      'depositA',
      'depositB',
    ],
    createdAt: monthsAgo(8),
    content: `# 房屋合租协议

本协议由出租人（甲方）：{{landlordName}}
与合租人（乙方1）：{{tenantA}}、（乙方2）：{{tenantB}} 共同签署。

依据《民法典》租赁合同相关规定，三方约定如下：

1. **标的房屋**：{{propertyAddress}}
   - 乙方1使用：{{roomA}}
   - 乙方2使用：{{roomB}}
   - 公共区域：客厅、厨房、卫生间共用

2. **租期**：{{startDate}} 至 {{endDate}}

3. **租金与押金**
   - 乙方1：月租金{{rentA}}元，押金{{depositA}}元
   - 乙方2：月租金{{rentB}}元，押金{{depositB}}元

4. **费用分摊**：水电气物业等公共费用，甲乙双方各承担50%。

5. **合租守则**
   - 23:00后保持安静
   - 公共区域轮流清洁，每周轮换
   - 访客留宿需提前48小时告知对方

6. **违约责任**：任一合租人提前退租，需承担1个月租金违约金。

7. **押金上限**：所有押金合计不超过月租总额20%（《民法典》第586条）。

三方签字：
甲方：__________ 乙方1：__________ 乙方2：__________
日期：__________`,
  },
];

export const mockLogs: OperationLogEntry[] = [
  {
    id: 'log_001',
    timestamp: now.subtract(1, 'hour').toISOString(),
    module: 'bill',
    action: 'update',
    operator: '房东（管理员）',
    targetId: 'bill_001',
    targetName: 'BL本月1001',
    summary: '更新账单：录入本月水电气读数并重新计算费用',
    diff: {
      totalAmount: { before: 7800, after: 8756.5 },
      items: { before: 1, after: 4 },
    },
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_002',
    timestamp: now.subtract(3, 'hour').toISOString(),
    module: 'tenant',
    action: 'verify',
    operator: '房东（管理员）',
    targetId: 'ten_004',
    targetName: '陈美琳',
    summary: '租客身份核验：完成身份证OCR识别，待人脸活体比对',
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_003',
    timestamp: now.subtract(5, 'hour').toISOString(),
    module: 'meter',
    action: 'pay',
    operator: '房东（管理员）',
    targetId: 'bill_005',
    targetName: '王思琪 · 上月账单',
    summary: '账单收款：收到银行转账 5726.50 元，已全额结清',
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_004',
    timestamp: now.subtract(1, 'day').toISOString(),
    module: 'property',
    action: 'create',
    operator: '房东（管理员）',
    targetId: 'prop_006',
    targetName: '通州北苑精装三居',
    summary: '新增房源：通州北苑精装三居，录入表计配置3项',
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_005',
    timestamp: now.subtract(2, 'day').toISOString(),
    module: 'lease',
    action: 'sign',
    operator: '房东（管理员）',
    targetId: 'ten_003',
    targetName: '张晓明 租约',
    summary: '租约签署：使用「标准租赁合同」模板，租期1年，月租金6200元，押金1240元（20%上限）',
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_006',
    timestamp: now.subtract(3, 'day').toISOString(),
    module: 'bill',
    action: 'create',
    operator: '系统（自动续期）',
    targetId: 'bill_001',
    targetName: '国贸CBD精装两居 · 本月账单',
    summary: '账单自动续期：上月账单结清后，按周期自动生成本月账单',
    ip: 'system',
    userAgent: 'system',
  },
  {
    id: 'log_007',
    timestamp: now.subtract(5, 'day').toISOString(),
    module: 'property',
    action: 'update',
    operator: '房东（管理员）',
    targetId: 'prop_005',
    targetName: '双井地铁口LOFT',
    summary: '房源状态变更：由「出租中」改为「维修中」，备注：水管漏水维修',
    diff: {
      status: { before: 'rented', after: 'maintenance' },
    },
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
  {
    id: 'log_008',
    timestamp: now.subtract(7, 'day').toISOString(),
    module: 'tenant',
    action: 'delete',
    operator: '房东（管理员）',
    targetId: 'ten_005',
    targetName: '赵小龙',
    summary: '租客退租：退房验收完成，房屋无损，押金全额退还',
    ip: '127.0.0.1 (本地演示)',
    userAgent: '房掌柜 Web / macOS Safari 17',
  },
];
