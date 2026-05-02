package com.fooddelivery.controller;

import com.fooddelivery.dto.CommonResponse;
import com.fooddelivery.engine.StatisticsEngine;
import com.fooddelivery.service.AuditLogService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsEngine statisticsEngine;
    private final AuditLogService auditLogService;

    @GetMapping("/overview")
    public CommonResponse.Result<StatisticsEngine.StatisticsOverview> getOverview(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String date) {
        
        LocalDate statisticsDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        
        StatisticsEngine.StatisticsOverview overview = statisticsEngine.getStatisticsOverview(storeId, statisticsDate);
        
        log.info("获取统计概览: storeId={}, date={}", storeId, statisticsDate);
        return CommonResponse.Result.success(overview);
    }

    @GetMapping("/daily")
    public CommonResponse.Result<?> getDailyStatistics(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        
        return CommonResponse.Result.success();
    }

    @GetMapping("/goods-sales")
    public CommonResponse.Result<?> getGoodsSalesStatistics(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        
        return CommonResponse.Result.success();
    }

    @PostMapping("/calculate")
    public CommonResponse.Result<?> calculateDailyStatistics(
            @RequestParam Long storeId,
            @RequestParam String date) {
        
        LocalDate statisticsDate = LocalDate.parse(date);
        var result = statisticsEngine.calculateDailyStatistics(storeId, null, statisticsDate);
        
        log.info("手动计算日统计: storeId={}, date={}", storeId, date);
        return CommonResponse.Result.success(result);
    }

    @GetMapping("/audit/trace")
    public CommonResponse.Result<?> getAuditTrace(
            @RequestParam String businessType,
            @RequestParam(required = false) Long businessId,
            @RequestParam(required = false) String businessNo) {
        
        var logs = businessId != null 
            ? auditLogService.getTraceLog(businessType, businessId)
            : auditLogService.getTraceLogByNo(businessType, businessNo);
        
        return CommonResponse.Result.success(logs);
    }
}
