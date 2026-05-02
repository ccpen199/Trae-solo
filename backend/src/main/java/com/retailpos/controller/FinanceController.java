package com.retailpos.controller;

import com.retailpos.engine.DailySettlementEngine;
import com.retailpos.dto.DailySettlementDTO;
import com.retailpos.dto.TransactionFlowDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final DailySettlementEngine dailySettlementEngine;

    @PostMapping("/settlement/daily")
    public Result<DailySettlementDTO> generateDailySettlement(@RequestBody Map<String, Object> params) {
        Long storeId = Long.valueOf(params.get("storeId").toString());
        LocalDate date = LocalDate.parse(params.get("date").toString());

        DailySettlementDTO result = dailySettlementEngine.generateDailySettlement(storeId, date);
        return Result.success(result);
    }

    @GetMapping("/settlement/{date}")
    public Result<DailySettlementDTO> getSettlement(@RequestParam Long storeId,
                                                     @PathVariable @DateTimeFormat LocalDate date) {
        DailySettlementDTO result = dailySettlementEngine.generateDailySettlement(storeId, date);
        return Result.success(result);
    }

    @GetMapping("/flow")
    public Result<List<TransactionFlowDTO>> getTransactionFlow(@RequestParam Long storeId,
                                                                 @RequestParam @DateTimeFormat LocalDate date) {
        List<TransactionFlowDTO> flows = dailySettlementEngine.getTransactionFlow(storeId, date);
        return Result.success(flows);
    }

    @GetMapping("/summary")
    public Result<Map<String, Object>> getSummary(@RequestParam Long storeId,
                                                     @RequestParam @DateTimeFormat LocalDate startDate,
                                                     @RequestParam @DateTimeFormat LocalDate endDate) {
        Map<String, Object> summary = dailySettlementEngine.getSettlementSummary(storeId, startDate, endDate);
        return Result.success(summary);
    }

    @GetMapping("/export")
    public Result<String> exportReport(@RequestParam Long storeId,
                                        @RequestParam @DateTimeFormat LocalDate startDate,
                                        @RequestParam @DateTimeFormat LocalDate endDate) {
        log.info("导出报表请求: storeId={}, startDate={}, endDate={}", storeId, startDate, endDate);
        return Result.success("报表导出任务已提交");
    }
}
