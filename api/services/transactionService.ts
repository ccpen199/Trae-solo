/**
 * Transaction service - includes 50% discount commission engine
 */
import db from '../db.js';

const DEFAULT_NODES = [
  '签订买卖合同',
  '支付意向金',
  '资金监管账户存入首付',
  '银行贷款审批',
  '网签备案',
  '缴税过户',
  '领取不动产证',
  '资金划转业主',
  '物业交接'
];

export function calcCommission(price: number, isDiscounted = true) {
  const rateSetting = db.prepare("SELECT value FROM settings WHERE key = 'commission_rate_sale'").get() as any;
  const discountSetting = db.prepare("SELECT value FROM settings WHERE key = 'commission_discount'").get() as any;
  const baseRate = rateSetting ? parseFloat(rateSetting.value) : 0.025;
  const discount = discountSetting ? parseFloat(discountSetting.value) : 0.5;
  const finalRate = isDiscounted ? baseRate * discount : baseRate;
  const amount = Math.round(price * finalRate);
  return {
    baseRate,
    discount: isDiscounted ? discount : 1,
    finalRate,
    price,
    originalCommission: Math.round(price * baseRate),
    commissionAmount: amount,
    saved: isDiscounted ? Math.round(price * baseRate * (1 - discount)) : 0
  };
}

export function listTransactions(status: string | undefined, page = 1, limit = 20) {
  const where = status ? 'WHERE t.status = ?' : '';
  const args: any[] = [];
  if (status) args.push(status);
  const count = (db.prepare(`SELECT COUNT(*) as c FROM transactions t ${where}`).get(...args) as any).c;
  const offset = (page - 1) * limit;
  const list = db.prepare(`
    SELECT t.*,
           p.name as property_name,
           p.address as property_address,
           b.name as buyer_name,
           s.name as seller_name,
           a.name as agent_name,
           (SELECT COUNT(*) FROM transfer_nodes tn WHERE tn.transaction_id = t.id AND tn.status = 'completed') as nodes_completed,
           (SELECT COUNT(*) FROM transfer_nodes tn WHERE tn.transaction_id = t.id) as nodes_total,
           (SELECT node_name FROM transfer_nodes tn WHERE tn.transaction_id = t.id AND tn.status = 'processing' ORDER BY sort_order LIMIT 1) as current_node
    FROM transactions t
    LEFT JOIN properties p ON t.property_id = p.id
    LEFT JOIN users b ON t.buyer_id = b.id
    LEFT JOIN users s ON t.seller_id = s.id
    LEFT JOIN users a ON t.agent_id = a.id
    ${where}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);
  return { list, total: count, page, limit };
}

export function getTransactionDetail(id: number) {
  const transaction = db.prepare(`
    SELECT t.*,
           p.name as property_name, p.address as property_address, p.area as property_area,
           b.name as buyer_name, b.phone as buyer_phone,
           s.name as seller_name, s.phone as seller_phone,
           a.name as agent_name, a.phone as agent_phone
    FROM transactions t
    LEFT JOIN properties p ON t.property_id = p.id
    LEFT JOIN users b ON t.buyer_id = b.id
    LEFT JOIN users s ON t.seller_id = s.id
    LEFT JOIN users a ON t.agent_id = a.id
    WHERE t.id = ?
  `).get(id) as any;
  if (!transaction) return null;
  const nodes = db.prepare(`SELECT * FROM transfer_nodes WHERE transaction_id = ? ORDER BY sort_order`).all(id);
  return { transaction, nodes, fundAccount: { accountNo: '95599******8821', bank: '中国工商银行', amount: transaction.price } };
}

export function createTransaction(data: any) {
  const price = data.price;
  const commission = calcCommission(price, true);
  const info = db.prepare(`
    INSERT INTO transactions (property_id, buyer_id, seller_id, agent_id, price, commission_rate, commission_amount, fund_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'negotiating')
  `).run(data.propertyId, data.buyerId, data.sellerId, data.agentId, price, commission.finalRate, commission.commissionAmount);
  const txId = Number(info.lastInsertRowid);
  const insertNode = db.prepare(`INSERT INTO transfer_nodes (transaction_id, node_name, status, sort_order) VALUES (?, ?, 'pending', ?)`);
  DEFAULT_NODES.forEach((name, idx) => {
    insertNode.run(txId, name, idx + 1);
  });
  return { id: txId, commission };
}

export function updateNodeStatus(transactionId: number, nodeId: number, status: string) {
  const node = db.prepare('SELECT * FROM transfer_nodes WHERE id = ? AND transaction_id = ?').get(nodeId, transactionId);
  if (!node) throw new Error('节点不存在');
  const completedAt = status === 'completed' ? new Date().toISOString().slice(0, 19) : null;
  db.prepare('UPDATE transfer_nodes SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, nodeId);

  const allNodes = db.prepare('SELECT * FROM transfer_nodes WHERE transaction_id = ? ORDER BY sort_order').all(transactionId) as any[];
  const allCompleted = allNodes.every(n => n.status === 'completed');
  if (allCompleted) {
    db.prepare(`UPDATE transactions SET status = 'completed', fund_status = 'released', updated_at = datetime('now') WHERE id = ?`).run(transactionId);
    db.prepare(`UPDATE properties SET status = 'sold', updated_at = datetime('now') WHERE id = (SELECT property_id FROM transactions WHERE id = ?)`).run(transactionId);
  } else if (allNodes.some(n => n.status === 'processing')) {
    db.prepare(`UPDATE transactions SET status = 'transferring', updated_at = datetime('now') WHERE id = ?`).run(transactionId);
  }
  return { updated: true };
}
