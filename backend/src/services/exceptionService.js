const { generateId } = require('../utils');

class ExceptionService {
  constructor(db) {
    this.db = db;
  }

  createException(exceptionType, relatedType, relatedId, description, originalData) {
    const id = generateId();
    
    const insert = this.db.prepare(`
      INSERT INTO exceptions (
        id, exception_type, related_type, related_id, 
        description, original_data, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      exceptionType,
      relatedType,
      relatedId,
      description,
      JSON.stringify(originalData),
      'PENDING'
    );

    return {
      success: true,
      exceptionId: id
    };
  }

  handleLocationDrift(containerId, currentLocation, expectedLocation, driftDistance) {
    return this.createException(
      'LOCATION_DRIFT',
      'CONTAINER',
      containerId,
      `定位漂移: 当前位置 ${currentLocation}, 期望位置 ${expectedLocation}, 漂移距离 ${driftDistance}米`,
      {
        containerId,
        currentLocation,
        expectedLocation,
        driftDistance,
        timestamp: new Date().toISOString()
      }
    );
  }

  handleRouteDeviation(containerId, currentRoute, expectedRoute, deviationPercentage) {
    return this.createException(
      'ROUTE_DEVIATION',
      'CONTAINER',
      containerId,
      `路线偏离: 当前路线偏离度 ${deviationPercentage}%`,
      {
        containerId,
        currentRoute,
        expectedRoute,
        deviationPercentage,
        timestamp: new Date().toISOString()
      }
    );
  }

  handleDriverReject(taskId, driverId, reason) {
    return this.createException(
      'DRIVER_REJECT',
      'TASK',
      taskId,
      `司机拒接: 司机ID ${driverId}, 原因: ${reason}`,
      {
        taskId,
        driverId,
        reason,
        timestamp: new Date().toISOString()
      }
    );
  }

  handleArrivalUnconfirmed(containerId, expectedArrivalTime, actualTime) {
    return this.createException(
      'ARRIVAL_UNCONFIRMED',
      'CONTAINER',
      containerId,
      `到达未确认: 期望到达时间 ${expectedArrivalTime}, 当前时间 ${actualTime}`,
      {
        containerId,
        expectedArrivalTime,
        actualTime,
        timestamp: new Date().toISOString()
      }
    );
  }

  handleMapCallbackDelay(mapProvider, callbackData, delaySeconds) {
    return this.createException(
      'MAP_CALLBACK_DELAY',
      'EXTERNAL',
      mapProvider,
      `第三方地图回调延迟: 延迟 ${delaySeconds}秒`,
      {
        mapProvider,
        callbackData,
        delaySeconds,
        timestamp: new Date().toISOString()
      }
    );
  }

  getPendingExceptions() {
    return this.db.prepare(`
      SELECT * FROM exceptions 
      WHERE status = 'PENDING' 
      ORDER BY created_at DESC
    `).all();
  }

  getExceptionsByType(exceptionType) {
    return this.db.prepare(`
      SELECT * FROM exceptions 
      WHERE exception_type = ? 
      ORDER BY created_at DESC
    `).all(exceptionType);
  }

  resolveException(exceptionId, handlerId, resolution) {
    const transaction = this.db.transaction(() => {
      const exception = this.db.prepare(
        'SELECT * FROM exceptions WHERE id = ?'
      ).get(exceptionId);

      if (!exception) {
        throw new Error('异常记录不存在');
      }

      if (exception.status === 'RESOLVED') {
        throw new Error('该异常已被处理');
      }

      this.db.prepare(`
        UPDATE exceptions 
        SET status = 'RESOLVED', handled_by = ?, handled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(handlerId, exceptionId);

      this.db.prepare(`
        INSERT INTO operation_logs (
          id, user_id, operation, table_name, record_id, after_data
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        generateId(),
        handlerId,
        'RESOLVE_EXCEPTION',
        'exceptions',
        exceptionId,
        JSON.stringify({ resolution })
      );

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error('处理异常失败:', error);
      return { success: false, message: error.message };
    }
  }

  getExceptionStatistics() {
    return this.db.prepare(`
      SELECT 
        exception_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved
      FROM exceptions
      GROUP BY exception_type
    `).all();
  }
}

module.exports = ExceptionService;
