export const highways = [
  { code: 'G1', name: '京哈高速' },
  { code: 'G2', name: '京沪高速' },
  { code: 'G4', name: '京港澳高速' },
  { code: 'G5', name: '京昆高速' },
  { code: 'G6', name: '京藏高速' },
  { code: 'G15', name: '沈海高速' },
  { code: 'G20', name: '青银高速' },
  { code: 'G30', name: '连霍高速' },
  { code: 'G36', name: '宁洛高速' },
  { code: 'G50', name: '沪渝高速' },
]

export const cities = [
  { name: '北京', districts: ['朝阳区', '海淀区', '丰台区', '东城区', '西城区'] },
  { name: '上海', districts: ['浦东新区', '徐汇区', '静安区', '黄浦区'] },
  { name: '广州', districts: ['天河区', '越秀区', '白云区', '番禺区'] },
]

export const operatorColors: Record<string, string> = {
  '国网电动': '#1677ff',
  '特来电': '#00b578',
  '星星充电': '#ff8f1f',
  '小桔充电': '#ff3141',
  '云快充': '#7b68ee',
}

export const protocolColors: Record<string, string> = {
  '国网协议': '#1677ff',
  '第三方API': '#ff8f1f',
  'GB/T 27930': '#00b578',
}

export interface Inspection {
  normal: boolean
  lastDate: string
  anomalies: string[]
}

export interface AlarmRecord {
  id: string
  time: string
  type: '故障告警' | '离线告警' | '巡检异常'
  content: string
  status: '待处理' | '处理中' | '已处理'
}

export interface WorkOrder {
  id: string
  problemType: '巡检异常' | '桩体故障' | '通信异常' | '支付异常'
  description: string
  responsibleParty: '运营商运维' | '场站驻场' | '第三方维修' | '平台技术' | '自动分配中'
  progress: 1 | 2 | 3 | 4 | 5
  handler: string
  phone: string
  createTime: string
  estimatedTime: string
  status: '待派单' | '已派单' | '处理中' | '待复查' | '已完成'
}

export interface RecheckRecord {
  id: string
  workOrderId: string
  summary: string
  handler: string
  finishTime: string
  result: '通过' | '需二次处理'
  rechecker: string
  recheckTime: string
}

export interface Station {
  id: string
  name: string
  operator: string
  protocol: string
  distance: string
  rating: number
  guns: { idle: number; charging: number; fault: number; offline: number }
  occupancyRate: number
  electricityPrice: number
  servicePrice: number
  inspectionStatus: '正常' | '有异常'
  type: 'highway' | 'city'
  highway?: string
  city?: string
  district?: string
  address: string
  longitude: number
  latitude: number
  businessHours: string
  lastSyncTime: string
  apiStatus: '在线' | '离线'
  lastInspectionTime: string
  inspectionItems: string[]
  inspection: Inspection
  peakHours: string
  queueCount: number
}

export const stations: Station[] = [
  {
    id: 'h1', name: 'G1京哈高速·白鹿服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '35.2km', rating: 4.7,
    guns: { idle: 4, charging: 6, fault: 1, offline: 1 }, occupancyRate: 60,
    electricityPrice: 0.85, servicePrice: 0.40, inspectionStatus: '有异常',
    type: 'highway', highway: 'G1',
    address: 'G1京哈高速白鹿服务区(双向)', longitude: 117.12, latitude: 40.23,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:30:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 09:00:00',
    inspectionItems: ['3号桩通信异常'],
    inspection: { normal: false, lastDate: '2026-06-17', anomalies: ['3号桩通信异常', '显示屏黑屏需检查'] },
    peakHours: '10:00-14:00', queueCount: 2,
  },
  {
    id: 'h2', name: 'G1京哈高速·山海关服务区充电站', operator: '特来电', protocol: '第三方API',
    distance: '128.5km', rating: 4.5,
    guns: { idle: 6, charging: 4, fault: 0, offline: 2 }, occupancyRate: 40,
    electricityPrice: 0.92, servicePrice: 0.35, inspectionStatus: '正常',
    type: 'highway', highway: 'G1',
    address: 'G1京哈高速山海关服务区(北京方向)', longitude: 119.76, latitude: 40.00,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:25:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-16 15:00:00',
    inspectionItems: [], peakHours: '08:00-12:00', queueCount: 0,
  },
  {
    id: 'h3', name: 'G2京沪高速·梅村服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '95.0km', rating: 4.8,
    guns: { idle: 2, charging: 8, fault: 0, offline: 0 }, occupancyRate: 80,
    electricityPrice: 0.88, servicePrice: 0.38, inspectionStatus: '正常',
    type: 'highway', highway: 'G2',
    address: 'G2京沪高速梅村服务区(上海方向)', longitude: 120.38, latitude: 31.58,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:28:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 08:00:00',
    inspectionItems: [], peakHours: '09:00-13:00', queueCount: 3,
  },
  {
    id: 'h4', name: 'G2京沪高速·阳澄湖服务区充电站', operator: '星星充电', protocol: '第三方API',
    distance: '112.3km', rating: 4.6,
    guns: { idle: 5, charging: 3, fault: 1, offline: 1 }, occupancyRate: 35,
    electricityPrice: 0.90, servicePrice: 0.42, inspectionStatus: '有异常',
    type: 'highway', highway: 'G2',
    address: 'G2京沪高速阳澄湖服务区(双向)', longitude: 120.82, latitude: 31.42,
    businessHours: '06:00-22:00', lastSyncTime: '2026-06-18 14:20:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-15 14:00:00',
    inspectionItems: ['7号枪头接触不良'], peakHours: '10:00-14:00', queueCount: 1,
  },
  {
    id: 'h5', name: 'G4京港澳高速·许昌服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '210.0km', rating: 4.4,
    guns: { idle: 3, charging: 5, fault: 2, offline: 0 }, occupancyRate: 55,
    electricityPrice: 0.82, servicePrice: 0.36, inspectionStatus: '有异常',
    type: 'highway', highway: 'G4',
    address: 'G4京港澳高速许昌服务区(南行)', longitude: 113.85, latitude: 34.04,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:15:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 11:00:00',
    inspectionItems: ['2号桩体故障', '5号桩通信异常'], peakHours: '11:00-15:00', queueCount: 4,
  },
  {
    id: 'h6', name: 'G4京港澳高速·驻马店服务区充电站', operator: '云快充', protocol: '第三方API',
    distance: '280.5km', rating: 4.3,
    guns: { idle: 7, charging: 3, fault: 0, offline: 0 }, occupancyRate: 30,
    electricityPrice: 0.95, servicePrice: 0.30, inspectionStatus: '正常',
    type: 'highway', highway: 'G4',
    address: 'G4京港澳高速驻马店服务区(双向)', longitude: 114.02, latitude: 32.98,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:00:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 06:00:00',
    inspectionItems: [], peakHours: '09:00-12:00', queueCount: 0,
  },
  {
    id: 'h7', name: 'G5京昆高速·延庆服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '42.0km', rating: 4.9,
    guns: { idle: 8, charging: 2, fault: 0, offline: 0 }, occupancyRate: 20,
    electricityPrice: 0.80, servicePrice: 0.35, inspectionStatus: '正常',
    type: 'highway', highway: 'G5',
    address: 'G5京昆高速延庆服务区(出京方向)', longitude: 115.97, latitude: 40.47,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:32:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 07:30:00',
    inspectionItems: [], peakHours: '08:00-11:00', queueCount: 0,
  },
  {
    id: 'h8', name: 'G5京昆高速·涿州服务区充电站', operator: '特来电', protocol: 'GB/T 27930',
    distance: '68.3km', rating: 4.5,
    guns: { idle: 3, charging: 5, fault: 0, offline: 2 }, occupancyRate: 50,
    electricityPrice: 0.88, servicePrice: 0.38, inspectionStatus: '正常',
    type: 'highway', highway: 'G5',
    address: 'G5京昆高速涿州服务区(双向)', longitude: 115.98, latitude: 39.49,
    businessHours: '06:00-23:00', lastSyncTime: '2026-06-18 14:10:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 16:00:00',
    inspectionItems: [], peakHours: '10:00-14:00', queueCount: 1,
  },
  {
    id: 'h9', name: 'G6京藏高速·昌平服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '28.5km', rating: 4.6,
    guns: { idle: 5, charging: 5, fault: 0, offline: 0 }, occupancyRate: 50,
    electricityPrice: 0.82, servicePrice: 0.36, inspectionStatus: '正常',
    type: 'highway', highway: 'G6',
    address: 'G6京藏高速昌平服务区(出京方向)', longitude: 116.23, latitude: 40.22,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:35:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 09:00:00',
    inspectionItems: [], peakHours: '07:00-10:00', queueCount: 1,
  },
  {
    id: 'h10', name: 'G6京藏高速·张家口服务区充电站', operator: '小桔充电', protocol: 'GB/T 27930',
    distance: '156.0km', rating: 4.2,
    guns: { idle: 2, charging: 4, fault: 1, offline: 1 }, occupancyRate: 55,
    electricityPrice: 0.98, servicePrice: 0.32, inspectionStatus: '有异常',
    type: 'highway', highway: 'G6',
    address: 'G6京藏高速张家口服务区(双向)', longitude: 114.88, latitude: 40.82,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 13:50:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-16 10:00:00',
    inspectionItems: ['4号桩充电中断频繁'], peakHours: '09:00-13:00', queueCount: 2,
  },
  {
    id: 'h11', name: 'G15沈海高速·莱山服务区充电站', operator: '星星充电', protocol: '第三方API',
    distance: '320.0km', rating: 4.5,
    guns: { idle: 6, charging: 4, fault: 0, offline: 0 }, occupancyRate: 40,
    electricityPrice: 0.90, servicePrice: 0.40, inspectionStatus: '正常',
    type: 'highway', highway: 'G15',
    address: 'G15沈海高速莱山服务区(南行)', longitude: 121.45, latitude: 37.50,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:22:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 07:00:00',
    inspectionItems: [], peakHours: '10:00-14:00', queueCount: 0,
  },
  {
    id: 'h12', name: 'G15沈海高速·胶州服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '380.5km', rating: 4.7,
    guns: { idle: 3, charging: 7, fault: 0, offline: 0 }, occupancyRate: 70,
    electricityPrice: 0.85, servicePrice: 0.38, inspectionStatus: '正常',
    type: 'highway', highway: 'G15',
    address: 'G15沈海高速胶州服务区(双向)', longitude: 120.03, latitude: 36.26,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:30:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 14:00:00',
    inspectionItems: [], peakHours: '09:00-13:00', queueCount: 2,
  },
  {
    id: 'h13', name: 'G20青银高速·淄博服务区充电站', operator: '特来电', protocol: '第三方API',
    distance: '290.0km', rating: 4.4,
    guns: { idle: 4, charging: 4, fault: 0, offline: 2 }, occupancyRate: 40,
    electricityPrice: 0.92, servicePrice: 0.35, inspectionStatus: '正常',
    type: 'highway', highway: 'G20',
    address: 'G20青银高速淄博服务区(双向)', longitude: 118.05, latitude: 36.81,
    businessHours: '06:00-22:00', lastSyncTime: '2026-06-18 14:18:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 08:00:00',
    inspectionItems: [], peakHours: '10:00-14:00', queueCount: 0,
  },
  {
    id: 'h14', name: 'G20青银高速·济南服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '350.2km', rating: 4.6,
    guns: { idle: 1, charging: 7, fault: 1, offline: 1 }, occupancyRate: 70,
    electricityPrice: 0.84, servicePrice: 0.38, inspectionStatus: '有异常',
    type: 'highway', highway: 'G20',
    address: 'G20青银高速济南服务区(东行)', longitude: 117.00, latitude: 36.67,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:28:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 12:00:00',
    inspectionItems: ['6号桩体异响'], peakHours: '09:00-13:00', queueCount: 3,
  },
  {
    id: 'h15', name: 'G30连霍高速·开封服务区充电站', operator: '云快充', protocol: '第三方API',
    distance: '450.0km', rating: 4.3,
    guns: { idle: 5, charging: 3, fault: 0, offline: 2 }, occupancyRate: 30,
    electricityPrice: 0.88, servicePrice: 0.32, inspectionStatus: '正常',
    type: 'highway', highway: 'G30',
    address: 'G30连霍高速开封服务区(西行)', longitude: 114.35, latitude: 34.79,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:05:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 06:30:00',
    inspectionItems: [], peakHours: '10:00-14:00', queueCount: 0,
  },
  {
    id: 'h16', name: 'G30连霍高速·洛阳服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '520.3km', rating: 4.5,
    guns: { idle: 2, charging: 6, fault: 2, offline: 0 }, occupancyRate: 60,
    electricityPrice: 0.83, servicePrice: 0.36, inspectionStatus: '有异常',
    type: 'highway', highway: 'G30',
    address: 'G30连霍高速洛阳服务区(双向)', longitude: 112.45, latitude: 34.62,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 13:55:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-16 09:00:00',
    inspectionItems: ['1号桩支付失败', '8号桩通信异常'], peakHours: '11:00-15:00', queueCount: 5,
  },
  {
    id: 'h17', name: 'G36宁洛高速·蚌埠服务区充电站', operator: '星星充电', protocol: 'GB/T 27930',
    distance: '580.0km', rating: 4.4,
    guns: { idle: 4, charging: 4, fault: 0, offline: 0 }, occupancyRate: 50,
    electricityPrice: 0.90, servicePrice: 0.38, inspectionStatus: '正常',
    type: 'highway', highway: 'G36',
    address: 'G36宁洛高速蚌埠服务区(双向)', longitude: 117.36, latitude: 32.92,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:12:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 07:00:00',
    inspectionItems: [], peakHours: '09:00-12:00', queueCount: 0,
  },
  {
    id: 'h18', name: 'G36宁洛高速·阜阳服务区充电站', operator: '小桔充电', protocol: 'GB/T 27930',
    distance: '640.5km', rating: 4.2,
    guns: { idle: 3, charging: 3, fault: 1, offline: 1 }, occupancyRate: 40,
    electricityPrice: 0.95, servicePrice: 0.30, inspectionStatus: '有异常',
    type: 'highway', highway: 'G36',
    address: 'G36宁洛高速阜阳服务区(南行)', longitude: 115.81, latitude: 32.89,
    businessHours: '06:00-22:00', lastSyncTime: '2026-06-18 13:40:00',
    apiStatus: '离线', lastInspectionTime: '2026-06-15 11:00:00',
    inspectionItems: ['3号桩离线超过24小时'], peakHours: '10:00-14:00', queueCount: 1,
  },
  {
    id: 'h19', name: 'G50沪渝高速·湖州服务区充电站', operator: '国网电动', protocol: '国网协议',
    distance: '180.0km', rating: 4.8,
    guns: { idle: 6, charging: 4, fault: 0, offline: 0 }, occupancyRate: 40,
    electricityPrice: 0.86, servicePrice: 0.36, inspectionStatus: '正常',
    type: 'highway', highway: 'G50',
    address: 'G50沪渝高速湖州服务区(双向)', longitude: 120.10, latitude: 30.87,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:33:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 08:30:00',
    inspectionItems: [], peakHours: '09:00-12:00', queueCount: 0,
  },
  {
    id: 'h20', name: 'G50沪渝高速·宜兴服务区充电站', operator: '特来电', protocol: '第三方API',
    distance: '220.5km', rating: 4.6,
    guns: { idle: 2, charging: 6, fault: 0, offline: 2 }, occupancyRate: 60,
    electricityPrice: 0.92, servicePrice: 0.35, inspectionStatus: '正常',
    type: 'highway', highway: 'G50',
    address: 'G50沪渝高速宜兴服务区(西行)', longitude: 119.82, latitude: 31.36,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:25:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 15:30:00',
    inspectionItems: [], peakHours: '10:00-14:00', queueCount: 1,
  },
  {
    id: 'c1', name: '国网电动充电站(朝阳大悦城)', operator: '国网电动', protocol: '国网协议',
    distance: '0.5km', rating: 4.8,
    guns: { idle: 8, charging: 4, fault: 0, offline: 0 }, occupancyRate: 33,
    electricityPrice: 1.25, servicePrice: 0.50, inspectionStatus: '正常',
    type: 'city', city: '北京', district: '朝阳区',
    address: '北京市朝阳区朝阳北路101号朝阳大悦城B2层', longitude: 116.47, latitude: 39.92,
    businessHours: '07:00-23:00', lastSyncTime: '2026-06-18 14:35:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 09:00:00',
    inspectionItems: [], peakHours: '18:00-21:00', queueCount: 0,
  },
  {
    id: 'c2', name: '特来电充电站(中关村软件园)', operator: '特来电', protocol: '第三方API',
    distance: '8.2km', rating: 4.6,
    guns: { idle: 3, charging: 7, fault: 1, offline: 1 }, occupancyRate: 58,
    electricityPrice: 1.35, servicePrice: 0.45, inspectionStatus: '有异常',
    type: 'city', city: '北京', district: '海淀区',
    address: '北京市海淀区东北旺西路8号中关村软件园', longitude: 116.30, latitude: 40.05,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:30:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 10:00:00',
    inspectionItems: ['A06桩枪头损坏'], peakHours: '08:00-10:00', queueCount: 2,
  },
  {
    id: 'c3', name: '星星充电站(丰台科技园)', operator: '星星充电', protocol: '第三方API',
    distance: '12.5km', rating: 4.5,
    guns: { idle: 10, charging: 5, fault: 0, offline: 1 }, occupancyRate: 31,
    electricityPrice: 1.18, servicePrice: 0.42, inspectionStatus: '正常',
    type: 'city', city: '北京', district: '丰台区',
    address: '北京市丰台区丰台科技园航海路1号', longitude: 116.29, latitude: 39.82,
    businessHours: '06:00-23:00', lastSyncTime: '2026-06-18 14:28:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 07:00:00',
    inspectionItems: [], peakHours: '17:00-20:00', queueCount: 0,
  },
  {
    id: 'c4', name: '小桔充电站(王府井百货)', operator: '小桔充电', protocol: 'GB/T 27930',
    distance: '5.8km', rating: 4.7,
    guns: { idle: 5, charging: 3, fault: 0, offline: 0 }, occupancyRate: 37,
    electricityPrice: 1.42, servicePrice: 0.48, inspectionStatus: '正常',
    type: 'city', city: '北京', district: '东城区',
    address: '北京市东城区王府井大街255号', longitude: 116.41, latitude: 39.91,
    businessHours: '08:00-22:00', lastSyncTime: '2026-06-18 14:32:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 10:00:00',
    inspectionItems: [], peakHours: '12:00-14:00', queueCount: 0,
  },
  {
    id: 'c5', name: '云快充充电站(陆家嘴中心)', operator: '云快充', protocol: '第三方API',
    distance: '1.2km', rating: 4.9,
    guns: { idle: 6, charging: 6, fault: 0, offline: 0 }, occupancyRate: 50,
    electricityPrice: 1.30, servicePrice: 0.55, inspectionStatus: '正常',
    type: 'city', city: '上海', district: '浦东新区',
    address: '上海市浦东新区陆家嘴环路1088号', longitude: 121.50, latitude: 31.24,
    businessHours: '00:00-24:00', lastSyncTime: '2026-06-18 14:35:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 08:00:00',
    inspectionItems: [], peakHours: '18:00-21:00', queueCount: 1,
  },
  {
    id: 'c6', name: '国网电动充电站(徐家汇公园)', operator: '国网电动', protocol: '国网协议',
    distance: '3.5km', rating: 4.6,
    guns: { idle: 2, charging: 6, fault: 2, offline: 0 }, occupancyRate: 60,
    electricityPrice: 1.20, servicePrice: 0.50, inspectionStatus: '有异常',
    type: 'city', city: '上海', district: '徐汇区',
    address: '上海市徐汇区肇嘉浜路889号', longitude: 121.44, latitude: 31.19,
    businessHours: '06:00-23:00', lastSyncTime: '2026-06-18 14:20:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-17 13:00:00',
    inspectionItems: ['B03桩体故障', 'B04通信异常'], peakHours: '17:00-20:00', queueCount: 3,
  },
  {
    id: 'c7', name: '特来电充电站(静安嘉里中心)', operator: '特来电', protocol: '第三方API',
    distance: '5.0km', rating: 4.8,
    guns: { idle: 4, charging: 4, fault: 0, offline: 0 }, occupancyRate: 50,
    electricityPrice: 1.38, servicePrice: 0.50, inspectionStatus: '正常',
    type: 'city', city: '上海', district: '静安区',
    address: '上海市静安区南京西路1515号', longitude: 121.44, latitude: 31.22,
    businessHours: '07:00-23:00', lastSyncTime: '2026-06-18 14:33:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 09:30:00',
    inspectionItems: [], peakHours: '12:00-14:00', queueCount: 0,
  },
  {
    id: 'c8', name: '星星充电站(天河城广场)', operator: '星星充电', protocol: 'GB/T 27930',
    distance: '2.0km', rating: 4.5,
    guns: { idle: 7, charging: 5, fault: 0, offline: 2 }, occupancyRate: 36,
    electricityPrice: 1.15, servicePrice: 0.40, inspectionStatus: '正常',
    type: 'city', city: '广州', district: '天河区',
    address: '广州市天河区天河路208号天河城B3层', longitude: 113.33, latitude: 23.14,
    businessHours: '07:00-23:00', lastSyncTime: '2026-06-18 14:30:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 07:30:00',
    inspectionItems: [], peakHours: '18:00-21:00', queueCount: 0,
  },
  {
    id: 'c9', name: '国网电动充电站(北京路步行街)', operator: '国网电动', protocol: '国网协议',
    distance: '4.5km', rating: 4.4,
    guns: { idle: 3, charging: 5, fault: 0, offline: 0 }, occupancyRate: 63,
    electricityPrice: 1.22, servicePrice: 0.48, inspectionStatus: '正常',
    type: 'city', city: '广州', district: '越秀区',
    address: '广州市越秀区北京路168号', longitude: 113.27, latitude: 23.13,
    businessHours: '08:00-22:00', lastSyncTime: '2026-06-18 14:28:00',
    apiStatus: '在线', lastInspectionTime: '2026-06-18 08:00:00',
    inspectionItems: [], peakHours: '12:00-14:00', queueCount: 1,
  },
]
