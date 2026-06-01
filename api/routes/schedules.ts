import express, { type Request, type Response } from 'express';
import * as scheduleRepository from '../db/repositories/scheduleRepository.js';
import * as scheduleValidationService from '../services/scheduleValidationService.js';
import type { CreateScheduleDto, UpdateScheduleDto } from '../types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { doctorId, institutionId, startDate, endDate } = req.query;

    let schedules;

    if (doctorId && startDate && endDate) {
      schedules = scheduleRepository.findByDoctorAndDateRange(
        parseInt(doctorId as string, 10),
        startDate as string,
        endDate as string
      );
    } else if (doctorId) {
      schedules = scheduleRepository.findByDoctorId(parseInt(doctorId as string, 10));
    } else if (institutionId) {
      schedules = scheduleRepository.findByInstitutionId(parseInt(institutionId as string, 10));
    } else if (startDate && endDate) {
      schedules = scheduleRepository.findByDateRange(startDate as string, endDate as string);
    } else {
      schedules = scheduleRepository.findAll();
    }

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const schedule = scheduleRepository.findById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/validate', (req: Request, res: Response): void => {
  try {
    const dto: CreateScheduleDto = req.body;

    if (!dto.doctorId || !dto.institutionId || !dto.departmentId || !dto.date || !dto.startTime || !dto.endTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: doctorId, institutionId, departmentId, date, startTime, endTime'
      });
      return;
    }

    const conflicts = scheduleValidationService.validateSchedule(dto);
    const hasErrors = conflicts.some(c => c.severity === 'error');

    res.json({
      success: true,
      data: {
        conflicts,
        isValid: !hasErrors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const dto: CreateScheduleDto = req.body;

    if (!dto.doctorId || !dto.institutionId || !dto.departmentId || !dto.date || !dto.startTime || !dto.endTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: doctorId, institutionId, departmentId, date, startTime, endTime'
      });
      return;
    }

    const conflicts = scheduleValidationService.validateSchedule(dto);
    const schedule = scheduleRepository.create(dto, conflicts);

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto: UpdateScheduleDto = req.body;

    const existing = scheduleRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    let conflicts;
    if (dto.doctorId || dto.date || dto.startTime || dto.endTime || dto.institutionId) {
      const validateDto: CreateScheduleDto = {
        doctorId: dto.doctorId ?? existing.doctorId,
        institutionId: dto.institutionId ?? existing.institutionId,
        departmentId: dto.departmentId ?? existing.departmentId,
        date: dto.date ?? existing.date,
        startTime: dto.startTime ?? existing.startTime,
        endTime: dto.endTime ?? existing.endTime,
        isHospitalShift: dto.isHospitalShift ?? existing.isHospitalShift
      };
      conflicts = scheduleValidationService.validateSchedule(validateDto, id);
    }

    const schedule = scheduleRepository.update(id, dto, conflicts);
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = scheduleRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    const deleted = scheduleRepository.remove(id);
    res.json({
      success: true,
      data: deleted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
