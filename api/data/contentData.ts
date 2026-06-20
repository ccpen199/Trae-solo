import type { ContentItem } from '../../shared/types';
import { generateId, getRandomDate, getRandomItem, getRandomInt } from './utils';

const channels: ContentItem['channel'][] = ['politics', 'livelihood', 'culture', 'education'];
const tiers: ContentItem['tier'][] = ['city', 'district', 'street'];
const statuses: ContentItem['status'][] = ['published', 'published', 'published', 'pending', 'draft', 'rejected'];
const sources: ContentItem['source'][] = ['manual', 'rss', 'api', 'manual', 'manual'];

const politicsTitles = [
  '市委召开常委会会议 研究部署经济社会发展重点工作',
  '市政府党组召开2024年度民主生活会',
  '徐州市第十六届人民代表大会第五次会议隆重开幕',
  '市政协十六届三次会议隆重开幕',
  '全市安全生产工作会议召开 压实责任筑牢防线',
  '市委理论学习中心组举行集体学习会',
  '全市优化营商环境工作推进会召开',
  '徐州市与某央企签署战略合作框架协议',
  '市领导调研重点项目建设推进情况',
  '全市党建工作会议召开 推动全面从严治党向纵深发展',
];

const livelihoodTitles = [
  '徐州地铁4号线一期工程正式开通运营',
  '我市今年将新增10个便民服务中心',
  '市区公交线路优化调整 方便市民出行',
  '全市老旧小区改造工程全面启动',
  '徐州市民中心正式启用 一站式办理政务服务',
  '我市启动"一刻钟便民生活圈"建设',
  '市区新增5000个公共停车位 缓解停车难',
  '全市城乡居民医保缴费标准调整',
  '我市开展市容环境综合整治行动',
  '徐州首批"社区食堂"投入运营 惠及老年群体',
];

const cultureTitles = [
  '徐州汉文化旅游节盛大开幕 擦亮汉文化名片',
  '市博物馆新馆正式开放 展出珍贵文物千余件',
  '我市成功举办第三届淮海文化博览会',
  '徐州梆子戏入选国家级非遗代表性项目',
  '全市全民阅读活动启动 建设书香徐州',
  '云龙湖景区获评国家级旅游度假区',
  '我市举办"大美徐州"摄影大赛作品展',
  '户部山历史文化街区改造提升工程竣工',
  '徐州书画名家邀请展在市美术馆开展',
  '民间手工艺展示活动走进社区',
];

const educationTitles = [
  '我市今年新建改扩建中小学20所 增加学位3万个',
  '徐州市教育局发布2024年义务教育招生政策',
  '全市高考工作部署会议召开 确保平安高考',
  '徐州高校毕业生就业创业促进计划启动',
  '我市推进"双减"工作落地见效',
  '徐州市第一中学喜迎建校120周年',
  '全市职业教育高质量发展大会召开',
  '名师工作室授牌仪式举行 促进教师专业成长',
  '我市开展校园安全专项检查行动',
  '学前教育普及普惠工程取得新成效',
];

const titleMap = {
  politics: politicsTitles,
  livelihood: livelihoodTitles,
  culture: cultureTitles,
  education: educationTitles,
};

const creatorNames = ['张编辑', '李记者', '王主任', '刘编辑', '陈记者', '赵编审', '孙编辑', '周记者'];

const coverImages = [
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=500&fit=crop',
];

function generateContent(channel: ContentItem['channel'], index: number): ContentItem {
  const titles = titleMap[channel];
  const title = titles[index % titles.length];
  const status = getRandomItem(statuses);
  const createTime = getRandomDate(60);
  const publishTime = status === 'published' ? getRandomDate(30) : undefined;

  return {
    id: generateId('content'),
    title,
    summary: `这是一篇关于${title}的新闻报道，详细介绍了相关情况和最新进展...`,
    content: `<p>本报讯（记者 某某）${title}。</p><p>日前，相关部门召开专题会议，对该项工作进行了全面部署。会议指出，要深入贯彻落实上级决策部署，坚持以人民为中心的发展思想，扎实推进各项工作任务落地见效。</p><p>据了解，该项工作自启动以来，各相关部门密切配合、协同推进，取得了阶段性成效。下一步，将继续加大工作力度，完善工作机制，确保按时保质完成各项目标任务，不断提升人民群众的获得感、幸福感、安全感。</p><p>市领导强调，要提高政治站位，强化责任担当，以更高的标准、更严的要求、更实的举措，推动各项工作再上新台阶，为全市经济社会高质量发展作出新的更大贡献。</p>`,
    coverImage: coverImages[index % coverImages.length],
    channel,
    tier: getRandomItem(tiers),
    status,
    source: getRandomItem(sources),
    viewCount: getRandomInt(100, 50000),
    publishTime,
    createTime,
    updateTime: createTime,
    creatorId: `user_${getRandomInt(1, 10)}`,
    creatorName: getRandomItem(creatorNames),
  };
}

export const mockContents: ContentItem[] = [];

channels.forEach((channel) => {
  for (let i = 0; i < 10; i++) {
    mockContents.push(generateContent(channel, i));
  }
});

mockContents.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
