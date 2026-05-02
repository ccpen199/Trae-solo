import { Request, Response } from 'express';
import { Appointment } from '../models/models';

// 模拟数据库
let appointments: Appointment[] = [];

export const createAppointment = (req: Request, res: Response) => {
  const { supplierId, supplierName, arrivalTime } = req.body;
  
  const newAppointment: Appointment = {
    id: `appt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    supplierId,
    supplierName,
    arrivalTime,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  appointments.push(newAppointment);
  res.status(201).json(newAppointment);
};

export const confirmAppointment = (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = appointments.find(a => a.id === id);
  
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  
  appointment.status = 'confirmed';
  appointment.updatedAt = new Date().toISOString();
  
  res.json(appointment);
};

export const getAppointments = (req: Request, res: Response) => {
  const { status } = req.query;
  let filteredAppointments = appointments;
  
  if (status) {
    filteredAppointments = appointments.filter(a => a.status === status);
  }
  
  res.json(filteredAppointments);
};

export const getAppointmentById = (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = appointments.find(a => a.id === id);
  
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  
  res.json(appointment);
};

export const cancelAppointment = (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = appointments.find(a => a.id === id);
  
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  
  appointment.status = 'cancelled';
  appointment.updatedAt = new Date().toISOString();
  
  res.json(appointment);
};