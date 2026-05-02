class GateRuleEngine {
  constructor(db) {
    this.db = db;
  }

  validateGateAppointment(appointment) {
    const errors = [];
    const { container_id, appointment_time, gate_no } = appointment;

    if (!container_id) {
      errors.push('必须指定集装箱');
    }

    if (!appointment_time) {
      errors.push('必须指定预约时间');
    }

    if (!gate_no) {
      errors.push('必须指定闸口');
    }

    if (container_id) {
      const container = this.db.prepare(
        'SELECT * FROM containers WHERE id = ?'
      ).get(container_id);
      
      if (!container) {
        errors.push('集装箱不存在');
      }
    }

    if (appointment_time) {
      const appointmentDate = new Date(appointment_time);
      const now = new Date();
      
      if (appointmentDate < now) {
        errors.push('预约时间不能早于当前时间');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  lockGate(gateNo, taskId, operatorId) {
    const transaction = this.db.transaction(() => {
      const existingLock = this.db.prepare(
        'SELECT * FROM gate_locks WHERE gate_no = ?'
      ).get(gateNo);

      if (existingLock) {
        const lockTime = new Date(existingLock.locked_at);
        const now = new Date();
        const diffMinutes = (now - lockTime) / (1000 * 60);
        
        if (diffMinutes < 30) {
          throw new Error(`闸口${gateNo}已被锁定，请稍后再试`);
        }
      }

      if (existingLock) {
        this.db.prepare(`
          UPDATE gate_locks 
          SET locked_by = ?, locked_at = CURRENT_TIMESTAMP, task_id = ?
          WHERE gate_no = ?
        `).run(operatorId, taskId, gateNo);
      } else {
        this.db.prepare(`
          INSERT INTO gate_locks (id, gate_no, locked_by, locked_at, task_id)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        `).run(`gl${Date.now()}`, gateNo, operatorId, taskId);
      }

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error('闸口锁定失败:', error);
      return { success: false, message: error.message };
    }
  }

  unlockGate(gateNo) {
    const deleteLock = this.db.prepare(`
      DELETE FROM gate_locks WHERE gate_no = ?
    `);
    const result = deleteLock.run(gateNo);
    return result.changes > 0;
  }

  isGateLocked(gateNo) {
    const lock = this.db.prepare(
      'SELECT * FROM gate_locks WHERE gate_no = ?'
    ).get(gateNo);

    if (!lock) return false;

    const lockTime = new Date(lock.locked_at);
    const now = new Date();
    const diffMinutes = (now - lockTime) / (1000 * 60);

    return diffMinutes < 30;
  }

  getAvailableGates() {
    const gates = ['G01', 'G02', 'G03', 'G04', 'G05'];
    const availableGates = [];

    for (const gate of gates) {
      const locked = this.isGateLocked(gate);
      if (!locked) {
        availableGates.push(gate);
      }
    }

    return availableGates;
  }

  checkIn(appointmentId, actualTime) {
    const transaction = this.db.transaction(() => {
      const appointment = this.db.prepare(
        'SELECT * FROM gate_appointments WHERE id = ?'
      ).get(appointmentId);

      if (!appointment) {
        throw new Error('预约不存在');
      }

      if (appointment.status === 'CHECKED_IN') {
        throw new Error('该预约已完成入场');
      }

      this.db.prepare(`
        UPDATE gate_appointments 
        SET status = 'CHECKED_IN', actual_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(actualTime || new Date().toISOString(), appointmentId);

      const container = this.db.prepare(
        'SELECT * FROM containers WHERE id = ?'
      ).get(appointment.container_id);

      if (container) {
        this.db.prepare(`
          UPDATE containers 
          SET status = 'ARRIVED_AT_GATE', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(appointment.container_id);
      }

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error('入场检查失败:', error);
      return { success: false, message: error.message };
    }
  }

  checkOut(appointmentId) {
    const transaction = this.db.transaction(() => {
      const appointment = this.db.prepare(
        'SELECT * FROM gate_appointments WHERE id = ?'
      ).get(appointmentId);

      if (!appointment) {
        throw new Error('预约不存在');
      }

      this.db.prepare(`
        UPDATE gate_appointments 
        SET status = 'CHECKED_OUT', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(appointmentId);

      const container = this.db.prepare(
        'SELECT * FROM containers WHERE id = ?'
      ).get(appointment.container_id);

      if (container) {
        this.db.prepare(`
          UPDATE containers 
          SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(appointment.container_id);
      }

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error('出场检查失败:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = GateRuleEngine;
