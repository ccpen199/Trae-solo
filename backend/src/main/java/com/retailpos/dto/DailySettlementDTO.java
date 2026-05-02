package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DailySettlementDTO {
    private Long id;
    private Long storeId;
    private String storeName;
    private LocalDate settlementDate;
    private BigDecimal totalSales;
    private BigDecimal totalRefund;
    private BigDecimal totalDiscount;
    private BigDecimal cashSales;
    private BigDecimal cardSales;
    private BigDecimal wechatSales;
    private BigDecimal alipaySales;
    private Integer pointsRedeemed;
    private Integer pointsEarned;
    private Integer couponsUsed;
    private Integer transactionCount;
    private Integer refundCount;
}
