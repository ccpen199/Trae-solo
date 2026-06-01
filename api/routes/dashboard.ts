import express, { type Request, type Response } from 'express';
import * as doctorRepository from '../db/repositories/doctorRepository.js';
import * as institutionRepository from '../db/repositories/institutionRepository.js';
import * as scheduleRepository from '../db/repositories/scheduleRepository.js';
import * as appointmentRepository from '../db/repositories/appointmentRepository.js';
import * as settlementRepository from '../db/repositories/settlementRepository.js';
import type { DashboardStats } from '../types/index.js';

const router = express.Router();

function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const doctors = doctorRepository.findAll();
    const institutions = institutionRepository.findAllInstitutions();
    const schedules = scheduleRepository.findAll();
    const appointments = appointmentRepository.findAll();
    const settlements = settlementRepository.findAll();

    const { startDate, endDate } = getCurrentMonthRange();
    const monthlyAppointments = appointmentRepository.findByDateRange(startDate, endDate);
    const monthlyVisits = monthlyAppointments.filter(a => a.status === 'completed').length;

    const pendingSettlementAmount = settlements
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.totalIncome, 0);

    const stats: DashboardStats = {
      doctorCount: doctors.length,
      institutionCount: institutions.length,
      scheduleCount: schedules.length,
      appointmentCount: appointments.length,
      pendingSettlementAmount,
      monthlyVisits
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/trends', (req: Request, res: Response): void => {
  try {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const monthlyData = months.map(month => {
      const [year, m] = month.split('-').map(Number);
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const endDate = `${year}-${String(m).padStart(2, '0')}-${lastDay}`;

      const monthSchedules = scheduleRepository.findByDateRange(startDate, endDate);
      const monthAppointments = appointmentRepository.findByDateRange(startDate, endDate);

      return {
        month,
        scheduleCount: monthSchedules.length,
        appointmentCount: monthAppointments.length,
        completedCount: monthAppointments.filter(a => a.status === 'completed').length
      };
    });

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
