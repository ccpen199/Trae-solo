package com.fooddelivery.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.entity.AuditLog;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.mapper.AuditLogMapper;
import com.fooddelivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogMapper auditLogMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void logCreate(String businessType, Long businessId, String businessNo,
                           Long operatorId, String operatorRole, AuditSource source, String detail) {
        saveAuditLog(businessType, businessId, businessNo,
            source, operatorId, operatorRole,
            "CREATE", "创建",
            null, null, null, null,
            detail, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void logUpdate(String businessType, Long businessId, String businessNo,
                          Long operatorId, String operatorRole, AuditSource source, String detail) {
        saveAuditLog(businessType, businessId, businessNo,
            source, operatorId, operatorRole,
            "UPDATE", "更新",
            null, null, null, null,
            detail, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void logDelete(String businessType, Long businessId, String businessNo,
                          Long operatorId, String operatorRole, AuditSource source, String detail) {
        saveAuditLog(businessType, businessId, businessNo,
            source, operatorId, operatorRole,
            "DELETE", "删除",
            null, null, null, null,
            detail, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void logStatusChange(String businessType, Long businessId, String businessNo,
                                Integer fromStatus, String fromStatusName,
                                Integer toStatus, String toStatusName,
                                String eventCode, String eventName,
                                Long operatorId, String operatorRole,
                                AuditSource source, String reason, String extInfo) {
        saveAuditLog(businessType, businessId, businessNo,
            source, operatorId, operatorRole,
            eventCode, eventName,
            fromStatus, fromStatusName, toStatus, toStatusName,
            reason, extInfo);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void logEngineProcess(String engineType, Long businessId, String businessNo,
                                  String action, String detail, String calculationBasis) {
        AuditLog auditLog = new AuditLog();
        auditLog.setTraceId(IdUtil.simpleUUID());
        auditLog.setBusinessType(engineType);
        auditLog.setBusinessId(businessId);
        auditLog.setBusinessNo(businessNo);
        auditLog.setSourceType(AuditSource.SYSTEM_AUTO.getCode());
        auditLog.setSourceName(AuditSource.SYSTEM_AUTO.getName());
        auditLog.setAction(action);
        auditLog.setActionName(engineType + "引擎处理");
        auditLog.setDetail(detail);
        auditLog.setOperateTime(LocalDateTime.now());
        
        StringBuilder extInfo = new StringBuilder();
        extInfo.append("{\"engineType\":\"").append(engineType).append("\"");
        if (calculationBasis != null) {
            extInfo.append(",\"calculationBasis\":").append(calculationBasis);
        }
        extInfo.append("}");
        auditLog.setExtInfo(extInfo.toString());
        
        auditLogMapper.insert(auditLog);
        log.debug("引擎处理审计日志: engineType={}, businessId={}, action={}", engineType, businessId, action);
    }

    private void saveAuditLog(String businessType, Long businessId, String businessNo,
                               AuditSource source, Long operatorId, String operatorRole,
                               String action, String actionName,
                               Integer fromStatus, String fromStatusName,
                               Integer toStatus, String toStatusName,
                               String detail, String extInfo) {
        AuditLog auditLog = new AuditLog();
        auditLog.setTraceId(IdUtil.simpleUUID());
        auditLog.setBusinessType(businessType);
        auditLog.setBusinessId(businessId);
        auditLog.setBusinessNo(businessNo);
        auditLog.setSourceType(source.getCode());
        auditLog.setSourceName(source.getName());
        auditLog.setOperatorId(operatorId);
        auditLog.setOperatorRole(operatorRole);
        auditLog.setAction(action);
        auditLog.setActionName(actionName);
        auditLog.setFromStatus(fromStatus);
        auditLog.setFromStatusName(fromStatusName);
        auditLog.setToStatus(toStatus);
        auditLog.setToStatusName(toStatusName);
        auditLog.setDetail(detail);
        auditLog.setOperateTime(LocalDateTime.now());
        auditLog.setExtInfo(extInfo);
        
        auditLogMapper.insert(auditLog);
        log.debug("保存审计日志: type={}, id={}, action={}", businessType, businessId, action);
    }

    @Override
    public List<AuditLog> getTraceLog(String businessType, Long businessId) {
        return auditLogMapper.selectList(
            new LambdaQueryWrapper<AuditLog>()
                .eq(AuditLog::getBusinessType, businessType)
                .eq(AuditLog::getBusinessId, businessId)
                .orderByAsc(AuditLog::getOperateTime)
        );
    }

    @Override
    public List<AuditLog> getTraceLogByNo(String businessType, String businessNo) {
        return auditLogMapper.selectList(
            new LambdaQueryWrapper<AuditLog>()
                .eq(AuditLog::getBusinessType, businessType)
                .eq(AuditLog::getBusinessNo, businessNo)
                .orderByAsc(AuditLog::getOperateTime)
        );
    }
}
