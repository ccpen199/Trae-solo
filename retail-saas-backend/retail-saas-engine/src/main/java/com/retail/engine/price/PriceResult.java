package com.retail.engine.price;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PriceResult {

    private Long productId;

    private Long priceSystemId;

    private String priceSystemCode;

    private String priceSystemName;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private BigDecimal costPrice;

    private BigDecimal margin;

    private BigDecimal marginRate;

    private LocalDateTime effectiveTime;

    private LocalDateTime expireTime;

    private String versionNo;

    private boolean isPromotion;

    private String promotionName;
}
