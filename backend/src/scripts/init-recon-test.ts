import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('正在创建对账测试数据...\n');

  const basicAccount = await prisma.bankAccount.findFirst({
    where: { accountType: 'BASIC' },
  });

  if (!basicAccount) {
    console.log('未找到账户，请先初始化账户数据');
    return;
  }

  console.log('使用账户:', basicAccount.accountName);

  console.log('\n--- 删除旧的测试数据 ---');
  await prisma.reconciliationItem.deleteMany({});
  await prisma.exceptionReport.deleteMany({});
  await prisma.reconciliation.deleteMany({});
  await prisma.transaction.deleteMany({ where: { transactionRef: { startsWith: 'TEST-' } } });
  console.log('✓ 旧数据已清理');

  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2);
  const threeDaysAgo = new Date(Date.now() - 86400000 * 3);

  console.log('\n--- 创建匹配的交易和ERP单据 ---');

  const match1Amount = 150000;
  const match1CounterParty = '阿里巴巴集团有限公司';
  const match1Account = '6222021200008888999';

  await prisma.transaction.create({
    data: {
      bankAccountId: basicAccount.id,
      transactionDate: yesterday,
      transactionRef: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      counterParty: match1CounterParty,
      counterPartyAccount: match1Account,
      amount: match1Amount,
      transactionType: 'CREDIT',
      purpose: '销售回款',
      isReconciled: false,
    },
  });

  await prisma.erpDocument.create({
    data: {
      documentNumber: `ERP-TEST-MATCH-001`,
      erpNumber: 'INV-2026-TEST-001',
      documentType: 'INVOICE',
      bankAccountId: basicAccount.id,
      amount: match1Amount,
      counterParty: match1CounterParty,
      counterPartyAccount: match1Account,
      documentDate: yesterday,
      businessDate: yesterday,
      department: '销售部',
      reconcileStatus: 'PENDING',
      isReconciled: false,
    },
  });

  console.log('✓ 匹配数据1已创建 (阿里巴巴, ¥150,000)');

  const match2Amount = 85000;
  const match2CounterParty = '华为技术有限公司';
  const match2Account = '6222081200007777888';

  await prisma.transaction.create({
    data: {
      bankAccountId: basicAccount.id,
      transactionDate: twoDaysAgo,
      transactionRef: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      counterParty: match2CounterParty,
      counterPartyAccount: match2Account,
      amount: -match2Amount,
      transactionType: 'DEBIT',
      purpose: '采购付款',
      isReconciled: false,
    },
  });

  await prisma.erpDocument.create({
    data: {
      documentNumber: `ERP-TEST-MATCH-002`,
      erpNumber: 'PO-2026-TEST-002',
      documentType: 'PAYMENT_ORDER',
      bankAccountId: basicAccount.id,
      amount: match2Amount,
      counterParty: match2CounterParty,
      counterPartyAccount: match2Account,
      documentDate: twoDaysAgo,
      businessDate: twoDaysAgo,
      department: '采购部',
      reconcileStatus: 'PENDING',
      isReconciled: false,
    },
  });

  console.log('✓ 匹配数据2已创建 (华为, ¥85,000)');

  console.log('\n--- 创建未匹配的交易 ---');

  await prisma.transaction.create({
    data: {
      bankAccountId: basicAccount.id,
      transactionDate: yesterday,
      transactionRef: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      counterParty: '腾讯科技有限公司',
      counterPartyAccount: '6222021200005555666',
      amount: 280000,
      transactionType: 'CREDIT',
      purpose: '技术服务费',
      isReconciled: false,
    },
  });

  await prisma.transaction.create({
    data: {
      bankAccountId: basicAccount.id,
      transactionDate: threeDaysAgo,
      transactionRef: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      counterParty: '京东集团',
      counterPartyAccount: '6222081200003333444',
      amount: -45000,
      transactionType: 'DEBIT',
      purpose: '办公用品采购',
      isReconciled: false,
    },
  });

  console.log('✓ 未匹配交易已创建 (腾讯 ¥280,000, 京东 ¥45,000)');

  console.log('\n--- 创建未匹配的ERP单据 ---');

  await prisma.erpDocument.create({
    data: {
      documentNumber: `ERP-TEST-UNMATCH-001`,
      erpNumber: 'INV-2026-TEST-003',
      documentType: 'INVOICE',
      bankAccountId: basicAccount.id,
      amount: 125000,
      counterParty: '美团有限公司',
      counterPartyAccount: '6222021200001111222',
      documentDate: yesterday,
      businessDate: yesterday,
      department: '销售部',
      reconcileStatus: 'PENDING',
      isReconciled: false,
    },
  });

  console.log('✓ 未匹配ERP单据已创建 (美团 ¥125,000)');

  console.log('\n--- 创建异常交易 (大额交易) ---');

  await prisma.transaction.create({
    data: {
      bankAccountId: basicAccount.id,
      transactionDate: today,
      transactionRef: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      counterParty: '异常测试公司',
      counterPartyAccount: '9999999999999999999',
      amount: 5000000,
      transactionType: 'CREDIT',
      purpose: '大额异常交易测试',
      isReconciled: false,
    },
  });

  console.log('✓ 异常交易已创建 (大额 ¥5,000,000 - 将被标记为异常)');

  console.log('\n========================================');
  console.log('  对账测试数据创建完成!');
  console.log('========================================');
  console.log('\n测试数据摘要:');
  console.log('  ✓ 匹配交易与ERP: 2组 (阿里巴巴 ¥150,000, 华为 ¥85,000)');
  console.log('  ✓ 未匹配交易: 2笔 (腾讯 ¥280,000, 京东 ¥45,000)');
  console.log('  ✓ 未匹配ERP: 1笔 (美团 ¥125,000)');
  console.log('  ✓ 异常交易: 1笔 (大额 ¥5,000,000)');
  console.log('');
  console.log('现在可以:');
  console.log('  1. 登录系统后点击"同步所有账户"');
  console.log('  2. 点击"执行对账"选择账户');
  console.log('  3. 查看对账结果和异常项');
  console.log('  4. 异常项将显示在对账管理页面');
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
