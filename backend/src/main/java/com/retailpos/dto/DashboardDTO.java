package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DashboardDTO {
    private BigDecimal todaySales;
    private BigDecimal todayRefund;
    private Integer todayTransactions;
    private Integer lowStockCount;
    private BigDecimal monthSales;
    private BigDecimal monthProfit;
}
