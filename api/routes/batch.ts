import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { calculateTaxes } from '../services/taxCalculator.js';
import { saveCalculationResult } from '../models/calculation.js';
import db from '../db/index.js';

const router = express.Router();
const upload = multer({ dest: '/tmp/' });

interface BatchImportResult {
  batchId: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errorDetails: Array<{ row: number; error: string }>;
  results: any[];
}

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ success: false, error: '文件为空' });
    }

    const batchId = `BATCH-${Date.now()}`;
    const errorDetails: Array<{ row: number; error: string }> = [];
    const results: any[] = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = (data[i] as any) || {};
      const rowNumber = i + 2;

      const requiredFields = ['orderId', 'countryCode', 'currency', 'productName', 'hsCode', 'quantity', 'unitPrice'];
      const missingFields = requiredFields.filter(f => !row[f]);

      if (missingFields.length > 0) {
        errorDetails.push({
          row: rowNumber,
          error: `缺少必填字段: ${missingFields.join(', ')}`
        });
        continue;
      }

      try {
        const input = {
          orderId: String(row.orderId),
          countryCode: String(row.countryCode),
          currency: String(row.currency),
          exchangeRate: row.exchangeRate ? parseFloat(row.exchangeRate) : 1,
          shippingFee: row.shippingFee ? parseFloat(row.shippingFee) : 0,
          insuranceFee: row.insuranceFee ? parseFloat(row.insuranceFee) : 0,
          platformWithholding: row.platformWithholding ? parseFloat(row.platformWithholding) : 0,
          items: [
            {
              lineNumber: 1,
              productName: String(row.productName),
              hsCode: String(row.hsCode),
              quantity: parseInt(row.quantity),
              unitPrice: parseFloat(row.unitPrice),
              discount: row.discount ? parseFloat(row.discount) : 0,
            },
          ],
        };

        const result = calculateTaxes(input);
        const id = saveCalculationResult(result);
        results.push({ row: rowNumber, calculationId: id, ...result });
        successCount++;
      } catch (rowError: any) {
        errorDetails.push({
          row: rowNumber,
          error: rowError.message || '计算失败',
        });
      }
    }

    const batchRecord = db.prepare(`
      INSERT INTO batch_imports (batch_id, file_name, total_rows, success_rows, error_rows, error_details, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      batchId,
      req.file.originalname,
      data.length,
      successCount,
      errorDetails.length,
      JSON.stringify(errorDetails),
      'completed'
    );

    res.json({
      success: true,
      data: {
        batchId,
        fileName: req.file.originalname,
        totalRows: data.length,
        successRows: successCount,
        errorRows: errorDetails.length,
        errorDetails,
        results,
      },
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ success: false, error: '批量导入失败' });
  }
});

router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const records = db.prepare('SELECT * FROM batch_imports ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取导入历史失败' });
  }
});

router.get('/template', (req, res) => {
  const templateData = [
    {
      orderId: 'ORD-001',
      countryCode: 'US',
      currency: 'USD',
      exchangeRate: 1,
      productName: '智能手机',
      hsCode: '85171200',
      quantity: 1,
      unitPrice: 599,
      discount: 0,
      shippingFee: 20,
      insuranceFee: 5,
    },
    {
      orderId: 'ORD-002',
      countryCode: 'EU',
      currency: 'EUR',
      exchangeRate: 0.92,
      productName: 'T恤衫',
      hsCode: '61091000',
      quantity: 10,
      unitPrice: 29.99,
      discount: 5,
      shippingFee: 15,
      insuranceFee: 2,
    },
  ];

  const ws = xlsx.utils.json_to_sheet(templateData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Template');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=tax_calculation_template.xlsx');
  res.send(buffer);
});

export default router;
