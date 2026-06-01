const db = require('../db')
const dataAggregator = require('./dataAggregator')
const riskEvaluator = require('./riskEvaluator')
const { v4: uuidv4 } = require('uuid')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const fs = require('fs')
const path = require('path')

class ReportGenerator {
  async generateReport(creditCode, accountManager, authFile) {
    const queryRecord = db.prepare(`
      INSERT INTO query_records (credit_code, account_manager, query_purpose, auth_file, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    if (!authFile) {
      queryRecord.run(creditCode, accountManager, '企业征信查询', null, 'failed')
      throw new Error('缺少授权文件，无法生成报告')
    }

    queryRecord.run(creditCode, accountManager, '企业征信查询', authFile, 'success')

    const aggregatedData = await dataAggregator.aggregateAllData(creditCode)
    const riskResult = riskEvaluator.evaluate(aggregatedData)
    
    const enterpriseName = aggregatedData.business.success 
      ? aggregatedData.business.data.enterprise.name 
      : '未知企业'

    const existingReports = db.prepare('SELECT COUNT(*) as count FROM reports WHERE credit_code = ?').get(creditCode)
    const version = `V${existingReports.count + 1}.0`
    const reportNo = `CR${Date.now()}${Math.floor(Math.random() * 1000)}`

    const reportData = JSON.stringify({
      aggregatedData,
      riskResult,
      generatedAt: new Date().toISOString()
    })

    const insertReport = db.prepare(`
      INSERT INTO reports (report_no, credit_code, enterprise_name, version, risk_level, risk_score, hit_rules, evidence_sources, report_data, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertReport.run(
      reportNo,
      creditCode,
      enterpriseName,
      version,
      riskResult.riskLevel,
      riskResult.riskScore,
      JSON.stringify(riskResult.hitRules),
      JSON.stringify(riskResult.evidenceSources),
      reportData,
      accountManager
    )

    db.prepare(`
      INSERT INTO audit_logs (operator, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(accountManager, '生成报告', 'report', reportNo, `生成企业 ${enterpriseName} 征信报告`)

    return {
      reportNo,
      version,
      enterpriseName,
      creditCode,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      hitRules: riskResult.hitRules,
      evidenceSources: riskResult.evidenceSources,
      aggregatedData,
      generatedAt: new Date().toISOString()
    }
  }

  async regenerateReport(reportNo, accountManager) {
    const originalReport = db.prepare('SELECT * FROM reports WHERE report_no = ?').get(reportNo)
    if (!originalReport) {
      throw new Error('报告不存在')
    }

    if (originalReport.is_archived === 1) {
      throw new Error('已归档报告不能重新生成')
    }

    return this.generateReport(originalReport.credit_code, accountManager, 'regenerate_auth')
  }

  async exportReport(reportId, exportedBy) {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const today = new Date().toISOString().split('T')[0]
    const watermark = `${exportedBy} - ${today}`
    
    const pdfBytes = await this.generatePDF(report, watermark)
    
    const exportDir = path.join(__dirname, '../../../exports')
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    const fileName = `${report.report_no}_${report.version}.pdf`
    const filePath = path.join(exportDir, fileName)
    fs.writeFileSync(filePath, pdfBytes)

    db.prepare(`
      INSERT INTO export_records (report_id, report_no, version, exported_by, watermark, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reportId, report.report_no, report.version, exportedBy, watermark, filePath)

    db.prepare(`
      INSERT INTO audit_logs (operator, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(exportedBy, 'Export Report', 'report', report.report_no, `Export report ${report.report_no} version ${report.version}`)

    return { filePath, fileName, watermark }
  }

  async generatePDF(report, watermark) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const fontSize = 12
    const lineHeight = fontSize * 1.8
    let y = height - 50

    const drawText = (text, x, y, size = fontSize) => {
      page.drawText(text, {
        x, y, size, font, color: rgb(0, 0, 0)
      })
    }

    drawText('Enterprise Credit Report', width / 2 - 100, y, 20)
    y -= 50

    drawText(`Report No: ${report.report_no}`, 50, y)
    drawText(`Version: ${report.version}`, 350, y)
    y -= lineHeight

    drawText(`Credit Code: ${report.credit_code}`, 50, y)
    drawText(`Risk Level: ${report.risk_level}`, 350, y)
    y -= lineHeight

    drawText(`Risk Score: ${report.risk_score}/100`, 50, y)
    y -= 40

    drawText('Hit Rules:', 50, y)
    y -= lineHeight

    const hitRules = JSON.parse(report.hit_rules || '[]')
    hitRules.forEach(rule => {
      drawText(`  - ${rule.ruleCode} (${rule.riskLevel})`, 70, y)
      y -= lineHeight
    })

    y -= 30
    drawText('Generated At: ' + report.generated_at.substring(0, 19), 50, y)
    y -= lineHeight
    drawText('Exported By: Operator', 50, y)

    page.drawText('EXPORTED', {
      x: width / 2 - 80,
      y: height / 2,
      size: 40,
      font,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { angle: -30, type: 'degrees' }
    })

    return pdfDoc.save()
  }

  getRiskLevelText(level) {
    const map = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    }
    return map[level] || level
  }

  async getReport(reportIdOrNo) {
    let report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportIdOrNo)
    if (!report) {
      report = db.prepare('SELECT * FROM reports WHERE report_no = ?').get(reportIdOrNo)
    }
    if (!report) return null

    return {
      ...report,
      reportData: JSON.parse(report.report_data || '{}'),
      hitRules: JSON.parse(report.hit_rules || '[]'),
      evidenceSources: JSON.parse(report.evidence_sources || '[]')
    }
  }

  async getQueryHistory() {
    return db.prepare('SELECT * FROM query_records ORDER BY query_time DESC LIMIT 50').all()
  }

  async getReportList() {
    return db.prepare('SELECT * FROM reports ORDER BY generated_at DESC LIMIT 50').all()
  }

  async getAuditLogs() {
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all()
  }

  async getDataSources() {
    return db.prepare('SELECT * FROM data_sources').all()
  }
}

module.exports = new ReportGenerator()
