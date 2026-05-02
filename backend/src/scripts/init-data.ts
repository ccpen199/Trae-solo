import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...\n');

  const password1 = await bcrypt.hash('Admin123456', 10);
  const password2 = await bcrypt.hash('Cashier123', 10);
  const password3 = await bcrypt.hash('Fm123456', 10);
  const password4 = await bcrypt.hash('Cfo123456', 10);
  const password5 = await bcrypt.hash('Auditor123', 10);

  const users = [
    {
      username: 'admin',
      password: password1,
      realName: '系统管理员',
      email: 'admin@example.com',
      role: 'ADMIN',
      department: 'IT部门',
    },
    {
      username: 'cashier1',
      password: password2,
      realName: '李出纳',
      email: 'cashier1@example.com',
      role: 'CASHIER',
      department: '财务部',
    },
    {
      username: 'fm1',
      password: password3,
      realName: '王经理',
      email: 'fm1@example.com',
      role: 'FINANCIAL_MANAGER',
      department: '财务部',
    },
    {
      username: 'cfo1',
      password: password4,
      realName: '张CFO',
      email: 'cfo1@example.com',
      role: 'CFO',
      department: '财务部',
    },
    {
      username: 'auditor1',
      password: password5,
      realName: '刘审计',
      email: 'auditor1@example.com',
      role: 'AUDITOR',
      department: '审计部',
    },
  ];

  const existingUsers = await prisma.user.findMany({
    where: { username: { in: users.map(u => u.username) } },
  });

  for (const user of users) {
    const existing = existingUsers.find(u => u.username === user.username);
    
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`✓ 创建用户: ${user.username} (${user.realName}) - ${user.role}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: user.password,
          realName: user.realName,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      });
      console.log(`✓ 更新用户: ${user.username} (${user.realName}) - ${user.role}`);
    }
  }

  const accounts = [
    {
      accountNumber: '6222021200001234567',
      accountName: '公司基本账户',
      bankName: '中国工商银行',
      bankCode: 'ICBC',
      accountType: 'BASIC',
      currency: 'CNY',
      initialBalance: 5000000,
      currentBalance: 5000000,
      availableBalance: 5000000,
      status: 'ACTIVE',
    },
    {
      accountNumber: '6222081200009876543',
      accountName: '公司一般账户',
      bankName: '中国建设银行',
      bankCode: 'CCB',
      accountType: 'GENERAL',
      currency: 'CNY',
      initialBalance: 2500000,
      currentBalance: 2500000,
      availableBalance: 2500000,
      status: 'ACTIVE',
    },
    {
      accountNumber: '6225881200004567890',
      accountName: '美元账户',
      bankName: '招商银行',
      bankCode: 'CMB',
      accountType: 'FOREIGN_CURRENCY',
      currency: 'USD',
      initialBalance: 100000,
      currentBalance: 100000,
      availableBalance: 100000,
      status: 'ACTIVE',
    },
  ];

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const createdById = adminUser?.id || 'system';

  const existingAccounts = await prisma.bankAccount.findMany({
    where: { accountNumber: { in: accounts.map(a => a.accountNumber) } },
  });

  for (const account of accounts) {
    const existing = existingAccounts.find(a => a.accountNumber === account.accountNumber);
    
    if (!existing) {
      const created = await prisma.bankAccount.create({
        data: {
          ...account,
          createdBy: createdById,
        },
      });
      console.log(`✓ 创建账户: ${account.accountName} (${account.accountNumber})`);

      await prisma.balanceHistory.create({
        data: {
          bankAccountId: created.id,
          balance: account.initialBalance,
          availableBalance: account.availableBalance,
          recordTime: new Date(),
          source: 'MANUAL_ADJUST',
          syncStatus: 'SUCCESS',
        },
      });
    } else {
      await prisma.bankAccount.update({
        where: { id: existing.id },
        data: {
          accountName: account.accountName,
          bankName: account.bankName,
          accountType: account.accountType,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          status: account.status,
        },
      });
      console.log(`✓ 更新账户: ${account.accountName} (${account.accountNumber})`);
    }
  }

  const basicAccount = await prisma.bankAccount.findFirst({
    where: { accountType: 'BASIC' },
  });

  const erpDocs = [
    {
      documentNumber: 'ERP-2026-001',
      erpNumber: 'INV-2026-001',
      documentType: 'INVOICE',
      bankAccountId: basicAccount?.id,
      amount: 150000,
      counterParty: '阿里巴巴集团有限公司',
      counterPartyAccount: '6222021200008888999',
      documentDate: new Date(Date.now() - 86400000 * 3),
      businessDate: new Date(Date.now() - 86400000 * 3),
      department: '销售部',
      reconcileStatus: 'PENDING',
    },
    {
      documentNumber: 'ERP-2026-002',
      erpNumber: 'PO-2026-002',
      documentType: 'PAYMENT_ORDER',
      bankAccountId: basicAccount?.id,
      amount: 85000,
      counterParty: '华为技术有限公司',
      counterPartyAccount: '6222081200007777888',
      documentDate: new Date(Date.now() - 86400000 * 5),
      businessDate: new Date(Date.now() - 86400000 * 5),
      department: '采购部',
      reconcileStatus: 'PENDING',
    },
    {
      documentNumber: 'ERP-2026-003',
      erpNumber: 'EXP-2026-003',
      documentType: 'EXPENSE_CLAIM',
      bankAccountId: basicAccount?.id,
      amount: 12500,
      counterParty: '张三',
      counterPartyAccount: '6225881200006666777',
      documentDate: new Date(Date.now() - 86400000 * 2),
      businessDate: new Date(Date.now() - 86400000 * 2),
      department: '市场部',
      reconcileStatus: 'PENDING',
    },
  ];

  const existingErpDocs = await prisma.erpDocument.findMany({
    where: { documentNumber: { in: erpDocs.map(d => d.documentNumber) } },
  });

  for (const doc of erpDocs) {
    const existing = existingErpDocs.find(d => d.documentNumber === doc.documentNumber);
    
    if (!existing) {
      await prisma.erpDocument.create({ data: doc });
      console.log(`✓ 创建ERP单据: ${doc.documentNumber}`);
    } else {
      console.log(`✓ ERP单据已存在: ${doc.documentNumber}`);
    }
  }

  console.log('\n========================================');
  console.log('  数据初始化完成!');
  console.log('========================================');
  console.log('\n默认账户信息:');
  console.log('  管理员: admin / Admin123456');
  console.log('  出纳: cashier1 / Cashier123');
  console.log('  财务经理: fm1 / Fm123456');
  console.log('  CFO: cfo1 / Cfo123456');
  console.log('  审计员: auditor1 / Auditor123');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
