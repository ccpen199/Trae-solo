const express = require('express')
const { auth } = require('../middleware/auth')
const router = express.Router()

router.get('/stats', auth, (req, res) => {
  const db = req.db
  const data = {
    applications: db.prepare('SELECT COUNT(*) AS c FROM applications').get().c,
    activeApps: db.prepare('SELECT COUNT(*) AS c FROM applications WHERE status = ?').get('active').c,
    tasksCreated: db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE status = ?').get('created').c,
    tasksExecuted: db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE status = ?').get('executed').c,
    tasksFailed: db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE status = ?').get('failed').c,
    ordersOpen: db.prepare('SELECT COUNT(*) AS c FROM change_orders WHERE status IN (?, ?, ?)')
      .all('draft', 'submitted', 'approved').reduce((s, r) => s + r.c, 0),
    ordersClosed: db.prepare('SELECT COUNT(*) AS c FROM change_orders WHERE status IN (?, ?)')
      .all('closed', 'rejected').reduce((s, r) => s + r.c, 0),
    alertsOpen: db.prepare('SELECT COUNT(*) AS c FROM alerts WHERE status = ?').get('open').c,
    alertsCritical: db.prepare('SELECT COUNT(*) AS c FROM alerts WHERE severity = ? AND status = ?').get('critical', 'open').c,
    executionsToday: db.prepare("SELECT COUNT(*) AS c FROM execution_logs WHERE date(started_at) = date('now','localtime')").get().c,
    recentTasks: db.prepare(`SELECT t.*, a.app_name, a.app_code FROM tasks t LEFT JOIN applications a ON a.id = t.app_id ORDER BY t.id DESC LIMIT 8`).all(),
    recentOrders: db.prepare(`SELECT co.*, a.app_name FROM change_orders co LEFT JOIN applications a ON a.id = co.app_id ORDER BY co.id DESC LIMIT 8`).all(),
    recentAlerts: db.prepare(`SELECT al.*, a.app_name FROM alerts al LEFT JOIN applications a ON a.id = al.app_id ORDER BY al.id DESC LIMIT 8`).all(),
    recentAudits: db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20`).all()
  }
  res.json({ code: 0, data })
})

router.get('/timeline', auth, (req, res) => {
  const db = req.db
  const tasks = db.prepare(`SELECT 'task' AS type, id, task_no AS no, title, status, created_at AS time FROM tasks`).all()
  const orders = db.prepare(`SELECT 'order' AS type, id, order_no AS no, title, status, created_at AS time FROM change_orders`).all()
  const alerts = db.prepare(`SELECT 'alert' AS type, id, alert_no AS no, title, status, created_at AS time FROM alerts`).all()
  const all = [...tasks, ...orders, ...alerts].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 50)
  res.json({ code: 0, data: all })
})

module.exports = router
