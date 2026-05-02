package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("price_version")
public class PriceVersion extends BaseEntity {

    private Long productId;

    private Long priceSystemId;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private LocalDateTime effectiveTime;

    private LocalDateTime expireTime;

    private String versionNo;

    private String status;

    private Long auditBy;

    private LocalDateTime auditTime;
}
