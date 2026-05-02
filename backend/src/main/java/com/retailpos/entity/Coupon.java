package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("coupon")
public class Coupon {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String couponCode;
    private String couponName;
    private String couponType;
    private BigDecimal discountValue;
    private BigDecimal minConsumption;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private Integer totalQuantity;
    private Integer remainQuantity;
    private String status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
