import { query } from '../database';
import {
  ExaminationReport,
  HealthRecommendation,
  AbnormalItem,
  ResultValue,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

interface ReportGenerationConfig {
  outputPath: string;
  templateConfig: {
    header: string;
    footer: string;
    logoPath?: string;
  };
}

const defaultConfig: ReportGenerationConfig = {
  outputPath: path.join(process.cwd(), 'reports'),
  templateConfig: {
    header: '健康体检报告',
    footer: '本报告仅供参考，如有疑问请咨询专业医生',
  },
};

export class ReportAutoGenEngine {
  private config: ReportGenerationConfig;

  constructor(config?: Partial<ReportGenerationConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputPath)) {
      fs.mkdirSync(this.config.outputPath, { recursive: true });
    }
  }

  async generateReport(
    orderId: string,
    patientId: string,
    chiefDoctorId: string
  ): Promise<ExaminationReport> {
    const patient = await this.getPatient(patientId);
    const order = await this.getOrder(orderId);
    const results = await this.getExaminationResults(orderId);
    const abnormalItems = this.extractAbnormalItems(results);
    const riskLevel = this.calculateRiskLevel(abnormalItems);
    const recommendations = this.generateRecommendations(abnormalItems, results);
    const summary = this.generateSummary(results, abnormalItems);
    const conclusions = this.generateConclusions(abnormalItems, riskLevel);

    const report: ExaminationReport = {
      id: uuidv4(),
      reportNo: this.generateReportNo(),
      orderId,
      patientId,
      chiefDoctorId,
      summary,
      conclusions,
      recommendations,
      abnormalItems,
      riskLevel,
      isGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedReport = await this.saveReport(report);
    const pdfPath = await this.generatePDF(savedReport, patient, results);
    
    savedReport.pdfUrl = `/api/reports/pdf/${savedReport.id}`;
    savedReport.isGenerated = true;
    await this.updateReport(savedReport);

    return savedReport;
  }

  private async getPatient(patientId: string): Promise<any> {
    const result = await query(`SELECT * FROM patients WHERE id = $1`, [patientId]);
    if (result.rows.length === 0) {
      throw new Error('患者不存在');
    }
    return result.rows[0];
  }

  private async getOrder(orderId: string): Promise<any> {
    const result = await query(
      `SELECT eo.*, mp.name as package_name 
       FROM examination_orders eo 
       LEFT JOIN medical_packages mp ON eo.package_id = mp.id 
       WHERE eo.id = $1`,
      [orderId]
    );
    if (result.rows.length === 0) {
      throw new Error('订单不存在');
    }
    return result.rows[0];
  }

  private async getExaminationResults(orderId: string): Promise<any[]> {
    const result = await query(
      `SELECT er.*, oi.item_name, oi.item_type, rv.*
       FROM examination_results er
       LEFT JOIN order_items oi ON er.order_item_id = oi.id
       LEFT JOIN result_values rv ON er.id = rv.result_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }

  private extractAbnormalItems(results: any[]): AbnormalItem[] {
    const abnormalItems: AbnormalItem[] = [];
    const processedResults = new Set<string>();

    results.forEach((row) => {
      if (row.is_abnormal && !processedResults.has(row.id)) {
        processedResults.add(row.id);
        abnormalItems.push({
          id: uuidv4(),
          reportId: '',
          itemName: row.item_name,
          itemType: row.item_type,
          value: row.value || '详见报告',
          normalRange: row.normal_range || '',
          description: this.generateAbnormalDescription(row),
          isCrisis: row.is_crisis || false,
        });
      }
    });

    return abnormalItems;
  }

  private generateAbnormalDescription(row: any): string {
    const value = parseFloat(row.value);
    const rangeParts = (row.normal_range || '').split('-');
    
    if (rangeParts.length === 2) {
      const min = parseFloat(rangeParts[0]);
      const max = parseFloat(rangeParts[1]);
      
      if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
        if (value < min) {
          return `${row.name}结果偏低，建议定期复查`;
        } else if (value > max) {
          return `${row.name}结果偏高，可能存在潜在健康风险`;
        }
      }
    }
    
    return `${row.name}结果异常，建议进一步检查`;
  }

  private calculateRiskLevel(abnormalItems: AbnormalItem[]): 'low' | 'medium' | 'high' | 'critical' {
    const crisisCount = abnormalItems.filter(item => item.isCrisis).length;
    const abnormalCount = abnormalItems.length;

    if (crisisCount > 0) {
      return 'critical';
    } else if (abnormalCount >= 5) {
      return 'high';
    } else if (abnormalCount >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateRecommendations(
    abnormalItems: AbnormalItem[],
    results: any[]
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];
    const riskLevel = this.calculateRiskLevel(abnormalItems);

    const hasHighBloodPressure = results.some(r => 
      r.name?.toLowerCase().includes('血压') && r.is_abnormal
    );
    const hasHighBloodSugar = results.some(r => 
      (r.name?.toLowerCase().includes('血糖') || r.name?.toLowerCase().includes('糖')) && r.is_abnormal
    );
    const hasHighCholesterol = results.some(r => 
      (r.name?.toLowerCase().includes('胆固醇') || r.name?.toLowerCase().includes('血脂')) && r.is_abnormal
    );

    if (hasHighBloodPressure) {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'diet',
        content: '建议低盐低脂饮食，每日食盐摄入量不超过6克',
        priority: 'high',
      });
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'lifestyle',
        content: '规律作息，避免熬夜和过度劳累',
        priority: 'medium',
      });
    }

    if (hasHighBloodSugar) {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'diet',
        content: '控制碳水化合物摄入，选择低GI食物',
        priority: 'high',
      });
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'exercise',
        content: '每周进行至少150分钟中等强度有氧运动',
        priority: 'medium',
      });
    }

    if (hasHighCholesterol) {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'diet',
        content: '减少饱和脂肪摄入，增加膳食纤维',
        priority: 'high',
      });
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'follow_up',
        content: '建议尽快到相关专科进一步检查和治疗',
        priority: 'high',
      });
    } else if (riskLevel === 'medium') {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'follow_up',
        content: '建议3-6个月后复查相关项目',
        priority: 'medium',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: uuidv4(),
        reportId: '',
        category: 'lifestyle',
        content: '保持健康生活方式，规律作息，合理饮食，适度运动',
        priority: 'low',
      });
    }

    return recommendations;
  }

  private generateSummary(results: any[], abnormalItems: AbnormalItem[]): string {
    const totalItems = new Set(results.map(r => r.item_name)).size;
    const abnormalCount = abnormalItems.length;
    const crisisCount = abnormalItems.filter(i => i.isCrisis).length;

    let summary = `本次体检共完成${totalItems}项检查项目。`;
    
    if (abnormalCount === 0) {
      summary += '所有检查项目结果均在正常范围内，身体状况良好。';
    } else if (crisisCount > 0) {
      summary += `发现${crisisCount}项危急值异常，${abnormalCount - crisisCount}项异常结果，建议立即就医。`;
    } else {
      summary += `发现${abnormalCount}项异常结果，建议关注并定期复查。`;
    }

    return summary;
  }

  private generateConclusions(
    abnormalItems: AbnormalItem[],
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    if (riskLevel === 'critical') {
      return '存在危急值异常，存在严重健康风险，请立即就医进行进一步检查和治疗。';
    } else if (riskLevel === 'high') {
      return '存在多项异常指标，建议到相关专科进一步检查，明确诊断。';
    } else if (riskLevel === 'medium') {
      return '存在部分异常指标，建议调整生活方式，定期复查。';
    } else {
      return '身体状况基本良好，请继续保持健康的生活方式，定期体检。';
    }
  }

  private generateReportNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RPT${year}${month}${day}${random}`;
  }

  private async saveReport(report: ExaminationReport): Promise<ExaminationReport> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reportResult = await client.query(
        `INSERT INTO examination_reports (
          id, report_no, order_id, patient_id, chief_doctor_id,
          summary, conclusions, risk_level, is_generated
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          report.id,
          report.reportNo,
          report.orderId,
          report.patientId,
          report.chiefDoctorId,
          report.summary,
          report.conclusions,
          report.riskLevel,
          report.isGenerated,
        ]
      );

      for (const item of report.abnormalItems) {
        await client.query(
          `INSERT INTO abnormal_items (
            id, report_id, item_name, item_type, value, normal_range, description, is_crisis
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            report.id,
            item.itemName,
            item.itemType,
            item.value,
            item.normalRange,
            item.description,
            item.isCrisis,
          ]
        );
      }

      for (const rec of report.recommendations) {
        await client.query(
          `INSERT INTO health_recommendations (
            id, report_id, category, content, priority
           ) VALUES ($1, $2, $3, $4, $5)`,
          [
            uuidv4(),
            report.id,
            rec.category,
            rec.content,
            rec.priority,
          ]
        );
      }

      await client.query('COMMIT');
      return { ...report, ...reportResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async updateReport(report: ExaminationReport): Promise<void> {
    await query(
      `UPDATE examination_reports SET pdf_url = $1, is_generated = $2, updated_at = NOW() WHERE id = $3`,
      [report.pdfUrl, report.isGenerated, report.id]
    );
  }

  private async generatePDF(
    report: ExaminationReport,
    patient: any,
    results: any[]
  ): Promise<string> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const fileName = `${report.reportNo}.pdf`;
    const filePath = path.join(this.config.outputPath, fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(20).text('健康体检报告', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`报告编号: ${report.reportNo}`);
    doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`);
    doc.moveDown();

    doc.fontSize(14).text('一、基本信息', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`姓名: ${patient.name}`);
    doc.text(`性别: ${patient.gender === 'male' ? '男' : '女'}`);
    doc.text(`出生日期: ${patient.birth_date?.toLocaleDateString('zh-CN') || '未填写'}`);
    doc.text(`身份证号: ${patient.id_card}`);
    doc.text(`联系电话: ${patient.phone}`);
    doc.moveDown();

    doc.fontSize(14).text('二、体检摘要', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(report.summary);
    doc.moveDown();

    if (report.abnormalItems.length > 0) {
      doc.fontSize(14).text('三、异常指标', { underline: true });
      doc.moveDown(0.5);
      
      report.abnormalItems.forEach((item, index) => {
        doc.fontSize(12).text(
          `${index + 1}. ${item.itemName}: ${item.value} (参考范围: ${item.normalRange || '详见报告'})`
        );
        if (item.isCrisis) {
          doc.fillColor('red').text('【危急值】', { continued: true });
          doc.fillColor('black');
        }
        doc.text(item.description);
        doc.moveDown(0.3);
      });
      doc.moveDown();
    }

    doc.fontSize(14).text('四、健康建议', { underline: true });
    doc.moveDown(0.5);
    
    report.recommendations.forEach((rec, index) => {
      const categoryMap: Record<string, string> = {
        diet: '饮食建议',
        exercise: '运动建议',
        medication: '用药建议',
        follow_up: '随访建议',
        lifestyle: '生活方式',
      };
      
      doc.fontSize(12).text(
        `${index + 1}. [${categoryMap[rec.category] || rec.category}] ${rec.content}`
      );
      doc.moveDown(0.3);
    });
    doc.moveDown();

    doc.fontSize(14).text('五、检查结果详情', { underline: true });
    doc.moveDown(0.5);
    
    const uniqueItems = [...new Set(results.map(r => r.item_name))];
    uniqueItems.forEach((itemName) => {
      const itemResults = results.filter(r => r.item_name === itemName);
      if (itemResults.length > 0) {
        doc.fontSize(12).text(`【${itemName}】`);
        itemResults.forEach((r) => {
          if (r.name) {
            const valueText = r.is_abnormal ? `${r.value}${r.unit || ''} (异常)` : `${r.value}${r.unit || ''}`;
            doc.fontSize(10).text(`  ${r.name}: ${valueText}`);
            if (r.normal_range) {
              doc.fontSize(10).text(`  参考范围: ${r.normal_range}`);
            }
          }
        });
        if (itemResults[0].conclusion) {
          doc.fontSize(10).text(`  结论: ${itemResults[0].conclusion}`);
        }
        doc.moveDown(0.3);
      }
    });

    doc.moveDown();
    doc.fontSize(10).text(this.config.templateConfig.footer, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }

  async getReport(reportId: string): Promise<ExaminationReport | null> {
    const result = await query(
      `SELECT * FROM examination_reports WHERE id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const report = result.rows[0];
    
    const abnormalResult = await query(
      `SELECT * FROM abnormal_items WHERE report_id = $1`,
      [reportId]
    );
    
    const recommendationsResult = await query(
      `SELECT * FROM health_recommendations WHERE report_id = $1`,
      [reportId]
    );

    return {
      id: report.id,
      reportNo: report.report_no,
      orderId: report.order_id,
      patientId: report.patient_id,
      chiefDoctorId: report.chief_doctor_id,
      summary: report.summary,
      conclusions: report.conclusions,
      riskLevel: report.risk_level,
      isGenerated: report.is_generated,
      pdfUrl: report.pdf_url,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      abnormalItems: abnormalResult.rows.map((row: any) => ({
        id: row.id,
        reportId: row.report_id,
        itemName: row.item_name,
        itemType: row.item_type,
        value: row.value,
        normalRange: row.normal_range,
        description: row.description,
        isCrisis: row.is_crisis,
      })),
      recommendations: recommendationsResult.rows.map((row: any) => ({
        id: row.id,
        reportId: row.report_id,
        category: row.category,
        content: row.content,
        priority: row.priority,
      })),
    };
  }
}

import { pool } from '../database';
export const reportEngine = new ReportAutoGenEngine();
