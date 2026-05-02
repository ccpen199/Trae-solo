import { prisma, redis } from '../config';
import { AppointmentStatus, RoomStatus, TechnicianStatus } from '@prisma/client';
import moment from 'moment';

export interface ResourceCheckResult {
  available: boolean;
  technicianId?: string;
  roomId?: string;
  message?: string;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  type: 'technician' | 'room';
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface QueueItem {
  appointmentId: string;
  customerName: string;
  technicianName: string;
  serviceName: string;
  estimatedWaitTime: number;
  position: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

export class MultiResourceEngine {
  
  async checkTechnicianAvailability(
    technicianId: string,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<ResourceCheckResult> {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    const schedule = await prisma.schedule.findUnique({
      where: {
        technicianId_date: {
          technicianId,
          date: new Date(dateStr)
        }
      }
    });
    
    if (!schedule || !schedule.isWorking) {
      return {
        available: false,
        technicianId,
        message: '技师当天不上班或已请假'
      };
    }
    
    if (!this.isTimeInRange(startTime, duration, schedule.startTime, schedule.endTime)) {
      return {
        available: false,
        technicianId,
        message: '预约时间不在技师工作时间范围内'
      };
    }
    
    const endTime = this.calculateEndTime(startTime, duration);
    
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        technicianId,
        scheduledDate: new Date(dateStr),
        status: {
          in: [
            AppointmentStatus.BOOKED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS
          ]
        }
      }
    });
    
    const conflicts: ConflictInfo[] = [];
    
    for (const apt of existingAppointments) {
      if (this.isTimeOverlap(startTime, endTime, apt.scheduledTime, apt.estimatedEndTime || '')) {
        conflicts.push({
          type: 'technician',
          id: technicianId,
          startTime: apt.scheduledTime,
          endTime: apt.estimatedEndTime || '',
          reason: '技师已有其他预约'
        });
      }
    }
    
    if (conflicts.length > 0) {
      return {
        available: false,
        technicianId,
        message: '技师时间冲突',
        conflicts
      };
    }
    
    const technician = await prisma.technician.findUnique({
      where: { userId: technicianId },
      include: { user: true }
    });
    
    if (technician?.status !== TechnicianStatus.AVAILABLE) {
      return {
        available: false,
        technicianId,
        message: `技师当前状态为: ${technician?.status || '未知'}`
      };
    }
    
    return {
      available: true,
      technicianId,
      message: '技师可用'
    };
  }
  
  async checkRoomAvailability(
    roomId: string,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<ResourceCheckResult> {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return {
        available: false,
        roomId,
        message: '房间不存在'
      };
    }
    
    if (room.status !== RoomStatus.AVAILABLE && room.status !== RoomStatus.RESERVED) {
      return {
        available: false,
        roomId,
        message: `房间当前状态为: ${room.status}`
      };
    }
    
    const endTime = this.calculateEndTime(startTime, duration);
    
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        roomId,
        scheduledDate: new Date(dateStr),
        status: {
          in: [
            AppointmentStatus.BOOKED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS
          ]
        }
      }
    });
    
    const conflicts: ConflictInfo[] = [];
    
    for (const apt of existingAppointments) {
      if (this.isTimeOverlap(startTime, endTime, apt.scheduledTime, apt.estimatedEndTime || '')) {
        conflicts.push({
          type: 'room',
          id: roomId,
          startTime: apt.scheduledTime,
          endTime: apt.estimatedEndTime || '',
          reason: '房间已有其他预约'
        });
      }
    }
    
    if (conflicts.length > 0) {
      return {
        available: false,
        roomId,
        message: '房间时间冲突',
        conflicts
      };
    }
    
    return {
      available: true,
      roomId,
      message: '房间可用'
    };
  }
  
  async findAvailableRooms(
    date: Date,
    startTime: string,
    duration: number
  ): Promise<string[]> {
    const rooms = await prisma.room.findMany({
      where: {
        status: {
          in: [RoomStatus.AVAILABLE, RoomStatus.RESERVED]
        }
      },
      select: { id: true }
    });
    
    const availableRooms: string[] = [];
    
    for (const room of rooms) {
      const result = await this.checkRoomAvailability(room.id, date, startTime, duration);
      if (result.available) {
        availableRooms.push(room.id);
      }
    }
    
    return availableRooms;
  }
  
  async findAvailableTechnicians(
    serviceId: string,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<string[]> {
    const techniciansWithSkill = await prisma.technicianSkill.findMany({
      where: { serviceId },
      include: { technician: true }
    });
    
    const availableTechnicians: string[] = [];
    
    for (const skill of techniciansWithSkill) {
      if (skill.technician.status === TechnicianStatus.AVAILABLE) {
        const result = await this.checkTechnicianAvailability(
          skill.technician.userId,
          date,
          startTime,
          duration
        );
        if (result.available) {
          availableTechnicians.push(skill.technician.userId);
        }
      }
    }
    
    return availableTechnicians;
  }
  
  async lockResources(
    appointmentId: string,
    technicianId: string,
    roomId: string | null,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<boolean> {
    const lockKey = `lock:appointment:${appointmentId}`;
    const endTime = this.calculateEndTime(startTime, duration);
    
    const lockData = {
      appointmentId,
      technicianId,
      roomId,
      date: moment(date).format('YYYY-MM-DD'),
      startTime,
      endTime,
      lockedAt: new Date().toISOString()
    };
    
    await redis.setex(lockKey, 1800, JSON.stringify(lockData));
    
    if (roomId) {
      const roomLockKey = `lock:room:${roomId}:${moment(date).format('YYYY-MM-DD')}:${startTime}-${endTime}`;
      await redis.setex(roomLockKey, 1800, appointmentId);
    }
    
    const techLockKey = `lock:technician:${technicianId}:${moment(date).format('YYYY-MM-DD')}:${startTime}-${endTime}`;
    await redis.setex(techLockKey, 1800, appointmentId);
    
    return true;
  }
  
  async releaseResources(appointmentId: string): Promise<boolean> {
    const lockKey = `lock:appointment:${appointmentId}`;
    const lockDataStr = await redis.get(lockKey);
    
    if (lockDataStr) {
      const lockData = JSON.parse(lockDataStr);
      
      if (lockData.roomId) {
        const roomLockKey = `lock:room:${lockData.roomId}:${lockData.date}:${lockData.startTime}-${lockData.endTime}`;
        await redis.del(roomLockKey);
      }
      
      const techLockKey = `lock:technician:${lockData.technicianId}:${lockData.date}:${lockData.startTime}-${lockData.endTime}`;
      await redis.del(techLockKey);
      
      await redis.del(lockKey);
    }
    
    return true;
  }
  
  async getQueueStatus(): Promise<QueueItem[]> {
    const today = moment().startOf('day').toDate();
    
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: today,
        status: {
          in: [
            AppointmentStatus.BOOKED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS
          ]
        }
      },
      include: {
        customer: { select: { realName: true, username: true } },
        technician: { include: { user: { select: { realName: true } } } },
        service: { select: { name: true, duration: true } }
      },
      orderBy: [
        { scheduledTime: 'asc' }
      ]
    });
    
    const queue: QueueItem[] = [];
    let currentPosition = 1;
    const currentTime = moment().format('HH:mm');
    
    for (const apt of appointments) {
      let status: 'waiting' | 'in_progress' | 'completed' = 'waiting';
      let estimatedWaitTime = 0;
      
      if (apt.status === AppointmentStatus.IN_PROGRESS) {
        status = 'in_progress';
      } else if (apt.scheduledTime < currentTime) {
        estimatedWaitTime = this.calculateWaitTime(currentTime, apt.scheduledTime);
      }
      
      queue.push({
        appointmentId: apt.id,
        customerName: apt.customer.realName || apt.customer.username,
        technicianName: apt.technician.user?.realName || '未知技师',
        serviceName: apt.service.name,
        estimatedWaitTime,
        position: currentPosition++,
        status
      });
    }
    
    return queue;
  }
  
  async updateTechnicianStatus(technicianId: string, status: TechnicianStatus): Promise<void> {
    await prisma.technician.update({
      where: { userId: technicianId },
      data: { status }
    });
    
    await redis.publish('technician:status', JSON.stringify({
      technicianId,
      status,
      updatedAt: new Date().toISOString()
    }));
  }
  
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
    await prisma.room.update({
      where: { id: roomId },
      data: { status }
    });
    
    await redis.publish('room:status', JSON.stringify({
      roomId,
      status,
      updatedAt: new Date().toISOString()
    }));
  }
  
  private isTimeInRange(
    checkStartTime: string,
    duration: number,
    rangeStart: string,
    rangeEnd: string
  ): boolean {
    const checkEnd = this.calculateEndTime(checkStartTime, duration);
    return checkStartTime >= rangeStart && checkEnd <= rangeEnd;
  }
  
  private isTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
  
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }
  
  private calculateWaitTime(currentTime: string, scheduledTime: string): number {
    const [currHours, currMinutes] = currentTime.split(':').map(Number);
    const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
    
    const currTotal = currHours * 60 + currMinutes;
    const schedTotal = schedHours * 60 + schedMinutes;
    
    return Math.max(0, schedTotal - currTotal);
  }
}

export const multiResourceEngine = new MultiResourceEngine();
