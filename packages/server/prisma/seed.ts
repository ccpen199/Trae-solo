import { PrismaClient, UserRole, VisaType, OrderType, OrderStatus, PaymentStatus, CourierTaskStatus } from '@prisma/client';

const prisma = new PrismaClient();
const crypto = require('crypto');

function enc(v: string): string {
  const ALG = 'aes-256-gcm';
  const key = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(v, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([0]), iv, tag, enc]).toString('base64');
}
function hash(v: string): string {
  return crypto.createHmac('sha256', 'postal-gov-salt').update(v).digest('hex');
}
function hashPwd(p: string): string {
  return crypto.createHash('sha256').update(p + 'pepper').digest('hex');
}

async function main() {
  console.log('🌱 Seeding postal gov platform...');

  const password = hashPwd('Admin@123456');

  const provinceAdmin = await prisma.user.upsert({
    where: { phoneHash: hash('13800000001') },
    update: {},
    create: {
      phoneEncrypted: enc('13800000001'), phoneHash: hash('13800000001'),
      passwordHash: password, role: UserRole.PROVINCE_ADMIN,
      operatorProfile: { create: { operatorNo: 'OP-PROV-001', department: '广东省政务运营中心', managedCity: '广东省', permissions: { all: true } } },
    },
    include: { operatorProfile: true },
  });
  console.log('✅ Created province admin 13800000001 / Admin@123456');

  for (const city of ['广州市', '深圳市', '佛山市']) {
    const idx = ['广州市', '深圳市', '佛山市'].indexOf(city) + 1;
    const cityAdmin = await prisma.user.upsert({
      where: { phoneHash: hash(`1380000010${idx}`) },
      update: {},
      create: {
        phoneEncrypted: enc(`1380000010${idx}`), phoneHash: hash(`1380000010${idx}`),
        passwordHash: password, role: UserRole.CITY_OPERATOR, city,
        operatorProfile: { create: { operatorNo: `OP-CITY-${String(idx).padStart(3, '0')}`, department: `${city}政务运营部`, managedCity: city, permissions: { city: true } } },
      },
    });
    console.log(`✅ Created ${city} operator 1380000010${idx}`);

    const approver = await prisma.user.upsert({
      where: { phoneHash: hash(`1380000020${idx}`) },
      update: {},
      create: {
        phoneEncrypted: enc(`1380000020${idx}`), phoneHash: hash(`1380000020${idx}`),
        passwordHash: password, role: UserRole.APPROVER, city,
        approverProfile: { create: { approverNo: `APR-${String(idx).padStart(3, '0')}`, department: `${city}审批科`, dutyCity: city, approvalTypes: { visa: true, idcard: true } } },
      },
    });
    console.log(`✅ Created ${city} approver 1380000020${idx}`);

    for (let j = 1; j <= 3; j++) {
      const courierPhone = `13800000${30}${idx}${j}`;
      const courier = await prisma.user.upsert({
        where: { phoneHash: hash(courierPhone) },
        update: {},
        create: {
          phoneEncrypted: enc(courierPhone), phoneHash: hash(courierPhone),
          passwordHash: password, role: UserRole.COURIER, city,
          courierProfile: {
            create: {
              employeeNo: `EMP-${city.slice(0, 2)}-${String(j).padStart(3, '0')}`,
              postStation: `${city}邮政${j}号支局`, postStationCode: `${city.slice(0, 2)}${j}`,
              serviceCity: city, serviceDistrict: '中心城区',
              currentLat: 23.1291 + Math.random() * 0.1, currentLon: 113.2644 + Math.random() * 0.1,
              isOnDuty: j === 1,
            },
          },
        },
      });
      console.log(`✅ Created ${city} courier ${courierPhone}`);
    }
  }

  const applicant1 = await prisma.user.upsert({
    where: { phoneHash: hash('13912345678') },
    update: {},
    create: {
      phoneEncrypted: enc('13912345678'), phoneHash: hash('13912345678'),
      passwordHash: password, role: UserRole.APPLICANT, city: '广州市',
      profile: {
        create: {
          realNameEncrypted: enc('张三'), realNameMasked: '张*',
          idCardEncrypted: enc('440101199001011234'), idCardHash: hash('440101199001011234'), idCardMasked: '4401****1234',
          gender: '男', birthDate: new Date('1990-01-01'), ethnicity: '汉',
          addressEncrypted: enc('广州市天河区天河路385号'), addressMasked: '广州市天河****85号',
          policeDbVerified: true, policeDbVerifyAt: new Date(),
        },
      },
      identityVerifications: {
        create: { type: 'REAL_NAME_FACE', status: 'VERIFIED', verifiedAt: new Date(), faceVerifyScore: 0.96, verifyResult: { nameMatch: true, idMatch: true, faceMatch: true } },
      },
    },
  });
  console.log('✅ Created verified applicant 13912345678 / Admin@123456');

  const orderNo = `GDHKM${new Date().toISOString().slice(0, 10).replace(/-/g, '')}000001`;
  const sampleOrder = await prisma.order.upsert({
    where: { orderNo },
    update: {},
    create: {
      orderNo, orderType: OrderType.HK_MACAO_VISA, status: OrderStatus.COURIER_ASSIGNED,
      applicantId: applicant1.id, applicantCity: '广州市',
      serviceFee: 25, governmentFee: 80, courierFee: 36, totalAmount: 141,
      paymentStatus: PaymentStatus.PAID, paidAt: new Date(),
      pickupAddressEncrypted: enc('广州市天河区天河路385号'), pickupAddressMasked: '广州市天河****85号',
      pickupContactNameEncrypted: enc('张三'), pickupContactPhoneEncrypted: enc('13912345678'),
      pickupLat: 23.1317, pickupLon: 113.3211,
      deliveryAddressEncrypted: enc('广州市天河区天河北路233号'), deliveryAddressMasked: '广州市天河****33号',
      deliveryContactNameEncrypted: enc('张三'), deliveryContactPhoneEncrypted: enc('13912345678'),
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      visaApplication: {
        create: { visaType: VisaType.HK_G_SIGN, validMonths: 12, entryCount: '一次有效', travelPurpose: '旅游', passportNoMasked: 'E12****567' },
      },
      statusLogs: {
        create: [
          { toStatus: OrderStatus.CREATED, remark: '订单创建' },
          { toStatus: OrderStatus.PENDING_PICKUP, remark: '支付成功' },
          { toStatus: OrderStatus.COURIER_ASSIGNED, remark: '揽收员已分配' },
        ],
      },
      paymentRecords: {
        create: [{ paymentNo: `PAY${Date.now()}001`, amount: 141, channel: 'WECHAT_PAY', status: PaymentStatus.PAID, thirdPartyTradeNo: 'wx-20240615001', paidAt: new Date() }],
      },
    },
    include: { visaApplication: true },
  });
  console.log(`✅ Created sample visa order ${orderNo}`);

  await prisma.dataEncryptionKey.upsert({
    where: { keyVersion: 1 },
    update: {},
    create: { keyVersion: 1, keyValue: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', algorithm: 'AES-256-GCM', isActive: true },
  });
  console.log('✅ Created encryption key');

  console.log('\n🎉 Seeding complete! Test accounts:');
  console.log('   📋 省级运营: 13800000001 / Admin@123456');
  console.log('   🏙️  广州运营: 13800000101 / Admin@123456');
  console.log('   📝 广州审批: 13800000201 / Admin@123456');
  console.log('   🚚 广州揽收: 138000003011 / Admin@123456');
  console.log('   👤 申请人(已实名): 13912345678 / Admin@123456');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
