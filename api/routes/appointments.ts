import express, { type Request, type Response } from 'express';
import * as appointmentRepository from '../db/repositories/appointmentRepository.js';
import * as scheduleRepository from '../db/repositories/scheduleRepository.js';
import type { CreateAppointmentDto, UpdateAppointmentDto } from '../types/index.js';

const router = express.Router();

function generateTimeSlots(startTime: string, endTime: string, slotCount: number): string[] {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const totalMinutes = endMinutes - startMinutes;
  const slotDuration = Math.floor(totalMinutes / slotCount);

  const slots: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    const slotMinutes = startMinutes + i * slotDuration;
    const h = Math.floor(slotMinutes / 60);
    const m = slotMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return slots;
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { scheduleId, patientPhone, startDate, endDate } = req.query;

    let appointments;

    if (scheduleId) {
      appointments = appointmentRepository.findByScheduleId(parseInt(scheduleId as string, 10));
    } else if (patientPhone) {
      appointments = appointmentRepository.findByPatientPhone(patientPhone as string);
    } else if (startDate && endDate) {
      appointments = appointmentRepository.findByDateRange(startDate as string, endDate as string);
    } else {
      appointments = appointmentRepository.findAll();
    }

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/slots/:scheduleId', (req: Request, res: Response): void => {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    const schedule = scheduleRepository.findById(scheduleId);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    const allSlots = generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotCount);
    const existingAppointments = appointmentRepository.findByScheduleId(scheduleId);
    const bookedSlots = new Set(existingAppointments.map(a => a.slotTime));

    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

    res.json({
      success: true,
      data: {
        allSlots,
        availableSlots,
        bookedSlots: Array.from(bookedSlots),
        appointments: existingAppointments
      }
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
    const appointment = appointmentRepository.findById(id);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: appointment
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
    const dto: CreateAppointmentDto = req.body;

    if (!dto.scheduleId || !dto.patientName || !dto.patientPhone || !dto.slotTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: scheduleId, patientName, patientPhone, slotTime'
      });
      return;
    }

    const schedule = scheduleRepository.findById(dto.scheduleId);
    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
      return;
    }

    if (schedule.status === 'cancelled' || schedule.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Cannot create appointment for cancelled or completed schedule'
      });
      return;
    }

    const existingCount = appointmentRepository.countByScheduleId(dto.scheduleId);
    if (existingCount >= schedule.slotCount) {
      res.status(400).json({
        success: false,
        error: 'No available slots for this schedule'
      });
      return;
    }

    const existingAppointments = appointmentRepository.findByScheduleId(dto.scheduleId);
    const slotTaken = existingAppointments.some(a => a.slotTime === dto.slotTime && a.status !== 'cancelled');
    if (slotTaken) {
      res.status(400).json({
        success: false,
        error: 'This slot is already booked'
      });
      return;
    }

    const appointment = appointmentRepository.create(dto);
    res.status(201).json({
      success: true,
      data: appointment
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
    const dto: UpdateAppointmentDto = req.body;

    const existing = appointmentRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    const appointment = appointmentRepository.update(id, dto);
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
