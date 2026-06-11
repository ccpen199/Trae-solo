package com.guizhou.platform.subsidy.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidy.entity.SubsidyAuditLog;
import com.guizhou.platform.subsidy.entity.SubsidyVerifyRecord;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface SuperviseService extends IService<SubsidyAuditLog> {

    void recordAuditLog(String businessType, Long businessId, String businessNo,
                        Integer operationType, String operationName,
                        Long operatorId, String operatorName, String operatorDept,
                        String beforeData, String afterData, String changeContent);

    List<SubsidyAuditLog> getAuditLogs(String businessType, Long businessId);

    String createVerifyRecord(Long grantId, String merchantId, String merchantName,
                              BigDecimal originalAmount, BigDecimal subsidyAmount,
                              BigDecimal selfPayAmount, String certificateNo,
                              String verifyPlace, String verifyItems);

    void auditVerifyRecord(Long verifyId, Boolean passed, String auditorId,
                           String auditorName, String opinion);

    List<SubsidyVerifyRecord> getVerifyRecordsByGrant(Long grantId);

    List<SubsidyVerifyRecord> getVerifyRecordsByBeneficiary(String beneficiaryId);

    Map<String, Object> getSuperviseDashboard();

    List<Map<String, Object>> getPenetrationAnalysis(String dimension, String value);
}
