const db = require('../database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const ledgerKernel = require('../engines/ledgerKernel');

class UserService {
  async register(username, password, phone, email) {
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR phone = ?',
      [username, phone]
    );

    if (existingUser) {
      throw new Error('用户名或手机号已存在');
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.run(
      `INSERT INTO users (
        id, username, password_hash, phone, email, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, username, passwordHash, phone, email]
    );

    return {
      userId,
      username,
      status: 'pending',
      message: '注册成功，请完成实名激活'
    };
  }

  async login(username, password) {
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new Error('用户名或密码错误');
    }

    return {
      userId: user.id,
      username: user.username,
      realName: user.real_name,
      status: user.status,
      phone: user.phone
    };
  }

  async activateRealName(userId, realName, idCard, bankCardNumber, bankName) {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.status === 'active') {
      throw new Error('用户已完成实名激活');
    }

    await db.run(
      `UPDATE users 
       SET real_name = ?, id_card = ?, bank_card_number = ?, bank_name = ?, 
           status = 'active', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [realName, idCard, bankCardNumber, bankName, userId]
    );

    const accountId = uuidv4();
    const accountNumber = this.generateAccountNumber();

    await db.run(
      `INSERT INTO accounts (
        id, user_id, account_number, account_type, balance, frozen_balance, 
        currency, status, daily_limit
      ) VALUES (?, ?, ?, 'personal', 0, 0, 'CNY', 'active', ?)`,
      [accountId, userId, accountNumber, process.env.DAILY_LIMIT_USER || 100000]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'real_name_activation',
        `实名激活完成: ${realName}, 身份证: ${idCard.substring(0, 6)}****, 银行卡: ${bankCardNumber.substring(0, 4)}****`
      ]
    );

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const account = await db.get('SELECT * FROM accounts WHERE user_id = ?', [userId]);

    return {
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        realName: updatedUser.real_name,
        status: updatedUser.status
      },
      account: {
        id: account.id,
        accountNumber: account.account_number,
        balance: account.balance,
        status: account.status
      },
      message: '实名激活成功，虚拟账户已下发'
    };
  }

  async getUserInfo(userId) {
    const user = await db.get(
      `SELECT id, username, real_name, phone, email, status, bank_name, 
              substr(bank_card_number, 1, 4) || '****' || substr(bank_card_number, -4) as bank_card_number
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new Error('用户不存在');
    }

    const account = await db.get(
      'SELECT * FROM accounts WHERE user_id = ?',
      [userId]
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        phone: user.phone,
        email: user.email,
        status: user.status,
        bankName: user.bank_name,
        bankCardNumber: user.bank_card_number
      },
      account: account ? {
        id: account.id,
        accountNumber: account.account_number,
        balance: account.balance,
        frozenBalance: account.frozen_balance,
        currency: account.currency,
        status: account.status,
        dailyLimit: account.daily_limit
      } : null
    };
  }

  async getAccountTransactions(userId, limit = 20) {
    const account = await db.get('SELECT id FROM accounts WHERE user_id = ?', [userId]);
    if (!account) {
      return [];
    }
    return await ledgerKernel.getAccountTransactions(account.id, limit);
  }

  async recharge(userId, amount) {
    if (amount <= 0) {
      throw new Error('充值金额必须大于0');
    }

    const account = await db.get('SELECT * FROM accounts WHERE user_id = ?', [userId]);
    if (!account) {
      throw new Error('用户账户不存在');
    }

    const user = await db.get('SELECT status FROM users WHERE id = ?', [userId]);
    if (user.status !== 'active') {
      throw new Error('用户未完成实名激活，无法充值');
    }

    const newBalance = account.balance + amount;

    await db.run(
      'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, account.id]
    );

    const transactionId = uuidv4();
    const transactionNo = this.generateTransactionNo();

    await db.run(
      `INSERT INTO transactions (
        id, transaction_no, to_account_id, amount, transaction_type, status, description
      ) VALUES (?, ?, ?, ?, 'recharge', 'completed', ?)`,
      [transactionId, transactionNo, account.id, amount, `充值 ${amount} 元`]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'recharge',
        `账户充值: ${amount} 元`
      ]
    );

    return {
      success: true,
      transactionId,
      transactionNo,
      amount,
      newBalance,
      message: '充值成功'
    };
  }

  async freezeAccount(userId, reason) {
    const account = await db.get('SELECT id FROM accounts WHERE user_id = ?', [userId]);
    if (!account) {
      throw new Error('用户账户不存在');
    }

    await db.run(
      `UPDATE accounts 
       SET status = 'frozen', updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [userId]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'account_freeze',
        `账户冻结: ${reason}`
      ]
    );

    return {
      success: true,
      message: '账户已冻结'
    };
  }

  async unfreezeAccount(userId) {
    await db.run(
      `UPDATE accounts 
       SET status = 'active', updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [userId]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'account_unfreeze',
        '账户解冻'
      ]
    );

    return {
      success: true,
      message: '账户已解冻'
    };
  }

  generateAccountNumber() {
    const prefix = '8888';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return prefix + timestamp + random;
  }

  generateTransactionNo() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');
    const timeStr = now.getHours().toString().padStart(2, '0') +
                   now.getMinutes().toString().padStart(2, '0') +
                   now.getSeconds().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${dateStr}${timeStr}${randomStr}`;
  }
}

module.exports = new UserService();
