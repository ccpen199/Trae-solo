import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { reportEngine } from '../engines/report-engine';
import { riskModelEngine } from '../engines/risk-model';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

router.post('/generate/:orderId', authenticateToken, requireRoles('chief_doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const chiefDoctorId = req.user?.doctorId;

    if (!chiefDoctorId) {
      return res.status(400).json({ message: '请先关联医生信息' });
    }

    const orderResult = await query(
      `SELECT eo.*, p.name as patient_name, p.id as patient_id
       FROM examination_orders eo
       LEFT JOIN patients p ON eo.patient_id = p.id
       WHERE eo.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'examination_completed') {
      return res.status(400).json({ message: '体检尚未完成，无法生成报告' });
    }

    const existingReport = await query(
      `SELECT * FROM examination_reports WHERE order_id = $1`,
      [orderId]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json({ message: '报告已存在' });
    }

    const report = await reportEngine.generateReport(orderId, order.patient_id, chiefDoctorId);

    await query(
      `UPDATE examination_orders SET status = 'report_generated', updated_at = NOW() WHERE id = $1`,
      [orderId]
    );

    await query(
      `UPDATE reservations SET status = 'report_generated', updated_at = NOW() WHERE order_id = $1`,
      [orderId]
    );

    await query(
      `INSERT INTO notifications (
        id, type, target_type, target_id, title, content, related_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        'report_ready',
        'patient',
        order.patient_id,
        '体检报告已生成',
        `您的体检报告${report.reportNo}已生成，请查看。`,
        report.id,
      ]
    );

    if (report.abnormalItems.length > 0) {
      const riskAssessment = await riskModelEngine.assessRisk(
        order.patient_id,
        report.abnormalItems
      );

      if (riskAssessment.followUpRequired && (riskAssessment.overallRisk === 'medium' || riskAssessment.overallRisk === 'high' || riskAssessment.overallRisk === 'critical')) {
        await riskModelEngine.createFollowUpTask(
          order.patient_id,
          report.id,
          report.abnormalItems,
          riskAssessment.overallRisk
        );
      }
    }

    res.status(201).json({
      message: '报告生成成功',
      report: {
        id: report.id,
        reportNo: report.reportNo,
        summary: report.summary,
        conclusions: report.conclusions,
        riskLevel: report.riskLevel,
        isGenerated: report.isGenerated,
        pdfUrl: report.pdfUrl,
        abnormalItems: report.abnormalItems.length,
        recommendations: report.recommendations.length,
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: '生成报告失败' });
  }
});

router.get('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await reportEngine.getReport(reportId);

    if (!report) {
      return res.status(404).json({ message: '报告不存在' });
    }

    const patientResult = await query(
      `SELECT * FROM patients WHERE id = $1`,
      [report.patientId]
    );

    const doctorResult = await query(
      `SELECT * FROM doctors WHERE id = $1`,
      [report.chiefDoctorId]
    );

    res.json({
      ...report,
      patient: patientResult.rows[0],
      chiefDoctor: doctorResult.rows[0],
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: '获取报告失败' });
  }
});

router.get('/order/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await query(
      `SELECT * FROM examination_reports WHERE order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '报告不存在' });
    }

    const report = await reportEngine.getReport(result.rows[0].id);
    res.json(report);
  } catch (error) {
    console.error('Get report by order error:', error);
    res.status(500).json({ message: '获取报告失败' });
  }
});

router.get('/patient/:patientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const result = await query(
      `SELECT er.*, eo.order_no, mp.name as package_name
       FROM examination_reports er
       LEFT JOIN examination_orders eo ON er.order_id = eo.id
       LEFT JOIN medical_packages mp ON eo.package_id = mp.id
       WHERE er.patient_id = $1
       ORDER BY er.created_at DESC`,
      [patientId]
    );

    const reports = result.rows.map((row: any) => ({
      id: row.id,
      reportNo: row.report_no,
      orderId: row.order_id,
      orderNo: row.order_no,
      packageName: row.package_name,
      summary: row.summary,
      conclusions: row.conclusions,
      riskLevel: row.risk_level,
      isGenerated: row.is_generated,
      pdfUrl: row.pdf_url,
      createdAt: row.created_at,
    }));

    res.json(reports);
  } catch (error) {
    console.error('Get patient reports error:', error);
    res.status(500).json({ message: '获取患者报告列表失败' });
  }
});

router.get('/pdf/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const reportResult = await query(
      `SELECT report_no FROM examination_reports WHERE id = $1`,
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ message: '报告不存在' });
    }

    const reportNo = reportResult.rows[0].report_no;
    const pdfPath = path.join(process.cwd(), 'reports', `${reportNo}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF文件不存在' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${reportNo}.pdf`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get report PDF error:', error);
    res.status(500).json({ message: '获取报告PDF失败' });
  }
});

router.get('/review/pending', authenticateToken, requireRoles('chief_doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT eo.*, p.name as patient_name, p.phone as patient_phone,
              mp.name as package_name, r.reservation_code
       FROM examination_orders eo
       LEFT JOIN patients p ON eo.patient_id = p.id
       LEFT JOIN medical_packages mp ON eo.package_id = mp.id
       LEFT JOIN reservations r ON eo.id = r.order_id
       WHERE eo.status = 'examination_completed'
       ORDER BY eo.updated_at ASC`,
    );

    const pendingOrders = result.rows.map((row: any) => ({
      orderId: row.id,
      orderNo: row.order_no,
      reservationCode: row.reservation_code,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      packageName: row.package_name,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      count: pendingOrders.length,
      orders: pendingOrders,
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({ message: '获取待审核报告列表失败' });
  }
});

export default router;
