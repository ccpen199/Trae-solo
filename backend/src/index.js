import express from 'express'
import cors from 'cors'
import declarationRoutes from './routes/declarations.js'
import dashboardRoutes from './routes/dashboard.js'
import userRoutes from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 11851

app.use(cors({
  origin: ['http://localhost:11852', 'http://127.0.0.1:11852'],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'customs-declaration-api',
  })
})

app.get('/api/constants', (req, res) => {
  res.json({
    success: true,
    data: {
      UserRole: {
        DECLARANT: '报关员',
        CARGO_OWNER: '货主',
        CUSTOMS: '海关',
        FORWARDER: '货代',
        TAX: '税务',
        ADMIN: '管理员',
      },
      DeclarationStatus: {
        DRAFT: '草稿',
        PENDING_DATA_ENTRY: '待资料录入',
        PENDING_CLASSIFICATION: '待商品归类',
        PENDING_DECLARATION: '待申报',
        PENDING_INSPECTION_TAX: '待查验缴税',
        RELEASED_ARCHIVED: '放行归档',
        REJECTED: '已驳回',
        CANCELLED: '已撤销',
        EXCEPTION: '异常',
      },
      DocumentType: {
        INVOICE: '发票',
        'PACKING_LIST': '装箱单',
        'BILL_OF_LADING': '提单',
        'CERTIFICATE_OF_ORIGIN': '原产地证',
        'INSPECTION_CERTIFICATE': '检验证书',
        OTHER: '其他',
      },
      InspectionResult: {
        PASSED: '通过',
        FAILED: '驳回',
        NEED_SUPPLEMENT: '补充资料',
        TRANSFERRED: '转派',
      },
    },
  })
})

app.use('/api/declarations', declarationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    errors: [err.message || 'Internal server error'],
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    errors: ['Endpoint not found'],
  })
})

export { app, PORT }

if (import.meta.url === `file://${process.argv[1]}`) {
  import('./config/database.js').then(({ default: prisma }) => {
    app.listen(PORT, () => {
      console.log(`海关报关系统后端服务启动成功！`)
      console.log(`端口: ${PORT}`)
      console.log(`地址: http://localhost:${PORT}`)
      console.log(`健康检查: http://localhost:${PORT}/health`)
    })
  }).catch(err => {
    console.error('数据库连接失败:', err)
    process.exit(1)
  })
}
