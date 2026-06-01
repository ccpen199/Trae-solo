import { Router, Response } from 'express';
import { getOne, getAll, runQuery } from '../database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const aiReplies = [
  '好的，我已经记下来了～',
  '这笔钱花得值吗？',
  '记得要节约哦～',
  '哇，又有收入啦！💰',
  '记账小能手，继续保持！',
  '我会帮你好好管理财务的',
  '今天的消费还可以，加油！',
  '收到，这就帮你记上 ✅',
];

router.get('/contacts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await getAll('SELECT * FROM contacts WHERE user_id = ? ORDER BY is_default DESC, id', [req.user!.id]);
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contact_id, page = 1, page_size = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(page_size);

    let sql = `
      SELECT cm.*, ct.name as contact_name, t.amount, t.type as transaction_type, c.name as category_name
      FROM chat_messages cm
      LEFT JOIN contacts ct ON cm.contact_id = ct.id
      LEFT JOIN transactions t ON cm.transaction_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE cm.user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (contact_id) {
      sql += ' AND cm.contact_id = ?';
      params.push(contact_id);
    }

    sql += ' ORDER BY cm.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), offset);

    const messages = await getAll(sql, params);
    res.json({ success: true, data: messages.reverse() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/message', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contact_id, content, message_type = 'text' } = req.body;

    if (!content) {
      res.status(400).json({ success: false, message: '消息内容不能为空' });
      return;
    }

    const defaultContact = await getOne('SELECT id FROM contacts WHERE user_id = ? AND is_default = 1', [req.user!.id]);
    const targetContactId = contact_id || defaultContact?.id;

    await runQuery(
      `INSERT INTO chat_messages (user_id, contact_id, sender_type, content, message_type)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user!.id, targetContactId || null, 'user', content, message_type]
    );

    const aiReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
    
    const aiResult = await runQuery(
      `INSERT INTO chat_messages (user_id, contact_id, sender_type, content, message_type)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user!.id, targetContactId || null, 'contact', aiReply, 'text']
    );

    const aiMessage = await getOne('SELECT * FROM chat_messages WHERE id = ?', [aiResult.lastID]);

    res.json({ success: true, data: aiMessage });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/transaction-message', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { transaction_id, contact_id } = req.body;

    if (!transaction_id) {
      res.status(400).json({ success: false, message: '缺少交易ID' });
      return;
    }

    const transaction = await getOne(
      `SELECT t.*, c.name as category_name, c.icon as category_icon 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.id = ? AND t.user_id = ?`,
      [transaction_id, req.user!.id]
    );

    if (!transaction) {
      res.status(404).json({ success: false, message: '交易不存在' });
      return;
    }

    const typeText = transaction.type === 'income' ? '收入' : '支出';
    const messageContent = `${transaction.category_icon} ${typeText} ¥${transaction.amount} - ${transaction.category_name}`;

    await runQuery(
      `INSERT INTO chat_messages (user_id, contact_id, sender_type, content, message_type, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user!.id, contact_id || null, 'user', messageContent, 'transaction', transaction_id]
    );

    const aiRepliesForTransaction = [
      `好嘞，这笔${transaction.amount}元我已经记下了！`,
      `收到～${transaction.category_name}花费${transaction.amount}元`,
      `记账成功！今天也要好好理财哦 💰`,
      `${transaction.amount}元已入账，继续保持记账习惯！`,
    ];

    const aiReply = aiRepliesForTransaction[Math.floor(Math.random() * aiRepliesForTransaction.length)];
    
    const aiResult = await runQuery(
      `INSERT INTO chat_messages (user_id, contact_id, sender_type, content, message_type)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user!.id, contact_id || null, 'contact', aiReply, 'text']
    );

    const aiMessage = await getOne('SELECT * FROM chat_messages WHERE id = ?', [aiResult.lastID]);

    res.json({ success: true, data: aiMessage });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/message/:id/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_favorited } = req.body;

    await runQuery(
      'UPDATE chat_messages SET is_favorited = ? WHERE id = ? AND user_id = ?',
      [is_favorited ? 1 : 0, id, req.user!.id]
    );

    res.json({ success: true, message: is_favorited ? '已收藏' : '已取消收藏' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;