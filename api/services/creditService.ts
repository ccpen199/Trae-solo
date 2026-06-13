import db from '../db/index.js'

export const creditService = {
  async checkCredit(userId: number) {
    const user = db.prepare('SELECT credit_score, zhima_user_id FROM users WHERE id = ?').get(userId) as any
    if (!user) throw new Error('用户不存在')

    const eligible = user.creditScore >= 600
    return {
      eligible,
      creditScore: user.creditScore,
      maxAmount: eligible ? user.creditScore * 10 : 0,
      zhimaBound: !!user.zhimaUserId,
    }
  },

  async deductCredit(userId: number, orderId: number, amount: number) {
    const check = await this.checkCredit(userId)
    if (!check.eligible) throw new Error('信用额度不足')

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order || order.paymentStatus !== 'credit_held') throw new Error('订单状态异常')

    db.prepare('UPDATE orders SET payment_status = ?, credit_deducted_at = datetime("now") WHERE id = ?').run('paid', orderId)
    db.prepare('UPDATE users SET credit_score = credit_score + 5 WHERE id = ?').run(userId)

    return { success: true, deductedAt: new Date().toISOString() }
  },

  async bindZhima(userId: number, authCode: string) {
    if (!authCode || authCode.length < 8) throw new Error('授权码无效')

    const zhimaUserId = 'ZM' + Math.random().toString(36).slice(2, 10).toUpperCase()
    db.prepare('UPDATE users SET zhima_user_id = ?, credit_score = credit_score + 50 WHERE id = ?').run(zhimaUserId, userId)

    return { success: true, zhimaUserId, newCreditScore: (db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as any).credit_score }
  },
}
