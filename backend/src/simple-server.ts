import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { simpleStore, generateOrderNo, FUND_NAV } from './services/simple-store';

const app = express();
const PORT = 21224;
const JWT_SECRET = 'yuebao_jwt_secret_key_2024';
const BCRYPT_SALT_ROUNDS = 10;

interface AuthRequest extends express.Request {
  userId?: string;
}

app.use(cors({
  origin: ['http://localhost:11224', 'http://localhost:11225'],
  credentials: true,
}));

app.use(express.json());

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问', code: 401 });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效或已过期', code: 403 });
    }
    const payload = decoded as { userId: string };
    req.userId = payload.userId;
    next();
  });
};

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '余额宝理财服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

app.post(
  '/api/auth/register',
  [
    body('username').isLength({ min: 3, max: 50 }),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existingUser = await simpleStore.findUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ success: false, error: '用户名已存在' });
      }

      const passwordHash = await bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS);

      const user = await simpleStore.createUser({
        username: req.body.username,
        passwordHash,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            phone: user.phone,
            email: user.email,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

app.post(
  '/api/auth/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await simpleStore.findUserByUsername(req.body.username);
      if (!user) {
        return res.status(400).json({ success: false, error: '用户名或密码错误' });
      }

      const isPasswordValid = await bcrypt.compare(req.body.password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, error: '用户名或密码错误' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            phone: user.phone,
            email: user.email,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

app.get('/api/assets/overview', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const balance = await simpleStore.getAccountBalance(userId);
    const share = await simpleStore.getFundShare(userId);

    if (!balance || !share) {
      return res.status(404).json({ success: false, error: '用户资产信息不存在' });
    }

    const fundAvailableAmount = share.availableShares * share.nav;

    res.json({
      success: true,
      data: {
        accountBalance: {
          available: balance.available,
          frozen: balance.frozen,
          total: balance.available + balance.frozen,
        },
        fundShare: {
          totalShares: share.totalShares,
          availableShares: share.availableShares,
          frozenShares: share.frozenShares,
          nav: share.nav,
          totalAmount: share.totalShares * share.nav,
          availableAmount: fundAvailableAmount,
        },
        totalIncome: balance.totalIncome,
        totalAsset: balance.available + fundAvailableAmount,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/assets/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const transactions = await simpleStore.getTransactions(userId);

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/assets/transfer-in', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const transactions = await simpleStore.getTransferIn(userId);

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/assets/transfer-out', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const transactions = await simpleStore.getTransferOut(userId);

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/assets/purchase', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, fromAccount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: '购买金额必须大于0' });
    }

    const balance = await simpleStore.getAccountBalance(userId);
    if (!balance) {
      return res.status(404).json({ success: false, error: '用户账户不存在' });
    }

    if (fromAccount === 'BALANCE' && balance.available < amount) {
      return res.status(400).json({ success: false, error: '账户余额不足' });
    }

    if (fromAccount === 'BALANCE') {
      await simpleStore.updateAccountBalance(userId, -amount);
    }

    const shares = amount / FUND_NAV;
    await simpleStore.updateFundShare(userId, shares);

    const orderNo = generateOrderNo('PUR');

    await simpleStore.createOrder({
      userId,
      orderNo,
      type: 'PURCHASE',
      amount,
      shares,
      nav: FUND_NAV,
      status: 'SUCCESS',
    });

    await simpleStore.createTransaction({
      userId,
      orderNo,
      type: 'PURCHASE',
      channel: fromAccount === 'BALANCE' ? 'ACCOUNT_BALANCE' : undefined,
      amount,
      shares,
      nav: FUND_NAV,
      status: 'SUCCESS',
      description: `购买货币基金 ${amount} 元`,
    });

    res.json({
      success: true,
      data: {
        orderNo,
        amount,
        shares,
        nav: FUND_NAV,
        status: 'SUCCESS',
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/payments/info', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const orderAmount = parseFloat(req.query.orderAmount as string) || 0;

    const balance = await simpleStore.getAccountBalance(userId);
    const share = await simpleStore.getFundShare(userId);

    if (!balance || !share) {
      return res.status(404).json({ success: false, error: '用户资产信息不存在' });
    }

    const fundAvailableAmount = share.availableShares * share.nav;
    let maxUsableAmount = balance.available;
    if (fundAvailableAmount > 0) {
      maxUsableAmount = balance.available + fundAvailableAmount;
    }

    res.json({
      success: true,
      data: {
        orderAmount,
        accountBalance: {
          available: balance.available,
        },
        fundShare: {
          availableAmount: fundAvailableAmount,
          availableShares: share.availableShares,
          nav: share.nav,
        },
        maxUsableAmount,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/payments/execute', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { orderAmount, useFundShare, useAccountBalance, paymentPassword } = req.body;

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({ success: false, error: '订单金额必须大于0' });
    }

    if (!useFundShare && !useAccountBalance) {
      return res.status(400).json({ success: false, error: '至少选择一种支付方式' });
    }

    const balance = await simpleStore.getAccountBalance(userId);
    const share = await simpleStore.getFundShare(userId);

    if (!balance || !share) {
      return res.status(404).json({ success: false, error: '用户资产信息不存在' });
    }

    let remainingAmount = orderAmount;
    let fundSharesUsed = 0;
    let balanceUsed = 0;

    const fundAvailableAmount = share.availableShares * share.nav;

    if (useFundShare && fundAvailableAmount > 0) {
      if (fundAvailableAmount >= remainingAmount) {
        fundSharesUsed = remainingAmount / share.nav;
        remainingAmount = 0;
      } else {
        fundSharesUsed = share.availableShares;
        remainingAmount = remainingAmount - fundAvailableAmount;
      }
    }

    if (remainingAmount > 0 && useAccountBalance) {
      if (balance.available < remainingAmount) {
        return res.status(400).json({ success: false, error: '余额不足，无法完成支付' });
      }
      balanceUsed = remainingAmount;
      remainingAmount = 0;
    }

    if (remainingAmount > 0) {
      return res.status(400).json({ success: false, error: '余额不足，无法完成支付' });
    }

    if (fundSharesUsed > 0) {
      await simpleStore.updateFundShare(userId, -fundSharesUsed);
    }

    if (balanceUsed > 0) {
      await simpleStore.updateAccountBalance(userId, -balanceUsed);
    }

    const orderNo = generateOrderNo('PAY');

    await simpleStore.createOrder({
      userId,
      orderNo,
      type: 'PAYMENT',
      amount: orderAmount,
      shares: fundSharesUsed > 0 ? fundSharesUsed : undefined,
      nav: fundSharesUsed > 0 ? share.nav : undefined,
      status: 'SUCCESS',
    });

    if (fundSharesUsed > 0) {
      await simpleStore.createTransaction({
        userId,
        orderNo,
        type: 'PAYMENT',
        channel: 'FUND_SHARE',
        amount: fundSharesUsed * share.nav,
        shares: fundSharesUsed,
        nav: share.nav,
        status: 'SUCCESS',
        description: `货币基金支付 - 订单 ${orderNo}`,
      });
    }

    if (balanceUsed > 0) {
      await simpleStore.createTransaction({
        userId,
        orderNo,
        type: 'PAYMENT',
        channel: 'ACCOUNT_BALANCE',
        amount: balanceUsed,
        status: 'SUCCESS',
        description: `账户余额支付 - 订单 ${orderNo}`,
      });
    }

    res.json({
      success: true,
      data: {
        orderNo,
        amount: orderAmount,
        status: 'SUCCESS',
        fundSharesUsed,
        balanceUsed,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/redeems/limit-info', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const share = await simpleStore.getFundShare(userId);

    if (!share) {
      return res.status(404).json({ success: false, error: '用户基金份额信息不存在' });
    }

    const maxRedeemAmount = share.availableShares * share.nav;

    res.json({
      success: true,
      data: {
        maxRedeemAmount,
        maxSingleRedeem: 50000,
        maxDailyRedeem: 100000,
        maxMonthlyRedeem: 500000,
        todayUsed: 0,
        monthUsed: 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/redeems/instant', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: '赎回金额必须大于0' });
    }

    const share = await simpleStore.getFundShare(userId);
    if (!share) {
      return res.status(404).json({ success: false, error: '用户基金份额信息不存在' });
    }

    const availableAmount = share.availableShares * share.nav;
    if (availableAmount < amount) {
      return res.status(400).json({ success: false, error: '基金份额不足' });
    }

    const shares = amount / share.nav;

    await simpleStore.updateFundShare(userId, -shares);
    await simpleStore.updateAccountBalance(userId, amount);

    const orderNo = generateOrderNo('RED');

    await simpleStore.createOrder({
      userId,
      orderNo,
      type: 'REDEEM',
      amount,
      shares,
      nav: share.nav,
      status: 'SUCCESS',
    });

    await simpleStore.createTransaction({
      userId,
      orderNo,
      type: 'REDEEM',
      channel: 'FUND_SHARE',
      amount,
      shares,
      nav: share.nav,
      status: 'SUCCESS',
      description: `实时赎回 ${amount} 元到账户余额`,
    });

    res.json({
      success: true,
      data: {
        orderNo,
        amount,
        shares,
        nav: share.nav,
        status: 'SUCCESS',
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`==============================`);
  console.log(`  余额宝理财服务已启动`);
  console.log(`  后端地址: http://localhost:${PORT}`);
  console.log(`  端口: ${PORT}`);
  console.log(`==============================`);
});
