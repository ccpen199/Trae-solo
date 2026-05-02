package com.retailpos.controller;

import com.retailpos.dto.DashboardDTO;
import com.retailpos.dto.DailySettlementDTO;
import com.retailpos.dto.TransactionFlowDTO;
import com.retailpos.engine.DailySettlementEngine;
import com.retailpos.entity.Inventory;
import com.retailpos.entity.Product;
import com.retailpos.mapper.InventoryMapper;
import com.retailpos.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final DailySettlementEngine dailySettlementEngine;
    private final InventoryMapper inventoryMapper;
    private final ProductMapper productMapper;

    @GetMapping("/dashboard")
    public Result<DashboardDTO> getDashboard(@RequestParam Long storeId) {
        LocalDate today = LocalDate.now();

        DailySettlementDTO todaySettlement = dailySettlementEngine.generateDailySettlement(storeId, today);

        DashboardDTO dashboard = new DashboardDTO();
        dashboard.setTodaySales(todaySettlement.getTotalSales());
        dashboard.setTodayRefund(todaySettlement.getTotalRefund());
        dashboard.setTodayTransactions(todaySettlement.getTransactionCount());

        List<Inventory> lowStockItems = inventoryMapper.selectList(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .le(Inventory::getQuantity, 10)
        );
        dashboard.setLowStockCount(lowStockItems.size());

        Map<String, Object> monthSummary = dailySettlementEngine.getSettlementSummary(
                storeId, today.withDayOfMonth(1), today);
        dashboard.setMonthSales((BigDecimal) monthSummary.get("totalSales"));

        return Result.success(dashboard);
    }

    @GetMapping("/realtime-sales")
    public Result<Map<String, Object>> getRealtimeSales(@RequestParam Long storeId) {
        LocalDate today = LocalDate.now();
        List<TransactionFlowDTO> flows = dailySettlementEngine.getTransactionFlow(storeId, today);

        BigDecimal totalAmount = flows.stream()
                .filter(f -> "COMPLETED".equals(f.getStatus()))
                .map(TransactionFlowDTO::getActualAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new HashMap<>();
        result.put("totalAmount", totalAmount);
        result.put("transactionCount", flows.size());
        result.put("transactions", flows);

        return Result.success(result);
    }

    @GetMapping("/inventory-alert")
    public Result<List<Map<String, Object>>> getInventoryAlert(@RequestParam Long storeId) {
        List<Inventory> lowStockItems = inventoryMapper.selectList(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .le(Inventory::getQuantity, 10)
        );

        List<Map<String, Object>> alerts = lowStockItems.stream().map(inv -> {
            Product product = productMapper.selectById(inv.getProductId());
            Map<String, Object> alert = new HashMap<>();
            alert.put("productId", inv.getProductId());
            alert.put("productName", product != null ? product.getProductName() : "未知商品");
            alert.put("currentStock", inv.getQuantity());
            alert.put("lowStockThreshold", inv.getLowStockThreshold());
            return alert;
        }).collect(Collectors.toList());

        return Result.success(alerts);
    }

    @GetMapping("/product-sales")
    public Result<List<Map<String, Object>>> getProductSales(@RequestParam Long storeId,
                                                               @RequestParam(required = false) String startDate,
                                                               @RequestParam(required = false) String endDate) {
        List<Map<String, Object>> salesData = new java.util.ArrayList<>();
        return Result.success(salesData);
    }
}
