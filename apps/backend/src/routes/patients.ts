import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let queryText = `SELECT * FROM patients WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex++} OR id_card ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    queryText += ` ORDER BY created_at DESC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    const patients = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      birthDate: row.birth_date,
      idCard: row.id_card,
      phone: row.phone,
      email: row.email,
      address: row.address,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    let countResult;
    if (search) {
      countResult = await query(
        `SELECT COUNT(*) as count FROM patients WHERE name ILIKE $1 OR id_card ILIKE $2 OR phone ILIKE $3`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );
    } else {
      countResult = await query(`SELECT COUNT(*) as count FROM patients`);
    }

    res.json({
      patients,
      total: parseInt(countResult.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: '获取患者列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM patients WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '患者不存在' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      gender: row.gender,
      birthDate: row.birth_date,
      idCard: row.id_card,
      phone: row.phone,
      email: row.email,
      address: row.address,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: '获取患者信息失败' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, gender, birthDate, idCard, phone, email, address } = req.body;

    if (!name || !gender || !birthDate || !idCard || !phone) {
      return res.status(400).json({ message: '请提供必要的患者信息' });
    }

    const existingPatient = await query(
      `SELECT id FROM patients WHERE id_card = $1`,
      [idCard]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(400).json({ message: '该身份证号已存在患者记录' });
    }

    const result = await query(
      `INSERT INTO patients (id, name, gender, birth_date, id_card, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [uuidv4(), name, gender, new Date(birthDate), idCard, phone, email, address]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      message: '患者创建成功',
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: '创建患者失败' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, gender, birthDate, phone, email, address } = req.body;

    const existingPatient = await query(
      `SELECT * FROM patients WHERE id = $1`,
      [id]
    );

    if (existingPatient.rows.length === 0) {
      return res.status(404).json({ message: '患者不存在' });
    }

    const result = await query(
      `UPDATE patients 
       SET name = COALESCE($1, name),
           gender = COALESCE($2, gender),
           birth_date = COALESCE($3, birth_date),
           phone = COALESCE($4, phone),
           email = COALESCE($5, email),
           address = COALESCE($6, address),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, gender, birthDate ? new Date(birthDate) : null, phone, email, address, id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      message: '患者信息更新成功',
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: '更新患者信息失败' });
  }
});

router.get('/:id/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT eo.*, mp.name as package_name, r.reservation_code,
              er.id as report_id, er.report_no, er.risk_level, er.created_at as report_date
       FROM examination_orders eo
       LEFT JOIN medical_packages mp ON eo.package_id = mp.id
       LEFT JOIN reservations r ON eo.id = r.order_id
       LEFT JOIN examination_reports er ON eo.id = er.order_id
       WHERE eo.patient_id = $1
       ORDER BY eo.created_at DESC`,
      [id]
    );

    const history = result.rows.map((row: any) => ({
      orderId: row.id,
      orderNo: row.order_no,
      reservationCode: row.reservation_code,
      packageName: row.package_name,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      reportId: row.report_id,
      reportNo: row.report_no,
      riskLevel: row.risk_level,
      reportDate: row.report_date,
      createdAt: row.created_at,
    }));

    res.json(history);
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ message: '获取患者历史记录失败' });
  }
});

export default router;
