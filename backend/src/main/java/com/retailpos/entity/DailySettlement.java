package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("daily_settlement")
public class DailySettlement {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long storeId;
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
    private Long operatorId;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
