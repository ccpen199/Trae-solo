import { db } from '../database';
import { generateId, encrypt, decrypt, now } from '../utils';

class CardPoolService {
  addCards(
    productId: string,
    supplierId: string,
    cards: { cardNumber: string; cardPassword: string; expireTime?: number }[],
    batchNo?: string
  ): { success: number; failed: number } {
    const batch = batchNo || `BATCH${Date.now()}`;
    let success = 0;
    let failed = 0;

    const tx = db.transaction((cardsToAdd: typeof cards) => {
      for (const card of cardsToAdd) {
        try {
          const id = generateId();
          const encNumber = encrypt(card.cardNumber);
          const encPassword = encrypt(card.cardPassword);
          db.prepare(`
            INSERT INTO card_pool (id, product_id, supplier_id, card_number, card_password,
              encrypted_card, encrypted_password, batch_no, status, expire_time, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
          `).run(id, productId, supplierId, '***', '***', encNumber, encPassword, batch, card.expireTime || null, now());
          success++;
        } catch {
          failed++;
        }
      }
      db.prepare('UPDATE products SET stock = (SELECT COUNT(*) FROM card_pool WHERE product_id = ? AND status = ?), updated_at = ? WHERE id = ?')
        .run(productId, 'available', now(), productId);
    });

    try {
      tx(cards);
    } catch {
    }

    return { success, failed };
  }

  consumeCard(orderId: string, productId: string, supplierId?: string): {
    cardNumber: string;
    cardPassword: string;
    cardId: string;
  } | null {
    const sql = supplierId
      ? 'SELECT * FROM card_pool WHERE product_id = ? AND supplier_id = ? AND status = ? ORDER BY RANDOM() LIMIT 1'
      : 'SELECT * FROM card_pool WHERE product_id = ? AND status = ? ORDER BY RANDOM() LIMIT 1';

    const params = supplierId ? [productId, supplierId, 'available'] : [productId, 'available'];
    const card: any = db.prepare(sql).get(...params);

    if (!card) return null;

    const tx = db.transaction(() => {
      const result = db.prepare('UPDATE card_pool SET status = ?, order_id = ?, used_at = ? WHERE id = ? AND status = ?')
        .run('used', orderId, now(), card.id, 'available');
      if (result.changes === 0) throw new Error('卡密已被占用');

      db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(productId);
    });

    try {
      tx();
      return {
        cardId: card.id,
        cardNumber: decrypt(card.encrypted_card),
        cardPassword: decrypt(card.encrypted_password)
      };
    } catch {
      return this.consumeCard(orderId, productId, supplierId);
    }
  }

  decryptCard(cardId: string): { cardNumber: string; cardPassword: string } | null {
    const card: any = db.prepare('SELECT encrypted_card, encrypted_password FROM card_pool WHERE id = ?').get(cardId);
    if (!card) return null;
    return {
      cardNumber: decrypt(card.encrypted_card),
      cardPassword: decrypt(card.encrypted_password)
    };
  }

  getBatchInventory(batchNo: string): { total: number; available: number; used: number; expired: number } {
    const rows: any[] = db.prepare('SELECT status, COUNT(*) as cnt FROM card_pool WHERE batch_no = ? GROUP BY status').all(batchNo);
    const result = { total: 0, available: 0, used: 0, expired: 0 };
    rows.forEach(r => {
      result.total += r.cnt;
      if (r.status === 'available') result.available += r.cnt;
      else if (r.status === 'used') result.used += r.cnt;
      else if (r.status === 'expired') result.expired += r.cnt;
    });
    return result;
  }

  listCardsByProduct(productId: string, status?: string, page: number = 1, pageSize: number = 50): any[] {
    const offset = (page - 1) * pageSize;
    const sql = status
      ? 'SELECT id, product_id, supplier_id, batch_no, status, expire_time, created_at, used_at, order_id FROM card_pool WHERE product_id = ? AND status = ? LIMIT ? OFFSET ?'
      : 'SELECT id, product_id, supplier_id, batch_no, status, expire_time, created_at, used_at, order_id FROM card_pool WHERE product_id = ? LIMIT ? OFFSET ?';
    return status
      ? db.prepare(sql).all(productId, status, pageSize, offset)
      : db.prepare(sql).all(productId, pageSize, offset);
  }

  expireCards() {
    const t = now();
    const result = db.prepare(`
      UPDATE card_pool SET status = 'expired'
      WHERE status = 'available' AND expire_time IS NOT NULL AND expire_time <= ?
    `).run(t);

    db.prepare(`
      UPDATE products p SET stock = (
        SELECT COUNT(*) FROM card_pool c WHERE c.product_id = p.id AND c.status = 'available'
      ), updated_at = ?
    `).run(t);

    return result.changes;
  }

  getProductInventory(productId: string): { total: number; available: number } {
    const total: any = db.prepare('SELECT COUNT(*) as cnt FROM card_pool WHERE product_id = ?').get(productId);
    const available: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE product_id = ? AND status = 'available'").get(productId);
    return { total: total.cnt, available: available.cnt };
  }
}

export const cardPoolService = new CardPoolService();
