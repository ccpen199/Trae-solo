import { v4 as uuidv4 } from 'uuid';
import { mockHospitals } from '../data/mockData';
import type { Hospital, Department, Doctor } from '../../shared/types';

export interface AppointmentRequest {
  userId: string;
  hospitalId: string;
  departmentId: string;
  doctorId?: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientIdCard: string;
  phone: string;
}

export class MedicalService {
  async getHospitals(): Promise<Hospital[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockHospitals;
  }

  async getHospitalDepartments(hospitalId: string): Promise<Department[] | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const hospital = mockHospitals.find(h => h.id === hospitalId);
    return hospital?.departments || null;
  }

  async getDepartmentDoctors(hospitalId: string, departmentId: string): Promise<Doctor[] | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const hospital = mockHospitals.find(h => h.id === hospitalId);
    const department = hospital?.departments.find(d => d.id === departmentId);
    return department?.doctors || null;
  }

  async getWaitTimes(): Promise<Array<{ hospitalId: string; hospitalName: string; departmentId: string; departmentName: string; waitTime: number }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result: Array<{ hospitalId: string; hospitalName: string; departmentId: string; departmentName: string; waitTime: number }> = [];
    mockHospitals.forEach(hospital => {
      hospital.departments.forEach(dept => {
        result.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          departmentId: dept.id,
          departmentName: dept.name,
          waitTime: dept.waitTime + Math.floor(Math.random() * 20 - 10),
        });
      });
    });
    return result;
  }

  async createAppointment(request: AppointmentRequest): Promise<{ appointmentId: string; status: string; qrCode?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const appointmentId = uuidv4();
    const qrData = JSON.stringify({
      appointmentId,
      hospitalId: request.hospitalId,
      departmentId: request.departmentId,
      patientName: request.patientName,
      time: `${request.date} ${request.timeSlot}`,
    });
    return {
      appointmentId,
      status: 'confirmed',
      qrCode: Buffer.from(qrData).toString('base64'),
    };
  }

  async getAppointments(userId: string): Promise<Array<{
    id: string;
    hospitalName: string;
    departmentName: string;
    doctorName?: string;
    date: string;
    timeSlot: string;
    status: string;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: uuidv4(),
        hospitalName: '广西医科大学第一附属医院',
        departmentName: '内科',
        doctorName: '王医生',
        date: '2024-06-20',
        timeSlot: '09:00-09:30',
        status: 'scheduled',
      },
      {
        id: uuidv4(),
        hospitalName: '广西壮族自治区人民医院',
        departmentName: '心血管内科',
        date: '2024-06-25',
        timeSlot: '14:30-15:00',
        status: 'scheduled',
      },
    ];
  }

  async payMedicalBill(orderId: string, amount: number): Promise<{ success: boolean; transactionId: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      transactionId: uuidv4(),
    };
  }
}

export const medicalService = new MedicalService();
