export interface CitizenCode {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'expired'
  balance: number
  expiryDate: string
}

export interface VerificationRecord {
  id: string
  type: 'subway' | 'scenic' | 'campus'
  location: string
  time: string
  status: 'success' | 'failed'
  citizenName: string
}

export interface LifecycleEvent {
  id: string
  type: 'application' | 'loss_report' | 'nfc_recharge' | 'balance_notification'
  description: string
  time: string
  amount?: number
}

export interface ScenicSpot {
  id: string
  name: string
  level: string
  district: string
  ticketPrice: number
  openHours: string
}

export interface TransitLine {
  lineName: string
  color: string
  stations: string[]
}

export interface SchoolVenue {
  id: string
  name: string
  type: '小学' | '初中' | '高中' | '大学'
  district: string
  facilities: string[]
}

export interface SocialSecurityCert {
  id: string
  name: string
  category: string
  issuer: string
  validFrom: string
  validTo: string
}

export interface DiscountActivity {
  id: string
  title: string
  type: 'transit' | 'scenic' | 'medical' | 'fitness'
  discount: string
  startDate: string
  endDate: string
  description: string
}

export interface HeatMapItem {
  district: string
  value: number
  level: 'low' | 'medium' | 'high'
}

export interface ComplaintWorkOrder {
  id: string
  category: string
  content: string
  status: 'pending' | 'processing' | 'resolved'
  dispatchBureau: string
  createTime: string
  citizenName: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsersToday: number
  totalServices: number
  totalVerifications: number
  monthlyGrowth: number
  serviceCoverage: number
}

export const citizenCodes: CitizenCode[] = [
  { id: 'cc001', name: '市民乘车码', code: 'HZBUS-2026-88001', status: 'active', balance: 156.80, expiryDate: '2028-12-31' },
  { id: 'cc002', name: '文旅体验码', code: 'HZTOUR-2026-66002', status: 'active', balance: 0, expiryDate: '2027-06-30' },
  { id: 'cc003', name: '医保电子码', code: 'HZMED-2026-44003', status: 'active', balance: 3200.00, expiryDate: '2027-12-31' },
  { id: 'cc004', name: '校园健身码', code: 'HZCAM-2026-22004', status: 'inactive', balance: 0, expiryDate: '2026-06-30' },
]

export const verificationRecords: VerificationRecord[] = [
  { id: 'vr001', type: 'subway', location: '地铁1号线·龙翔桥站', time: '2026-06-09 08:15:32', status: 'success', citizenName: '张伟' },
  { id: 'vr002', type: 'subway', location: '地铁2号线·钱江路站', time: '2026-06-09 08:42:18', status: 'success', citizenName: '李芳' },
  { id: 'vr003', type: 'scenic', location: '西湖景区·断桥入口', time: '2026-06-09 09:10:05', status: 'success', citizenName: '王强' },
  { id: 'vr004', type: 'scenic', location: '灵隐寺景区·飞来峰闸机', time: '2026-06-09 10:25:47', status: 'failed', citizenName: '赵丽' },
  { id: 'vr005', type: 'campus', location: '浙江大学紫金港校区·东门', time: '2026-06-09 07:30:00', status: 'success', citizenName: '陈明' },
  { id: 'vr006', type: 'subway', location: '地铁4号线·市民中心站', time: '2026-06-09 17:55:11', status: 'success', citizenName: '刘洋' },
  { id: 'vr007', type: 'campus', location: '杭州第二中学·南门', time: '2026-06-09 18:10:22', status: 'success', citizenName: '周婷' },
  { id: 'vr008', type: 'subway', location: '地铁3号线·武林门站', time: '2026-06-09 19:05:38', status: 'failed', citizenName: '吴刚' },
]

export const lifecycleEvents: LifecycleEvent[] = [
  { id: 'le001', type: 'application', description: '市民乘车码申请通过', time: '2026-01-15 10:30:00', amount: 0 },
  { id: 'le002', type: 'nfc_recharge', description: '市民乘车码NFC充值', time: '2026-03-20 14:22:15', amount: 200 },
  { id: 'le003', type: 'loss_report', description: '文旅体验码挂失处理', time: '2026-04-08 09:15:00', amount: 0 },
  { id: 'le004', type: 'balance_notification', description: '医保电子码余额提醒', time: '2026-05-01 08:00:00', amount: 3200 },
  { id: 'le005', type: 'application', description: '校园健身码申请通过', time: '2026-02-28 16:45:00', amount: 0 },
  { id: 'le006', type: 'nfc_recharge', description: '市民乘车码NFC充值', time: '2026-05-15 11:30:00', amount: 100 },
  { id: 'le007', type: 'loss_report', description: '校园健身码挂失补办', time: '2026-06-01 13:20:00', amount: 10 },
  { id: 'le008', type: 'balance_notification', description: '市民乘车码余额不足提醒', time: '2026-06-09 07:50:00', amount: 12.5 },
]

export const scenicSpots: ScenicSpot[] = [
  { id: 'ss01', name: '西湖', level: '5A', district: '西湖区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss02', name: '灵隐寺', level: '5A', district: '西湖区', ticketPrice: 75, openHours: '07:00-18:00' },
  { id: 'ss03', name: '千岛湖', level: '5A', district: '淳安县', ticketPrice: 150, openHours: '08:00-17:00' },
  { id: 'ss04', name: '宋城', level: '4A', district: '西湖区', ticketPrice: 280, openHours: '10:00-21:00' },
  { id: 'ss05', name: '西溪湿地', level: '5A', district: '余杭区', ticketPrice: 80, openHours: '08:00-17:30' },
  { id: 'ss06', name: '雷峰塔', level: '4A', district: '西湖区', ticketPrice: 40, openHours: '08:00-20:30' },
  { id: 'ss07', name: '断桥残雪', level: '5A', district: '西湖区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss08', name: '三潭印月', level: '5A', district: '西湖区', ticketPrice: 55, openHours: '08:00-17:00' },
  { id: 'ss09', name: '飞来峰', level: '5A', district: '西湖区', ticketPrice: 45, openHours: '07:00-18:00' },
  { id: 'ss10', name: '岳王庙', level: '4A', district: '西湖区', ticketPrice: 25, openHours: '07:30-17:30' },
  { id: 'ss11', name: '六和塔', level: '4A', district: '西湖区', ticketPrice: 20, openHours: '06:30-17:30' },
  { id: 'ss12', name: '龙井茶园', level: '3A', district: '西湖区', ticketPrice: 0, openHours: '08:00-17:00' },
  { id: 'ss13', name: '河坊街', level: '4A', district: '上城区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss14', name: '南宋御街', level: '4A', district: '上城区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss15', name: '良渚古城遗址', level: '5A', district: '余杭区', ticketPrice: 80, openHours: '09:00-17:00' },
  { id: 'ss16', name: '湘湖', level: '4A', district: '萧山区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss17', name: '杭州乐园', level: '4A', district: '萧山区', ticketPrice: 160, openHours: '09:30-17:00' },
  { id: 'ss18', name: '虎跑梦泉', level: '4A', district: '西湖区', ticketPrice: 15, openHours: '06:30-18:00' },
  { id: 'ss19', name: '九溪烟树', level: '4A', district: '西湖区', ticketPrice: 0, openHours: '全天开放' },
  { id: 'ss20', name: '超山风景区', level: '4A', district: '临平区', ticketPrice: 50, openHours: '08:00-17:00' },
  { id: 'ss21', name: '大明山', level: '4A', district: '临安区', ticketPrice: 88, openHours: '08:00-16:30' },
  { id: 'ss22', name: '天目山', level: '4A', district: '临安区', ticketPrice: 100, openHours: '08:00-16:00' },
  { id: 'ss23', name: '瑶琳仙境', level: '4A', district: '桐庐县', ticketPrice: 116, openHours: '08:30-16:00' },
  { id: 'ss24', name: '富春江', level: '4A', district: '富阳区', ticketPrice: 60, openHours: '08:00-16:30' },
  { id: 'ss25', name: '黄龙洞', level: '3A', district: '西湖区', ticketPrice: 15, openHours: '07:30-17:30' },
  { id: 'ss26', name: '钱王祠', level: '3A', district: '西湖区', ticketPrice: 15, openHours: '08:00-17:00' },
  { id: 'ss27', name: '西泠印社', level: '3A', district: '西湖区', ticketPrice: 0, openHours: '08:30-16:30' },
]

export const transitLines: TransitLine[] = [
  { lineName: '1号线', color: '#E4002B', stations: ['湘湖', '滨康路', '西兴', '滨和路', '江陵路', '富春路', '城站', '定安路', '龙翔桥', '凤起路', '武林广场', '西湖文化广场', '打铁关', '闸弄口', '彭埠', '七堡', '九和路', '九堡', '客运中心', '下沙西', '下沙江滨', '云水', '文海南路', '临平南'] },
  { lineName: '2号线', color: '#0072CE', stations: ['良渚', '杜甫村', '白洋', '金家渡', '墩祥街', '三墩', '虾龙圩', '三坝', '文新', '丰潭路', '古翠路', '学院路', '沈塘桥', '武林门', '凤起路', '中河北路', '建国北路', '人民广场', '钱江路', '钱江世纪城', '飞虹路', '盈丰路', '良渚文化村'] },
  { lineName: '3号线', color: '#FFD100', stations: ['星桥路', '星桥', '黄鹤山', '华鹤街', '丁桥', '桃花湖公园', '同协路', '东新园', '善贤', '潮王路', '西湖文化广场', '武林广场', '武林门', '古墩路', '古荡', '汽车西站', '东岳', '花坞', '高教路', '联胜路', '文一西路', '绿汀路'] },
  { lineName: '4号线', color: '#00A651', stations: ['浦沿', '杨家墩', '中医药大学', '联庄', '水澄桥', '复兴路', '南星桥', '甬江路', '近江', '城星路', '市民中心', '江锦路', '钱江路', '景芳', '新塘', '火车东站', '彭埠', '明石路', '笕桥老街', '华中南路', '池华街', '金家渡'] },
  { lineName: '5号线', color: '#00B7EE', stations: ['金星', '绿汀路', '葛巷村', '创景路', '良睦路', '杭师大仓前', '永福路', '五常', '蒋村', '三坝', '萍水街', '和睦', '运河中央公园', '大运河', '拱宸桥东', '城北体育公园', '东新园', '善贤', '西文街', '打铁关', '建国北路', '城站', '江城路', '候潮门', '南星桥', '长河', '人民广场', '博奥路', '姑娘桥'] },
  { lineName: '6号线', color: '#9B59B6', stations: ['桂花西路', '公望街', '高桥', '受降', '富阳客运中心', '高教路', '银湖', '虎啸杏', '野生动物园东', '中村', '象山美院', '美院象山', '枫桦西路', '之浦路', '枸桔弄', '三堡', '亚运村', '奥体中心', '星民', '江陵路', '钱江世纪城', '丰北', '火车东站'] },
]

export const schoolVenues: SchoolVenue[] = [
  { id: 'sv01', name: '浙江大学紫金港校区', type: '大学', district: '西湖区', facilities: ['田径场', '游泳馆', '篮球馆', '羽毛球馆', '网球场'] },
  { id: 'sv02', name: '浙江工业大学屏峰校区', type: '大学', district: '西湖区', facilities: ['田径场', '篮球场', '乒乓球馆'] },
  { id: 'sv03', name: '杭州学军中学', type: '高中', district: '西湖区', facilities: ['田径场', '篮球场', '排球馆'] },
  { id: 'sv04', name: '杭州第二中学', type: '高中', district: '滨江区', facilities: ['田径场', '游泳馆', '篮球场'] },
  { id: 'sv05', name: '杭州市建兰中学', type: '初中', district: '上城区', facilities: ['田径场', '篮球场'] },
  { id: 'sv06', name: '杭州市崇文小学', type: '小学', district: '上城区', facilities: ['操场', '室内体育馆'] },
  { id: 'sv07', name: '杭州市天长小学', type: '小学', district: '上城区', facilities: ['操场', '乒乓球室'] },
  { id: 'sv08', name: '杭州电子科技大学下沙校区', type: '大学', district: '钱塘区', facilities: ['田径场', '游泳馆', '篮球馆', '羽毛球馆'] },
]

export const socialSecurityCerts: SocialSecurityCert[] = [
  { id: 'ssc01', name: '养老保险参保凭证', category: '养老保险', issuer: '杭州市人力资源和社会保障局', validFrom: '2020-07-01', validTo: '2026-12-31' },
  { id: 'ssc02', name: '失业登记证明', category: '失业保险', issuer: '杭州市人力资源和社会保障局', validFrom: '2026-06-01', validTo: '2026-09-01' },
  { id: 'ssc03', name: '工伤保险参保证明', category: '工伤保险', issuer: '杭州市人力资源和社会保障局', validFrom: '2022-03-15', validTo: '2027-03-15' },
  { id: 'ssc04', name: '生育保险待遇凭证', category: '生育保险', issuer: '杭州市医疗保障局', validFrom: '2026-01-10', validTo: '2026-12-31' },
  { id: 'ssc05', name: '住房公积金缴存证明', category: '住房公积金', issuer: '杭州住房公积金管理中心', validFrom: '2021-05-01', validTo: '2026-12-31' },
]

export const discountActivities: DiscountActivity[] = [
  { id: 'da01', title: '5折乘车券', type: 'transit', discount: '5折', startDate: '2026-06-01', endDate: '2026-06-30', description: '市民码用户享地铁公交5折优惠，每日限2次' },
  { id: 'da02', title: '西湖夜游特惠', type: 'scenic', discount: '7折', startDate: '2026-06-15', endDate: '2026-08-31', description: '文旅码用户晚间游览西湖景区享7折门票' },
  { id: 'da03', title: '在线问诊优惠', type: 'medical', discount: '免挂号费', startDate: '2026-05-01', endDate: '2026-07-31', description: '医保电子码用户在线问诊免收挂号费' },
  { id: 'da04', title: '校园健身月卡', type: 'fitness', discount: '8折', startDate: '2026-06-01', endDate: '2026-06-30', description: '校园健身码用户办理月卡享8折优惠' },
  { id: 'da05', title: '周末畅游套餐', type: 'scenic', discount: '6折', startDate: '2026-07-01', endDate: '2026-08-31', description: '文旅码用户周末畅游指定景区享6折联票' },
  { id: 'da06', title: '通勤早鸟优惠', type: 'transit', discount: '3折', startDate: '2026-06-01', endDate: '2026-09-30', description: '早7点前刷卡乘车享3折特惠' },
]

export const heatMapData: HeatMapItem[] = [
  { district: '上城区', value: 85600, level: 'high' },
  { district: '下城区', value: 72300, level: 'high' },
  { district: '江干区', value: 61400, level: 'medium' },
  { district: '拱墅区', value: 53700, level: 'medium' },
  { district: '西湖区', value: 98200, level: 'high' },
  { district: '滨江区', value: 76100, level: 'high' },
  { district: '萧山区', value: 45800, level: 'medium' },
  { district: '余杭区', value: 62500, level: 'medium' },
  { district: '临平区', value: 38200, level: 'low' },
  { district: '钱塘区', value: 29600, level: 'low' },
  { district: '富阳区', value: 21400, level: 'low' },
  { district: '临安区', value: 18700, level: 'low' },
]

export const complaintWorkOrders: ComplaintWorkOrder[] = [
  { id: 'wo001', category: '交通出行', content: '地铁1号线龙翔桥站周末拥挤严重，建议增设安检通道', status: 'processing', dispatchBureau: '交通局', createTime: '2026-06-07 09:15:00', citizenName: '张伟' },
  { id: 'wo002', category: '文旅服务', content: '灵隐寺景区售票处排队长，建议增加线上购票渠道', status: 'resolved', dispatchBureau: '文旅局', createTime: '2026-06-05 14:20:00', citizenName: '李芳' },
  { id: 'wo003', category: '医疗保障', content: '社区医院挂号系统经常崩溃，影响就医体验', status: 'pending', dispatchBureau: '卫健委', createTime: '2026-06-09 08:30:00', citizenName: '王强' },
  { id: 'wo004', category: '教育服务', content: '校园健身场馆开放时间过短，建议延长至晚间', status: 'processing', dispatchBureau: '教育局', createTime: '2026-06-08 16:45:00', citizenName: '赵丽' },
  { id: 'wo005', category: '社会保障', content: '养老保险转移接续办理流程复杂，建议简化手续', status: 'pending', dispatchBureau: '人社局', createTime: '2026-06-09 10:00:00', citizenName: '陈明' },
  { id: 'wo006', category: '交通出行', content: '公交晚点信息未及时推送，导致乘客滞留', status: 'resolved', dispatchBureau: '交通局', createTime: '2026-06-04 11:30:00', citizenName: '刘洋' },
  { id: 'wo007', category: '文旅服务', content: '千岛湖景区停车难，节假日需提前预约车位', status: 'processing', dispatchBureau: '文旅局', createTime: '2026-06-06 09:00:00', citizenName: '周婷' },
  { id: 'wo008', category: '医疗保障', content: '异地医保结算响应慢，期望提升系统性能', status: 'pending', dispatchBureau: '卫健委', createTime: '2026-06-09 11:20:00', citizenName: '吴刚' },
]

export const dashboardStats: DashboardStats = {
  totalUsers: 12568000,
  activeUsersToday: 892300,
  totalServices: 47,
  totalVerifications: 35670000,
  monthlyGrowth: 3.8,
  serviceCoverage: 96.5,
}
