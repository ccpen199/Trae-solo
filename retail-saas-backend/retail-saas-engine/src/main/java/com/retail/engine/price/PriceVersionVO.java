package com.retail.engine.price;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PriceVersionVO {

    private Long id;

    private Long productId;

    private Long priceSystemId;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private LocalDateTime effectiveTime;

    private LocalDateTime expireTime;

    private String versionNo;

    private String status;

    private String createBy;

    private LocalDateTime createTime;
}
