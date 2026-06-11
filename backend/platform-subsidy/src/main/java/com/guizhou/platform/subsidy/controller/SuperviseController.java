package com.guizhou.platform.subsidy.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidy.entity.SubsidyAuditLog;
import com.guizhou.platform.subsidy.entity.SubsidyVerifyRecord;
import com.guizhou.platform.subsidy.service.SuperviseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Tag(name = "资金监管", description = "审计日志、核销管理、穿透分析")
@RestController
@RequestMapping("/api/supervise")
public class SuperviseController {

    @Resource
    private SuperviseService superviseService;

    @Operation(summary = "获取监管仪表盘数据")
    @GetMapping("/dashboard")
    public Result<Map<String, Object>> getSuperviseDashboard() {
        return Result.success(superviseService.getSuperviseDashboard());
    }

    @Operation(summary = "获取业务审计日志")
    @GetMapping("/audit-log")
    public Result<List<SubsidyAuditLog>> getAuditLogs(@RequestParam String businessType,
                                                      @RequestParam Long businessId) {
        return Result.success(superviseService.getAuditLogs(businessType, businessId));
    }

    @Operation(summary = "创建核销记录")
    @PostMapping("/verify")
    public Result<String> createVerifyRecord(@RequestParam Long grantId,
                                             @RequestParam String merchantId,
                                             @RequestParam String merchantName,
                                             @RequestParam BigDecimal originalAmount,
                                             @RequestParam BigDecimal subsidyAmount,
                                             @RequestParam BigDecimal selfPayAmount,
                                             @RequestParam(required = false) String certificateNo,
                                             @RequestParam(required = false) String verifyPlace,
                                             @RequestParam(required = false) String verifyItems) {
        return Result.success(superviseService.createVerifyRecord(
                grantId, merchantId, merchantName, originalAmount, subsidyAmount,
                selfPayAmount, certificateNo, verifyPlace, verifyItems));
    }

    @Operation(summary = "审核核销记录")
    @PostMapping("/verify/{id}/audit")
    public Result<Void> auditVerifyRecord(@PathVariable Long id,
                                          @RequestParam Boolean passed,
                                          @RequestParam String auditorId,
                                          @RequestParam String auditorName,
                                          @RequestParam(required = false) String opinion) {
        superviseService.auditVerifyRecord(id, passed, auditorId, auditorName, opinion);
        return Result.success();
    }

    @Operation(summary = "获取补贴下的核销记录")
    @GetMapping("/verify/grant/{grantId}")
    public Result<List<SubsidyVerifyRecord>> getVerifyRecordsByGrant(@PathVariable Long grantId) {
        return Result.success(superviseService.getVerifyRecordsByGrant(grantId));
    }

    @Operation(summary = "获取受益人核销记录")
    @GetMapping("/verify/beneficiary/{beneficiaryId}")
    public Result<List<SubsidyVerifyRecord>> getVerifyRecordsByBeneficiary(@PathVariable String beneficiaryId) {
        return Result.success(superviseService.getVerifyRecordsByBeneficiary(beneficiaryId));
    }

    @Operation(summary = "穿透分析")
    @GetMapping("/penetration")
    public Result<List<Map<String, Object>>> getPenetrationAnalysis(
            @RequestParam String dimension,
            @RequestParam String value) {
        return Result.success(superviseService.getPenetrationAnalysis(dimension, value));
    }
}
