package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ScanResultDTO {
    private Long productId;
    private String barcode;
    private String productName;
    private BigDecimal price;
    private Integer quantity;
    private Integer availableStock;
    private String unit;
    private BigDecimal memberPrice;
    private boolean found;
    private String message;
}
