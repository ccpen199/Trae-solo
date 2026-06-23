import { AppDataSource } from '../data-source';
import { Community } from '../entities/Community';
import { Project } from '../entities/Project';
import { User } from '../entities/User';
import { Bill } from '../entities/Bill';
import { WorkOrder } from '../entities/WorkOrder';
import { Announcement } from '../entities/Announcement';
import { Post } from '../entities/Post';
import { Comment } from '../entities/Comment';
import { MerchantProduct } from '../entities/MerchantProduct';
import { Order } from '../entities/Order';
import { Activity } from '../entities/Activity';
import { ActivityRegistration } from '../entities/ActivityRegistration';
import { Message } from '../entities/Message';
import { GovDataChannel } from '../entities/GovDataChannel';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedData() {
  const communityRepo = AppDataSource.getRepository(Community);
  const existingCommunities = await communityRepo.count();
  if (existingCommunities > 0) {
    console.log('[Seed] 数据已存在，跳过初始化');
    return;
  }

  console.log('[Seed] 开始初始化数据...');

  const community = communityRepo.create({
    id: uuidv4(),
    name: '阳光花园小区',
    address: '人民路128号',
    city: '杭州市',
    district: '西湖区',
    developer: '阳光地产',
    buildYear: 2018,
    totalBuildings: 12,
    totalUnits: 480,
    description: '高品质住宅社区，配备完善的物业服务和生活配套设施。',
  });
  await communityRepo.save(community);

  const projectRepo = AppDataSource.getRepository(Project);
  const project1 = projectRepo.create({
    id: uuidv4(),
    name: '1号楼',
    type: 'residential',
    communityId: community.id,
    config: { propertyFeePerSquare: 2.5 },
    status: 'active',
  });
  const project2 = projectRepo.create({
    id: uuidv4(),
    name: '2号楼',
    type: 'residential',
    communityId: community.id,
    config: { propertyFeePerSquare: 2.5 },
    status: 'active',
  });
  await projectRepo.save([project1, project2]);

  const userRepo = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = userRepo.create({
    id: uuidv4(),
    phone: '13800000000',
    password: hashedPassword,
    name: '系统管理员',
    role: 'admin',
    communityId: community.id,
    projectId: project1.id,
    status: 'active',
  });

  const property = userRepo.create({
    id: uuidv4(),
    phone: '13800000001',
    password: hashedPassword,
    name: '物业管家小王',
    role: 'property',
    communityId: community.id,
    status: 'active',
  });

  const worker = userRepo.create({
    id: uuidv4(),
    phone: '13800000002',
    password: hashedPassword,
    name: '维修师傅李工',
    role: 'worker',
    communityId: community.id,
    status: 'active',
  });

  const owner = userRepo.create({
    id: uuidv4(),
    phone: '13800000003',
    password: hashedPassword,
    name: '业主张先生',
    role: 'owner',
    communityId: community.id,
    projectId: project1.id,
    address: '1号楼1单元1001室',
    status: 'active',
  });

  const owner2 = userRepo.create({
    id: uuidv4(),
    phone: '13800000004',
    password: hashedPassword,
    name: '业主李女士',
    role: 'owner',
    communityId: community.id,
    projectId: project2.id,
    address: '2号楼3单元502室',
    status: 'active',
  });

  const merchant = userRepo.create({
    id: uuidv4(),
    phone: '13800000005',
    password: hashedPassword,
    name: '便民超市',
    role: 'merchant',
    communityId: community.id,
    merchantInfo: { storeName: '社区便民超市', category: '生活服务', description: '提供日常生活用品配送服务' },
    status: 'active',
  });

  await userRepo.save([admin, property, worker, owner, owner2, merchant]);

  const billRepo = AppDataSource.getRepository(Bill);
  const today = new Date();
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const dueDate = new Date(today);
  dueDate.setMonth(dueDate.getMonth() + 1);

  const bill1 = billRepo.create({
    id: uuidv4(),
    userId: owner.id,
    communityId: community.id,
    projectId: project1.id,
    type: 'property',
    amount: 250.00,
    period,
    dueDate: dueDate.toISOString().split('T')[0],
    status: 'unpaid',
  });

  const bill2 = billRepo.create({
    id: uuidv4(),
    userId: owner2.id,
    communityId: community.id,
    projectId: project2.id,
    type: 'property',
    amount: 180.00,
    period,
    dueDate: dueDate.toISOString().split('T')[0],
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentMethod: 'wechat',
    transactionId: 'WX' + Date.now(),
  });
  await billRepo.save([bill1, bill2]);

  const workOrderRepo = AppDataSource.getRepository(WorkOrder);
  const wo1 = workOrderRepo.create({
    id: uuidv4(),
    userId: owner.id,
    communityId: community.id,
    projectId: project1.id,
    type: 'plumbing',
    title: '厨房水龙头漏水',
    description: '厨房水龙头持续滴水，需要维修更换密封圈。',
    status: 'pending',
    priority: 'medium',
    location: { lat: 30.2741, lng: 120.1551, address: '1号楼1单元1001室' },
  });

  const wo2 = workOrderRepo.create({
    id: uuidv4(),
    userId: owner2.id,
    communityId: community.id,
    projectId: project2.id,
    type: 'electrical',
    title: '客厅灯具不亮',
    description: '客厅吸顶灯突然不亮了，可能是镇流器坏了。',
    status: 'processing',
    assignedToId: worker.id,
    priority: 'high',
    location: { lat: 30.2742, lng: 120.1552, address: '2号楼3单元502室' },
  });
  await workOrderRepo.save([wo1, wo2]);

  const announcementRepo = AppDataSource.getRepository(Announcement);
  const ann1 = announcementRepo.create({
    id: uuidv4(),
    communityId: community.id,
    title: '关于小区消防演习的通知',
    content: '各位业主：为提高消防安全意识，物业将于本周六上午9点在小区广场举行消防演习，请各位业主积极参与。',
    category: 'notice',
    status: 'published',
  });
  const ann2 = announcementRepo.create({
    id: uuidv4(),
    communityId: community.id,
    title: '停水通知',
    content: '各位业主：因市政管网检修，本周三上午8:00-12:00将临时停水，请提前做好储水准备。',
    category: 'emergency',
    status: 'published',
  });
  await announcementRepo.save([ann1, ann2]);

  const postRepo = AppDataSource.getRepository(Post);
  const post1 = postRepo.create({
    id: uuidv4(),
    userId: owner.id,
    communityId: community.id,
    content: '周末一起去小区公园散步吗？最近樱花开了，特别好看！',
    likeCount: 5,
    status: 'active',
  });
  await postRepo.save(post1);

  const commentRepo = AppDataSource.getRepository(Comment);
  const comment1 = commentRepo.create({
    id: uuidv4(),
    postId: post1.id,
    userId: owner2.id,
    content: '好啊好啊，我也正想出去走走！',
    status: 'active',
  });
  await commentRepo.save(comment1);

  const productRepo = AppDataSource.getRepository(MerchantProduct);
  const product1 = productRepo.create({
    id: uuidv4(),
    merchantId: merchant.id,
    communityId: community.id,
    name: '新鲜鸡蛋 30枚装',
    category: '生鲜食品',
    description: '农家散养土鸡蛋，新鲜直达',
    price: 29.90,
    status: 'active',
    sortOrder: 1,
  });
  const product2 = productRepo.create({
    id: uuidv4(),
    merchantId: merchant.id,
    communityId: community.id,
    name: '家庭清洁服务',
    category: '家政服务',
    description: '专业保洁阿姨上门服务，3小时深度清洁',
    price: 158.00,
    status: 'active',
    sortOrder: 2,
  });
  const product3 = productRepo.create({
    id: uuidv4(),
    merchantId: merchant.id,
    communityId: community.id,
    name: '家电维修上门',
    category: '维修服务',
    description: '空调/洗衣机/冰箱等家电上门维修服务',
    price: 50.00,
    status: 'active',
    sortOrder: 3,
  });
  await productRepo.save([product1, product2, product3]);

  const orderRepo = AppDataSource.getRepository(Order);
  const order1 = orderRepo.create({
    id: uuidv4(),
    userId: owner.id,
    productId: product1.id,
    communityId: community.id,
    quantity: 1,
    totalAmount: 29.90,
    status: 'paid',
    address: '1号楼1单元1001室',
    contactName: '张先生',
    contactPhone: '13800000003',
    paidAt: new Date().toISOString(),
    paidMethod: 'wechat',
  });
  await orderRepo.save(order1);

  const activityRepo = AppDataSource.getRepository(Activity);
  const activity1 = activityRepo.create({
    id: uuidv4(),
    communityId: community.id,
    title: '社区亲子运动会',
    description: '增进邻里感情，丰富社区生活，欢迎家长带小朋友踊跃参加！',
    location: '小区中心广场',
    startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '17:00',
    maxParticipants: 50,
    status: 'published',
  });
  await activityRepo.save(activity1);

  const regRepo = AppDataSource.getRepository(ActivityRegistration);
  const reg1 = regRepo.create({
    id: uuidv4(),
    activityId: activity1.id,
    userId: owner.id,
    contactName: '张先生',
    contactPhone: '13800000003',
    participantCount: 3,
    status: 'registered',
  });
  await regRepo.save(reg1);

  const messageRepo = AppDataSource.getRepository(Message);
  const msg1 = messageRepo.create({
    id: uuidv4(),
    userId: owner.id,
    title: '欢迎加入阳光花园',
    content: '感谢您注册成为阳光花园小区业主，祝您在这里生活愉快！如有任何问题，请联系物业。',
    type: 'inbox',
    category: 'system',
    status: 'unread',
    channels: { inbox: true },
  });
  const msg2 = messageRepo.create({
    id: uuidv4(),
    userId: owner.id,
    title: '物业费缴纳提醒',
    content: '您有一笔物业费待缴纳，请及时处理，以免影响您的正常生活。',
    type: 'inbox',
    category: 'bill',
    status: 'unread',
    channels: { inbox: true, template: true },
  });
  await messageRepo.save([msg1, msg2]);

  const govRepo = AppDataSource.getRepository(GovDataChannel);
  const gov1 = govRepo.create({
    id: uuidv4(),
    communityId: community.id,
    channelName: '政务信息推送',
    channelType: 'info_push',
    config: { apiEndpoint: 'https://gov.example.com/api/push', apiKey: '***' },
    status: 'active',
  });
  await govRepo.save(gov1);

  console.log('[Seed] 数据初始化完成');
  console.log('[Seed] 测试账号:');
  console.log('  管理员: 13800000000 / 123456');
  console.log('  物业: 13800000001 / 123456');
  console.log('  维修工: 13800000002 / 123456');
  console.log('  业主: 13800000003 / 123456');
  console.log('  商户: 13800000005 / 123456');
}
