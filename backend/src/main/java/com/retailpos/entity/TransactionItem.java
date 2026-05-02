package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("transaction_item")
public class TransactionItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long transactionId;
    private Long productId;
    private String productName;
    private String barcode;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountRate;
    private BigDecimal subtotal;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
