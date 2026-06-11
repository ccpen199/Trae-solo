package com.guizhou.platform.payment.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentOrderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String orderNo;

    private Long userId;

    private String userName;

    private Integer billType;

    private String billTypeName;

    private String accountNo;

    private String accountName;

    private String accountAddr;

    private BigDecimal payAmount;

    private BigDecimal penaltyAmount;

    private BigDecimal totalAmount;

    private Integer paymentChannel;

    private String channelName;

    private String channelOrderNo;

    private Integer paymentStatus;

    private String paymentStatusDesc;

    private LocalDateTime payTime;

    private LocalDateTime expireTime;

    private String billPeriod;

    private String billNo;

    private String companyCode;

    private String companyName;

    private String remark;

    private LocalDateTime createTime;
}
