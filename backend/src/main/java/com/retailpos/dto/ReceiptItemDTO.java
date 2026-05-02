package com.retailpos.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReceiptItemDTO {
    private String productName;
    private Integer quantity;
    private String unitPrice;
    private String subtotal;
}
