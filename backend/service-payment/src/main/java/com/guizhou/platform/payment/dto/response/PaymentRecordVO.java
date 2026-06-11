package com.guizhou.platform.payment.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentRecordVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long orderId;

    private String orderNo;

    private Long userId;

    private String userName;

    private Integer billType;

    private String billTypeName;

    private String accountNo;

    private String accountName;

    private BigDecimal payAmount;

    private Integer paymentChannel;

    private String channelName;

    private String channelOrderNo;

    private Integer paymentStatus;

    private String paymentStatusDesc;

    private LocalDateTime payTime;

    private BigDecimal refundAmount;

    private LocalDateTime refundTime;

    private String companyCode;

    private String companyName;
}
