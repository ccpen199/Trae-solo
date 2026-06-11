import { db, generateId, now } from './database';
import bcrypt from 'bcryptjs';
import type {
  User, Role, Permission, Content, Tag, ScenicSpot,
  IntangibleHeritage, InvestmentProject, FestivalActivity,
  Dashboard, OpenApi, DistributionRule, GuideCertification
} from '../../shared/types';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const seedDatabase = async (): Promise<void> => {
  const adminId = generateId();
  const editorId = generateId();
  const governmentId = generateId();
  const scenicId = generateId();
  const enterpriseId = generateId();
  const professionalId = generateId();
  const touristId = generateId();

  const superAdminRoleId = generateId();
  const governmentRoleId = generateId();
  const scenicAdminRoleId = generateId();
  const enterpriseRoleId = generateId();
  const editorRoleId = generateId();
  const professionalRoleId = generateId();
  const touristRoleId = generateId();

  const roles: Role[] = [
    { id: superAdminRoleId, name: '超级管理员', code: 'super_admin', description: '系统最高权限管理员', isSystem: true },
    { id: governmentRoleId, name: '文旅主管部门', code: 'government', description: '文旅管理部门用户', isSystem: true },
    { id: scenicAdminRoleId, name: '景区运营方', code: 'scenic_admin', description: '景区运营管理人员', isSystem: true },
    { id: enterpriseRoleId, name: '文旅企业', code: 'enterprise', description: '文旅企业用户', isSystem: true },
    { id: editorRoleId, name: '专业编辑', code: 'editor', description: '内容编辑人员', isSystem: true },
    { id: professionalRoleId, name: '专业读者', code: 'professional', description: '专业读者用户', isSystem: true },
    { id: touristRoleId, name: '普通游客', code: 'tourist', description: '普通游客用户', isSystem: true },
  ];

  roles.forEach(role => db.roles.set(role.id, role));

  const permissions: Permission[] = [
    { id: generateId(), name: '内容查看', code: 'content:read', module: 'content', action: 'read' },
    { id: generateId(), name: '内容创建', code: 'content:create', module: 'content', action: 'create' },
    { id: generateId(), name: '内容编辑', code: 'content:edit', module: 'content', action: 'edit' },
    { id: generateId(), name: '内容删除', code: 'content:delete', module: 'content', action: 'delete' },
    { id: generateId(), name: '内容发布', code: 'content:publish', module: 'content', action: 'publish' },
    { id: generateId(), name: '审核操作', code: 'audit:operate', module: 'audit', action: 'operate' },
    { id: generateId(), name: '审核查看', code: 'audit:view', module: 'audit', action: 'view' },
    { id: generateId(), name: '版权管理', code: 'copyright:manage', module: 'copyright', action: 'manage' },
    { id: generateId(), name: '数据分析查看', code: 'analytics:view', module: 'analytics', action: 'view' },
    { id: generateId(), name: '数据看板编辑', code: 'data:edit', module: 'data', action: 'edit' },
    { id: generateId(), name: 'API开发访问', code: 'developer:access', module: 'developer', action: 'access' },
    { id: generateId(), name: 'API申请', code: 'developer:apply', module: 'developer', action: 'apply' },
    { id: generateId(), name: '招商服务', code: 'service:invest', module: 'service', action: 'invest' },
    { id: generateId(), name: '活动申报', code: 'service:festival', module: 'service', action: 'festival' },
    { id: generateId(), name: '导游认证', code: 'service:guide', module: 'service', action: 'guide' },
    { id: generateId(), name: '用户管理', code: 'system:user', module: 'system', action: 'user' },
    { id: generateId(), name: '角色管理', code: 'system:role', module: 'system', action: 'role' },
    { id: generateId(), name: '系统设置', code: 'system:setting', module: 'system', action: 'setting' },
    { id: generateId(), name: '日志查看', code: 'system:log', module: 'system', action: 'log' },
  ];

  permissions.forEach(p => db.permissions.set(p.id, p));

  const allPermissionIds = permissions.map(p => p.id);
  db.rolePermissions.set(superAdminRoleId, allPermissionIds);
  db.rolePermissions.set(governmentRoleId, permissions.filter(p => 
    ['content:read', 'content:publish', 'audit:operate', 'audit:view', 'analytics:view', 'data:edit', 'service:invest', 'service:festival', 'system:log'].includes(p.code)
  ).map(p => p.id));
  db.rolePermissions.set(scenicAdminRoleId, permissions.filter(p => 
    ['content:read', 'content:create', 'content:edit', 'audit:view', 'analytics:view', 'service:festival'].includes(p.code)
  ).map(p => p.id));
  db.rolePermissions.set(enterpriseRoleId, permissions.filter(p => 
    ['content:read', 'content:create', 'content:edit', 'audit:view', 'service:invest', 'developer:apply'].includes(p.code)
  ).map(p => p.id));
  db.rolePermissions.set(editorRoleId, permissions.filter(p => 
    ['content:read', 'content:create', 'content:edit', 'content:delete', 'audit:operate', 'audit:view', 'copyright:manage'].includes(p.code)
  ).map(p => p.id));
  db.rolePermissions.set(professionalRoleId, permissions.filter(p => 
    ['content:read', 'analytics:view', 'developer:access', 'developer:apply'].includes(p.code)
  ).map(p => p.id));
  db.rolePermissions.set(touristRoleId, permissions.filter(p => 
    ['content:read'].includes(p.code)
  ).map(p => p.id));

  const hashedAdminPwd = await hashPassword('admin123');
  const hashedUserPwd = await hashPassword('user123');

  const users: User[] = [
    {
      id: adminId,
      username: 'admin',
      realName: '系统管理员',
      email: 'admin@wenlv.gov.cn',
      phone: '13800000001',
      role: 'super_admin',
      organization: '文化和旅游部',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: editorId,
      username: 'editor',
      realName: '李编辑',
      email: 'editor@wenlv.gov.cn',
      phone: '13800000002',
      role: 'editor',
      organization: '中国旅游报',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: governmentId,
      username: 'gov',
      realName: '王处长',
      email: 'wang@mct.gov.cn',
      phone: '13800000003',
      role: 'government',
      organization: '文化和旅游部资源开发司',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gov',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: scenicId,
      username: 'scenic',
      realName: '张经理',
      email: 'zhang@gugong.com',
      phone: '13800000004',
      role: 'scenic_admin',
      organization: '故宫博物院',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scenic',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: enterpriseId,
      username: 'enterprise',
      realName: '赵总',
      email: 'zhao@ctrip.com',
      phone: '13800000005',
      role: 'enterprise',
      organization: '携程旅行',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=enterprise',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: professionalId,
      username: 'pro',
      realName: '陈教授',
      email: 'chen@university.edu.cn',
      phone: '13800000006',
      role: 'professional',
      organization: '清华大学建筑学院',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
    {
      id: touristId,
      username: 'tourist',
      realName: '刘游客',
      email: 'liu@email.com',
      phone: '13800000007',
      role: 'tourist',
      organization: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tourist',
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    },
  ];

  users.forEach(user => db.users.set(user.id, { ...user, password_hash: hashedUserPwd } as any));
  (db.users.get(adminId) as any).password_hash = hashedAdminPwd;

  db.userRoles.set(adminId, [superAdminRoleId]);
  db.userRoles.set(editorId, [editorRoleId]);
  db.userRoles.set(governmentId, [governmentRoleId]);
  db.userRoles.set(scenicId, [scenicAdminRoleId]);
  db.userRoles.set(enterpriseId, [enterpriseRoleId]);
  db.userRoles.set(professionalId, [professionalRoleId]);
  db.userRoles.set(touristId, [touristRoleId]);

  const tags: Tag[] = [
    { id: generateId(), name: '历史文化', category: '主题', useCount: 156 },
    { id: generateId(), name: '自然风光', category: '主题', useCount: 243 },
    { id: generateId(), name: '民俗风情', category: '主题', useCount: 89 },
    { id: generateId(), name: '美食探店', category: '主题', useCount: 178 },
    { id: generateId(), name: '红色旅游', category: '主题', useCount: 67 },
    { id: generateId(), name: '乡村振兴', category: '主题', useCount: 45 },
    { id: generateId(), name: '北京', category: '地域', useCount: 312 },
    { id: generateId(), name: '上海', category: '地域', useCount: 278 },
    { id: generateId(), name: '西安', category: '地域', useCount: 198 },
    { id: generateId(), name: '成都', category: '地域', useCount: 167 },
    { id: generateId(), name: '杭州', category: '地域', useCount: 145 },
    { id: generateId(), name: '5A景区', category: '等级', useCount: 356 },
    { id: generateId(), name: '4A景区', category: '等级', useCount: 523 },
    { id: generateId(), name: '非遗', category: '特色', useCount: 89 },
    { id: generateId(), name: '文物保护单位', category: '特色', useCount: 124 },
  ];

  tags.forEach(tag => db.tags.set(tag.id, tag));

  const scenicSpots: ScenicSpot[] = [
    { id: generateId(), name: '故宫博物院', level: '5A', region: '北京', address: '北京市东城区景山前街4号', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forbidden%20city%20beijing%20chinese%20imperial%20palace%20traditional%20architecture&image_size=square_hd', ticketPrice: 60, rating: 4.9, maxCapacity: 80000, currentVisitorCount: 0, saturation: 0, latitude: 39.9163, longitude: 116.3972, description: '中国明清两代的皇家宫殿，旧称紫禁城，是中国古代宫廷建筑之精华。' },
    { id: generateId(), name: '颐和园', level: '5A', region: '北京', address: '北京市海淀区新建宫门路19号', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=summer%20palace%20beijing%20chinese%20garden%20kunming%20lake&image_size=square_hd', ticketPrice: 30, rating: 4.8, maxCapacity: 100000, currentVisitorCount: 0, saturation: 0, latitude: 39.9999, longitude: 116.2755, description: '中国清朝时期皇家园林，前身为清漪园，坐落在北京西郊。' },
    { id: generateId(), name: '八达岭长城', level: '5A', region: '北京', address: '北京市延庆区八达岭镇', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=great%20wall%20badaling%20china%20mountain%20landscape&image_size=square_hd', ticketPrice: 40, rating: 4.7, maxCapacity: 60000, currentVisitorCount: 0, saturation: 0, latitude: 40.3539, longitude: 116.0199, description: '中国古代伟大的防御工程万里长城的重要组成部分。' },
    { id: generateId(), name: '秦始皇兵马俑博物馆', level: '5A', region: '西安', address: '陕西省西安市临潼区秦陵北路', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=terracotta%20warriors%20xian%20china%20ancient%20army&image_size=square_hd', ticketPrice: 120, rating: 4.9, maxCapacity: 65000, currentVisitorCount: 0, saturation: 0, latitude: 34.3860, longitude: 109.2786, description: '世界八大奇迹之一，中国规模最大的古代军事博物馆。' },
    { id: generateId(), name: '西湖风景区', level: '5A', region: '杭州', address: '浙江省杭州市西湖区', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=west%20lake%20hangzhou%20chinese%20water%20landscape%20pagoda&image_size=square_hd', ticketPrice: 0, rating: 4.8, maxCapacity: 200000, currentVisitorCount: 0, saturation: 0, latitude: 30.2430, longitude: 120.1436, description: '中国大陆首批国家重点风景名胜区和中国十大风景名胜之一。' },
    { id: generateId(), name: '黄山风景区', level: '5A', region: '黄山', address: '安徽省黄山市黄山区', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=huangshan%20mountain%20china%20clouds%20pine%20trees&image_size=square_hd', ticketPrice: 190, rating: 4.9, maxCapacity: 50000, currentVisitorCount: 0, saturation: 0, latitude: 30.1299, longitude: 118.1707, description: '世界文化与自然双重遗产，中华十大名山之一。' },
    { id: generateId(), name: '九寨沟', level: '5A', region: '阿坝', address: '四川省阿坝藏族羌族自治州九寨沟县', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jiuzhaigou%20valley%20china%20turquoise%20lake%20waterfall&image_size=square_hd', ticketPrice: 169, rating: 4.9, maxCapacity: 41000, currentVisitorCount: 0, saturation: 0, latitude: 33.1656, longitude: 103.9139, description: '世界自然遗产，以翠海、叠瀑、彩林、雪峰、藏情著称。' },
    { id: generateId(), name: '丽江古城', level: '5A', region: '丽江', address: '云南省丽江市古城区', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lijiang%20ancient%20town%20china%20naxi%20traditional%20architecture&image_size=square_hd', ticketPrice: 50, rating: 4.7, maxCapacity: 150000, currentVisitorCount: 0, saturation: 0, latitude: 26.8721, longitude: 100.2303, description: '世界文化遗产，是中国以整座古城申报世界文化遗产获得成功的两座古城之一。' },
  ];

  scenicSpots.forEach(spot => db.scenicSpots.set(spot.id, spot));

  const contentTypes: ('article' | 'video' | 'vr' | 'infographic')[] = ['article', 'video', 'vr', 'infographic'];
  const contentStatuses: ('draft' | 'pending_audit' | 'auditing' | 'approved' | 'rejected' | 'published' | 'offline')[] = ['published', 'published', 'published', 'pending_audit', 'approved', 'draft'];
  const categories = ['政策解读', '景区推荐', '文化遗产', '旅游攻略', '节庆活动', '行业动态'];
  const regions = ['北京', '上海', '西安', '成都', '杭州', '全国'];

  const sampleContents: Content[] = [
    {
      id: generateId(),
      title: '2024年全国文化和旅游发展规划解读',
      type: 'article',
      authorId: governmentId,
      authorName: '王处长',
      summary: '深入解读国家文化和旅游部最新发布的发展规划，分析未来五年文旅行业发展趋势和政策导向。',
      content: `<h2>规划背景</h2><p>为深入贯彻落实党的二十大精神，加快推进文化和旅游深度融合发展，文化和旅游部近日印发《2024年全国文化和旅游发展规划》...</p>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20traditional%20landscape%20painting%20mountains%20and%20rivers%20cultural%20heritage&image_size=landscape_16_9',
      tags: ['政策解读', '行业动态', '全国'],
      category: '政策解读',
      region: '全国',
      status: 'published',
      views: 15680,
      likes: 892,
      shares: 345,
      comments: 156,
      scheduledPublishAt: undefined,
      publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: generateId(),
      title: '故宫博物院：六百年紫禁城的前世今生',
      type: 'vr',
      authorId: scenicId,
      authorName: '张经理',
      summary: '通过VR全景技术，带您沉浸式游览故宫博物院，了解这座六百年皇家宫殿的历史与文化。',
      content: `<h2>VR导览说明</h2><p>本VR导览包含太和殿、乾清宫、御花园等核心景区，配有专业语音讲解，让您足不出户感受紫禁城的魅力...</p>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forbidden%20city%20beijing%20imperial%20palace%20traditional%20chinese%20architecture&image_size=landscape_16_9',
      tags: ['历史文化', '5A景区', '北京'],
      category: '景区推荐',
      region: '北京',
      status: 'published',
      views: 45230,
      likes: 2341,
      shares: 1256,
      comments: 478,
      publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: generateId(),
      title: '【一图读懂】2024年节假日旅游出行指南',
      type: 'infographic',
      authorId: editorId,
      authorName: '李编辑',
      summary: '通过精美的信息图，为您解读2024年节假日安排、热门景区预测、出行避坑指南。',
      content: `<p>本长图包含以下内容：</p><ul><li>2024年节假日放假安排</li><li>各节假日热门目的地预测</li><li>交通出行高峰时段提示</li><li>景区预约攻略</li></ul>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20infographic%20travel%20guide%20illustration%20map%20calendar&image_size=landscape_16_9',
      tags: ['旅游攻略', '全国'],
      category: '旅游攻略',
      region: '全国',
      status: 'published',
      views: 89450,
      likes: 5678,
      shares: 3421,
      comments: 892,
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: generateId(),
      title: '非遗传承人系列纪录片：昆曲的传承与创新',
      type: 'video',
      authorId: editorId,
      authorName: '李编辑',
      summary: '跟随镜头，走进昆曲艺术的世界，聆听非遗传承人的故事，感受传统艺术的魅力。',
      content: `<p>昆曲是中国最古老的剧种之一，被誉为"百戏之祖"。本片通过对多位昆曲传承人的采访，展现这一古老艺术在当代的传承与创新...</p>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20kunqu%20opera%20traditional%20performance%20art%20heritage&image_size=landscape_16_9',
      tags: ['非遗', '历史文化', '民俗风情'],
      category: '文化遗产',
      region: '全国',
      status: 'pending_audit',
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: generateId(),
      title: '2024年春节黄金周全国旅游市场分析报告',
      type: 'article',
      authorId: professionalId,
      authorName: '陈教授',
      summary: '基于全国A级景区客流数据、OTA预订数据和消费券核销数据，深度分析春节黄金周旅游市场特点。',
      content: `<h2>一、总体情况</h2><p>2024年春节黄金周期间，全国国内旅游出游人次达4.74亿，同比增长34.3%...</p>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20spring%20festival%20travel%20crowd%20tourism%20statistics%20data&image_size=landscape_16_9',
      tags: ['行业动态', '数据分析', '全国'],
      category: '行业动态',
      region: '全国',
      status: 'approved',
      views: 23450,
      likes: 1234,
      shares: 567,
      comments: 234,
      publishedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: generateId(),
      title: '西安城墙灯会：千年古都的新春盛宴',
      type: 'article',
      authorId: editorId,
      authorName: '李编辑',
      summary: '带您走进西安城墙新春灯会，感受千年古都的节日氛围，了解灯会背后的文化内涵。',
      content: `<h2>灯会简介</h2><p>西安城墙新春灯会始于1984年，至今已成功举办40届，是西安最具影响力的文化活动之一...</p>`,
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=xian%20city%20wall%20lantern%20festival%20night%20traditional%20chinese%20new%20year&image_size=landscape_16_9',
      tags: ['节庆活动', '历史文化', '西安'],
      category: '节庆活动',
      region: '西安',
      status: 'published',
      views: 34560,
      likes: 1876,
      shares: 890,
      comments: 345,
      publishedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ];

  sampleContents.forEach(content => {
    db.contents.set(content.id, content);
    db.contentTags.set(content.id, content.tags);
    
    if (content.status === 'pending_audit') {
      db.auditRecords.set(content.id, [{
        id: generateId(),
        contentId: content.id,
        auditorId: '',
        auditorName: '',
        level: 1,
        action: 'submit',
        opinion: '已提交审核',
        createdAt: content.updatedAt,
      }]);
    }
  });

  scenicSpots.forEach(spot => {
    const flows: any[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - 86400000 * i);
      const visitorCount = Math.floor(Math.random() * spot.maxCapacity * 0.8) + spot.maxCapacity * 0.2;
      flows.push({
        id: generateId(),
        scenicSpotId: spot.id,
        scenicSpotName: spot.name,
        region: spot.region,
        visitorCount: Math.floor(visitorCount),
        maxCapacity: spot.maxCapacity,
        saturation: Math.round((visitorCount / spot.maxCapacity) * 10000) / 10000,
        realTimeData: i === 0,
        timestamp: date.toISOString(),
      });
    }
    db.scenicFlows.set(spot.id, flows);
    
    const todayFlow = flows[0];
    spot.currentVisitorCount = todayFlow.visitorCount;
    spot.saturation = todayFlow.saturation;
    db.scenicSpots.set(spot.id, spot);

    const platforms = ['携程', '美团', '飞猪', '去哪儿', '同程'];
    const bookings: any[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - 86400000 * i);
      platforms.forEach(platform => {
        bookings.push({
          id: generateId(),
          scenicSpotId: spot.id,
          scenicSpotName: spot.name,
          platform,
          bookingCount: Math.floor(Math.random() * 5000) + 500,
          bookingAmount: Math.floor(Math.random() * 500000) + 50000,
          checkInDate: new Date(Date.now() - 86400000 * i + 86400000 * Math.floor(Math.random() * 7)).toISOString().split('T')[0],
          dataDate: date.toISOString().split('T')[0],
        });
      });
    }
    db.otaBookings.set(spot.id, bookings);
  });

  const heritages: IntangibleHeritage[] = [
    { id: generateId(), name: '昆曲', category: '传统戏剧', level: 'national', region: '江苏', inheritor: '王芳', description: '昆曲是中国最古老的剧种之一，被誉为"百戏之祖"，以其优雅的唱腔和精美的表演著称。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '京剧', category: '传统戏剧', level: 'national', region: '北京', inheritor: '梅葆玖', description: '京剧是中国影响最大的戏曲剧种，被视为中国国粹，位列中国戏曲三鼎甲榜首。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '剪纸', category: '传统美术', level: 'national', region: '河北', inheritor: '王老赏', description: '剪纸是中国最古老的民间艺术之一，其在视觉上给人以透空的感觉和艺术享受。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '刺绣', category: '传统美术', level: 'national', region: '江苏', inheritor: '姚建萍', description: '刺绣是中国民间传统手工艺之一，在中国至少有二三千年历史，苏绣、湘绣、粤绣、蜀绣并称中国四大名绣。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '景德镇陶瓷', category: '传统技艺', level: 'national', region: '江西', inheritor: '邓希平', description: '景德镇陶瓷历史悠久，素有"瓷都"之称，其青花瓷、玲珑瓷、粉彩瓷、颜色釉瓷并称四大传统名瓷。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '龙井茶制作技艺', category: '传统技艺', level: 'national', region: '浙江', inheritor: '戚国伟', description: '西湖龙井茶是中国十大名茶之首，其制作技艺包括采摘、摊放、杀青、辉锅等十道工序。', certificationDate: '2008-06-07' },
    { id: generateId(), name: '端午节', category: '民俗', level: 'national', region: '湖北', inheritor: '', description: '端午节是中国四大传统节日之一，习俗包括赛龙舟、吃粽子、挂艾草、佩香囊等。', certificationDate: '2006-05-20' },
    { id: generateId(), name: '中医针灸', category: '传统医药', level: 'national', region: '全国', inheritor: '石学敏', description: '针灸是针法和灸法的总称，是东方医学的重要组成部分，2010年被列入人类非物质文化遗产代表作名录。', certificationDate: '2006-05-20' },
  ];

  heritages.forEach(h => db.heritages.set(h.id, h));

  const couponBatches = [
    { id: generateId(), name: '2024年全国文旅消费券（春季）', totalAmount: 100000000, totalCount: 2000000, region: '全国', validFrom: '2024-03-01', validTo: '2024-05-31' },
    { id: generateId(), name: '北京文旅消费券', totalAmount: 30000000, totalCount: 600000, region: '北京', validFrom: '2024-04-01', validTo: '2024-06-30' },
    { id: generateId(), name: '上海文旅消费券', totalAmount: 25000000, totalCount: 500000, region: '上海', validFrom: '2024-04-15', validTo: '2024-07-15' },
    { id: generateId(), name: '西安文旅消费券', totalAmount: 20000000, totalCount: 400000, region: '西安', validFrom: '2024-05-01', validTo: '2024-08-31' },
    { id: generateId(), name: '杭州文旅消费券', totalAmount: 15000000, totalCount: 300000, region: '杭州', validFrom: '2024-05-01', validTo: '2024-08-31' },
  ];

  couponBatches.forEach(batch => {
    db.couponBatches.set(batch.id, batch);
    
    const consumptions: any[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - 86400000 * i);
      const usedCount = Math.floor(Math.random() * 20000) + 5000;
      const usedAmount = usedCount * (Math.random() * 30 + 20);
      consumptions.push({
        id: generateId(),
        couponBatchId: batch.id,
        couponName: batch.name,
        totalAmount: batch.totalAmount,
        usedAmount: Math.floor(usedAmount),
        usedCount,
        writeOffRate: Math.round((usedCount / batch.totalCount) * 10000) / 10000,
        region: batch.region,
        statisticsDate: date.toISOString().split('T')[0],
      });
    }
    db.couponConsumptions.set(batch.id, consumptions);
  });

  const investmentProjects: InvestmentProject[] = [
    { id: generateId(), name: '张家界国际旅游度假区项目', type: '景区开发', region: '湖南', totalInvestment: 5000000000, description: '项目规划面积约30平方公里，建设内容包括主题乐园、度假酒店、康养中心、文化演艺中心等。', contactPerson: '周经理', contactPhone: '13900000001', status: 'negotiating', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '西安大唐不夜城二期扩建工程', type: '商业文旅', region: '陕西', totalInvestment: 2000000000, description: '在现有大唐不夜城基础上，扩建二期项目，打造沉浸式唐风体验街区。', contactPerson: '吴总监', contactPhone: '13900000002', status: 'signed', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '成都大熊猫主题公园', type: '主题公园', region: '四川', totalInvestment: 3500000000, description: '以大熊猫文化为核心，集科研保护、科普教育、旅游休闲于一体的大型主题公园。', contactPerson: '郑总', contactPhone: '13900000003', status: 'pending', createdBy: enterpriseId, createdAt: now() },
    { id: generateId(), name: '黄山风景区智慧旅游升级项目', type: '智慧旅游', region: '安徽', totalInvestment: 500000000, description: '运用5G、AI、VR等技术，打造智慧景区，提升游客体验和管理效率。', contactPerson: '王经理', contactPhone: '13900000004', status: 'negotiating', createdBy: scenicId, createdAt: now() },
    { id: generateId(), name: '丽江古镇文化保护与旅游开发项目', type: '古镇开发', region: '云南', totalInvestment: 1500000000, description: '在保护丽江古城原有风貌基础上，进行旅游基础设施升级和文化IP开发。', contactPerson: '陈主任', contactPhone: '13900000005', status: 'completed', createdBy: governmentId, createdAt: now() },
  ];

  investmentProjects.forEach(p => db.investmentProjects.set(p.id, p));

  const festivalActivities: FestivalActivity[] = [
    { id: generateId(), name: '2024洛阳牡丹文化节', organizer: '洛阳市人民政府', region: '河南', startDate: '2024-04-01', endDate: '2024-05-05', venue: '洛阳市各牡丹园', expectedScale: 3000000, description: '第40届洛阳牡丹文化节，以"花开洛阳 青春登场"为主题，举办赏花、演出、论坛等系列活动。', status: 'ongoing', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '2024西双版纳泼水节', organizer: '西双版纳州人民政府', region: '云南', startDate: '2024-04-13', endDate: '2024-04-15', venue: '西双版纳州景洪市', expectedScale: 1000000, description: '傣族传统新年，将举办泼水狂欢、龙舟赛、放高升、民族歌舞等活动。', status: 'approved', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '2024青岛国际啤酒节', organizer: '青岛市人民政府', region: '山东', startDate: '2024-07-19', endDate: '2024-08-04', venue: '青岛西海岸新区金沙滩啤酒城', expectedScale: 5000000, description: '第34届青岛国际啤酒节，将邀请国内外知名啤酒品牌参展，举办啤酒品饮、文艺演出、体育赛事等活动。', status: 'reviewing', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '2024杭州西湖博览会', organizer: '杭州市人民政府', region: '浙江', startDate: '2024-10-18', endDate: '2024-11-11', venue: '杭州市各展馆', expectedScale: 8000000, description: '第25届杭州西湖博览会，聚焦文旅融合、数字经济、美好生活三大主题。', status: 'submitted', createdBy: governmentId, createdAt: now() },
    { id: generateId(), name: '2024哈尔滨冰雪大世界', organizer: '哈尔滨市人民政府', region: '黑龙江', startDate: '2024-12-18', endDate: '2025-02-28', venue: '哈尔滨冰雪大世界园区', expectedScale: 2000000, description: '第26届哈尔滨冰雪大世界，将打造世界最大的冰雪主题乐园，展示精美的冰雕雪塑艺术。', status: 'draft', createdBy: scenicId, createdAt: now() },
  ];

  festivalActivities.forEach(a => db.festivalActivities.set(a.id, a));

  const guideCertifications: GuideCertification[] = [
    { id: generateId(), userId: touristId, realName: '刘导游', idCard: '110101199001011234', qualificationNo: 'D-1101-001234', qualificationLevel: 'intermediate', certificateImage: '', status: 'approved', validUntil: '2028-12-31', createdAt: now() },
    { id: generateId(), userId: generateId(), realName: '张导游', idCard: '610101199203042345', qualificationNo: 'D-6101-005678', qualificationLevel: 'senior', certificateImage: '', status: 'approved', validUntil: '2027-06-30', createdAt: now() },
    { id: generateId(), userId: generateId(), realName: '王导游', idCard: '510101199506073456', qualificationNo: 'D-5101-009012', qualificationLevel: 'primary', certificateImage: '', status: 'pending', validUntil: '', createdAt: now() },
  ];

  guideCertifications.forEach(c => db.guideCertifications.set(c.id, c));

  const dashboards: Dashboard[] = [
    {
      id: generateId(),
      name: '全国文旅运行监测总览',
      description: '全国A级景区客流、OTA预订、消费券核销等核心指标实时监测',
      ownerId: governmentId,
      isPublic: true,
      sharedRoles: [governmentRoleId, superAdminRoleId],
      layout: [
        { id: generateId(), type: 'card', title: '今日全国景区客流总量', dataSource: 'scenic_flow', dimensions: ['date'], measures: ['visitor_count'], filters: { timeRange: 'today' }, position: { x: 0, y: 0, w: 3, h: 2 } },
        { id: generateId(), type: 'card', title: '今日OTA预订金额', dataSource: 'ota_booking', dimensions: ['date'], measures: ['booking_amount'], filters: { timeRange: 'today' }, position: { x: 3, y: 0, w: 3, h: 2 } },
        { id: generateId(), type: 'card', title: '消费券核销率', dataSource: 'coupon', dimensions: ['date'], measures: ['write_off_rate'], filters: { timeRange: 'today' }, position: { x: 6, y: 0, w: 3, h: 2 } },
        { id: generateId(), type: 'card', title: '今日内容发布量', dataSource: 'content', dimensions: ['date'], measures: ['publish_count'], filters: { timeRange: 'today' }, position: { x: 9, y: 0, w: 3, h: 2 } },
        { id: generateId(), type: 'line', title: '近30天景区客流趋势', dataSource: 'scenic_flow', dimensions: ['date'], measures: ['visitor_count'], filters: { timeRange: '30days' }, position: { x: 0, y: 2, w: 8, h: 4 } },
        { id: generateId(), type: 'map', title: '全国景区客流热力分布', dataSource: 'scenic_flow', dimensions: ['region'], measures: ['visitor_count'], filters: { timeRange: 'today' }, position: { x: 8, y: 2, w: 4, h: 4 } },
        { id: generateId(), type: 'bar', title: '各平台OTA预订对比', dataSource: 'ota_booking', dimensions: ['platform'], measures: ['booking_amount'], filters: { timeRange: '7days' }, position: { x: 0, y: 6, w: 6, h: 4 } },
        { id: generateId(), type: 'pie', title: '消费券使用类型分布', dataSource: 'coupon', dimensions: ['type'], measures: ['used_amount'], filters: { timeRange: '30days' }, position: { x: 6, y: 6, w: 3, h: 4 } },
        { id: generateId(), type: 'table', title: '热门景区TOP10', dataSource: 'scenic_flow', dimensions: ['scenic_spot_name'], measures: ['visitor_count', 'saturation'], filters: { timeRange: 'today' }, position: { x: 9, y: 6, w: 3, h: 4 } },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      name: '内容传播分析看板',
      description: '内容传播效果、舆情分析、用户行为数据',
      ownerId: editorId,
      isPublic: true,
      sharedRoles: [editorRoleId, governmentRoleId, superAdminRoleId],
      layout: [
        { id: generateId(), type: 'line', title: '内容浏览量趋势', dataSource: 'content_analytics', dimensions: ['date'], measures: ['views', 'likes', 'shares'], filters: { timeRange: '30days' }, position: { x: 0, y: 0, w: 12, h: 4 } },
        { id: generateId(), type: 'gauge', title: '内容健康度评分', dataSource: 'sentiment', dimensions: [], measures: ['sentiment_score'], filters: { timeRange: '7days' }, position: { x: 0, y: 4, w: 4, h: 3 } },
        { id: generateId(), type: 'pie', title: '舆情情感分布', dataSource: 'sentiment', dimensions: ['sentiment'], measures: ['count'], filters: { timeRange: '7days' }, position: { x: 4, y: 4, w: 4, h: 3 } },
        { id: generateId(), type: 'bar', title: '热门话题TOP10', dataSource: 'hot_topics', dimensions: ['topic'], measures: ['mention_count'], filters: { timeRange: '7days' }, position: { x: 8, y: 4, w: 4, h: 3 } },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  dashboards.forEach(d => db.dashboards.set(d.id, d));

  const openApis: OpenApi[] = [
    {
      id: generateId(),
      name: '获取景区实时客流数据',
      path: '/api/data/scenic/flow/realtime',
      method: 'GET',
      description: '获取全国A级景区实时客流数据，支持按地区、景区等级筛选',
      category: '客流数据',
      requestParams: [
        { name: 'region', type: 'string', required: false, description: '地区编码', example: '110000' },
        { name: 'level', type: 'string', required: false, description: '景区等级', example: '5A' },
        { name: 'page', type: 'number', required: false, description: '页码', example: '1' },
        { name: 'pageSize', type: 'number', required: false, description: '每页数量', example: '20' },
      ],
      responseParams: [
        { name: 'code', type: 'number', required: true, description: '响应码', example: '200' },
        { name: 'data.list', type: 'array', required: true, description: '客流数据列表', example: '' },
        { name: 'data.total', type: 'number', required: true, description: '总数', example: '100' },
      ],
      rateLimit: 1000,
      isPublic: true,
    },
    {
      id: generateId(),
      name: '获取OTA预订数据',
      path: '/api/data/ota/booking',
      method: 'GET',
      description: '获取各OTA平台预订数据，支持按时间、地区、平台筛选',
      category: 'OTA数据',
      requestParams: [
        { name: 'startDate', type: 'string', required: true, description: '开始日期', example: '2024-01-01' },
        { name: 'endDate', type: 'string', required: true, description: '结束日期', example: '2024-01-31' },
        { name: 'platform', type: 'string', required: false, description: 'OTA平台', example: '携程' },
      ],
      responseParams: [
        { name: 'code', type: 'number', required: true, description: '响应码', example: '200' },
        { name: 'data', type: 'array', required: true, description: '预订数据', example: '' },
      ],
      rateLimit: 500,
      isPublic: true,
    },
    {
      id: generateId(),
      name: '获取非遗名录',
      path: '/api/data/heritage/list',
      method: 'GET',
      description: '获取国家级和省级非物质文化遗产名录',
      category: '文化遗产',
      requestParams: [
        { name: 'level', type: 'string', required: false, description: '级别', example: 'national' },
        { name: 'category', type: 'string', required: false, description: '类别', example: '传统戏剧' },
        { name: 'region', type: 'string', required: false, description: '地区', example: '北京' },
      ],
      responseParams: [
        { name: 'code', type: 'number', required: true, description: '响应码', example: '200' },
        { name: 'data.list', type: 'array', required: true, description: '非遗名录', example: '' },
      ],
      rateLimit: 2000,
      isPublic: true,
    },
    {
      id: generateId(),
      name: '获取消费券核销数据',
      path: '/api/data/coupon/consumption',
      method: 'GET',
      description: '获取文旅消费券核销统计数据',
      category: '消费券',
      requestParams: [
        { name: 'batchId', type: 'string', required: false, description: '消费券批次ID', example: '' },
        { name: 'region', type: 'string', required: false, description: '地区', example: '北京' },
        { name: 'startDate', type: 'string', required: false, description: '开始日期', example: '2024-01-01' },
      ],
      responseParams: [
        { name: 'code', type: 'number', required: true, description: '响应码', example: '200' },
        { name: 'data', type: 'array', required: true, description: '核销数据', example: '' },
      ],
      rateLimit: 500,
      isPublic: true,
    },
    {
      id: generateId(),
      name: '内容查询接口',
      path: '/api/content/search',
      method: 'POST',
      description: '按关键词、分类、地区、时间范围查询内容',
      category: '内容服务',
      requestParams: [
        { name: 'keyword', type: 'string', required: false, description: '关键词', example: '故宫' },
        { name: 'category', type: 'string', required: false, description: '内容分类', example: '景区推荐' },
        { name: 'type', type: 'string', required: false, description: '内容类型', example: 'article' },
        { name: 'page', type: 'number', required: false, description: '页码', example: '1' },
      ],
      responseParams: [
        { name: 'code', type: 'number', required: true, description: '响应码', example: '200' },
        { name: 'data.list', type: 'array', required: true, description: '内容列表', example: '' },
      ],
      rateLimit: 2000,
      isPublic: true,
    },
  ];

  openApis.forEach(api => db.openApis.set(api.id, api));

  const distributionRules: DistributionRule[] = [
    {
      id: generateId(),
      name: '北京地区政策推送',
      contentTags: ['政策解读', '北京'],
      targetRegions: ['北京'],
      targetUserGroups: ['government', 'scenic_admin', 'enterprise', 'professional'],
      priority: 10,
      channels: ['pc', 'h5', 'plugin'],
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-12-31T23:59:59Z',
      isEnabled: true,
    },
    {
      id: generateId(),
      name: '全国行业热点推送',
      contentTags: ['行业动态', '全国'],
      targetRegions: [],
      targetUserGroups: ['professional', 'government', 'enterprise'],
      priority: 8,
      channels: ['pc', 'h5'],
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-12-31T23:59:59Z',
      isEnabled: true,
    },
    {
      id: generateId(),
      name: '节假日旅游攻略推送',
      contentTags: ['旅游攻略'],
      targetRegions: [],
      targetUserGroups: ['tourist', 'professional'],
      priority: 5,
      channels: ['h5'],
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-12-31T23:59:59Z',
      isEnabled: true,
    },
    {
      id: generateId(),
      name: '景区资讯定向推送',
      contentTags: ['5A景区'],
      targetRegions: [],
      targetUserGroups: ['scenic_admin', 'tourist'],
      priority: 6,
      channels: ['pc', 'h5', 'plugin'],
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-12-31T23:59:59Z',
      isEnabled: true,
    },
  ];

  distributionRules.forEach(rule => db.distributionRules.set(rule.id, rule));

  sampleContents.forEach(content => {
    if (content.status === 'published') {
      const records: any[] = [];
      ['pc', 'h5', 'plugin'].forEach((channel, idx) => {
        if (idx < 2 || Math.random() > 0.5) {
          records.push({
            id: generateId(),
            contentId: content.id,
            ruleId: distributionRules[Math.floor(Math.random() * distributionRules.length)].id,
            channel,
            targetRegion: content.region === '全国' ? undefined : content.region,
            deliveredAt: new Date(Date.parse(content.publishedAt!) + Math.random() * 3600000).toISOString(),
            viewedAt: new Date(Date.parse(content.publishedAt!) + Math.random() * 7200000).toISOString(),
            clickedAt: Math.random() > 0.3 ? new Date(Date.parse(content.publishedAt!) + Math.random() * 10800000).toISOString() : undefined,
          });
        }
      });
      db.distributionRecords.set(content.id, records);

      const nodes: any[] = [];
      for (let i = 0; i < 10; i++) {
        const level = i < 5 ? 1 : i < 8 ? 2 : 3;
        nodes.push({
          id: generateId(),
          contentId: content.id,
          userId: generateId(),
          userName: `用户${i + 1}`,
          platform: ['微信', '微博', '抖音', '小红书'][Math.floor(Math.random() * 4)],
          shareCount: Math.floor(Math.random() * 50),
          viewCount: Math.floor(Math.random() * 500),
          level,
          parentId: level > 1 ? nodes[Math.floor(Math.random() * (level - 1))]?.id : undefined,
          timestamp: new Date(Date.parse(content.publishedAt!) + i * 3600000).toISOString(),
        });
      }
      db.propagationNodes.set(content.id, nodes);

      const sentiments: any[] = [];
      for (let i = 0; i < 7; i++) {
        const positive = Math.floor(Math.random() * 500) + 300;
        const neutral = Math.floor(Math.random() * 200) + 100;
        const negative = Math.floor(Math.random() * 50) + 10;
        sentiments.push({
          id: generateId(),
          contentId: content.id,
          totalMentions: positive + neutral + negative,
          positiveCount: positive,
          neutralCount: neutral,
          negativeCount: negative,
          sentimentScore: Math.round(positive / (positive + neutral + negative) * 10000) / 10000,
          hotTopics: ['旅游', '文化', '风景', '美食', '住宿'].slice(0, Math.floor(Math.random() * 3) + 2),
          keyOpinionLeaders: ['旅游博主A', '旅行家B', '摄影师C'].slice(0, Math.floor(Math.random() * 2) + 1),
          analysisDate: new Date(Date.now() - 86400000 * i).toISOString().split('T')[0],
        });
      }
      db.sentimentAnalyses.set(content.id, sentiments);
    }
  });

  console.log('Database seeded successfully');
};

export const initDatabase = seedDatabase;
