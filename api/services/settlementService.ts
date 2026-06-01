import * as settlementRepository from '../db/repositories/settlementRepository.js';
import * as scheduleRepository from '../db/repositories/scheduleRepository.js';
import * as appointmentRepository from '../db/repositories/appointmentRepository.js';
import * as doctorRepository from '../db/repositories/doctorRepository.js';
import type { Settlement, CalculateSettlementDto } from '../types/index.js';

function getDateRangeForPeriod(period: string): { startDate: string; endDate: string } {
  const [year, month] = period.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

interface SettlementCalculationResult {
  doctorId: number;
  institutionId: number;
  visitCount: number;
  totalIncome: number;
  defaultCount: number;
}

export function calculateSettlements(dto: CalculateSettlementDto): SettlementCalculationResult[] {
  const { startDate, endDate } = getDateRangeForPeriod(dto.period);

  let schedules = scheduleRepository.findByDateRange(startDate, endDate);

  if (dto.doctorId) {
    schedules = schedules.filter(s => s.doctorId === dto.doctorId);
  }
  if (dto.institutionId) {
    schedules = schedules.filter(s => s.institutionId === dto.institutionId);
  }

  const results = new Map<string, SettlementCalculationResult>();

  for (const schedule of schedules) {
    const key = `${schedule.doctorId}-${schedule.institutionId}`;

    if (!results.has(key)) {
      results.set(key, {
        doctorId: schedule.doctorId,
        institutionId: schedule.institutionId,
        visitCount: 0,
        totalIncome: 0,
        defaultCount: 0
      });
    }

    const result = results.get(key)!;

    const appointments = appointmentRepository.findByScheduleId(schedule.id);
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const noShowAppointments = appointments.filter(a => a.status === 'no_show');

    const doctor = doctorRepository.findById(schedule.doctorId);
    const visitPrice = doctor?.visitPrice || 0;

    result.visitCount += completedAppointments.length;
    result.totalIncome += completedAppointments.length * visitPrice;
    result.defaultCount += noShowAppointments.length;
  }

  return Array.from(results.values());
}

export function createOrUpdateSettlements(dto: CalculateSettlementDto): Settlement[] {
  const calculations = calculateSettlements(dto);
  const settlements: Settlement[] = [];

  for (const calc of calculations) {
    const existing = settlementRepository.findByDoctorAndInstitution(
      calc.doctorId,
      calc.institutionId,
      dto.period
    );

    if (existing && existing.status === 'pending') {
      const updated = settlementRepository.findByDoctorAndInstitution(
        calc.doctorId,
        calc.institutionId,
        dto.period
      );
      if (updated) {
        settlements.push(updated);
      }
    } else if (!existing) {
      const settlement = settlementRepository.create(
        dto.period,
        calc.doctorId,
        calc.institutionId,
        calc.visitCount,
        calc.totalIncome,
        calc.defaultCount
      );
      settlements.push(settlement);
    } else {
      settlements.push(existing);
    }
  }

  return settlements;
}

export function exportSettlements(period?: string): string {
  let settlements = settlementRepository.findAll();
  if (period) {
    settlements = settlementRepository.findByPeriod(period);
  }

  const header = ['ID', '周期', '医生ID', '机构ID', '出诊次数', '总收入', '违约次数', '状态', '创建时间'];
  const rows = settlements.map(s => [
    s.id,
    s.period,
    s.doctorId,
    s.institutionId,
    s.visitCount,
    s.totalIncome.toFixed(2),
    s.defaultCount,
    s.status,
    s.createdAt
  ]);

  const csvContent = [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}
