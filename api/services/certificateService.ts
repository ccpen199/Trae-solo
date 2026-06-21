import { nanoid } from 'nanoid'
import db from '../db/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PDFDocument from 'pdfkit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const certDir = path.resolve(__dirname, '../../data/certificates')
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true })
}

export interface Certificate {
  id: string
  order_id: string
  user_id: string
  artwork_id: string
  expert_id?: string
  certificate_no: string
  category?: string
  conclusion?: string
  valuation?: number
  expert_opinion?: string
  ai_data?: string
  blockchain_tx?: string
  pdf_url?: string
  status: string
  issued_at: string
  expires_at?: string
}

export interface CertificateDetail extends Certificate {
  artwork_title: string
  artwork_category: string
  artwork_images?: string
  artwork_description?: string
  expert_name?: string
  expert_title?: string
  username: string
}

function generateBlockchainTx(): string {
  const chars = '0123456789abcdef'
  let tx = '0x'
  for (let i = 0; i < 64; i++) {
    tx += chars[Math.floor(Math.random() * chars.length)]
  }
  return tx
}

function generateCertificateNo(): string {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  const random = Math.floor(100000 + Math.random() * 900000)
  return `CERT${dateStr}${random}`
}

export function generateCertificate(orderId: string): { success: boolean; certificate?: Certificate; error?: string } {
  const order = db.prepare('SELECT * FROM appraisal_orders WHERE id = ?').get(orderId) as any | undefined
  if (!order) return { success: false, error: '订单不存在' }
  if (order.status !== 'completed') return { success: false, error: '订单未完成，无法生成证书' }
  if (order.certificate_id) {
    const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(order.certificate_id) as Certificate | undefined
    if (existing) return { success: true, certificate: existing }
  }

  const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(order.artwork_id) as any | undefined
  const id = nanoid()
  const certificateNo = generateCertificateNo()
  const blockchainTx = generateBlockchainTx()
  const pdfUrl = `/certificates/${id}.pdf`

  db.prepare(`
    INSERT INTO certificates (id, order_id, user_id, artwork_id, expert_id, certificate_no, category, conclusion, valuation, expert_opinion, ai_data, blockchain_tx, pdf_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    id, order.id, order.user_id, order.artwork_id, order.expert_id || null,
    certificateNo, artwork?.category || '',
    order.expert_opinion ? `${artwork?.title || ''} 鉴定结论：${order.expert_opinion.slice(0, 50)}...` : '',
    order.valuation || null,
    order.expert_opinion || null,
    order.ai_result || null,
    blockchainTx,
    pdfUrl
  )

  db.prepare('UPDATE appraisal_orders SET certificate_id = ? WHERE id = ?').run(id, orderId)

  const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as Certificate
  generatePdf(certificate, artwork)

  return { success: true, certificate }
}

function generatePdf(certificate: Certificate, artwork: any): void {
  try {
    const pdfPath = path.join(certDir, `${certificate.id}.pdf`)
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = fs.createWriteStream(pdfPath)
    doc.pipe(stream)

    doc.fontSize(24).text('文玩艺术品鉴定证书', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(12).text(`证书编号：${certificate.certificate_no}`, { align: 'center' })
    doc.moveDown(0.5)
    doc.text(`发行日期：${certificate.issued_at}`, { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(14).text('藏品信息', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(11)
    doc.text(`藏品名称：${artwork?.title || '未知'}`)
    doc.text(`类        别：${certificate.category || artwork?.category || '未知'}`)
    if (artwork?.era) doc.text(`年        代：${artwork.era}`)
    if (artwork?.material) doc.text(`材        质：${artwork.material}`)
    if (artwork?.dimensions) doc.text(`尺        寸：${artwork.dimensions}`)
    doc.moveDown(1.5)

    if (certificate.valuation) {
      doc.fontSize(14).text('评估价值', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(18).fillColor('#c41e3a').text(`¥ ${certificate.valuation.toLocaleString()}`, { align: 'center' })
      doc.fillColor('black')
      doc.moveDown(1.5)
    }

    if (certificate.expert_opinion) {
      doc.fontSize(14).text('专家意见', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(11).text(certificate.expert_opinion)
      doc.moveDown(1.5)
    }

    if (certificate.blockchain_tx) {
      doc.fontSize(14).text('区块链存证', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(9).text(`交易哈希：${certificate.blockchain_tx}`)
      doc.moveDown(1)
    }

    doc.fontSize(10).text('本证书由文玩艺术品鉴定平台颁发，所有信息已上链存证，可通过证书编号查询真伪。', { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(10).text('—— 鉴定平台公章 ——', { align: 'center' })

    doc.end()
  } catch (err) {
    console.error('PDF generation failed:', err)
  }
}

export function getCertificateById(id: string): CertificateDetail | undefined {
  return db.prepare(`
    SELECT c.*, a.title as artwork_title, a.category as artwork_category,
           a.images as artwork_images, a.description as artwork_description,
           e.name as expert_name, e.title as expert_title, u.username
    FROM certificates c
    LEFT JOIN artworks a ON c.artwork_id = a.id
    LEFT JOIN experts e ON c.expert_id = e.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id) as CertificateDetail | undefined
}

export function getCertificateByNo(certificateNo: string): CertificateDetail | undefined {
  return db.prepare(`
    SELECT c.*, a.title as artwork_title, a.category as artwork_category,
           a.images as artwork_images, a.description as artwork_description,
           e.name as expert_name, e.title as expert_title, u.username
    FROM certificates c
    LEFT JOIN artworks a ON c.artwork_id = a.id
    LEFT JOIN experts e ON c.expert_id = e.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.certificate_no = ?
  `).get(certificateNo) as CertificateDetail | undefined
}

export function getUserCertificates(userId: string, page = 1, pageSize = 10): {
  list: CertificateDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  const total = (db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(userId) as { count: number }).count
  const list = db.prepare(`
    SELECT c.*, a.title as artwork_title, a.category as artwork_category,
           a.images as artwork_images, e.name as expert_name, e.title as expert_title, u.username
    FROM certificates c
    LEFT JOIN artworks a ON c.artwork_id = a.id
    LEFT JOIN experts e ON c.expert_id = e.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY c.issued_at DESC LIMIT ? OFFSET ?
  `).get(userId, pageSize, offset) as CertificateDetail[]
  return { list, total }
}

export function verifyCertificate(certificateNo: string, id?: string): {
  valid: boolean
  certificate?: CertificateDetail
  message: string
} {
  let cert: CertificateDetail | undefined
  if (id) {
    cert = getCertificateById(id)
  } else {
    cert = getCertificateByNo(certificateNo)
  }
  if (!cert) {
    return { valid: false, message: '证书不存在' }
  }
  if (cert.status !== 'active') {
    return { valid: false, certificate: cert, message: '证书已失效' }
  }
  return { valid: true, certificate: cert, message: '证书真实有效' }
}

export function revokeCertificate(certificateId: string): boolean {
  const info = db.prepare("UPDATE certificates SET status = 'revoked' WHERE id = ?").run(certificateId)
  return info.changes > 0
}

export function getPdfPath(certificateId: string): string | undefined {
  const pdfPath = path.join(certDir, `${certificateId}.pdf`)
  if (fs.existsSync(pdfPath)) return pdfPath
  return undefined
}

export function getAllCertificates(page = 1, pageSize = 10): {
  list: CertificateDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  const total = (db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number }).count
  const list = db.prepare(`
    SELECT c.*, a.title as artwork_title, a.category as artwork_category,
           a.images as artwork_images, e.name as expert_name, e.title as expert_title, u.username
    FROM certificates c
    LEFT JOIN artworks a ON c.artwork_id = a.id
    LEFT JOIN experts e ON c.expert_id = e.id
    LEFT JOIN users u ON c.user_id = u.id
    ORDER BY c.issued_at DESC LIMIT ? OFFSET ?
  `).get(pageSize, offset) as CertificateDetail[]
  return { list, total }
}
