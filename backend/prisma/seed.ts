import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";
import encryptionService from "../src/services/encryptionService";
import {
  UserRole,
  UserStatus,
  InstitutionType,
  InstitutionStatus,
  PackageType,
  PackageStatus,
  BookingStatus,
  PaymentStatus,
  InsuranceProductType,
  InsuranceOrderStatus,
  OcrStatus,
  IndicatorStatus,
  AbnormalLevel,
  Gender,
} from "../src/types/enums";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const passwordHash = await bcrypt.hash("123456", 12);
  const idCardEncrypted = encryptionService.encrypt("110101199001011234");
  const hisApiConfigEncrypted = encryptionService.encryptObject({
    url: "https://hospital-api.example.com",
    apiKey: "test-api-key",
    secret: "test-secret",
  });
  const apiConfigEncrypted = encryptionService.encryptObject({
    url: "https://insurance-api.example.com",
    apiKey: "insurance-api-key",
    secret: "insurance-secret",
  });

  console.log("清理现有数据...");
  await prisma.auditLog.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.abnormalIndicator.deleteMany();
  await prisma.healthIndicator.deleteMany();
  await prisma.healthArchive.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.insuranceOrder.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.healthPackage.deleteMany();
  await prisma.insuranceProduct.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.insuranceCompany.deleteMany();

  console.log("创建超级管理员...");
  const superAdmin = await prisma.user.create({
    data: {
      phone: "13800138000",
      name: "超级管理员",
      idCardEncrypted,
      email: "admin@example.com",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("创建超级管理员:", superAdmin.phone);

  console.log("创建普通测试用户...");
  const testUser = await prisma.user.create({
    data: {
      phone: "13900139000",
      name: "张三",
      idCardEncrypted: encryptionService.encrypt("110101198505051234"),
      email: "zhangsan@example.com",
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("创建测试用户:", testUser.phone);

  console.log("创建体检机构...");
  const institutions = [
    {
      name: "北京协和医院",
      type: InstitutionType.HOSPITAL,
      city: "北京",
      address: "北京市东城区帅府园1号",
      phone: "010-69156114",
      level: "三级甲等",
      description: "北京协和医院是一所位于北京市东城区，集医疗、科研、教学为一体的大型综合医院。",
      logoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200&h=200&fit=crop",
    },
    {
      name: "上海瑞金医院",
      type: InstitutionType.HOSPITAL,
      city: "上海",
      address: "上海市黄浦区瑞金二路197号",
      phone: "021-64370045",
      level: "三级甲等",
      description: "上海交通大学医学院附属瑞金医院，是一所集医疗、教学、科研为一体的三级甲等综合性医院。",
      logoUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop",
    },
    {
      name: "广州中山一院",
      type: InstitutionType.HOSPITAL,
      city: "广州",
      address: "广东省广州市越秀区中山二路58号",
      phone: "020-87755766",
      level: "三级甲等",
      description: "中山大学附属第一医院，是一所集医疗、教学、科研、预防保健为一体的三级甲等综合性医院。",
      logoUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200&h=200&fit=crop",
    },
  ];

  const createdInstitutions: { id: string }[] = [];
  for (const inst of institutions) {
    const institution = await prisma.institution.create({
      data: {
        ...inst,
        status: InstitutionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: superAdmin.id,
        hisApiConfigEncrypted,
      },
    });
    createdInstitutions.push(institution);
    console.log("创建医疗机构:", institution.name);
  }

  console.log("创建体检套餐...");
  const packageTypes = [
    { type: PackageType.GENERAL, namePrefix: "基础体检套餐", price: 599, desc: "适合常规健康检查的基础套餐" },
    { type: PackageType.CARDIOVASCULAR, namePrefix: "心血管专项套餐", price: 1299, desc: "针对心血管健康的专项检查" },
    { type: PackageType.CANCER_SCREENING, namePrefix: "肿瘤筛查套餐", price: 1999, desc: "针对常见癌症的早期筛查套餐" },
    { type: PackageType.WOMEN_HEALTH, namePrefix: "女性健康套餐", price: 899, desc: "针对女性健康的专项体检套餐" },
  ];

  const createdPackages: { id: string; price: any }[] = [];
  for (let i = 0; i < createdInstitutions.length; i++) {
    const institution = createdInstitutions[i];
    for (let j = 0; j < packageTypes.length; j++) {
      const pkg = packageTypes[j];
      const healthPackage = await prisma.healthPackage.create({
        data: {
          institutionId: institution.id,
          name: `${pkg.namePrefix}${j + 1}`,
          type: pkg.type,
          price: pkg.price + i * 100,
          originalPrice: pkg.price + 200 + i * 100,
          ageMin: 18,
          ageMax: j === 0 ? 65 : 75,
          gender: Gender.ALL,
          city: institutions[i].city,
          items: JSON.stringify([
            "身高、体重、血压",
            "血常规",
            "尿常规",
            "肝功能",
            "肾功能",
            "心电图",
            "胸部X光",
            "腹部B超",
          ]),
          description: pkg.desc,
          notice: "检查前一天晚上10点后禁食禁水",
          status: PackageStatus.PUBLISHED,
        },
      });
      createdPackages.push(healthPackage);
      console.log("创建体检套餐:", healthPackage.name);
    }
  }

  console.log("创建保险公司...");
  const insuranceCompanies = [
    {
      name: "平安保险",
      licenseNumber: "J103H1100001002",
      contactName: "张经理",
      contactPhone: "13900139001",
      commissionRate: 0.15,
    },
    {
      name: "中国人寿",
      licenseNumber: "J101H1100001001",
      contactName: "李经理",
      contactPhone: "13900139002",
      commissionRate: 0.12,
    },
    {
      name: "太平洋保险",
      licenseNumber: "J102H1100001003",
      contactName: "王经理",
      contactPhone: "13900139003",
      commissionRate: 0.18,
    },
  ];

  const createdCompanies: { id: string }[] = [];
  for (const company of insuranceCompanies) {
    const insuranceCompany = await prisma.insuranceCompany.create({
      data: {
        ...company,
        apiConfigEncrypted,
        status: InstitutionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: superAdmin.id,
      },
    });
    createdCompanies.push(insuranceCompany);
    console.log("创建保险公司:", insuranceCompany.name);
  }

  console.log("创建保险产品...");
  const productTypes = [
    { type: InsuranceProductType.CRITICAL_ILLNESS, name: "重大疾病保险", premium: 3500 },
    { type: InsuranceProductType.HOSPITALIZATION, name: "百万医疗险", premium: 299 },
    { type: InsuranceProductType.ACCIDENT, name: "意外伤害保险", premium: 199 },
  ];

  const createdProducts: { id: string; premium: any }[] = [];
  for (let i = 0; i < createdCompanies.length; i++) {
    const company = createdCompanies[i];
    for (let j = 0; j < productTypes.length; j++) {
      const prod = productTypes[j];
      const product = await prisma.insuranceProduct.create({
        data: {
          companyId: company.id,
          name: `${insuranceCompanies[i].name}-${prod.name}`,
          type: prod.type,
          coverage: JSON.stringify({
            coverageAmount: prod.type === InsuranceProductType.CRITICAL_ILLNESS ? 500000 : prod.type === InsuranceProductType.HOSPITALIZATION ? 4000000 : 100000,
            coveragePeriod: prod.type === InsuranceProductType.CRITICAL_ILLNESS ? "LIFETIME" : "ONE_YEAR",
            waitingPeriod: prod.type === InsuranceProductType.CRITICAL_ILLNESS ? 90 : 30,
          }),
          premium: prod.premium + i * 50,
          underwritingRules: JSON.stringify({
            minAge: 18,
            maxAge: 55,
            healthDeclarationRequired: true,
            medicalExamRequired: prod.type === InsuranceProductType.CRITICAL_ILLNESS,
          }),
          description: `${prod.name}，为您提供全面保障`,
          status: PackageStatus.PUBLISHED,
        },
      });
      createdProducts.push(product);
      console.log("创建保险产品:", product.name);
    }
  }

  console.log("创建模拟预约数据...");
  const checkupPersonEncrypted = encryptionService.encryptObject({
    name: "张三",
    idCard: "110101198505051234",
    phone: "13900139000",
    gender: "MALE",
  });

  const bookings = [];
  for (let i = 0; i < 3; i++) {
    const pkg = createdPackages[i];
    const booking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        packageId: pkg.id,
        checkupDate: new Date(2024, i, 15),
        checkupTime: "08:30",
        checkupPersonEncrypted,
        status: i === 0 ? BookingStatus.COMPLETED : i === 1 ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PAID,
        amount: pkg.price,
      },
    });
    bookings.push(booking);
    console.log("创建体检预约:", booking.id);
  }

  console.log("创建模拟保险订单数据...");
  const applicantEncrypted = encryptionService.encryptObject({
    name: "张三",
    idCard: "110101198505051234",
    phone: "13900139000",
    gender: "MALE",
    birthDate: "1985-05-05",
  });

  for (let i = 0; i < 3; i++) {
    const prod = createdProducts[i];
    const order = await prisma.insuranceOrder.create({
      data: {
        userId: testUser.id,
        productId: prod.id,
        policyNumber: `POL${Date.now()}${i}`,
        applicantEncrypted,
        insuredEncrypted: applicantEncrypted,
        beneficiary: "法定受益人",
        assessmentResult: i === 0 ? "STANDARD" : i === 1 ? "SUBSTANDARD" : "PENDING",
        premium: prod.premium,
        status: i === 0 ? InsuranceOrderStatus.ACTIVE : i === 1 ? InsuranceOrderStatus.APPROVED : InsuranceOrderStatus.PENDING_ASSESSMENT,
        effectiveDate: new Date(2024, 0, 1),
        expiryDate: new Date(2025, 0, 1),
      },
    });
    console.log("创建保险订单:", order.id);
  }

  console.log("创建模拟健康档案数据...");
  if (bookings.length > 0) {
    const completedBooking = bookings[0];

    const indicators = [
      { category: "血常规", name: "白细胞计数", value: "6.8", unit: "×10^9/L", referenceRange: "4.0-10.0", status: IndicatorStatus.NORMAL },
      { category: "血常规", name: "红细胞计数", value: "4.8", unit: "×10^12/L", referenceRange: "4.0-5.5", status: IndicatorStatus.NORMAL },
      { category: "血常规", name: "血红蛋白", value: "145", unit: "g/L", referenceRange: "120-160", status: IndicatorStatus.NORMAL },
      { category: "肝功能", name: "谷丙转氨酶(ALT)", value: "45", unit: "U/L", referenceRange: "0-40", status: IndicatorStatus.ABNORMAL },
      { category: "血脂", name: "总胆固醇", value: "5.8", unit: "mmol/L", referenceRange: "0-5.2", status: IndicatorStatus.ABNORMAL },
      { category: "血糖", name: "空腹血糖", value: "6.5", unit: "mmol/L", referenceRange: "3.9-6.1", status: IndicatorStatus.ABNORMAL },
    ];

    const abnormalIndicators = indicators
      .filter((i) => i.status !== IndicatorStatus.NORMAL)
      .map((i) => ({
        name: i.name,
        value: i.value,
        referenceRange: i.referenceRange,
        level: AbnormalLevel.MILD,
        description: `${i.name}异常，建议定期复查并调整生活方式。`,
      }));

    const archive = await prisma.$transaction(async (tx) => {
      const newArchive = await tx.healthArchive.create({
        data: {
          userId: testUser.id,
          bookingId: completedBooking.id,
          reportDate: new Date(2024, 0, 20),
          reportUrl: "https://example.com/report/001.pdf",
          ocrStatus: OcrStatus.COMPLETED,
          structuredData: JSON.stringify({
            reportType: "体检报告",
            analysisDate: new Date().toISOString(),
            summary: {
              totalIndicators: indicators.length,
              normalCount: indicators.filter((i) => i.status === IndicatorStatus.NORMAL).length,
              abnormalCount: indicators.filter((i) => i.status !== IndicatorStatus.NORMAL).length,
            },
            recommendations: [
              "建议控制饮食，减少高脂肪、高糖食物摄入",
              "增加有氧运动，每周至少3次，每次30分钟",
              "定期监测血糖和血脂，建议3个月后复查",
            ],
          }),
        },
      });

      await tx.healthIndicator.createMany({
        data: indicators.map((i) => ({
          ...i,
          archiveId: newArchive.id,
          measureDate: new Date(2024, 0, 15),
        })),
      });

      await tx.abnormalIndicator.createMany({
        data: abnormalIndicators.map((i) => ({
          ...i,
          archiveId: newArchive.id,
        })),
      });

      return newArchive;
    });

    console.log("创建健康档案:", archive.id);

    console.log("创建风险评估数据...");
    const riskAssessment = await prisma.riskAssessment.create({
      data: {
        userId: testUser.id,
        assessmentDate: new Date(2024, 0, 25),
        diabetesRisk: 45,
        hypertensionRisk: 55,
        cardiovascularRisk: 50,
        overallScore: 50,
        suggestions: JSON.stringify({
          diabetes: {
            risk: "MEDIUM",
            score: 45,
            factors: ["空腹血糖受损: 6.5mmol/L", "年龄45-64岁"],
            suggestions: ["建议进行糖耐量试验，控制饮食"],
          },
          hypertension: {
            risk: "HIGH",
            score: 55,
            factors: ["年龄45-64岁", "总胆固醇偏高: 5.8mmol/L"],
            suggestions: ["建议监测血压，低盐饮食"],
          },
          cardiovascular: {
            risk: "HIGH",
            score: 50,
            factors: ["年龄45-64岁", "总胆固醇偏高: 5.8mmol/L"],
            suggestions: ["建议低脂饮食，必要时服用他汀类药物"],
          },
          overall: {
            score: 50,
            level: "MEDIUM",
            summary: "存在一定的健康风险，建议改善生活方式，定期体检。",
          },
        }),
      },
    });
    console.log("创建风险评估:", riskAssessment.id);
  }

  console.log("");
  console.log("========================================");
  console.log("数据播种完成！");
  console.log("========================================");
  console.log("");
  console.log("测试账号:");
  console.log("  超级管理员: 13800138000 / 123456");
  console.log("  普通用户:   13900139000 / 123456");
  console.log("");
  console.log("创建的数据统计:");
  console.log("  体检机构: 3家");
  console.log("  体检套餐: 12个");
  console.log("  保险公司: 3家");
  console.log("  保险产品: 9个");
  console.log("  体检预约: 3条");
  console.log("  保险订单: 3条");
  console.log("  健康档案: 1份");
  console.log("  风险评估: 1份");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
