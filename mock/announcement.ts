import type { MockMethod } from 'vite-plugin-mock';
import Mock from 'mockjs';

const safeParam = (params: any, key: string, defaultValue: any = 0) => {
  return params?.[key] !== undefined ? params[key] : defaultValue;
};

const announcements: any[] = [];

const realAnnouncements = [
  {
    type: 'outage', serviceType: 'water',
    title: '停水通知 - 锦江区春熙路片区供水管道改造施工',
    summary: '因锦江区春熙路段供水管道老化改造施工需要，2025年1月15日8:00至1月16日6:00期间暂停供水',
    content: `<h3>停水通知</h3><p>尊敬的用户：</p><p>因锦江区春熙路段供水主管道老化改造施工需要，我司将对以下区域实施临时停水：</p><p><strong>停水时间：</strong>2025年1月15日 08:00 至 2025年1月16日 06:00（预计22小时）</p><p><strong>停水区域：</strong>锦江区春熙路、红星路、东大街沿线（东至一环路，南至滨江路，西至人民南路，北至蜀都大道）</p><p><strong>涉及户号：</strong>W2024开头的约3200户居民</p><p><strong>施工内容：</strong>DN600供水管道更换及阀门井改造</p><p><strong>恢复供水：</strong>施工完成后24小时内逐步恢复正常水压，初期可能出现水质浑浊现象，请排放5分钟后使用</p><p><strong>咨询热线：</strong>962960</p><p>请各用户提前做好蓄水准备，给您带来不便，敬请谅解。</p>`,
    affectAreas: ['510104'], affectAreaNames: ['锦江区'], pushStatus: 1, pushTime: '2025-01-14 18:00:00',
  },
  {
    type: 'outage', serviceType: 'electricity',
    title: '停电通知 - 武侯区科华北路配电站检修',
    summary: '因武侯区科华北路10kV配电站设备检修，2025年1月18日7:00至20:00期间计划停电',
    content: `<h3>停电通知</h3><p>尊敬的用户：</p><p>因武侯区科华北路10kV配电站年度检修需要，将实施计划停电：</p><p><strong>停电时间：</strong>2025年1月18日 07:00 至 2025年1月18日 20:00（预计13小时）</p><p><strong>停电区域：</strong>武侯区科华北路、科华中路、锦绣路沿线</p><p><strong>涉及范围：</strong>居民约1800户、商业用户约120户</p><p><strong>检修内容：</strong>10kV开关柜更换、变压器油化验及保护定值校验</p><p><strong>应急电源：</strong>已协调应急发电车保障科华路社区卫生服务中心等关键单位</p><p><strong>温馨提示：</strong>请提前为手机、充电宝等设备充满电，冰箱内食物请提前处理</p><p><strong>咨询热线：</strong>962960</p>`,
    affectAreas: ['510107'], affectAreaNames: ['武侯区'], pushStatus: 1, pushTime: '2025-01-17 09:00:00',
  },
  {
    type: 'outage', serviceType: 'gas',
    title: '停气通知 - 青羊区光华大道天然气管网安全检测',
    summary: '因青羊区光华大道天然气管网安全检测及维护，2025年1月20日9:00至17:00暂停供气',
    content: `<h3>停气通知</h3><p>尊敬的用户：</p><p>因青羊区光华大道天然气管网安全检测及设备维护需要，将实施临时停气：</p><p><strong>停气时间：</strong>2025年1月20日 09:00 至 2025年1月20日 17:00（预计8小时）</p><p><strong>停气区域：</strong>青羊区光华大道、瑞联路、东坡路沿线</p><p><strong>涉及用户：</strong>约2400户居民及商业用户</p><p><strong>检测内容：</strong>中压管网泄漏检测、调压箱维护保养、安全阀校验</p><p><strong>安全提示：</strong>恢复供气后请检查燃气阀门是否关闭，使用前请开窗通风5分钟，确认无异味后再点火</p><p><strong>咨询热线：</strong>962960</p>`,
    affectAreas: ['510105'], affectAreaNames: ['青羊区'], pushStatus: 1, pushTime: '2025-01-19 08:00:00',
  },
  {
    type: 'repair', serviceType: 'water',
    title: '供水抢修公告 - 成华区建设路主管道爆裂紧急抢修',
    summary: '成华区建设路与二环路交汇处DN400供水主管道爆裂，抢修队已到场，预计48小时内恢复',
    content: `<h3>紧急抢修公告</h3><p>尊敬的用户：</p><p>2025年1月12日14:30，成华区建设路与二环路交汇处发生DN400供水主管道爆裂事故，我司抢修队已于15:00到场处置：</p><p><strong>事故时间：</strong>2025年1月12日 14:30</p><p><strong>影响区域：</strong>成华区建设路、猛追湾、新鸿路沿线</p><p><strong>影响用户：</strong>约1500户居民用水受到影响，当前水压明显降低</p><p><strong>抢修进展：</strong>已完成阀门关闭及排水，正在开挖修复管道</p><p><strong>预计恢复：</strong>2025年1月14日 14:00前恢复正常供水</p><p><strong>应急供水：</strong>已在建设路社区设置2处临时供水点，居民可自带容器取水</p><p><strong>临时供水点：</strong>建设路社区服务中心、猛追湾街道办事处</p><p><strong>咨询热线：</strong>962960（已增派接线员）</p><p>给您带来的不便，我们深表歉意！</p>`,
    affectAreas: ['510108'], affectAreaNames: ['成华区'], pushStatus: 2, pushTime: '2025-01-12 15:00:00',
    repairProgress: [
      { stage: '接报', time: '2025-01-12 14:32', desc: '客服中心接到市民报警，反映建设路路口大量冒水', operator: '962960坐席-李娟', color: 'blue' },
      { stage: '派单', time: '2025-01-12 14:35', desc: '调度中心派发工单至成华供水抢修队，同步通知关闸班组', operator: '调度员-王建国', color: 'blue' },
      { stage: '到场', time: '2025-01-12 15:00', desc: '抢修队（6人+抢修车2辆）抵达现场，拉起警戒线，完成交通疏导', operator: '抢修队长-张师傅', color: 'cyan' },
      { stage: '关阀排水', time: '2025-01-12 15:25', desc: '关闭上下游3处控制阀门，完成管道余水排放，确认DN400主管爆裂长度约1.2米', operator: '抢修班组', color: 'cyan' },
      { stage: '开挖作业', time: '2025-01-12 16:40', desc: '协调市政破路许可，挖掘机进场开挖作业坑，深度约2.8米', operator: '抢修班组+外协施工', color: 'gold' },
      { stage: '管道修复', time: '2025-01-13 09:15', desc: '清理破损管段，吊装新DN400球墨铸铁管，完成对口焊接及法兰连接', operator: '管工班-刘师傅等4人', color: 'gold' },
      { stage: '打压试验', time: '2025-01-13 14:30', desc: '管道水压试验合格（1.2MPa保压30分钟无压降），通知监理旁站签字', operator: '质检-陈工', color: 'green' },
      { stage: '回填恢复', time: '2025-01-13 18:00', desc: '作业坑分层回填夯实，临时路面恢复，清理现场', operator: '施工班组', color: 'green' },
      { stage: '恢复供水', time: '2025-01-13 20:15', desc: '逐步开启阀门恢复供水，社区网格员逐户通知排放浑水', operator: '供水调度+社区联动', color: 'green' },
    ],
  },
  {
    type: 'repair', serviceType: 'electricity',
    title: '供电抢修公告 - 金牛区营门口电缆故障紧急抢修',
    summary: '金牛区营门口路10kV电缆故障导致片区停电，已派出2支抢修队紧急抢修中',
    content: `<h3>供电抢修公告</h3><p>尊敬的用户：</p><p>2025年1月13日09:15，金牛区营门口路10kV地下电缆发生故障，导致片区突发停电：</p><p><strong>故障时间：</strong>2025年1月13日 09:15</p><p><strong>影响区域：</strong>金牛区营门口路、茶店子、蜀汉路沿线</p><p><strong>影响用户：</strong>约2200户居民停电</p><p><strong>抢修力量：</strong>已派出2支抢修队（共12人），2辆抢修车、1辆发电车到场</p><p><strong>故障原因：</strong>初步判断为地下电缆绝缘老化击穿</p><p><strong>抢修进展：</strong>已确定故障点位，正在进行电缆修复</p><p><strong>预计恢复：</strong>2025年1月13日 22:00前恢复供电</p><p><strong>应急保障：</strong>已为金牛区人民医院接入应急发电车</p><p><strong>咨询热线：</strong>962960</p>`,
    affectAreas: ['510106'], affectAreaNames: ['金牛区'], pushStatus: 2, pushTime: '2025-01-13 09:30:00',
    repairProgress: [
      { stage: '故障告警', time: '2025-01-13 09:15', desc: '配网自动化系统告警：营门口10kV馈线跳闸，重合闸失败', operator: '调度自动化系统', color: 'red' },
      { stage: '用户报障', time: '2025-01-13 09:17', desc: '962960热线接获大量用户报停电，坐席同步录入工单系统', operator: '962960坐席组', color: 'blue' },
      { stage: '派单出动', time: '2025-01-13 09:22', desc: '配电运检部派发2支抢修队+应急发电车，优先保障医院等关键用户', operator: '配电调度-赵工', color: 'blue' },
      { stage: '应急保障', time: '2025-01-13 09:48', desc: '发电车抵达金牛区人民医院，完成电缆接驳启动供电', operator: '发电车组', color: 'cyan' },
      { stage: '故障定位', time: '2025-01-13 10:30', desc: '使用电缆故障测试仪精确定位：营门口路地下约1.5米处，电缆击穿点约30cm', operator: '检测班-林工', color: 'cyan' },
      { stage: '开挖作业', time: '2025-01-13 11:15', desc: '协调交警封闭半幅车道，开挖作业坑，露出故障电缆段', operator: '抢修一班', color: 'gold' },
      { stage: '电缆中间头制作', time: '2025-01-13 14:00', desc: '截除故障段，制作10kV冷缩电缆中间头2个，绝缘层处理完成', operator: '电缆班-周师傅等3人', color: 'gold' },
      { stage: '耐压试验', time: '2025-01-13 16:20', desc: '直流耐压试验35kV/5min通过，绝缘电阻合格', operator: '试验班-郑工', color: 'green' },
      { stage: '恢复送电', time: '2025-01-13 17:05', desc: '试送电成功，配网监测确认电流电压正常，发电车撤出', operator: '配电调度', color: 'green' },
      { stage: '现场恢复', time: '2025-01-13 18:30', desc: '路面恢复、清理现场，向社区通报恢复情况', operator: '抢修班组', color: 'green' },
    ],
  },
  {
    type: 'repair', serviceType: 'gas',
    title: '燃气抢修公告 - 高新区天府三街燃气泄漏紧急处置',
    summary: '高新区天府三街发现燃气泄漏点，已紧急关闭阀门，抢修队正在现场处置',
    content: `<h3>燃气抢修公告</h3><p>尊敬的用户：</p><p>2025年1月14日11:00，高新区天府三街与剑南大道交汇处发现地下燃气管线泄漏，我司已启动应急预案：</p><p><strong>发现时间：</strong>2025年1月14日 11:00</p><p><strong>影响区域：</strong>高新区天府三街、天府四街、剑南大道沿线</p><p><strong>影响用户：</strong>约800户居民暂停供气</p><p><strong>处置进展：</strong>已关闭上下游阀门，泄漏点已管控，正在抢修</p><p><strong>安全提示：</strong>周边居民请勿使用明火，如闻到异味请开窗通风并拨打962960</p><p><strong>预计恢复：</strong>2025年1月15日 06:00前恢复供气</p><p><strong>咨询热线：</strong>962960（24小时值守）</p>`,
    affectAreas: ['510109'], affectAreaNames: ['高新区'], pushStatus: 2, pushTime: '2025-01-14 11:15:00',
    repairProgress: [
      { stage: '巡检发现', time: '2025-01-14 11:00', desc: '燃气巡检车日常巡检，车载可燃气体报警器在天府三街路口触发高浓度报警', operator: '巡检车-川A·X8G23', color: 'red' },
      { stage: '现场警戒', time: '2025-01-14 11:08', desc: '巡检人员下车确认泄漏，设置警戒带，疏散周边无关人员，禁止一切明火', operator: '巡检员-小何', color: 'orange' },
      { stage: '关阀控险', time: '2025-01-14 11:25', desc: '关闭泄漏点上下游DN200调压箱出口阀门，隔离泄漏管段，浓度开始下降', operator: '调压班组', color: 'orange' },
      { stage: '应急联动', time: '2025-01-14 11:35', desc: '通报119、110联动，交警协助疏导交通，社区通知周边住户关闭门窗', operator: '应急办-孙主任', color: 'blue' },
      { stage: '精准定位', time: '2025-01-14 12:10', desc: '钻孔+检漏仪精确定位：地下PE管De160接口热熔处开裂，泄漏量约8m³/h', operator: '检漏班-马工', color: 'cyan' },
      { stage: '开挖换管', time: '2025-01-14 13:30', desc: '人工小心开挖作业坑，切除约0.8米破损管段，准备电熔套筒连接', operator: 'PE管班-韩师傅', color: 'gold' },
      { stage: '电熔焊接', time: '2025-01-14 15:00', desc: 'De160电熔套筒焊接完成，自然冷却30分钟', operator: 'PE管班', color: 'gold' },
      { stage: '严密性试验', time: '2025-01-14 16:10', desc: '强度试验0.4MPa/1h、严密性试验0.26MPa/24h（在线监测），合格', operator: '质检-吴工', color: 'green' },
      { stage: '置换通气', time: '2025-01-15 05:30', desc: '氮气置换管道内空气，逐步开启阀门恢复供气，网格员逐楼通知安全检查', operator: '调度中心+社区', color: 'green' },
      { stage: '复查确认', time: '2025-01-15 08:00', desc: '对周边200米范围再次巡检确认零泄漏，恢复正常运行', operator: '巡检班', color: 'green' },
    ],
  },
  {
    type: 'notice', serviceType: 'water',
    title: '水费价格调整通知 - 2025年成都市城镇供水价格调整',
    summary: '根据川发改价格〔2024〕218号文件，自2025年2月1日起调整城镇供水价格',
    content: `<h3>水费价格调整通知</h3><p>尊敬的用户：</p><p>根据四川省发展和改革委员会《关于调整成都市城镇供水价格的通知》（川发改价格〔2024〕218号），自2025年2月1日起调整供水价格：</p><p><strong>居民用水阶梯价格：</strong></p><ul><li>第一阶梯：0-180m³/年，到户价3.45元/m³（原3.20元）</li><li>第二阶梯：181-300m³/年，到户价4.50元/m³（原4.25元）</li><li>第三阶梯：300m³以上/年，到户价6.80元/m³（原6.45元）</li></ul><p><strong>执行时间：</strong>2025年2月1日（按抄表周期计算）</p><p><strong>低收入家庭保障：</strong>持低保户凭证每月免费用水量由5m³调整为6m³</p><p>如有疑问，请拨打咨询热线：962960</p>`,
    affectAreas: ['510104', '510105', '510106', '510107', '510108', '510109'], affectAreaNames: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区'], pushStatus: 1, pushTime: '2025-01-10 10:00:00',
  },
  {
    type: 'notice', serviceType: 'electricity',
    title: '电费价格调整通知 - 2025年四川电网销售电价调整',
    summary: '根据川发改价格文件，自2025年2月起调整居民生活用电阶梯电价',
    content: `<h3>电费价格调整通知</h3><p>尊敬的用户：</p><p>根据四川省发展和改革委员会相关文件，自2025年2月起调整四川电网销售电价：</p><p><strong>居民生活用电阶梯电价：</strong></p><ul><li>第一阶梯：0-180度/月，0.5224元/度</li><li>第二阶梯：181-280度/月，0.6224元/度</li><li>第三阶梯：281度以上/月，0.8224元/度</li></ul><p><strong>峰谷电价：</strong>高峰时段(10:00-12:00,15:00-21:00)上浮50%；低谷时段(23:00-07:00)下浮50%</p><p><strong>执行时间：</strong>2025年2月1日</p><p><strong>咨询热线：</strong>962960</p>`,
    affectAreas: ['510104', '510105', '510106', '510107', '510108', '510109'], affectAreaNames: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区'], pushStatus: 1, pushTime: '2025-01-11 09:00:00',
  },
  {
    type: 'notice', serviceType: 'gas',
    title: '冬季燃气安全使用温馨提示',
    summary: '冬季是燃气事故高发期，请用户注意通风换气、定期检查燃气设施',
    content: `<h3>冬季燃气安全使用温馨提示</h3><p>尊敬的用户：</p><p>冬季是燃气事故高发期，为保障您和家人的生命财产安全，请注意以下安全事项：</p><ul><li><strong>保持通风：</strong>使用燃气时务必保持室内通风，严禁密闭空间使用</li><li><strong>人走火灭：</strong>使用燃气时不要离开，用完即关闭阀门</li><li><strong>定期检查：</strong>建议每年由专业人员对燃气设施进行一次安全检查</li><li><strong>报警器维护：</strong>确保燃气报警器正常工作，定期测试</li><li><strong>泄漏处置：</strong>如闻到异味，立即关闭阀门、开窗通风、撤离到安全区域后拨打962960</li></ul><p><strong>免费安检预约：</strong>拨打962960可预约上门安全检查服务</p>`,
    affectAreas: ['510104', '510105', '510106', '510107', '510108', '510109'], affectAreaNames: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区'], pushStatus: 1, pushTime: '2025-01-05 08:00:00',
  },
  {
    type: 'outage', serviceType: 'all',
    title: '设施检修通知 - 锦江区部分区域水电气综合检修',
    summary: '锦江区牛市口片区将于2025年1月22日进行水电气综合检修，届时将分时段停供',
    content: `<h3>设施综合检修通知</h3><p>尊敬的用户：</p><p>为提升锦江区牛市口片区公用设施运行安全，我司将进行水电气综合检修：</p><p><strong>检修时间：</strong>2025年1月22日</p><p><strong>停水时段：</strong>08:00-14:00（供水管道冲洗消毒）</p><p><strong>停电时段：</strong>09:00-17:00（配电设备检修）</p><p><strong>停气时段：</strong>10:00-16:00（燃气管网安全检测）</p><p><strong>影响区域：</strong>锦江区牛市口、东大街、海椒市街沿线</p><p><strong>温馨提示：</strong>请提前做好蓄水、充电准备，停气后恢复供气请注意开窗通风</p><p><strong>咨询热线：</strong>962960</p>`,
    affectAreas: ['510104'], affectAreaNames: ['锦江区'], pushStatus: 1, pushTime: '2025-01-20 10:00:00',
  },
];

realAnnouncements.forEach((item, i) => {
  announcements.push({
    id: i + 1,
    ...item,
    status: i < 7 ? 2 : i < 9 ? 1 : 3,
    creatorName: ['李明', '王芳', '张华', '刘洋', '陈静', '赵强', '周敏', '吴刚', '孙丽', '郑伟'][i],
    publishTime: item.pushTime || Mock.Random.datetime(),
    createTime: Mock.Random.datetime(),
  });
});

for (let i = realAnnouncements.length; i < 20; i++) {
  const types = ['outage', 'repair', 'notice'];
  const serviceTypes = ['water', 'electricity', 'gas', 'all'];
  const type = types[i % 3];
  const serviceType = serviceTypes[i % 4];

  const titleMap: Record<string, Record<string, string>> = {
    outage: { water: '停水通知', electricity: '停电通知', gas: '停气通知', all: '设施检修通知' },
    repair: { water: '供水抢修公告', electricity: '供电抢修公告', gas: '燃气抢修公告', all: '紧急抢修公告' },
    notice: { water: '水费价格调整通知', electricity: '电费价格调整通知', gas: '燃气安全使用通知', all: '重要通知' },
  };

  const baseRepairProgress = type === 'repair' ? {
    repairProgress: [
      { stage: '接报', time: Mock.Random.datetime(), desc: `接获${['市民报警', '系统告警', '巡检发现'][i % 3]}，调度中心派发工单`, operator: Mock.Random.cname(), color: 'blue' },
      { stage: '到场', time: Mock.Random.datetime(), desc: '抢修人员抵达现场，完成现场警戒和安全防护措施', operator: Mock.Random.cname() + '抢修队', color: 'cyan' },
      { stage: '处置', time: Mock.Random.datetime(), desc: ['完成故障定位，正在修复作业', '已关闭控制阀门，正在开挖作业', '已确定故障点，正在进行修复'][i % 3], operator: '抢修班组', color: 'gold' },
      { stage: '恢复', time: Mock.Random.datetime(), desc: '完成修复并通过检测，逐步恢复正常供应', operator: '调度中心', color: 'green' },
    ],
  } : {};

  announcements.push({
    id: i + 1,
    title: `${titleMap[type][serviceType]} - ${Mock.Random.csentence(5, 10)}`,
    type,
    serviceType,
    summary: Mock.Random.csentence(15, 25),
    content: `<h3>${titleMap[type][serviceType]}</h3><p>尊敬的用户：</p><p>${Mock.Random.cparagraph(3, 5)}</p><p>${Mock.Random.cparagraph(2, 4)}</p>`,
    affectAreas: ['510104', '510105', '510107'].slice(0, (i % 3) + 1),
    affectAreaNames: ['锦江区', '青羊区', '武侯区'].slice(0, (i % 3) + 1),
    pushStatus: i % 2 === 0 ? 1 : 0,
    pushTime: Mock.Random.datetime(),
    status: i < 15 ? 2 : i < 18 ? 1 : 3,
    creatorName: Mock.Random.cname(),
    publishTime: Mock.Random.datetime(),
    createTime: Mock.Random.datetime(),
    ...baseRepairProgress,
  });
}

export default [
  {
    url: '/api/announcement/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, type, serviceType, keyword, areaCode } = query;
      let filtered = [...announcements];

      if (type) {
        filtered = filtered.filter((a) => a.type === type);
      }
      if (serviceType && serviceType !== 'all') {
        filtered = filtered.filter((a) => a.serviceType === serviceType || a.serviceType === 'all');
      }
      if (keyword) {
        filtered = filtered.filter((a) => a.title.includes(keyword) || a.summary.includes(keyword));
      }
      if (areaCode) {
        filtered = filtered.filter((a) => a.affectAreas.includes(areaCode));
      }
      if (query.status !== undefined && query.status !== '') {
        filtered = filtered.filter((a) => a.status === Number(query.status));
      }

      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return {
        code: 0,
        message: 'success',
        data: {
          list,
          total: filtered.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },
  {
    url: '/api/announcement/latest',
    method: 'get',
    response: ({ query }: any) => {
      const limit = Number(query.limit) || 5;
      const published = announcements.filter((a) => a.status === 2).slice(0, limit);
      return {
        code: 0,
        message: 'success',
        data: published,
      };
    },
  },
  {
    url: '/api/announcement/:id',
    method: 'get',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const announcement = announcements.find((a) => a.id === id);
      return {
        code: 0,
        message: 'success',
        data: announcement || announcements[0],
      };
    },
  },
  {
    url: '/api/admin/announcement/create',
    method: 'post',
    response: ({ body }: any) => {
      const newAnnouncement = {
        id: announcements.length + 1,
        ...body,
        status: 0,
        creatorName: '管理员',
        createTime: Mock.Random.datetime(),
      };
      announcements.unshift(newAnnouncement);
      return {
        code: 0,
        message: '创建成功',
        data: newAnnouncement,
      };
    },
  },
  {
    url: '/api/admin/announcement/:id',
    method: 'put',
    response: ({ params, body }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements[index] = { ...announcements[index], ...body };
      }
      return {
        code: 0,
        message: '更新成功',
        data: announcements[index],
      };
    },
  },
  {
    url: '/api/admin/announcement/submit-audit/:id',
    method: 'post',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements[index].status = 1;
      }
      return {
        code: 0,
        message: '提交审核成功',
      };
    },
  },
  {
    url: '/api/admin/announcement/audit/:id',
    method: 'post',
    response: ({ params, body }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements[index].status = body.result === 1 ? 2 : 3;
      }
      return {
        code: 0,
        message: '审核完成',
      };
    },
  },
  {
    url: '/api/admin/announcement/publish/:id',
    method: 'post',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements[index].status = 2;
        announcements[index].publishTime = Mock.Random.datetime();
      }
      return {
        code: 0,
        message: '发布成功',
      };
    },
  },
  {
    url: '/api/admin/announcement/offline/:id',
    method: 'post',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements[index].status = 4;
      }
      return {
        code: 0,
        message: '下架成功',
      };
    },
  },
  {
    url: '/api/admin/announcement/:id',
    method: 'delete',
    response: ({ params }: any) => {
      const id = Number(safeParam(params, 'id', 1));
      const index = announcements.findIndex((a) => a.id === id);
      if (index > -1) {
        announcements.splice(index, 1);
      }
      return {
        code: 0,
        message: '删除成功',
      };
    },
  },
] as MockMethod[];
