package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionFlowDTO {
    private String transactionNo;
    private String cashierName;
    private String memberName;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal actualAmount;
    private String paymentMethod;
    private String status;
    private LocalDateTime transactionTime;
}
