import { PrismaClient, UserRole, MembershipLevel, ProductStatus, PostStatus, ContentAuditStatus } from '../src/generated/client';
import { hashSync } from 'bcryptjs';
import { PRODUCT_CATEGORY_TREE } from '@pet/shared/constants';
import { buildTree, flattenTree, generateUUID } from '@pet/shared/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding database...');

  const adminPassword = hashSync('Admin@123456', 10);
  const userPassword = hashSync('User@123456', 10);

  const superAdmin = await prisma.user.upsert({
    where: { phone: '13800000000' },
    update: {},
    create: {
      phone: '13800000000',
      email: 'admin@petlife.com',
      password: adminPassword,
      nickname: '超级管理员',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adorable%20cartoon%20cat%20avatar%20cute%20kawaii&image_size=square',
      role: UserRole.SUPER_ADMIN,
      membershipLevel: MembershipLevel.DIAMOND,
      isVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('Created super admin:', superAdmin.phone);

  const testUser = await prisma.user.upsert({
    where: { phone: '13900000000' },
    update: {},
    create: {
      phone: '13900000000',
      email: 'user@petlife.com',
      password: userPassword,
      nickname: '萌宠主人',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20dog%20owner%20avatar%20friendly%20smile&image_size=square',
      role: UserRole.CUSTOMER,
      membershipLevel: MembershipLevel.BRONZE,
      growthPoints: 1500,
      balance: 1000,
      point: 500,
      isVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('Created test user:', testUser.phone);

  const flatCategories = flattenTree(PRODUCT_CATEGORY_TREE.children || []);
  for (const cat of flatCategories) {
    const { children, ...categoryData } = cat;
    await prisma.productCategory.upsert({
      where: { code: categoryData.code },
      update: {},
      create: {
        id: generateUUID(),
        ...categoryData,
        parentId: categoryData.parentId || null,
      },
    });
  }
  console.log('Created product categories');

  const topics = [
    { name: '猫咪日常', slug: 'cat-daily', category: 'life', isHot: true, isOfficial: true, description: '分享猫咪的日常生活点滴' },
    { name: '狗狗训练', slug: 'dog-training', category: 'training', isHot: true, isOfficial: true, description: '专业训犬技巧交流' },
    { name: '宠物医疗', slug: 'pet-health', category: 'health', isHot: true, isOfficial: true, description: '宠物健康医疗咨询' },
    { name: '宠物营养', slug: 'pet-nutrition', category: 'nutrition', isOfficial: true, description: '科学喂养，营养搭配' },
    { name: '领养救助', slug: 'adoption-rescue', category: 'adoption', isHot: true, isOfficial: true, description: '流浪动物领养救助专区' },
    { name: '经验交流', slug: 'experience', category: 'discussion', isOfficial: true, description: '养宠经验分享交流' },
  ];

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: {
        id: generateUUID(),
        ...topic,
        coverImage: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(topic.name + ' pet topic cover')}&image_size=landscape_16_9`,
      },
    });
  }
  console.log('Created topics');

  const membershipCards = [
    { type: 'MONTHLY', name: '月度黑卡', price: 29.9, originalPrice: 49.9, durationDays: 30, isHot: false, sortOrder: 1 },
    { type: 'QUARTERLY', name: '季度黑卡', price: 79.9, originalPrice: 149.9, durationDays: 90, isHot: true, sortOrder: 2 },
    { type: 'YEARLY', name: '年度黑卡', price: 299, originalPrice: 599, durationDays: 365, isHot: true, sortOrder: 3 },
    { type: 'LIFETIME', name: '终身黑卡', price: 1999, originalPrice: 3999, durationDays: 99999, isHot: false, sortOrder: 4 },
  ];

  for (const card of membershipCards) {
    await prisma.membershipCard.upsert({
      where: { id: generateUUID() },
      update: {},
      create: {
        id: generateUUID(),
        ...card,
        benefits: ['专属折扣', '免费包邮', '积分翻倍', '优先客服', '专属商品'],
        gifts: [{ type: 'coupon', value: 50, description: '50元无门槛券' }],
      },
    });
  }
  console.log('Created membership cards');

  const systemConfigs = [
    { key: 'site.name', value: '萌宠生活', type: 'string', group: 'base', isPublic: true },
    { key: 'site.description', value: '面向宠物主的全栈式宠物生活服务平台', type: 'string', group: 'base', isPublic: true },
    { key: 'site.logo', value: '/logo.png', type: 'string', group: 'base', isPublic: true },
    { key: 'order.auto_cancel_minutes', value: '30', type: 'number', group: 'order', isPublic: false },
    { key: 'order.auto_confirm_days', value: '7', type: 'number', group: 'order', isPublic: false },
    { key: 'order.auto_complete_days', value: '15', type: 'number', group: 'order', isPublic: false },
    { key: 'shipping.free_threshold', value: '99', type: 'number', group: 'shipping', isPublic: true },
    { key: 'shipping.default_fee', value: '10', type: 'number', group: 'shipping', isPublic: true },
    { key: 'review.auto_approve', value: 'true', type: 'boolean', group: 'content', isPublic: false },
    { key: 'post.auto_audit', value: 'true', type: 'boolean', group: 'content', isPublic: false },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        id: generateUUID(),
        ...config,
      },
    });
  }
  console.log('Created system configs');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
