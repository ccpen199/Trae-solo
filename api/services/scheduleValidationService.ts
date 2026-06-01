import * as scheduleRepository from '../db/repositories/scheduleRepository.js';
import * as doctorRepository from '../db/repositories/doctorRepository.js';
import * as institutionRepository from '../db/repositories/institutionRepository.js';
import type { Schedule, ConflictItem, CreateScheduleDto, Doctor, Institution } from '../types/index.js';

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function timesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  return s1 < e2 && s2 < e1;
}

function getDateTimeStr(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export function checkHospitalShiftConflict(
  scheduleDto: CreateScheduleDto,
  existingSchedules: Schedule[],
  excludeId?: number
): ConflictItem | null {
  if (scheduleDto.isHospitalShift !== 1) return null;

  const sameDaySchedules = existingSchedules.filter(
    s => s.date === scheduleDto.date &&
         s.id !== excludeId &&
         s.status !== 'cancelled'
  );

  for (const s of sameDaySchedules) {
    if (s.isHospitalShift === 1) {
      if (timesOverlap(scheduleDto.startTime, scheduleDto.endTime, s.startTime, s.endTime)) {
        return {
          type: 'hospital_shift',
          severity: 'error',
          message: `本院班次冲突：与 ${s.date} ${s.startTime}-${s.endTime} 的本院排班时间重叠`
        };
      }
    }
  }

  return null;
}

export function checkCrossInstitutionConflict(
  scheduleDto: CreateScheduleDto,
  existingSchedules: Schedule[],
  excludeId?: number
): ConflictItem | null {
  const sameDaySchedules = existingSchedules.filter(
    s => s.date === scheduleDto.date &&
         s.id !== excludeId &&
         s.status !== 'cancelled'
  );

  for (const s of sameDaySchedules) {
    if (timesOverlap(scheduleDto.startTime, scheduleDto.endTime, s.startTime, s.endTime)) {
      const institution = institutionRepository.findInstitutionById(s.institutionId);
      const instName = institution?.name || `机构#${s.institutionId}`;
      return {
        type: 'cross_institution',
        severity: 'error',
        message: `跨机构时间冲突：与 ${instName} ${s.date} ${s.startTime}-${s.endTime} 的排班时间重叠`
      };
    }
  }

  return null;
}

export function checkPracticeScope(
  scheduleDto: CreateScheduleDto,
  doctor: Doctor | null
): ConflictItem | null {
  if (!doctor) {
    return {
      type: 'practice_scope',
      severity: 'error',
      message: '医生信息不存在'
    };
  }

  if (!doctor.availableInstitutions.includes(scheduleDto.institutionId)) {
    const institution = institutionRepository.findInstitutionById(scheduleDto.institutionId);
    const instName = institution?.name || `机构#${scheduleDto.institutionId}`;
    return {
      type: 'practice_scope',
      severity: 'error',
      message: `执业范围不匹配：医生未在 ${instName} 备案执业`
    };
  }

  return null;
}

export function checkRestTime(
  scheduleDto: CreateScheduleDto,
  existingSchedules: Schedule[],
  excludeId?: number,
  minRestHours: number = 8
): ConflictItem | null {
  const newScheduleStart = getDateTimeStr(scheduleDto.date, scheduleDto.startTime);
  const newScheduleEnd = getDateTimeStr(scheduleDto.date, scheduleDto.endTime);

  const relevantSchedules = existingSchedules.filter(
    s => s.id !== excludeId && s.status !== 'cancelled'
  );

  for (const s of relevantSchedules) {
    const existingEnd = getDateTimeStr(s.date, s.endTime);
    const existingStart = getDateTimeStr(s.date, s.startTime);

    const restAfterExisting = newScheduleStart.getTime() - existingEnd.getTime();
    const restBeforeExisting = existingStart.getTime() - newScheduleEnd.getTime();

    const minRestMs = minRestHours * 60 * 60 * 1000;

    if (restAfterExisting > 0 && restAfterExisting < minRestMs) {
      const hours = (restAfterExisting / (60 * 60 * 1000)).toFixed(1);
      return {
        type: 'rest_time',
        severity: 'warning',
        message: `休息时间不足：两次出诊间隔仅 ${hours} 小时，建议不少于 ${minRestHours} 小时`
      };
    }

    if (restBeforeExisting > 0 && restBeforeExisting < minRestMs) {
      const hours = (restBeforeExisting / (60 * 60 * 1000)).toFixed(1);
      return {
        type: 'rest_time',
        severity: 'warning',
        message: `休息时间不足：两次出诊间隔仅 ${hours} 小时，建议不少于 ${minRestHours} 小时`
      };
    }
  }

  return null;
}

export function validateSchedule(
  scheduleDto: CreateScheduleDto,
  excludeId?: number
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  const doctor = doctorRepository.findById(scheduleDto.doctorId);

  const existingSchedules = scheduleRepository.findByDoctorId(scheduleDto.doctorId);

  const hospitalShiftConflict = checkHospitalShiftConflict(scheduleDto, existingSchedules, excludeId);
  if (hospitalShiftConflict) conflicts.push(hospitalShiftConflict);

  const crossInstitutionConflict = checkCrossInstitutionConflict(scheduleDto, existingSchedules, excludeId);
  if (crossInstitutionConflict) conflicts.push(crossInstitutionConflict);

  const practiceScopeConflict = checkPracticeScope(scheduleDto, doctor);
  if (practiceScopeConflict) conflicts.push(practiceScopeConflict);

  const restTimeConflict = checkRestTime(scheduleDto, existingSchedules, excludeId);
  if (restTimeConflict) conflicts.push(restTimeConflict);

  return conflicts;
}
