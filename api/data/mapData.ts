import type { MapLayerItem } from '../../shared/types';

const centerLng = 117.185;
const centerLat = 34.268;

const waterItems: MapLayerItem[] = [
  {
    id: 'water_1',
    name: '鼓楼区供水主管维修',
    type: 'water',
    status: 'warning',
    address: '鼓楼区中山北路沿线',
    district: '鼓楼区',
    startTime: '2024-06-20 09:00:00',
    endTime: '2024-06-20 17:00:00',
    description: '因供水主管道老化更换施工，中山北路沿线用户将暂停供水8小时。',
    lng: 117.175,
    lat: 34.285,
    affectedArea: 2.5,
  },
  {
    id: 'water_2',
    name: '泉山区小区管网改造',
    type: 'water',
    status: 'normal',
    address: '泉山区泰山街道某小区',
    district: '泉山区',
    startTime: '2024-06-21 08:00:00',
    endTime: '2024-06-21 16:00:00',
    description: '小区供水管网升级改造，施工期间供水压力可能下降。',
    lng: 117.145,
    lat: 34.235,
    affectedArea: 1.2,
  },
];

const powerItems: MapLayerItem[] = [
  {
    id: 'power_1',
    name: '云龙区变电站检修',
    type: 'power',
    status: 'warning',
    address: '云龙区和平大道沿线',
    district: '云龙区',
    startTime: '2024-06-22 07:00:00',
    endTime: '2024-06-22 19:00:00',
    description: '110kV变电站年度检修，沿线商业和居民用户停电12小时。',
    lng: 117.225,
    lat: 34.258,
    affectedArea: 3.8,
  },
  {
    id: 'power_2',
    name: '铜山区线路整改',
    type: 'power',
    status: 'normal',
    address: '铜山区北京南路两侧',
    district: '铜山区',
    startTime: '2024-06-23 08:30:00',
    endTime: '2024-06-23 17:30:00',
    description: '架空线路入地改造工程，部分区域停电。',
    lng: 117.168,
    lat: 34.215,
    affectedArea: 2.1,
  },
  {
    id: 'power_3',
    name: '贾汪区农网升级',
    type: 'power',
    status: 'normal',
    address: '贾汪区某乡镇',
    district: '贾汪区',
    startTime: '2024-06-24 07:30:00',
    endTime: '2024-06-24 16:30:00',
    description: '农村电网升级改造，提升供电可靠性。',
    lng: 117.35,
    lat: 34.42,
    affectedArea: 5.0,
  },
];

const gasItems: MapLayerItem[] = [
  {
    id: 'gas_1',
    name: '鼓楼区燃气管道更换',
    type: 'gas',
    status: 'danger',
    address: '鼓楼区民主路附近',
    district: '鼓楼区',
    startTime: '2024-06-20 14:00:00',
    endTime: '2024-06-20 22:00:00',
    description: '燃气管道腐蚀严重，紧急更换施工，请用户关闭阀门注意安全。',
    lng: 117.19,
    lat: 34.275,
    affectedArea: 1.8,
  },
];

const constructionItems: MapLayerItem[] = [
  {
    id: 'construction_1',
    name: '地铁5号线施工',
    type: 'construction',
    status: 'normal',
    address: '泉山区三环南路沿线',
    district: '泉山区',
    startTime: '2024-01-15 00:00:00',
    endTime: '2026-12-31 23:59:59',
    description: '地铁5号线一期工程土建施工，部分路段限行。',
    lng: 117.155,
    lat: 34.248,
    affectedArea: 8.5,
  },
  {
    id: 'construction_2',
    name: '高架快速路扩建',
    type: 'construction',
    status: 'normal',
    address: '云龙区东三环快速路',
    district: '云龙区',
    startTime: '2024-03-01 00:00:00',
    endTime: '2025-06-30 23:59:59',
    description: '东三环快速路扩建工程，注意绕行。',
    lng: 117.25,
    lat: 34.27,
    affectedArea: 6.2,
  },
];

export const mockMapLayers: MapLayerItem[] = [
  ...waterItems,
  ...powerItems,
  ...gasItems,
  ...constructionItems,
];

export const xuzhouMapData = {
  name: '徐州市',
  center: [centerLng, centerLat] as [number, number],
  districts: [
    { name: '鼓楼区', center: [117.18, 34.28] },
    { name: '云龙区', center: [117.22, 34.26] },
    { name: '贾汪区', center: [117.35, 34.42] },
    { name: '泉山区', center: [117.15, 34.24] },
    { name: '铜山区', center: [117.17, 34.20] },
    { name: '丰县', center: [116.57, 34.65] },
    { name: '沛县', center: [116.93, 34.73] },
    { name: '睢宁县', center: [117.95, 33.92] },
    { name: '邳州市', center: [117.96, 34.32] },
    { name: '新沂市', center: [118.33, 34.38] },
  ],
};
