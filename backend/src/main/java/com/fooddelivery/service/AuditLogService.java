package com.fooddelivery.service;

import com.fooddelivery.entity.AuditLog;
import com.fooddelivery.enums.AuditSource;

import java.util.List;

public interface AuditLogService {

    void logCreate(String businessType, Long businessId, String businessNo,
                    Long operatorId, String operatorRole, AuditSource source, String detail);

    void logUpdate(String businessType, Long businessId, String businessNo,
                   Long operatorId, String operatorRole, AuditSource source, String detail);

    void logDelete(String businessType, Long businessId, String businessNo,
                   Long operatorId, String operatorRole, AuditSource source, String detail);

    void logStatusChange(String businessType, Long businessId, String businessNo,
                         Integer fromStatus, String fromStatusName,
                         Integer toStatus, String toStatusName,
                         String eventCode, String eventName,
                         Long operatorId, String operatorRole,
                         AuditSource source, String reason, String extInfo);

    void logEngineProcess(String engineType, Long businessId, String businessNo,
                          String action, String detail, String calculationBasis);

    List<AuditLog> getTraceLog(String businessType, Long businessId);

    List<AuditLog> getTraceLogByNo(String businessType, String businessNo);
}
