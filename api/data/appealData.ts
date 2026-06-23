import type { Appeal } from '../../shared/types';
import { generateId, getRandomDate, getRandomItem, getRandomInt } from './utils';

const appealTitles = [
  '反映小区下水道堵塞问题',
  '建议增设公共自行车站点',
  '投诉施工噪音扰民',
  '咨询社保缴费相关问题',
  '反映路灯损坏不亮',
  '建议优化公交线路',
  '投诉环境卫生脏乱差',
  '反映井盖缺失存在安全隐患',
  '咨询子女入学政策',
  '反映小区停车难问题',
  '建议增加社区健身设施',
  '投诉商户占道经营',
  '反映自来水水压不足',
  '咨询医保报销流程',
  '反映道路坑洼不平',
  '建议增设过街天桥',
  '投诉广场舞噪音扰民',
  '反映燃气管道老化问题',
  '咨询居住证办理流程',
  '反映垃圾清运不及时',
];

const appealCategories = [
  '市政设施',
  '环境卫生',
  '交通出行',
  '供水供电',
  '教育医疗',
  '物业管理',
  '噪音扰民',
  '其他问题',
];

const statuses: Appeal['status'][] = ['pending', 'processing', 'transferred', 'resolved', 'resolved', 'closed', 'feedback', 'overdue'];

const citizenNames = ['王先生', '李女士', '张大爷', '刘阿姨', '陈先生', '赵女士', '孙先生', '周女士'];
const districts = ['鼓楼区', '云龙区', '泉山区', '铜山区', '贾汪区'];
const urgencies: Appeal['urgency'][] = ['normal', 'normal', 'normal', 'urgent', 'critical'];

const streetNames = [
  '彭城路123号',
  '淮海东路456号',
  '解放南路789号',
  '复兴北路321号',
  '和平大道654号',
  '铜山路987号',
  '建国西路135号',
  '民主南路246号',
];

export const mockAppeals: Appeal[] = appealTitles.map((title, index) => {
  const status = getRandomItem(statuses);
  const createTime = getRandomDate(30);
  const logs: Appeal['logs'] = [
    {
      id: generateId('log'),
      action: '诉求提交',
      operator: getRandomItem(citizenNames),
      remark: '市民通过平台提交诉求',
      time: createTime,
    },
  ];

  if (status !== 'pending') {
    logs.push({
      id: generateId('log'),
      action: '受理派单',
      operator: '工单受理员',
      remark: '已受理并分派至相关部门',
      time: getRandomDate(25),
    });
  }

  if (status === 'transferred' || status === 'resolved' || status === 'closed') {
    logs.push({
      id: generateId('log'),
      action: '转办12345',
      operator: '平台管理员',
      remark: '已转办至12345政务服务便民热线',
      time: getRandomDate(20),
    });
  }

  if (status === 'resolved' || status === 'closed') {
    logs.push({
      id: generateId('log'),
      action: '处理完成',
      operator: '承办部门',
      remark: '问题已处理完成，请市民核实',
      time: getRandomDate(10),
    });
  }

  if (status === 'closed') {
    logs.push({
      id: generateId('log'),
      action: '满意度评价',
      operator: getRandomItem(citizenNames),
      remark: '市民评价：满意',
      time: getRandomDate(5),
    });
  }

  return {
    id: `appeal_${index + 1}`,
    title,
    content: `市民反映：${title}，希望相关部门能够尽快处理解决，谢谢！
详细情况：该问题已经存在一段时间了，对日常生活造成了一定影响。
诉求：希望相关部门能够重视并尽快处理。`,
    category: getRandomItem(appealCategories),
    status,
    urgency: getRandomItem(urgencies),
    citizenName: getRandomItem(citizenNames),
    citizenPhone: `138${getRandomInt(10000000, 99999999)}`,
    address: getRandomItem(streetNames),
    district: getRandomItem(districts),
    platform12345Id:
      status === 'transferred' || status === 'resolved' || status === 'closed'
        ? `XZ12345${String(index + 1).padStart(6, '0')}`
        : undefined,
    transferTime:
      status === 'transferred' || status === 'resolved' || status === 'closed'
        ? getRandomDate(20)
        : undefined,
    resolveTime: status === 'resolved' || status === 'closed' ? getRandomDate(10) : undefined,
    satisfaction: status === 'closed' ? getRandomInt(3, 5) : undefined,
    createTime,
    logs,
  };
});

mockAppeals.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
