package com.guizhou.platform.datashare.controller;

import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.datashare.dto.ApiVisitLogQueryDTO;
import com.guizhou.platform.datashare.entity.ApiVisitLog;
import com.guizhou.platform.datashare.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Tag(name = "审计日志管理", description = "审计日志查询、统计和区块链存证接口")
@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Operation(summary = "获取日志详情")
    @GetMapping("/{id}")
    public Result<ApiVisitLog> getLog(@Parameter(description = "日志ID") @PathVariable Long id) {
        return Result.success(auditLogService.getLog(id));
    }

    @Operation(summary = "分页查询审计日志")
    @PostMapping("/query")
    public Result<PageResult<ApiVisitLog>> queryLogs(@RequestBody ApiVisitLogQueryDTO dto) {
        return Result.success(auditLogService.queryLogs(dto));
    }

    @Operation(summary = "获取访问统计")
    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics(
            @Parameter(description = "开始时间") @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        return Result.success(auditLogService.getStatistics(startTime, endTime));
    }

    @Operation(summary = "验证区块链存证")
    @GetMapping("/verify/{logId}")
    public Result<Boolean> verifyBlockchainHash(@Parameter(description = "日志ID") @PathVariable Long logId) {
        return Result.success(auditLogService.verifyBlockchainHash(logId));
    }
}
