import db from './index.js';
import bcrypt from 'bcryptjs';

const seedDatabase = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('123456', salt);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, role, phone, real_name, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('user1', 'user1@example.com', hashedPassword, 'user', '13800138001', '张三', '');
  insertUser.run('user2', 'user2@example.com', hashedPassword, 'user', '13800138002', '李四', '');
  insertUser.run('agent1', 'agent1@example.com', hashedPassword, 'agent', '13800138003', '王经纪', '');
  insertUser.run('agent2', 'agent2@example.com', hashedPassword, 'agent', '13800138004', '李经纪', '');

  const insertAgent = db.prepare(`
    INSERT OR IGNORE INTO agents (user_id, agency_name, license_number, experience_years, specialty, introduction, total_deals, conversion_rate, average_rating, review_count, credit_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAgent.run(3, '链家地产', 'A123456789', 8, '新房,二手房', '专业房产经纪人，8年行业经验，服务客户超过500+', 128, 35.5, 4.8, 156, 95, 'approved');
  insertAgent.run(4, '我爱我家', 'B987654321', 5, '租赁,商业地产', '专注租赁业务，熟悉各区域房源信息', 89, 42.3, 4.6, 98, 92, 'approved');

  const insertProperty = db.prepare(`
    INSERT OR IGNORE INTO properties (title, type, category, price, area, bedrooms, bathrooms, floor, total_floors, orientation, decoration, building_type, building_age, address, city, district, community, latitude, longitude, metro_station, metro_distance, school_district, school_rating, description, features, images, owner_id, agent_id, publish_type, verify_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const properties = [
    {
      title: '朝阳区精装三居室 南北通透 地铁旁',
      type: 'second_hand', category: 'apartment', price: 680, area: 120, bedrooms: 3, bathrooms: 2,
      floor: '15/28', total_floors: 28, orientation: '南北', decoration: '精装', building_type: '板楼',
      building_age: 8, address: '北京市朝阳区建国路88号', city: '北京', district: '朝阳区',
      community: '阳光花园', latitude: 39.9042, longitude: 116.4074, metro_station: '国贸站',
      metro_distance: 500, school_district: '朝阳区实验小学', school_rating: 5,
      description: '核心地段，交通便利，配套齐全，优质学区',
      features: '南北通透,地铁房,学区房,精装', images: '', owner_id: 2, agent_id: 1,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    },
    {
      title: '海淀区中关村优质两居 学区房',
      type: 'second_hand', category: 'apartment', price: 520, area: 85, bedrooms: 2, bathrooms: 1,
      floor: '8/18', total_floors: 18, orientation: '东南', decoration: '简装', building_type: '塔楼',
      building_age: 15, address: '北京市海淀区中关村大街1号', city: '北京', district: '海淀区',
      community: '科育小区', latitude: 39.9847, longitude: 116.3046, metro_station: '中关村站',
      metro_distance: 300, school_district: '中关村一小', school_rating: 5,
      description: '黄金地段，优质学区，投资自住两相宜',
      features: '学区房,地铁房,成熟社区', images: '', owner_id: 2, agent_id: 2,
      publish_type: 'owner', verify_status: 'approved', status: 'active'
    },
    {
      title: '丰台区新开盘 精装交付 品质住宅',
      type: 'new_house', category: 'apartment', price: 450, area: 95, bedrooms: 3, bathrooms: 2,
      floor: '10/25', total_floors: 25, orientation: '南北', decoration: '精装', building_type: '板楼',
      building_age: 0, address: '北京市丰台区丽泽路100号', city: '北京', district: '丰台区',
      community: '丽泽公馆', latitude: 39.8567, longitude: 116.3215, metro_station: '丽泽商务区站',
      metro_distance: 400, school_district: '丰台十二中', school_rating: 4,
      description: '新盘首发，精装交付，品质保证',
      features: '新房,精装,地铁房,品牌开发商', images: '', owner_id: 1, agent_id: 1,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    },
    {
      title: '西城区金融街高端公寓 拎包入住',
      type: 'rental', category: 'apartment', price: 15000, area: 68, bedrooms: 1, bathrooms: 1,
      floor: '22/35', total_floors: 35, orientation: '南', decoration: '豪装', building_type: '塔楼',
      building_age: 5, address: '北京市西城区金融大街18号', city: '北京', district: '西城区',
      community: '金融街公寓', latitude: 39.9128, longitude: 116.3634, metro_station: '复兴门站',
      metro_distance: 350, school_district: '实验二小', school_rating: 5,
      description: '金融街核心区，高端公寓，配套完善',
      features: '拎包入住,豪装,地铁房', images: '', owner_id: 2, agent_id: 2,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    },
    {
      title: '东城区CBD核心写字楼 可分割',
      type: 'commercial', category: 'office', price: 35000, area: 500, bedrooms: 0, bathrooms: 4,
      floor: '15/30', total_floors: 30, orientation: '东南', decoration: '精装', building_type: '写字楼',
      building_age: 10, address: '北京市东城区建国门外大街1号', city: '北京', district: '东城区',
      community: '国贸中心', latitude: 39.9087, longitude: 116.4605, metro_station: '国贸站',
      metro_distance: 200, school_district: '', school_rating: 0,
      description: 'CBD核心地段，5A级写字楼，企业总部首选',
      features: '地铁房,核心商圈,甲级写字楼', images: '', owner_id: 1, agent_id: 1,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    },
    {
      title: '通州区运河核心区 大两居 低总价',
      type: 'second_hand', category: 'apartment', price: 310, area: 89, bedrooms: 2, bathrooms: 1,
      floor: '6/22', total_floors: 22, orientation: '南', decoration: '毛坯', building_type: '板楼',
      building_age: 3, address: '北京市通州区运河东大街58号', city: '北京', district: '通州区',
      community: '运河湾', latitude: 39.9025, longitude: 116.6628, metro_station: '通州北苑站',
      metro_distance: 800, school_district: '通州实验小学', school_rating: 3,
      description: '城市副中心，低总价上车盘，未来增值空间大',
      features: '低总价,副中心,地铁房', images: '', owner_id: 1, agent_id: 2,
      publish_type: 'agent', verify_status: 'pending', status: 'active'
    },
    {
      title: '大兴区新盘 洋房社区 花园洋房',
      type: 'new_house', category: 'apartment', price: 380, area: 110, bedrooms: 3, bathrooms: 2,
      floor: '3/6', total_floors: 6, orientation: '南北', decoration: '精装', building_type: '洋房',
      building_age: 0, address: '北京市大兴区生物医药基地东路20号', city: '北京', district: '大兴区',
      community: '绿地海珀云翡', latitude: 39.7268, longitude: 116.3388, metro_station: '生物医药基地站',
      metro_distance: 600, school_district: '', school_rating: 0,
      description: '低密洋房社区，精装交付，南城品质标杆',
      features: '新房,洋房,精装,低密社区', images: '', owner_id: 2, agent_id: 1,
      publish_type: 'agent', verify_status: 'pending', status: 'active'
    },
    {
      title: '顺义区精装两居 机场附近 适合租住',
      type: 'rental', category: 'apartment', price: 5500, area: 75, bedrooms: 2, bathrooms: 1,
      floor: '5/12', total_floors: 12, orientation: '东南', decoration: '精装', building_type: '板楼',
      building_age: 6, address: '北京市顺义区空港街道天竺镇36号', city: '北京', district: '顺义区',
      community: '天竺花园', latitude: 40.0547, longitude: 116.5814, metro_station: '国展站',
      metro_distance: 700, school_district: '', school_rating: 0,
      description: '机场商圈，外籍人士聚集，交通便利',
      features: '拎包入住,精装,机场旁', images: '', owner_id: 1, agent_id: 2,
      publish_type: 'owner', verify_status: 'approved', status: 'active'
    },
    {
      title: '石景山区万达商圈 沿街商铺 含装修',
      type: 'commercial', category: 'shop', price: 18000, area: 150, bedrooms: 0, bathrooms: 2,
      floor: '1/3', total_floors: 3, orientation: '南', decoration: '精装', building_type: '商铺',
      building_age: 5, address: '北京市石景山区石景山路22号', city: '北京', district: '石景山区',
      community: '万达广场', latitude: 39.9063, longitude: 116.2236, metro_station: '八角游乐园站',
      metro_distance: 300, school_district: '', school_rating: 0,
      description: '成熟商圈，人流量大，适合餐饮零售',
      features: '沿街商铺,万达商圈,地铁房', images: '', owner_id: 2, agent_id: 1,
      publish_type: 'agent', verify_status: 'rejected', status: 'active'
    },
    {
      title: '昌平区回龙观 经典两居 总价低',
      type: 'second_hand', category: 'apartment', price: 290, area: 78, bedrooms: 2, bathrooms: 1,
      floor: '9/21', total_floors: 21, orientation: '西南', decoration: '简装', building_type: '塔楼',
      building_age: 12, address: '北京市昌平区回龙观东大街88号', city: '北京', district: '昌平区',
      community: '龙泽苑', latitude: 40.0745, longitude: 116.3192, metro_station: '回龙观站',
      metro_distance: 450, school_district: '回龙观中心小学', school_rating: 3,
      description: '回龙观核心区域，刚需上车首选，配套成熟',
      features: '低总价,地铁房,成熟社区', images: '', owner_id: 1, agent_id: 2,
      publish_type: 'owner', verify_status: 'pending', status: 'active'
    },
    {
      title: '房山区良乡大学城 新房三居 品质社区',
      type: 'new_house', category: 'apartment', price: 260, area: 105, bedrooms: 3, bathrooms: 2,
      floor: '8/18', total_floors: 18, orientation: '南北', decoration: '精装', building_type: '板楼',
      building_age: 0, address: '北京市房山区良乡大学城西路15号', city: '北京', district: '房山区',
      community: '恒大御峰', latitude: 39.7333, longitude: 116.1483, metro_station: '良乡大学城站',
      metro_distance: 500, school_district: '良乡中心小学', school_rating: 3,
      description: '大学城旁，人文气息浓厚，新房品质',
      features: '新房,精装,大学城,学区房', images: '', owner_id: 2, agent_id: 1,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    },
    {
      title: '朝阳区望京 精装一居 月租优惠',
      type: 'rental', category: 'apartment', price: 6800, area: 45, bedrooms: 1, bathrooms: 1,
      floor: '16/28', total_floors: 28, orientation: '南', decoration: '精装', building_type: '塔楼',
      building_age: 7, address: '北京市朝阳区望京西路10号', city: '北京', district: '朝阳区',
      community: '望京西园', latitude: 39.9939, longitude: 116.4744, metro_station: '望京站',
      metro_distance: 350, school_district: '', school_rating: 0,
      description: '望京核心地段，互联网公司聚集，交通便利',
      features: '拎包入住,精装,地铁房,互联网商圈', images: '', owner_id: 1, agent_id: 2,
      publish_type: 'agent', verify_status: 'approved', status: 'active'
    }
  ];

  properties.forEach((p) => {
    try {
      insertProperty.run(
        p.title, p.type, p.category, p.price, p.area, p.bedrooms, p.bathrooms,
        p.floor, p.total_floors, p.orientation, p.decoration, p.building_type,
        p.building_age, p.address, p.city, p.district, p.community, p.latitude,
        p.longitude, p.metro_station, p.metro_distance, p.school_district,
        p.school_rating, p.description, p.features, p.images, p.owner_id,
        p.agent_id, p.publish_type, p.verify_status, p.status
      );
    } catch (e) {
    }
  });

  const insertPriceRecord = db.prepare(`
    INSERT OR IGNORE INTO price_records (property_id, price, record_type, record_date, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  const today = new Date();
  for (let propId = 1; propId <= 12; propId++) {
    const property = db.prepare('SELECT price, type FROM properties WHERE id = ?').get(propId) as any;
    if (!property) continue;

    const basePrice = (property as any).price as number;
    const propType = (property as any).type as string;
    const recordCount = 6 + Math.floor(Math.random() * 7);

    for (let m = 0; m < recordCount; m++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - m);
      const dateStr = date.toISOString().split('T')[0];
      const fluctuation = 1 + (Math.random() - 0.5) * 0.06;
      const price = Math.round(basePrice * fluctuation * 100) / 100;
      const recordType = propType === 'rental' ? 'rental' : propType === 'new_house' ? 'new' : 'listing';
      insertPriceRecord.run(propId, price, recordType, dateStr, '系统采集');
    }
  }

  const insertVerification = db.prepare(`
    INSERT OR IGNORE INTO property_verifications (property_id, certificate_ocr_result, certificate_number, certificate_verified, image_duplicate_check, duplicate_images, price_anomaly_check, anomaly_reason, final_verdict, verifier_id, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ocrTemplates: Record<string, any> = {
    1: { owner_name: '阳光业主', certificate_number: '京房权证朝字第2020001号', property_address: '北京市朝阳区建国路88号', area: 120, property_type: 'apartment', issue_date: '2018-05-20', verified: true },
    2: { owner_name: '科育业主', certificate_number: '京房权证海字第2019002号', property_address: '北京市海淀区中关村大街1号', area: 85, property_type: 'apartment', issue_date: '2017-03-15', verified: true },
    3: { owner_name: '丽泽业主', certificate_number: '京房权证丰字第2024003号', property_address: '北京市丰台区丽泽路100号', area: 95, property_type: 'apartment', issue_date: '2024-01-10', verified: true },
    5: { owner_name: '国贸企业', certificate_number: '京房权证东字第2015005号', property_address: '北京市东城区建国门外大街1号', area: 500, property_type: 'office', issue_date: '2015-08-22', verified: true },
    6: { owner_name: '运河湾业主', certificate_number: '京房权证通字第2023006号', property_address: '北京市通州区运河东大街58号', area: 89, property_type: 'apartment', issue_date: '2023-06-18', verified: false },
    9: { owner_name: '万达商户', certificate_number: '京房权证石字第2020009号', property_address: '北京市石景山区石景山路22号', area: 150, property_type: 'shop', issue_date: '2020-11-05', verified: false },
  };

  for (let propId = 1; propId <= 12; propId++) {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propId) as any;
    if (!property) continue;

    const ocr = ocrTemplates[propId] || {
      owner_name: `${(property as any).community}业主`,
      certificate_number: `京房权证字第2020${propId}号`,
      property_address: (property as any).address,
      area: (property as any).area,
      property_type: (property as any).category,
      issue_date: '2020-01-01',
      verified: (property as any).verify_status === 'approved'
    };

    const isFake = (property as any).is_fake === 1;
    const hasAnomaly = (property as any).verify_status === 'rejected';
    const verifierId = (property as any).verify_status === 'approved' ? 1 : null;
    const verifiedAt = (property as any).verify_status !== 'pending' ? '2025-01-15 10:30:00' : null;

    insertVerification.run(
      propId,
      JSON.stringify(ocr),
      ocr.certificate_number,
      ocr.verified ? 1 : 0,
      isFake ? 1 : 0,
      isFake ? JSON.stringify(['img_001.jpg', 'img_002.jpg']) : '',
      hasAnomaly ? 1 : 0,
      hasAnomaly ? '价格畸低，偏离区域均价超过30%' : '',
      (property as any).verify_status === 'pending' ? null : (property as any).verify_status,
      verifierId,
      verifiedAt
    );
  }

  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO agent_reviews (agent_id, user_id, property_id, rating, content, service_type, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const reviewsForAgent1 = [
    { rating: 5, content: '王经纪非常专业，带我看了多套房源，最终选到了心仪的房子，全程耐心讲解', service_type: '二手房交易' },
    { rating: 5, content: '服务态度很好，对周边小区非常熟悉，推荐的房子都很符合我的需求', service_type: '二手房交易' },
    { rating: 4, content: '整体服务不错，就是有些环节沟通可以更及时一些', service_type: '新房购买' },
    { rating: 5, content: '很靠谱的经纪人，帮我们拿到了很好的价格', service_type: '二手房交易' },
    { rating: 4, content: '专业度高，对市场行情很了解，给出的建议很中肯', service_type: '新房购买' },
    { rating: 5, content: '交易流程帮我们处理得很顺利，省心省力', service_type: '二手房交易' },
    { rating: 5, content: '带我看了十多套房子，从不嫌烦，非常敬业', service_type: '二手房交易' },
    { rating: 4, content: '服务周到，后续跟进也到位，推荐', service_type: '新房购买' },
  ];

  const reviewsForAgent2 = [
    { rating: 5, content: '李经纪对租赁市场非常了解，帮我在3天内就找到了满意的房子', service_type: '房屋租赁' },
    { rating: 4, content: '响应速度快，推荐的房源质量不错', service_type: '房屋租赁' },
    { rating: 4, content: '租赁合同条款讲解得很详细，避免了很多坑', service_type: '房屋租赁' },
    { rating: 3, content: '服务还行，但部分信息不够及时更新', service_type: '房屋租赁' },
    { rating: 5, content: '帮我找到性价比超高的商铺，非常感谢', service_type: '商业地产' },
    { rating: 5, content: '专业可靠，租赁全程无忧', service_type: '房屋租赁' },
    { rating: 4, content: '态度热情，信息全面，推荐使用', service_type: '商业地产' },
  ];

  reviewsForAgent1.forEach((r, i) => {
    insertReview.run(1, i % 2 === 0 ? 1 : 2, (i % 5) + 1, r.rating, r.content, r.service_type, 1);
  });

  reviewsForAgent2.forEach((r, i) => {
    insertReview.run(2, i % 2 === 0 ? 1 : 2, (i % 5) + 1, r.rating, r.content, r.service_type, 1);
  });

  const insertInspection = db.prepare(`
    INSERT OR IGNORE INTO property_inspections (property_id, inspector_id, quality_score, issues, suggestions, status, inspected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const inspections = [
    { property_id: 1, inspector_id: 1, quality_score: 92, issues: '阳台密封条略有老化', suggestions: '建议更换阳台密封条', status: 'completed' },
    { property_id: 2, inspector_id: 1, quality_score: 88, issues: '厨房瓷砖有轻微裂纹', suggestions: '建议局部修补瓷砖', status: 'completed' },
    { property_id: 3, inspector_id: 1, quality_score: 95, issues: '无明显质量问题', suggestions: '保持现有品质', status: 'completed' },
    { property_id: 4, inspector_id: 1, quality_score: 90, issues: '空调制热效果稍差', suggestions: '建议检修空调系统', status: 'completed' },
    { property_id: 5, inspector_id: 1, quality_score: 85, issues: '消防通道堆放杂物', suggestions: '清理消防通道，确保安全', status: 'pending' },
    { property_id: 6, inspector_id: 1, quality_score: 78, issues: '墙面有渗水痕迹，卫生间防水需检修', suggestions: '重新做卫生间防水层', status: 'pending' },
    { property_id: 7, inspector_id: 1, quality_score: 93, issues: '花园绿化需维护', suggestions: '加强绿化养护', status: 'pending' },
    { property_id: 8, inspector_id: 1, quality_score: 86, issues: '厨房排烟效果不佳', suggestions: '建议更换抽油烟机', status: 'pending' },
  ];

  inspections.forEach((ins) => {
    insertInspection.run(
      ins.property_id, ins.inspector_id, ins.quality_score, ins.issues,
      ins.suggestions, ins.status, ins.status === 'completed' ? '2025-03-10 14:00:00' : null
    );
  });

  const insertRiskControl = db.prepare(`
    INSERT OR IGNORE INTO agent_risk_controls (agent_id, risk_type, risk_level, description, evidence, status, handler_id, handled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const riskControls = [
    { agent_id: 1, risk_type: '虚假房源', risk_level: 'medium', description: '发布房源图片与实际不符，涉嫌图片造假', evidence: '图片对比报告', status: 'resolved', handler_id: 1, handled_at: '2025-02-20 09:00:00' },
    { agent_id: 2, risk_type: '价格异常', risk_level: 'high', description: '多次发布低于市场价30%以上的房源，涉嫌低价引流', evidence: '价格偏差分析报告', status: 'pending', handler_id: null, handled_at: null },
    { agent_id: 1, risk_type: '服务投诉', risk_level: 'low', description: '客户投诉服务态度问题，沟通不及时', evidence: '客户投诉记录', status: 'resolved', handler_id: 1, handled_at: '2025-01-15 16:30:00' },
    { agent_id: 2, risk_type: '信息不实', risk_level: 'medium', description: '房源描述中学校信息与实际不符', evidence: '学区核实报告', status: 'pending', handler_id: null, handled_at: null },
    { agent_id: 1, risk_type: '违规操作', risk_level: 'high', description: '未经房主同意发布房源信息', evidence: '房主举报记录', status: 'confirmed', handler_id: 1, handled_at: '2025-04-05 11:20:00' },
  ];

  riskControls.forEach((rc) => {
    insertRiskControl.run(rc.agent_id, rc.risk_type, rc.risk_level, rc.description, rc.evidence, rc.status, rc.handler_id, rc.handled_at);
  });

  const insertAppeal = db.prepare(`
    INSERT OR IGNORE INTO appeals (property_id, user_id, reason, evidence, status, reviewer_id, review_comment, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const appeals = [
    { property_id: 9, user_id: 2, reason: '房源信息真实有效，商铺确实位于万达商圈，价格合理，不应被判定为虚假', evidence: '产权证照片,实地拍摄照片', status: 'approved', reviewer_id: 1, review_comment: '经核实，房源信息属实，撤销虚假标记', reviewed_at: '2025-03-01 10:00:00' },
    { property_id: 6, user_id: 1, reason: '房源审核时间过长，已提交完整材料，请求尽快审核', evidence: '产权证,身份证照片', status: 'pending', reviewer_id: null, review_comment: null, reviewed_at: null },
    { property_id: 10, user_id: 1, reason: '房源信息更新后已符合要求，请求重新审核', evidence: '更新后的房源截图,价格对比报告', status: 'pending', reviewer_id: null, review_comment: null, reviewed_at: null },
  ];

  appeals.forEach((a) => {
    insertAppeal.run(a.property_id, a.user_id, a.reason, a.evidence, a.status, a.reviewer_id, a.review_comment, a.reviewed_at);
  });

  const insertPriceStats = db.prepare(`
    INSERT OR IGNORE INTO community_price_stats (community, city, district, avg_price, deal_count, listing_count, price_trend, valuation_deviation, stat_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPriceStats.run('阳光花园', '北京', '朝阳区', 56000, 12, 45, 2.5, -1.2, today.toISOString().split('T')[0]);
  insertPriceStats.run('科育小区', '北京', '海淀区', 72000, 8, 23, -0.8, 2.1, today.toISOString().split('T')[0]);
  insertPriceStats.run('丽泽公馆', '北京', '丰台区', 48000, 25, 67, 5.2, 0.5, today.toISOString().split('T')[0]);
  insertPriceStats.run('运河湾', '北京', '通州区', 35000, 15, 38, 3.8, -0.5, today.toISOString().split('T')[0]);
  insertPriceStats.run('金融街公寓', '北京', '西城区', 95000, 6, 12, 1.2, 0.8, today.toISOString().split('T')[0]);

  const insertDecoration = db.prepare(`
    INSERT OR IGNORE INTO decoration_plans (title, style, budget_min, budget_max, area_min, area_max, bedrooms, city, company_name, company_rating, description, features, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDecoration.run('现代简约三居方案', '现代简约', 10, 15, 90, 120, '3室', '北京', '业之峰装饰', 4.8, '现代简约风格，适合年轻家庭，功能性强', '环保材料,智能家具,储物空间', '');
  insertDecoration.run('北欧风格两居设计', '北欧', 8, 12, 70, 90, '2室', '北京', '东易日盛', 4.6, '清新北欧风格，温馨舒适，适合小资生活', '原木色调,采光优化,软装搭配', '');
  insertDecoration.run('新中式豪华大宅', '新中式', 30, 50, 150, 200, '4室', '北京', '元洲装饰', 4.9, '传统中式与现代结合，彰显品味与气质', '实木家具,禅意空间,文化元素', '');

  const insertHeatmap = db.prepare(`
    INSERT OR IGNORE INTO region_heatmaps (city, district, region_name, heat_score, view_count, inquiry_count, deal_count, avg_price, stat_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = today.toISOString().split('T')[0];
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const lastYearStr = lastYear.toISOString().split('T')[0];

  const heatmapEntries = [
    { city: '北京', district: '朝阳区', region_name: '国贸CBD', heat_score: 95.5, view_count: 12580, inquiry_count: 856, deal_count: 128, avg_price: 78000, today_views: 12580, today_inquiries: 856, today_deals: 128 },
    { city: '北京', district: '海淀区', region_name: '中关村', heat_score: 88.2, view_count: 9876, inquiry_count: 654, deal_count: 89, avg_price: 72000, today_views: 9876, today_inquiries: 654, today_deals: 89 },
    { city: '北京', district: '西城区', region_name: '金融街', heat_score: 92.8, view_count: 11234, inquiry_count: 743, deal_count: 105, avg_price: 95000, today_views: 11234, today_inquiries: 743, today_deals: 105 },
    { city: '北京', district: '丰台区', region_name: '丽泽商务区', heat_score: 82.3, view_count: 7654, inquiry_count: 432, deal_count: 67, avg_price: 48000, today_views: 7654, today_inquiries: 432, today_deals: 67 },
    { city: '北京', district: '东城区', region_name: '王府井', heat_score: 85.6, view_count: 8765, inquiry_count: 521, deal_count: 78, avg_price: 88000, today_views: 8765, today_inquiries: 521, today_deals: 78 },
    { city: '北京', district: '通州区', region_name: '运河核心区', heat_score: 78.5, view_count: 6543, inquiry_count: 345, deal_count: 52, avg_price: 35000, today_views: 6543, today_inquiries: 345, today_deals: 52 },
    { city: '北京', district: '大兴区', region_name: '生物医药基地', heat_score: 72.1, view_count: 5432, inquiry_count: 278, deal_count: 38, avg_price: 38000, today_views: 5432, today_inquiries: 278, today_deals: 38 },
    { city: '北京', district: '顺义区', region_name: '空港商圈', heat_score: 70.8, view_count: 4876, inquiry_count: 234, deal_count: 32, avg_price: 32000, today_views: 4876, today_inquiries: 234, today_deals: 32 },
    { city: '北京', district: '石景山区', region_name: '万达商圈', heat_score: 68.4, view_count: 4231, inquiry_count: 198, deal_count: 28, avg_price: 42000, today_views: 4231, today_inquiries: 198, today_deals: 28 },
    { city: '北京', district: '昌平区', region_name: '回龙观', heat_score: 75.2, view_count: 5876, inquiry_count: 312, deal_count: 45, avg_price: 38000, today_views: 5876, today_inquiries: 312, today_deals: 45 },
    { city: '北京', district: '房山区', region_name: '良乡大学城', heat_score: 65.8, view_count: 3654, inquiry_count: 178, deal_count: 25, avg_price: 28000, today_views: 3654, today_inquiries: 178, today_deals: 25 },
    { city: '上海', district: '浦东新区', region_name: '陆家嘴', heat_score: 96.2, view_count: 15680, inquiry_count: 987, deal_count: 145, avg_price: 92000, today_views: 15680, today_inquiries: 987, today_deals: 145 },
    { city: '上海', district: '徐汇区', region_name: '徐家汇', heat_score: 89.5, view_count: 11234, inquiry_count: 765, deal_count: 98, avg_price: 85000, today_views: 11234, today_inquiries: 765, today_deals: 98 },
  ];

  heatmapEntries.forEach((h) => {
    insertHeatmap.run(h.city, h.district, h.region_name, h.heat_score, h.view_count, h.inquiry_count, h.deal_count, h.avg_price, todayStr);
  });

  heatmapEntries.forEach((h) => {
    const momViews = Math.round(h.view_count * (0.85 + Math.random() * 0.2));
    const momInquiries = Math.round(h.inquiry_count * (0.85 + Math.random() * 0.2));
    const momDeals = Math.round(h.deal_count * (0.85 + Math.random() * 0.2));
    const momPrice = Math.round(h.avg_price * (0.95 + Math.random() * 0.1));
    const momScore = Math.round((h.heat_score * (0.9 + Math.random() * 0.15)) * 10) / 10;
    insertHeatmap.run(h.city, h.district, h.region_name, momScore, momViews, momInquiries, momDeals, momPrice, lastMonthStr);
  });

  heatmapEntries.slice(0, 8).forEach((h) => {
    const yoyViews = Math.round(h.view_count * (0.7 + Math.random() * 0.3));
    const yoyInquiries = Math.round(h.inquiry_count * (0.7 + Math.random() * 0.3));
    const yoyDeals = Math.round(h.deal_count * (0.7 + Math.random() * 0.3));
    const yoyPrice = Math.round(h.avg_price * (0.88 + Math.random() * 0.12));
    const yoyScore = Math.round((h.heat_score * (0.8 + Math.random() * 0.15)) * 10) / 10;
    insertHeatmap.run(h.city, h.district, h.region_name, yoyScore, yoyViews, yoyInquiries, yoyDeals, yoyPrice, lastYearStr);
  });

  const insertViewingNote = db.prepare(`
    INSERT OR IGNORE INTO viewing_notes (user_id, property_id, content, images, rating, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const viewingNotes = [
    { user_id: 1, property_id: 1, content: '户型方正，南北通透，采光很好。小区绿化不错，物业管理规范。客厅面积大，适合家庭居住。', rating: 5, tags: ['户型好', '采光佳', '物业好'] },
    { user_id: 1, property_id: 2, content: '学区确实不错，但楼龄偏老，周边配套一般。走廊偏暗，需要考虑装修成本。', rating: 3, tags: ['学区好', '楼龄老', '需装修'] },
    { user_id: 2, property_id: 3, content: '新盘品质不错，精装交付标准高。售楼处服务好，周边规划完善，未来有升值空间。', rating: 5, tags: ['新房', '精装', '品质好'] },
    { user_id: 2, property_id: 4, content: '公寓面积偏小，但地段确实好。装修豪华，适合商务人士短期居住。价格偏高。', rating: 4, tags: ['地段好', '豪装', '面积小'] },
    { user_id: 1, property_id: 5, content: '写字楼位置优越，适合大型企业。公共区域维护好，停车位充足。', rating: 4, tags: ['位置好', '甲级', '停车方便'] },
    { user_id: 1, property_id: 6, content: '通州副中心未来有潜力，但目前周边配套还不完善。地铁距离有点远。', rating: 3, tags: ['潜力股', '配套不足'] },
    { user_id: 2, property_id: 7, content: '洋房社区环境优美，低密度居住很舒适。但位置偏南，通勤时间较长。', rating: 4, tags: ['洋房', '环境好', '通勤远'] },
    { user_id: 2, property_id: 8, content: '机场附近租房性价比可以，但噪音是个问题。适合经常出差的人士。', rating: 3, tags: ['性价比', '有噪音', '出差方便'] },
  ];

  viewingNotes.forEach((n) => {
    insertViewingNote.run(n.user_id, n.property_id, n.content, '', n.rating, JSON.stringify(n.tags));
  });

  console.log('Database seeded successfully');
};

seedDatabase();

export default seedDatabase;
