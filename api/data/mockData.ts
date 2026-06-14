import { v4 as uuidv4 } from 'uuid';
import type {
  Property,
  PropertyType,
  PropertyRight,
  SchoolDistrict,
  MetroInfo,
  Verification,
  Agent,
  User,
  Client,
  ViewingRecord,
  Deal,
} from '../../shared/types.js';
import { run } from './database.js';

const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区', '昌平区', '大兴区'];
const orientations = ['南', '南北', '东', '西', '东南', '西南'];
const decorations = ['精装修', '简装修', '毛坯', '豪华装修'];
const floors = ['低楼层', '中楼层', '高楼层', '顶层', '底层'];
const rightTypes = ['商品房', '经济适用房', '房改房', '回迁房', '公寓'];
const schoolLevels: ('primary' | 'middle' | 'high')[] = ['primary', 'middle', 'high'];
const schoolQualities: ('key' | 'ordinary')[] = ['key', 'ordinary'];
const metroLines = ['1号线', '2号线', '4号线', '5号线', '6号线', '8号线', '10号线', '13号线'];
const metroStations = [
  '国贸站', '西单站', '王府井站', '东单站', '建国门站', '朝阳门站',
  '西直门站', '东直门站', '复兴门站', '和平门站', '宣武门站', '崇文门站',
  '五道口站', '上地站', '西二旗站', '回龙观站', '天通苑站', '立水桥站',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

function generateAgent(): { user: User; agent: Agent } {
  const id = uuidv4();
  const userId = uuidv4();
  const name = `经纪人${randomInt(100, 999)}`;
  const phone = `138${randomInt(10000000, 99999999)}`;

  const user: User = {
    id: userId,
    phone,
    name,
    role: 'agent',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    createdAt: new Date().toISOString(),
  };

  const agent: Agent = {
    id,
    name,
    phone,
    company: randomPick(['链家', '我爱我家', '贝壳', '中原地产', '21世纪不动产']),
    licenseNumber: `京房经字${randomInt(10000, 99999)}号`,
    avatar: user.avatar,
    dealCount: randomInt(5, 200),
    rating: randomFloat(3.5, 5.0, 1),
    isVerified: randomBoolean(),
  };

  return { user, agent };
}

function generatePropertyRight(): PropertyRight {
  return {
    type: randomPick(rightTypes),
    status: randomPick(['normal', 'mortgaged', 'sealed']),
    ownershipYears: randomInt(1, 70),
    isFiveYears: randomBoolean(),
    isOnlyOne: randomBoolean(),
  };
}

function generateSchoolDistrict(): SchoolDistrict {
  return {
    name: `${randomPick(['北京', '清华', '北大', '人大', '中关村', '朝阳'])}${randomPick(['第一', '第二', '第三', '实验'])}${randomPick(['小学', '中学'])}`,
    level: randomPick(schoolLevels),
    quality: randomPick(schoolQualities),
    distance: randomFloat(0.1, 3.0),
    enrollmentPolicy: randomPick(['划片入学', '摇号', '九年一贯制', '对口直升']),
  };
}

function generateMetroInfo(): MetroInfo {
  const station = randomPick(metroStations);
  const distance = randomFloat(0.05, 2.0);
  return {
    nearestStation: station,
    line: randomPick(metroLines),
    distance,
    walkTime: Math.round(distance * 12),
  };
}

function generateVerification(): Verification {
  return {
    ownerVerified: randomBoolean(),
    agentVerified: randomBoolean(),
    antiFraudPassed: randomBoolean(),
    verifyTime: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
    listingDays: randomInt(1, 365),
    decayWeight: randomFloat(0.5, 1.0),
  };
}

function generateProperty(type: PropertyType, agent: Agent, index: number): Property {
  const id = uuidv4();
  const rooms = randomInt(1, 5);
  const halls = randomInt(0, 2);
  const bathrooms = randomInt(1, 3);
  const area = randomFloat(30, 200);

  let price: number;
  let unitPrice: number;
  let title: string;

  if (type === 'new') {
    unitPrice = randomFloat(30000, 80000);
    price = unitPrice * area;
    title = `【新房】${randomPick(['万科', '保利', '融创', '中海', '龙湖'])}${randomPick(['嘉园', '花园', '公馆', '府', '苑', '城'])} ${rooms}室${halls}厅`;
  } else if (type === 'secondhand') {
    unitPrice = randomFloat(25000, 100000);
    price = unitPrice * area;
    title = `【二手房】${randomPick(districts)}精品${rooms}居 ${randomPick(['南北通透', '满五唯一', '近地铁', '学区房'])}`;
  } else {
    price = randomFloat(3000, 20000);
    unitPrice = price / area;
    title = `【租房】${randomPick(['精装', '简装', '豪装'])}${rooms}居室 ${randomPick(['拎包入住', '近地铁', '押一付三', '免中介费'])}`;
  }

  const baseLat = 39.9042;
  const baseLng = 116.4074;

  const images = Array.from({ length: randomInt(3, 8) }, (_, i) =>
    `https://picsum.photos/seed/${id}-${i}/800/600`
  );

  return {
    id,
    type,
    title,
    price: Math.round(price),
    unitPrice: Math.round(unitPrice),
    area,
    rooms,
    halls,
    bathrooms,
    floor: randomPick(floors),
    orientation: randomPick(orientations),
    decoration: randomPick(decorations),
    buildYear: randomInt(1990, 2024),
    address: `${randomPick(districts)}${randomPick(['某某路', '某某大街', '某某胡同'])}${randomInt(1, 999)}号院${randomInt(1, 20)}号楼`,
    district: randomPick(districts),
    city: '北京',
    lat: baseLat + randomFloat(-0.1, 0.1, 6),
    lng: baseLng + randomFloat(-0.15, 0.15, 6),
    images,
    vrUrl: randomBoolean() ? `https://example.com/vr/${id}` : undefined,
    floorPlan: randomBoolean() ? `https://picsum.photos/seed/${id}-floor/400/300` : undefined,
    description: `房源编号: ${id.slice(0, 8)}\n${rooms}室${halls}厅${bathrooms}卫，建筑面积${area}平米。\n${randomPick(['采光好', '视野开阔', '交通便利', '配套齐全', '物业管理完善'])}，${randomPick(['拎包入住', '随时看房', '价格可议', '业主急售'])}。`,
    propertyRight: generatePropertyRight(),
    schoolDistrict: Math.random() > 0.3 ? generateSchoolDistrict() : undefined,
    metroInfo: Math.random() > 0.2 ? generateMetroInfo() : undefined,
    verification: generateVerification(),
    agent,
    ownerId: uuidv4(),
    publishTime: new Date(Date.now() - index * randomInt(1, 24) * 60 * 60 * 1000).toISOString(),
    listingWeight: randomFloat(0.8, 1.5),
    tags: [
      randomPick(['满五唯一', '满二', '近地铁', '学区房', '精装修']),
      randomPick(['南北通透', '采光好', '无遮挡', '户型方正']),
      randomPick(['随时看房', '有电梯', '绿化率高', '车位充足']),
    ],
  };
}

function generateClient(agentId: string, index: number): Client {
  return {
    id: uuidv4(),
    name: `客户${randomInt(1000, 9999)}`,
    phone: `139${randomInt(10000000, 99999999)}`,
    level: randomPick(['A', 'B', 'C']),
    budgetMin: randomInt(100, 300) * 10000,
    budgetMax: randomInt(300, 1000) * 10000,
    preference: randomPick(['三居室', '地铁房', '学区房', '精装修', '低楼层']),
    agentId,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function generateViewingRecord(propertyId: string, clientId: string, agentId: string): ViewingRecord {
  return {
    id: uuidv4(),
    propertyId,
    clientId,
    agentId,
    date: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    timeSlot: randomPick(['上午 9:00-11:00', '下午 14:00-16:00', '下午 16:00-18:00', '晚上 19:00-21:00']),
    feedback: randomPick(['非常满意，考虑中', '户型不太合适', '价格偏高', '位置满意', '需要和家人商量']),
    interestLevel: randomPick(['high', 'medium', 'low']),
    createdAt: new Date().toISOString(),
  };
}

function generateDeal(propertyId: string, clientId: string, agentId: string, propertyPrice: number): Deal {
  return {
    id: uuidv4(),
    propertyId,
    clientId,
    agentId,
    dealPrice: Math.round(propertyPrice * randomFloat(0.9, 1.05)),
    commission: Math.round(propertyPrice * randomFloat(0.01, 0.03)),
    dealDate: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: randomPick(['pending', 'completed', 'reported']),
    createdAt: new Date().toISOString(),
  };
}

export async function generateMockData(): Promise<void> {
  console.log('Generating mock data...');

  const { user: agentUser, agent } = generateAgent();
  await run(
    'INSERT INTO users (id, phone, name, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [agentUser.id, agentUser.phone, agentUser.name, agentUser.role, agentUser.avatar, agentUser.createdAt]
  );
  await run(
    'INSERT INTO agents (id, user_id, license_number, company, deal_count, rating, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [agent.id, agentUser.id, agent.licenseNumber, agent.company, agent.dealCount, agent.rating, agent.isVerified ? 1 : 0]
  );

  const ownerIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ownerId = uuidv4();
    ownerIds.push(ownerId);
    await run(
      'INSERT INTO users (id, phone, name, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        ownerId,
        `135${randomInt(10000000, 99999999)}`,
        `业主${randomInt(100, 999)}`,
        'owner',
        `https://api.dicebear.com/7.x/avataaars/svg?seed=owner${i}`,
        new Date().toISOString(),
      ]
    );
  }

  const propertyTypes: PropertyType[] = ['new', 'secondhand', 'rent'];
  const properties: Property[] = [];

  for (let i = 0; i < 50; i++) {
    const type = propertyTypes[i % 3];
    const property = generateProperty(type, agent, i);
    property.ownerId = ownerIds[i % ownerIds.length];
    properties.push(property);

    await run(
      `INSERT INTO properties (id, type, title, price, unit_price, area, rooms, halls, bathrooms, floor, orientation, decoration, build_year, address, district, city, lat, lng, description, owner_id, agent_id, publish_time, listing_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        property.id,
        property.type,
        property.title,
        property.price,
        property.unitPrice,
        property.area,
        property.rooms,
        property.halls,
        property.bathrooms,
        property.floor,
        property.orientation,
        property.decoration,
        property.buildYear,
        property.address,
        property.district,
        property.city,
        property.lat,
        property.lng,
        property.description,
        property.ownerId,
        agent.id,
        property.publishTime,
        property.listingWeight,
      ]
    );

    property.images.forEach((img, idx) => {
      run(
        'INSERT INTO property_images (id, property_id, url, type, sort_order) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), property.id, img, idx === 0 ? 'normal' : 'normal', idx]
      );
    });

    await run(
      'INSERT INTO property_rights (id, property_id, right_type, status, ownership_years, is_five_years, is_only_one) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        property.id,
        property.propertyRight.type,
        property.propertyRight.status,
        property.propertyRight.ownershipYears,
        property.propertyRight.isFiveYears ? 1 : 0,
        property.propertyRight.isOnlyOne ? 1 : 0,
      ]
    );

    if (property.schoolDistrict) {
      await run(
        'INSERT INTO school_districts (id, property_id, name, level, quality, distance, enrollment_policy) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          property.id,
          property.schoolDistrict.name,
          property.schoolDistrict.level,
          property.schoolDistrict.quality,
          property.schoolDistrict.distance,
          property.schoolDistrict.enrollmentPolicy,
        ]
      );
    }

    if (property.metroInfo) {
      await run(
        'INSERT INTO metro_infos (id, property_id, nearest_station, line, distance, walk_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          property.id,
          property.metroInfo.nearestStation,
          property.metroInfo.line,
          property.metroInfo.distance,
          property.metroInfo.walkTime,
        ]
      );
    }

    await run(
      'INSERT INTO verifications (id, property_id, owner_verified, agent_verified, anti_fraud_passed, verify_time, listing_days, decay_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        property.id,
        property.verification.ownerVerified ? 1 : 0,
        property.verification.agentVerified ? 1 : 0,
        property.verification.antiFraudPassed ? 1 : 0,
        property.verification.verifyTime,
        property.verification.listingDays,
        property.verification.decayWeight,
      ]
    );

    if (i % 5 === 0) {
      const client = generateClient(agent.id, i);
      await run(
        'INSERT INTO clients (id, agent_id, name, phone, level, budget_min, budget_max, preference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [client.id, client.agentId, client.name, client.phone, client.level, client.budgetMin, client.budgetMax, client.preference, client.createdAt]
      );

      if (i % 3 === 0) {
        const viewing = generateViewingRecord(property.id, client.id, agent.id);
        await run(
          'INSERT INTO viewing_records (id, property_id, client_id, agent_id, viewing_date, time_slot, feedback, interest_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [viewing.id, viewing.propertyId, viewing.clientId, viewing.agentId, viewing.date, viewing.timeSlot, viewing.feedback, viewing.interestLevel, viewing.createdAt]
        );
      }

      if (i % 7 === 0 && property.type !== 'rent') {
        const deal = generateDeal(property.id, client.id, agent.id, property.price);
        await run(
          'INSERT INTO deals (id, property_id, client_id, agent_id, deal_price, commission, deal_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [deal.id, deal.propertyId, deal.clientId, deal.agentId, deal.dealPrice, deal.commission, deal.dealDate, deal.status, deal.createdAt]
        );
      }
    }
  }

  console.log(`Mock data generated: ${properties.length} properties, 1 agent, and related records`);
}
