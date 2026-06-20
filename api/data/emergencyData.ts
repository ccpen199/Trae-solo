import type { EmergencyInfo } from '../../shared/types';
import { generateId, getRandomDate, getRandomItem, getRandomInt } from './utils';

const emergencyTypes = ['停水通知', '停电通知', '停气通知', '天气预警', '交通管制', '疫情防控', '突发事件'];
const levels: EmergencyInfo['level'][] = ['normal', 'yellow', 'orange', 'red'];
const statuses: EmergencyInfo['status'][] = ['published', 'published', 'expired', 'draft'];

const districts = ['鼓楼区', '云龙区', '泉山区', '铜山区', '贾汪区', '全市'];

const emergencyTitles = [
  '关于XX路供水管道维修的停水通知',
  '暴雨黄色预警信号',
  'XX变电站检修停电公告',
  '燃气管道改造施工通知',
  '暴雪橙色预警信号',
  '道路交通管制通告',
  '高温红色预警信号',
  '台风"某某"路径预报及防御提示',
  '空气质量重污染橙色预警',
  '疫情防控重要通知',
  '地震应急疏散演练公告',
  '消防安全隐患排查通知',
];

const emergencyContents = [
  '因供水管道维修施工，定于X月X日X时至X时，XX路沿线区域将暂停供水。请相关用户提前做好储水准备，施工期间给您带来不便，敬请谅解。服务热线：96110。',
  '徐州市气象台发布暴雨黄色预警信号：预计未来12小时内我市大部分地区将出现50毫米以上降水，局部地区可达100毫米以上，并伴有雷暴大风等强对流天气。请做好防范准备。',
  '因电网升级改造，定于X月X日X时至X时，XX街道、XX小区等区域将暂停供电。请相关用户提前做好准备，施工期间给您带来不便，敬请谅解。供电服务热线：95598。',
  '因燃气管道改造施工，定于X月X日X时至X时，XX路沿线区域将暂停供气。请相关用户关闭好燃气阀门，注意安全。燃气服务热线：95577。',
];

const creatorNames = ['应急管理局', '水务局', '供电公司', '燃气公司', '气象局', '交通局', '卫健委'];

export const mockEmergencies: EmergencyInfo[] = emergencyTitles.map((title, index) => {
  const level = getRandomItem(levels);
  const status = getRandomItem(statuses);
  const createTime = getRandomDate(30);
  const publishTime = status !== 'draft' ? getRandomDate(25) : undefined;

  const areaCount = getRandomInt(1, 3);
  const targetAreas: string[] = [];
  for (let i = 0; i < areaCount; i++) {
    const area = getRandomItem(districts);
    if (!targetAreas.includes(area)) {
      targetAreas.push(area);
    }
  }
  if (targetAreas.length === 0) {
    targetAreas.push('全市');
  }

  return {
    id: `emergency_${index + 1}`,
    title,
    content: emergencyContents[index % emergencyContents.length],
    level,
    type: getRandomItem(emergencyTypes),
    targetAreas,
    isPinned: level === 'red' || level === 'orange',
    status,
    publishTime,
    expireTime: status === 'expired' ? getRandomDate(5) : undefined,
    createTime,
    creatorId: `user_${getRandomInt(1, 5)}`,
    creatorName: getRandomItem(creatorNames),
    reachCount: getRandomInt(1000, 100000),
  };
});

mockEmergencies.sort((a, b) => {
  const levelOrder = { red: 0, orange: 1, yellow: 2, normal: 3 };
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  return levelOrder[a.level] - levelOrder[b.level];
});
