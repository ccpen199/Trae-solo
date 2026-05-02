package com.retail.engine.inventory;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StockAlert {

    private Long orgId;

    private String orgName;

    private Long productId;

    private String skuCode;

    private String skuName;

    private BigDecimal currentQty;

    private BigDecimal safetyStock;

    private BigDecimal shortageQty;

    private String alertLevel;
}
