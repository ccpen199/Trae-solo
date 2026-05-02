package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ReceiptDTO {
    private String transactionNo;
    private String storeName;
    private String cashierName;
    private LocalDateTime transactionTime;
    private String memberName;
    private Integer memberPoints;
    private String paymentMethod;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal actualAmount;
    private Integer pointsEarned;
    private Integer pointsUsed;
}
