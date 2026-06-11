package com.guizhou.platform.monitor.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.monitor.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;

@Tag(name = "监控报表", description = "可用性报表、告警统计、SLA达标率报表")
@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "生成服务可用性报表")
    @GetMapping("/availability")
    public Result<Map<String, Object>> generateAvailabilityReport(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        return Result.success(reportService.generateAvailabilityReport(startDate, endDate));
    }

    @Operation(summary = "生成告警统计报表")
    @GetMapping("/alert-statistics")
    public Result<Map<String, Object>> generateAlertStatistics(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        return Result.success(reportService.generateAlertStatistics(startDate, endDate));
    }

    @Operation(summary = "生成SLA达标率报表")
    @GetMapping("/sla-compliance")
    public Result<Map<String, Object>> generateSlaComplianceReport(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return Result.success(reportService.generateSlaComplianceReport(month));
    }
}
