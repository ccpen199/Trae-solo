import { Router } from 'express';
import db from '../db.js';

const router = Router();

const exceptionPatterns = [
  { type: '滞留', keywords: ['滞留', '未移动', '长时间未更新'], suggestion: '建议联系快递公司客服确认情况' },
  { type: '破损', keywords: ['破损', '损坏', '包装异常'], suggestion: '请在签收前拍照留证，并联系快递公司索赔' },
  { type: '丢失', keywords: ['丢失', '找不到', '未找到'], suggestion: '请立即联系快递公司进行查找，超过30天可申请理赔' },
  { type: '延误', keywords: ['延误', '超时', '延迟'], suggestion: '受天气或节假日影响，建议耐心等待' },
  { type: '拒收', keywords: ['拒收', '退回', '退回寄件人'], suggestion: '请确认收件人是否正常签收' }
];

function analyzeException(status, description) {
  for (const pattern of exceptionPatterns) {
    for (const keyword of pattern.keywords) {
      if (status.includes(keyword) || (description && description.includes(keyword))) {
        return {
          exception_type: pattern.type,
          cause: `${pattern.type}可能原因分析`,
          suggestion: pattern.suggestion
        };
      }
    }
  }

  return {
    exception_type: '其他',
    cause: '系统无法自动归因，请联系客服处理',
    suggestion: '建议拨打快递公司客服热线进行咨询'
  };
}

router.get('/order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    const exceptions = db.prepare('SELECT * FROM exception_log WHERE order_id = ? ORDER BY created_at DESC').all(orderId);
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auto-analyze', (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: '订单ID不能为空' });
    }

    const order = db.prepare('SELECT * FROM express_order WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const latestNode = db.prepare('SELECT * FROM tracking_node WHERE order_id = ? ORDER BY timestamp DESC LIMIT 1').get(order_id);

    let analysis = {
      order_id,
      status: order.status,
      last_update: latestNode ? latestNode.timestamp : order.updated_at
    };

    if (order.status === 'exception' || (latestNode && latestNode.status.includes('异常'))) {
      analysis = {
        ...analysis,
        ...analyzeException(latestNode?.status || '', latestNode?.description || '')
      };
    } else {
      analysis = {
        ...analysis,
        exception_type: '无异常',
        cause: '当前物流状态正常',
        suggestion: '无需处理'
      };
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { order_id, exception_type, cause, suggestion } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: '订单ID不能为空' });
    }

    const stmt = db.prepare(`
      INSERT INTO exception_log (order_id, exception_type, cause, suggestion, handling_status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(order_id, exception_type || '其他', cause || '', suggestion || '', 'pending');

    db.prepare('UPDATE express_order SET status = ? WHERE id = ?').run('exception', order_id);

    const log = db.prepare('SELECT * FROM exception_log WHERE id = ?').get(result.lastInsertRowid);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { handling_status } = req.body;

    const exception = db.prepare('SELECT * FROM exception_log WHERE id = ?').get(id);
    if (!exception) {
      return res.status(404).json({ error: '异常记录不存在' });
    }

    const stmt = db.prepare('UPDATE exception_log SET handling_status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(handling_status || 'resolved', id);

    if (handling_status === 'resolved') {
      db.prepare("UPDATE express_order SET status = 'transit' WHERE id = ?").run(exception.order_id);
    }

    const updated = db.prepare('SELECT * FROM exception_log WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
