package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("transaction")
public class Transaction {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String transactionNo;
    private Long storeId;
    private Long cashierId;
    private Long memberId;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal actualAmount;
    private String paymentMethod;
    private Integer pointsUsed;
    private BigDecimal pointsDiscount;
    private Long couponId;
    private BigDecimal couponDiscount;
    private String status;
    private LocalDateTime transactionTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
