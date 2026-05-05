const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken } = require('../middleware/auth')
const dayjs = require('dayjs')

router.use(authenticateToken)

router.get('/stats', (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const thisMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = 1').get().count
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
    
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE DATE(created_at) = ?
    `).get(today).count
    
    const todaySales = db.prepare(`
      SELECT IFNULL(SUM(total_amount), 0) as total
      FROM orders 
      WHERE DATE(created_at) = ?
    `).get(today).total
    
    const thisMonthSales = db.prepare(`
      SELECT IFNULL(SUM(total_amount), 0) as total
      FROM orders 
      WHERE DATE(created_at) >= ?
    `).get(thisMonth).total
    
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = 1').get().count
    const pendingRefunds = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = 5').get().count
    
    const lowInventory = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory 
      WHERE stock_quantity <= warning_line
    `).get().count

    res.json({
      success: true,
      data: {
        customers: customerCount,
        products: productCount,
        orders: orderCount,
        todayOrders,
        todaySales: parseFloat(todaySales) || 0,
        thisMonthSales: parseFloat(thisMonthSales) || 0,
        pendingOrders,
        pendingRefunds,
        lowInventory
      }
    })
  } catch (error) {
    console.error('获取统计数据错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/notifications', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * 
      FROM notifications 
      WHERE is_read = 0 
      ORDER BY created_at DESC
    `).all()

    res.json({
      success: true,
      data: notifications
    })
  } catch (error) {
    console.error('获取通知错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id)
    res.json({ success: true, message: '标记已读成功' })
  } catch (error) {
    console.error('标记通知错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/quick-actions', (req, res) => {
  try {
    const quickActions = [
      { key: 'add-product', name: '添加商品', icon: 'Plus', path: '/product' },
      { key: 'add-coupon', name: '添加优惠券', icon: 'Ticket', path: '/content?tab=coupon' },
      { key: 'add-activity', name: '添加活动', icon: 'Calendar', path: '/content?tab=activity' },
      { key: 'add-article', name: '添加文案', icon: 'Document', path: '/content?tab=article' },
      { key: 'add-supplier', name: '添加供应商', icon: 'OfficeBuilding', path: '/supplier' },
      { key: 'purchase-logistics', name: '采购进货物流查询', icon: 'Truck', path: '/order?tab=logistics' }
    ]

    res.json({
      success: true,
      data: quickActions
    })
  } catch (error) {
    console.error('获取快捷入口错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/recent-orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, c.username as customer_name, c.account as customer_account
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all()

    const statusMap = {
      1: '待付款',
      2: '待发货',
      3: '已发货',
      4: '已完成',
      5: '待退款',
      6: '已退款'
    }

    orders.forEach(order => {
      order.status_text = statusMap[order.status] || '未知'
    })

    res.json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('获取最近订单错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
