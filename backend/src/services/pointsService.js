const prisma = require('../config/database');

// 积分服务 - 核心功能：扣减、查询、记录

// 获取用户积分账户
const getAccount = async (userId) => {
  let account = await prisma.pointsAccount.findUnique({
    where: { userId },
  });
  
  // 如果账户不存在，创建一个
  if (!account) {
    account = await prisma.pointsAccount.create({
      data: {
        userId,
        balance: 0,
      },
    });
  }
  
  return account;
};

// 查询积分余额
const getBalance = async (userId) => {
  const account = await getAccount(userId);
  return account.balance;
};

// 检查积分是否足够
const checkBalance = async (userId, amount) => {
  const balance = await getBalance(userId);
  return balance >= amount;
};

// 扣减积分
const deductPoints = async (userId, amount, description, referenceId, referenceType) => {
  return prisma.$transaction(async (tx) => {
    const account = await tx.pointsAccount.findUnique({
      where: { userId },
    });
    
    if (!account) {
      throw new Error('积分账户不存在');
    }
    
    if (account.balance < amount) {
      throw new Error('积分不足');
    }
    
    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - amount;
    
    // 更新账户余额
    const updatedAccount = await tx.pointsAccount.update({
      where: { userId },
      data: { balance: balanceAfter },
    });
    
    // 创建交易记录
    await tx.pointsTransaction.create({
      data: {
        accountId: account.id,
        type: 'SPEND',
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceId,
        referenceType,
      },
    });
    
    return {
      balance: balanceAfter,
      deducted: amount,
    };
  });
};

// 增加积分
const addPoints = async (userId, amount, description, referenceId, referenceType) => {
  return prisma.$transaction(async (tx) => {
    let account = await tx.pointsAccount.findUnique({
      where: { userId },
    });
    
    if (!account) {
      account = await tx.pointsAccount.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }
    
    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + amount;
    
    // 更新账户余额
    const updatedAccount = await tx.pointsAccount.update({
      where: { userId },
      data: { balance: balanceAfter },
    });
    
    // 创建交易记录
    await tx.pointsTransaction.create({
      data: {
        accountId: account.id,
        type: 'EARN',
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceId,
        referenceType,
      },
    });
    
    return {
      balance: balanceAfter,
      added: amount,
    };
  });
};

// 获取积分交易记录
const getTransactions = async (userId, page = 1, pageSize = 20) => {
  const account = await prisma.pointsAccount.findUnique({
    where: { userId },
  });
  
  if (!account) {
    return {
      list: [],
      total: 0,
      page,
      pageSize,
    };
  }
  
  const skip = (page - 1) * pageSize;
  
  const [transactions, total] = await Promise.all([
    prisma.pointsTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.pointsTransaction.count({
      where: { accountId: account.id },
    }),
  ]);
  
  return {
    list: transactions,
    total,
    page,
    pageSize,
  };
};

module.exports = {
  getAccount,
  getBalance,
  checkBalance,
  deductPoints,
  addPoints,
  getTransactions,
};
