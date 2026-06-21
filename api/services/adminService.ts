import db from '../db/index.js'

export interface DashboardStats {
  totalUsers: number
  totalExperts: number
  totalArtworks: number
  totalOrders: number
  totalCertificates: number
  totalRevenue: number
  pendingExperts: number
  pendingOrders: number
  pendingDisputes: number
  usersGrowth: { date: string; count: number }[]
  ordersGrowth: { date: string; count: number }[]
  revenueGrowth: { date: string; amount: number }[]
  categoryDistribution: { category: string; count: number }[]
  recentOrders: any[]
  recentUsers: any[]
}

export function getDashboardStats(): DashboardStats {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  const totalExperts = (db.prepare("SELECT COUNT(*) as count FROM experts WHERE status = 'approved'").get() as { count: number }).count
  const totalArtworks = (db.prepare("SELECT COUNT(*) as count FROM artworks WHERE status = 'published'").get() as { count: number }).count
  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM appraisal_orders').get() as { count: number }).count
  const totalCertificates = (db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'active'").get() as { count: number }).count
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM appraisal_orders WHERE status = 'completed'").get() as { total: number }).total
  const pendingExperts = (db.prepare("SELECT COUNT(*) as count FROM experts WHERE status = 'pending'").get() as { count: number }).count
  const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM appraisal_orders WHERE status = 'pending' OR status = 'in_progress'").get() as { count: number }).count
  const pendingDisputes = (db.prepare("SELECT COUNT(*) as count FROM disputes WHERE status = 'pending'").get() as { count: number }).count

  const now = Date.now()
  const usersGrowth: { date: string; count: number }[] = []
  const ordersGrowth: { date: string; count: number }[] = []
  const revenueGrowth: { date: string; amount: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * 24 * 3600 * 1000)
    const dateStr = date.toISOString().slice(0, 10)
    const nextDateStr = new Date(now - (i - 1) * 24 * 3600 * 1000).toISOString().slice(0, 10)

    const userCount = (db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?',
    ).get(dateStr) as { count: number }).count
    usersGrowth.push({ date: dateStr, count: userCount })

    const orderCount = (db.prepare(
      'SELECT COUNT(*) as count FROM appraisal_orders WHERE DATE(created_at) = ?',
    ).get(dateStr) as { count: number }).count
    ordersGrowth.push({ date: dateStr, count: orderCount })

    const revAmount = (db.prepare(
      "SELECT COALESCE(SUM(price), 0) as total FROM appraisal_orders WHERE DATE(created_at) = ? AND status = 'completed'",
    ).get(dateStr) as { total: number }).total
    revenueGrowth.push({ date: dateStr, amount: Number(revAmount.toFixed(2)) })
  }

  const categoryDistribution = db.prepare(`
    SELECT category, COUNT(*) as count FROM artworks
    WHERE status = 'published' GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[]

  const recentOrders = db.prepare(`
    SELECT o.id, o.status, o.price, o.order_type, o.created_at,
           a.title as artwork_title, u.username, e.name as expert_name
    FROM appraisal_orders o
    LEFT JOIN artworks a ON o.artwork_id = a.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN experts e ON o.expert_id = e.id
    ORDER BY o.created_at DESC LIMIT 10
  `).all()

  const recentUsers = db.prepare(`
    SELECT id, username, email, role, created_at FROM users
    ORDER BY created_at DESC LIMIT 10
  `).all()

  return {
    totalUsers,
    totalExperts,
    totalArtworks,
    totalOrders,
    totalCertificates,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    pendingExperts,
    pendingOrders,
    pendingDisputes,
    usersGrowth,
    ordersGrowth,
    revenueGrowth,
    categoryDistribution,
    recentOrders,
    recentUsers,
  }
}

export function getUserList(page = 1, pageSize = 10, role?: string, keyword?: string): {
  list: any[]
  total: number
} {
  const offset = (page - 1) * pageSize
  let where = 'WHERE 1=1'
  const params: any[] = []
  if (role) {
    where += ' AND role = ?'
    params.push(role)
  }
  if (keyword) {
    where += ' AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)'
    const like = `%${keyword}%`
    params.push(like, like, like)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT id, username, email, avatar, phone, role, created_at, updated_at
    FROM users ${where}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as any[]
  return { list, total }
}

export function updateUserRole(userId: string, role: string): boolean {
  const validRoles = ['user', 'expert', 'admin']
  if (!validRoles.includes(role)) return false
  const info = db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, userId)
  return info.changes > 0
}

export function deleteUser(userId: string): boolean {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  return info.changes > 0
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  detail?: string
  created_at: string
}
