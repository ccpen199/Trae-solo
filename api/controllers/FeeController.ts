import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository.js';
import type { FeeBill } from '../types/index.js';

class FeeBillRepository extends BaseRepository<FeeBill> {
  protected tableName = 'fee_bills';
  protected columns = ['id', 'resident_id', 'unit_id', 'type', 'amount', 'billing_month', 'due_date', 'paid_at', 'status', 'payment_method', 'remark', 'created_at', 'updated_at'];

  getBillsByResident(residentId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM fee_bills WHERE resident_id = ?`;
    const dataSql = `
      SELECT fb.*, r.name as resident_name, u.unit_number, u.floor
      FROM fee_bills fb
      LEFT JOIN residents r ON fb.resident_id = r.id
      LEFT JOIN units u ON fb.unit_id = u.id
      WHERE fb.resident_id = ?
      ORDER BY fb.billing_month DESC
      LIMIT ? OFFSET ?
    `;
    
    const countResult = this.executeGet<{ total: number }>(countSql, [residentId]);
    const items = this.executeQuery(dataSql, [residentId, pageSize, offset]);
    
    return {
      items,
      total: countResult?.total || 0,
      page,
      page_size: pageSize,
    };
  }

  getBillsByStatus(status: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM fee_bills WHERE status = ?`;
    const dataSql = `
      SELECT fb.*, r.name as resident_name, r.phone, u.unit_number
      FROM fee_bills fb
      LEFT JOIN residents r ON fb.resident_id = r.id
      LEFT JOIN units u ON fb.unit_id = u.id
      WHERE fb.status = ?
      ORDER BY fb.due_date ASC
      LIMIT ? OFFSET ?
    `;
    
    const countResult = this.executeGet<{ total: number }>(countSql, [status]);
    const items = this.executeQuery(dataSql, [status, pageSize, offset]);
    
    return {
      items,
      total: countResult?.total || 0,
      page,
      page_size: pageSize,
    };
  }

  getFeeStats() {
    const sql = `
      SELECT 
        type,
        COUNT(*) as total_bills,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as unpaid_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
      FROM fee_bills
      GROUP BY type
    `;
    return this.executeQuery(sql);
  }

  getMonthlyStats() {
    const sql = `
      SELECT 
        billing_month,
        COUNT(*) as total_bills,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
      FROM fee_bills
      GROUP BY billing_month
      ORDER BY billing_month DESC
      LIMIT 12
    `;
    return this.executeQuery(sql);
  }
}

const feeBillRepo = new FeeBillRepository();

export const FeeController = {
  async getFeeBills(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;
      const status = req.query.status as string;
      const residentId = req.query.resident_id ? parseInt(req.query.resident_id as string) : null;

      let result;
      if (residentId) {
        result = feeBillRepo.getBillsByResident(residentId, page, pageSize);
      } else if (status) {
        result = feeBillRepo.getBillsByStatus(status, page, pageSize);
      } else {
        result = feeBillRepo.paginate(page, pageSize);
      }

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        page_size: result.page_size,
      });
    } catch (error) {
      console.error('Get fee bills error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get fee bills',
      });
    }
  },

  async getFeeBillById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const bill = feeBillRepo.findById(id);

      if (!bill) {
        res.status(404).json({
          success: false,
          error: 'Fee bill not found',
        });
        return;
      }

      res.json({
        success: true,
        data: bill,
      });
    } catch (error) {
      console.error('Get fee bill error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get fee bill',
      });
    }
  },

  async createFeeBill(req: Request, res: Response): Promise<void> {
    try {
      const { resident_id, unit_id, type, amount, billing_month, due_date, remark } = req.body;

      if (!resident_id || !type || !amount || !billing_month) {
        res.status(400).json({
          success: false,
          error: 'Resident ID, type, amount, and billing month are required',
        });
        return;
      }

      const bill = await feeBillRepo.create({
        resident_id,
        unit_id: unit_id || null,
        type,
        amount: parseFloat(amount),
        billing_month,
        due_date: due_date || null,
        status: 'unpaid',
        remark: remark || '',
      });

      res.json({
        success: true,
        data: bill,
        message: 'Fee bill created successfully',
      });
    } catch (error) {
      console.error('Create fee bill error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create fee bill',
      });
    }
  },

  async payFeeBill(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { payment_method } = req.body;

      const bill = feeBillRepo.findById(id);
      if (!bill) {
        res.status(404).json({
          success: false,
          error: 'Fee bill not found',
        });
        return;
      }

      if (bill.status === 'paid') {
        res.status(400).json({
          success: false,
          error: 'Fee bill already paid',
        });
        return;
      }

      const updatedBill = await feeBillRepo.update(id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: payment_method || 'online',
      });

      res.json({
        success: true,
        data: updatedBill,
        message: 'Fee bill paid successfully',
      });
    } catch (error) {
      console.error('Pay fee bill error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pay fee bill',
      });
    }
  },

  async updateFeeBill(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { type, amount, billing_month, due_date, status, remark } = req.body;

      const existing = feeBillRepo.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Fee bill not found',
        });
        return;
      }

      const bill = await feeBillRepo.update(id, {
        type,
        amount: amount ? parseFloat(amount) : undefined,
        billing_month,
        due_date,
        status,
        remark,
      });

      res.json({
        success: true,
        data: bill,
        message: 'Fee bill updated successfully',
      });
    } catch (error) {
      console.error('Update fee bill error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update fee bill',
      });
    }
  },

  async getFeeStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = feeBillRepo.getFeeStats() as Array<{
        type: string;
        total_bills: number;
        total_amount: number;
        paid_amount: number;
        unpaid_amount: number;
        overdue_amount: number;
      }>;
      const monthlyStats = feeBillRepo.getMonthlyStats();

      const totalUnpaid = stats.reduce((sum: number, s) => sum + (s.unpaid_amount || 0), 0);
      const totalPaid = stats.reduce((sum: number, s) => sum + (s.paid_amount || 0), 0);
      const totalOverdue = stats.reduce((sum: number, s) => sum + (s.overdue_amount || 0), 0);

      res.json({
        success: true,
        data: {
          by_type: stats,
          monthly: monthlyStats,
          summary: {
            total_unpaid: totalUnpaid,
            total_paid: totalPaid,
            total_overdue: totalOverdue,
            total_amount: totalUnpaid + totalPaid + totalOverdue,
          },
        },
      });
    } catch (error) {
      console.error('Get fee stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get fee stats',
      });
    }
  },
};

export default FeeController;
