package com.retail.engine.inventory;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StockOperationResult {

    private boolean success;

    private String message;

    private Long orgId;

    private Long productId;

    private BigDecimal beforeQty;

    private BigDecimal changeQty;

    private BigDecimal afterQty;

    private Long journalId;
}
