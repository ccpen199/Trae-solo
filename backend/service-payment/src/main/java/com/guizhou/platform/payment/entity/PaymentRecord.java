package com.guizhou.platform.payment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("payment_record")
public class PaymentRecord extends BaseEntity {

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

    private LocalDateTime payTime;

    private BigDecimal refundAmount;

    private LocalDateTime refundTime;

    private String refundReason;

    private String companyCode;

    private String companyName;

    private String remark;
}
