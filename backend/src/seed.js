const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = await prisma.user.createMany({
    data: [
      {
        id: 'user-admin-001',
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: 'ADMIN',
        phone: '13800000000',
        email: 'admin@pharmacy.com',
        isActive: true
      },
      {
        id: 'user-purchaser-001',
        username: 'purchaser1',
        password: hashedPassword,
        name: '采购员-张三',
        role: 'PURCHASER',
        phone: '13800000001',
        email: 'purchaser1@pharmacy.com',
        isActive: true
      },
      {
        id: 'user-warehouse-001',
        username: 'warehouse1',
        password: hashedPassword,
        name: '库管-李四',
        role: 'WAREHOUSE_KEEPER',
        phone: '13800000002',
        email: 'warehouse1@pharmacy.com',
        isActive: true
      },
      {
        id: 'user-pharmacist-001',
        username: 'pharmacist1',
        password: hashedPassword,
        name: '执业药师-王五',
        role: 'PHARMACIST',
        phone: '13800000003',
        email: 'pharmacist1@pharmacy.com',
        isActive: true
      },
      {
        id: 'user-cashier-001',
        username: 'cashier1',
        password: hashedPassword,
        name: '收银员-赵六',
        role: 'CASHIER',
        phone: '13800000004',
        email: 'cashier1@pharmacy.com',
        isActive: true
      }
    ]
  });

  console.log('Created users:', users.count);

  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        id: 'supplier-001',
        name: '国药集团医药有限公司',
        code: 'GYPHA-001',
        contactPerson: '李经理',
        phone: '010-88888888',
        address: '北京市朝阳区建国路88号',
        licenseNumber: '京食药监械经营许20230001',
        licenseExpiry: new Date('2028-12-31'),
        isQualified: true
      },
      {
        id: 'supplier-002',
        name: '上药控股有限公司',
        code: 'SYPHARMA-002',
        contactPerson: '王经理',
        phone: '021-66666666',
        address: '上海市浦东新区张江高科技园区',
        licenseNumber: '沪食药监械经营许20230002',
        licenseExpiry: new Date('2027-06-30'),
        isQualified: true
      },
      {
        id: 'supplier-003',
        name: '九州通医药集团',
        code: 'JZT-003',
        contactPerson: '张经理',
        phone: '027-77777777',
        address: '武汉市东西湖区九通路',
        licenseNumber: '鄂食药监械经营许20230003',
        licenseExpiry: new Date('2026-03-15'),
        isQualified: true
      }
    ]
  });

  console.log('Created suppliers:', suppliers.count);

  const drugs = await prisma.drug.createMany({
    data: [
      {
        id: 'drug-001',
        name: '阿莫西林胶囊',
        code: 'AMX-001',
        genericName: '阿莫西林',
        manufacturer: '华北制药股份有限公司',
        specification: '0.25g*24粒',
        unit: '盒',
        isPrescription: true,
        category: '抗生素'
      },
      {
        id: 'drug-002',
        name: '布洛芬缓释胶囊',
        code: 'IBU-002',
        genericName: '布洛芬',
        manufacturer: '中美天津史克制药有限公司',
        specification: '0.3g*20粒',
        unit: '盒',
        isPrescription: false,
        category: '解热镇痛'
      },
      {
        id: 'drug-003',
        name: '头孢克洛分散片',
        code: 'CEF-003',
        genericName: '头孢克洛',
        manufacturer: '礼来苏州制药有限公司',
        specification: '0.25g*12片',
        unit: '盒',
        isPrescription: true,
        category: '抗生素'
      },
      {
        id: 'drug-004',
        name: '氯雷他定片',
        code: 'LOR-004',
        genericName: '氯雷他定',
        manufacturer: '扬子江药业集团有限公司',
        specification: '10mg*6片',
        unit: '盒',
        isPrescription: false,
        category: '抗过敏'
      },
      {
        id: 'drug-005',
        name: '奥美拉唑肠溶胶囊',
        code: 'OME-005',
        genericName: '奥美拉唑',
        manufacturer: '阿斯利康制药有限公司',
        specification: '20mg*14粒',
        unit: '盒',
        isPrescription: true,
        category: '消化系统'
      },
      {
        id: 'drug-006',
        name: '维生素C片',
        code: 'VITC-006',
        genericName: '维生素C',
        manufacturer: '东北制药集团股份有限公司',
        specification: '100mg*100片',
        unit: '瓶',
        isPrescription: false,
        category: '维生素'
      },
      {
        id: 'drug-007',
        name: '盐酸二甲双胍片',
        code: 'MET-007',
        genericName: '二甲双胍',
        manufacturer: '中美上海施贵宝制药有限公司',
        specification: '0.5g*20片',
        unit: '盒',
        isPrescription: true,
        category: '糖尿病'
      },
      {
        id: 'drug-008',
        name: '硝苯地平缓释片',
        code: 'NIF-008',
        genericName: '硝苯地平',
        manufacturer: '拜耳医药保健有限公司',
        specification: '30mg*7片',
        unit: '盒',
        isPrescription: true,
        category: '心血管'
      }
    ]
  });

  console.log('Created drugs:', drugs.count);

  const configs = await prisma.systemConfig.createMany({
    data: [
      {
        key: 'EXPIRY_ALERT_LEVEL_1',
        value: '12',
        description: '效期预警一级 - 12个月'
      },
      {
        key: 'EXPIRY_ALERT_LEVEL_2',
        value: '6',
        description: '效期预警二级 - 6个月'
      },
      {
        key: 'EXPIRY_ALERT_LEVEL_3',
        value: '3',
        description: '效期预警三级 - 3个月（限制调价）'
      },
      {
        key: 'EXPIRY_ALERT_LEVEL_4',
        value: '1',
        description: '效期预警四级 - 1个月（禁止销售）'
      },
      {
        key: 'LOW_STOCK_THRESHOLD',
        value: '10',
        description: '低库存预警阈值'
      },
      {
        key: 'GSP_COMPLIANCE_ENABLED',
        value: 'true',
        description: 'GSP合规风控引擎开关'
      },
      {
        key: 'FIFO_ENABLED',
        value: 'true',
        description: 'FIFO先进先出库存管理开关'
      },
      {
        key: 'PRESCRIPTION_AI_ENABLED',
        value: 'true',
        description: '处方AI识别引擎开关'
      }
    ]
  });

  console.log('Created system configs:', configs.count);

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const in3Months = new Date(today);
  in3Months.setMonth(in3Months.getMonth() + 3);
  const in6Months = new Date(today);
  in6Months.setMonth(in6Months.getMonth() + 6);
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expired = new Date(today);
  expired.setMonth(expired.getMonth() - 1);

  const purchases = [
    {
      id: 'purchase-001',
      purchaseNo: 'PO-20260401-001',
      supplierId: 'supplier-001',
      status: 'COMPLETED',
      totalAmount: 1560.00,
      requestedById: 'user-purchaser-001',
      approvedById: 'user-admin-001',
      approvedAt: new Date(today.getTime() - 86400000 * 5),
      receivedAt: new Date(today.getTime() - 86400000 * 4),
      inspectedAt: new Date(today.getTime() - 86400000 * 3),
      completedAt: new Date(today.getTime() - 86400000 * 2),
      createdAt: new Date(today.getTime() - 86400000 * 7)
    },
    {
      id: 'purchase-002',
      purchaseNo: 'PO-20260425-002',
      supplierId: 'supplier-002',
      status: 'INSPECTING',
      totalAmount: 2280.00,
      requestedById: 'user-purchaser-001',
      approvedById: 'user-admin-001',
      approvedAt: new Date(today.getTime() - 86400000 * 2),
      receivedAt: new Date(today.getTime() - 86400000),
      createdAt: new Date(today.getTime() - 86400000 * 3)
    },
    {
      id: 'purchase-003',
      purchaseNo: 'PO-20260428-003',
      supplierId: 'supplier-001',
      status: 'PURCHASING',
      totalAmount: 3120.00,
      requestedById: 'user-purchaser-001',
      approvedById: 'user-admin-001',
      approvedAt: new Date(today.getTime() - 3600000 * 4),
      createdAt: new Date(today.getTime() - 3600000 * 8)
    }
  ];

  for (const purchase of purchases) {
    await prisma.purchase.create({ data: purchase });
  }
  console.log('Created purchases:', purchases.length);

  const purchaseItems = [
    {
      id: 'purchase-item-001',
      purchaseId: 'purchase-001',
      drugId: 'drug-001',
      quantity: 50,
      unitPrice: 12.50,
      batchNo: 'AMX20260401',
      expiryDate: nextYear,
      receivedQty: 50
    },
    {
      id: 'purchase-item-002',
      purchaseId: 'purchase-001',
      drugId: 'drug-002',
      quantity: 80,
      unitPrice: 15.50,
      batchNo: 'IBU20260401',
      expiryDate: in6Months,
      receivedQty: 80
    },
    {
      id: 'purchase-item-003',
      purchaseId: 'purchase-002',
      drugId: 'drug-003',
      quantity: 60,
      unitPrice: 18.00,
      batchNo: 'CEF20260425',
      expiryDate: in3Months,
      receivedQty: 60
    },
    {
      id: 'purchase-item-004',
      purchaseId: 'purchase-002',
      drugId: 'drug-005',
      quantity: 40,
      unitPrice: 30.00,
      batchNo: 'OME20260425',
      expiryDate: nextMonth,
      receivedQty: 40
    },
    {
      id: 'purchase-item-005',
      purchaseId: 'purchase-003',
      drugId: 'drug-006',
      quantity: 100,
      unitPrice: 5.20,
      batchNo: null,
      expiryDate: null,
      receivedQty: 0
    },
    {
      id: 'purchase-item-006',
      purchaseId: 'purchase-003',
      drugId: 'drug-007',
      quantity: 40,
      unitPrice: 25.00,
      batchNo: null,
      expiryDate: null,
      receivedQty: 0
    },
    {
      id: 'purchase-item-007',
      purchaseId: 'purchase-003',
      drugId: 'drug-008',
      quantity: 60,
      unitPrice: 35.00,
      batchNo: null,
      expiryDate: null,
      receivedQty: 0
    }
  ];

  for (const item of purchaseItems) {
    await prisma.purchaseItem.create({ data: item });
  }
  console.log('Created purchase items:', purchaseItems.length);

  const inventoryBatches = [
    {
      id: 'batch-001',
      drugId: 'drug-001',
      batchNo: 'AMX20260401',
      expiryDate: nextYear,
      totalQuantity: 50,
      availableQty: 45,
      unitCost: 12.50,
      status: 'IN_STOCK'
    },
    {
      id: 'batch-002',
      drugId: 'drug-002',
      batchNo: 'IBU20260401',
      expiryDate: in6Months,
      totalQuantity: 80,
      availableQty: 75,
      unitCost: 15.50,
      status: 'IN_STOCK'
    },
    {
      id: 'batch-003',
      drugId: 'drug-003',
      batchNo: 'CEF20260425',
      expiryDate: in3Months,
      totalQuantity: 60,
      availableQty: 60,
      unitCost: 18.00,
      status: 'EXPIRING_SOON'
    },
    {
      id: 'batch-004',
      drugId: 'drug-005',
      batchNo: 'OME20260425',
      expiryDate: nextMonth,
      totalQuantity: 40,
      availableQty: 40,
      unitCost: 30.00,
      status: 'EXPIRING_SOON'
    },
    {
      id: 'batch-005',
      drugId: 'drug-004',
      batchNo: 'LOR20260315',
      expiryDate: expired,
      totalQuantity: 30,
      availableQty: 0,
      unitCost: 20.00,
      status: 'EXPIRED',
      lockedQty: 30
    },
    {
      id: 'batch-006',
      drugId: 'drug-006',
      batchNo: 'VITC20260101',
      expiryDate: in3Months,
      totalQuantity: 100,
      availableQty: 100,
      unitCost: 3.50,
      status: 'IN_STOCK'
    }
  ];

  for (const batch of inventoryBatches) {
    await prisma.inventoryBatch.create({ data: batch });
  }
  console.log('Created inventory batches:', inventoryBatches.length);

  const expiryAlerts = [
    {
      id: 'alert-001',
      inventoryBatchId: 'batch-003',
      alertLevel: 3,
      message: '头孢克洛分散片 (批次: CEF20260425) 距效期3个月预警 - 限制调价',
      isRead: false
    },
    {
      id: 'alert-002',
      inventoryBatchId: 'batch-004',
      alertLevel: 4,
      message: '奥美拉唑肠溶胶囊 (批次: OME20260425) 距效期1个月预警 - 禁止销售',
      isRead: false
    },
    {
      id: 'alert-003',
      inventoryBatchId: 'batch-005',
      alertLevel: 5,
      message: '氯雷他定片 (批次: LOR20260315) 已过期 - 自动锁定库存',
      isRead: true,
      triggeredAt: expired
    }
  ];

  for (const alert of expiryAlerts) {
    await prisma.expiryAlert.create({ data: alert });
  }
  console.log('Created expiry alerts:', expiryAlerts.length);

  const prescriptions = [
    {
      id: 'prescription-001',
      prescriptionNo: 'RX-20260428-001',
      patientName: '张三',
      patientIdNo: '110101199001011234',
      patientPhone: '13800138000',
      drugNames: '阿莫西林胶囊, 头孢克洛分散片',
      extractedData: JSON.stringify({
        patientName: '张三',
        patientIdNo: '110101199001011234',
        drugs: [
          { name: '阿莫西林胶囊', dosage: '每日3次，每次2粒' },
          { name: '头孢克洛分散片', dosage: '每日2次，每次1片' }
        ],
        doctor: '李医生',
        hospital: '北京市第一人民医院'
      }),
      status: 'APPROVED',
      reviewedById: 'user-pharmacist-001',
      reviewedAt: new Date(today.getTime() - 3600000 * 2)
    },
    {
      id: 'prescription-002',
      prescriptionNo: 'RX-20260428-002',
      patientName: '李四',
      patientIdNo: '310101198505055678',
      patientPhone: '13900139000',
      drugNames: '盐酸二甲双胍片, 硝苯地平缓释片',
      extractedData: JSON.stringify({
        patientName: '李四',
        patientIdNo: '310101198505055678',
        drugs: [
          { name: '盐酸二甲双胍片', dosage: '每日2次，每次1片' },
          { name: '硝苯地平缓释片', dosage: '每日1次，每次1片' }
        ],
        doctor: '王医生',
        hospital: '上海市第一人民医院'
      }),
      status: 'PENDING_REVIEW'
    }
  ];

  for (const prescription of prescriptions) {
    await prisma.prescription.create({ data: prescription });
  }
  console.log('Created prescriptions:', prescriptions.length);

  const sales = [
    {
      id: 'sale-001',
      saleNo: 'SO-20260428-001',
      status: 'COMPLETED',
      totalAmount: 190.50,
      paidAmount: 190.50,
      patientName: '张三',
      patientPhone: '13800138000',
      prescriptionId: 'prescription-001',
      cashierId: 'user-cashier-001',
      paidAt: new Date(today.getTime() - 3600000),
      completedAt: new Date(today.getTime() - 3600000),
      invoiceNo: 'INV-20260428001',
      medicationGuide: '【用药指导】\n1. 请仔细阅读药品说明书...'
    },
    {
      id: 'sale-002',
      saleNo: 'SO-20260428-002',
      status: 'COMPLETED',
      totalAmount: 31.00,
      paidAmount: 31.00,
      patientName: '王五',
      patientPhone: '13600136000',
      cashierId: 'user-cashier-001',
      paidAt: new Date(today.getTime() - 1800000),
      completedAt: new Date(today.getTime() - 1800000),
      invoiceNo: 'INV-20260428002'
    }
  ];

  for (const sale of sales) {
    await prisma.sale.create({ data: sale });
  }
  console.log('Created sales:', sales.length);

  const saleItems = [
    {
      id: 'sale-item-001',
      saleId: 'sale-001',
      drugId: 'drug-001',
      inventoryBatchId: 'batch-001',
      quantity: 3,
      unitPrice: 18.50,
      subtotal: 55.50,
      batchNo: 'AMX20260401',
      expiryDate: nextYear
    },
    {
      id: 'sale-item-002',
      saleId: 'sale-001',
      drugId: 'drug-002',
      inventoryBatchId: 'batch-002',
      quantity: 2,
      unitPrice: 22.50,
      subtotal: 45.00,
      batchNo: 'IBU20260401',
      expiryDate: in6Months
    },
    {
      id: 'sale-item-003',
      saleId: 'sale-002',
      drugId: 'drug-002',
      inventoryBatchId: 'batch-002',
      quantity: 2,
      unitPrice: 15.50,
      subtotal: 31.00,
      batchNo: 'IBU20260401',
      expiryDate: in6Months
    }
  ];

  for (const item of saleItems) {
    await prisma.saleItem.create({ data: item });
  }
  console.log('Created sale items:', saleItems.length);

  const inventoryAudits = [
    {
      id: 'audit-001',
      auditNo: 'AUD-20260428001',
      inventoryBatchId: 'batch-001',
      type: 'SALE_DEDUCTION',
      beforeQty: 50,
      afterQty: 47,
      changeQty: -3,
      reason: '销售出库',
      relatedBizNo: 'SO-20260428-001',
      operatorId: 'user-cashier-001'
    },
    {
      id: 'audit-002',
      auditNo: 'AUD-20260428002',
      inventoryBatchId: 'batch-002',
      type: 'SALE_DEDUCTION',
      beforeQty: 80,
      afterQty: 77,
      changeQty: -3,
      reason: '销售出库',
      relatedBizNo: 'SO-20260428-001',
      operatorId: 'user-cashier-001'
    }
  ];

  for (const audit of inventoryAudits) {
    await prisma.inventoryAudit.create({ data: audit });
  }
  console.log('Created inventory audits:', inventoryAudits.length);

  const auditLogs = [
    {
      id: 'log-001',
      action: 'CREATE',
      tableName: 'Purchase',
      recordId: 'purchase-001',
      operatorId: 'user-purchaser-001',
      operatorName: '采购员-张三',
      remark: '创建采购申请单'
    },
    {
      id: 'log-002',
      action: 'UPDATE',
      tableName: 'Purchase',
      recordId: 'purchase-001',
      oldValues: JSON.stringify({ status: 'DRAFT' }),
      newValues: JSON.stringify({ status: 'COMPLETED' }),
      operatorId: 'user-admin-001',
      operatorName: '系统管理员',
      remark: '采购单审批通过并完成'
    }
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }
  console.log('Created audit logs:', auditLogs.length);

  console.log('');
  console.log('========================================');
  console.log('  Seed completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Test Data Summary:');
  console.log('----------------------------------------');
  console.log('  Users: 5');
  console.log('  Suppliers: 3');
  console.log('  Drugs: 8');
  console.log('  Purchases: 3 (1完成, 1待检, 1采购中)');
  console.log('  Inventory Batches: 6 (含临期/过期批次)');
  console.log('  Expiry Alerts: 3');
  console.log('  Prescriptions: 2 (1已审核, 1待审核)');
  console.log('  Sales: 2');
  console.log('  Sale Items: 3');
  console.log('----------------------------------------');
  console.log('');
  console.log('Default Accounts:');
  console.log('----------------------------------------');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: 123456');
  console.log('  Role: 系统管理员');
  console.log('');
  console.log('Purchaser:');
  console.log('  Username: purchaser1');
  console.log('  Password: 123456');
  console.log('  Role: 采购员');
  console.log('');
  console.log('Warehouse Keeper:');
  console.log('  Username: warehouse1');
  console.log('  Password: 123456');
  console.log('  Role: 库管');
  console.log('');
  console.log('Pharmacist:');
  console.log('  Username: pharmacist1');
  console.log('  Password: 123456');
  console.log('  Role: 执业药师');
  console.log('');
  console.log('Cashier:');
  console.log('  Username: cashier1');
  console.log('  Password: 123456');
  console.log('  Role: 收银员');
  console.log('');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
