package com.guizhou.platform.payment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("payment_order")
public class PaymentOrder extends BaseEntity {

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

    private String channelOrderNo;

    private Integer paymentStatus;

    private LocalDateTime payTime;

    private LocalDateTime expireTime;

    private String billPeriod;

    private String billNo;

    private String companyCode;

    private String companyName;

    private String callbackData;

    private Integer notifyCount;

    private LocalDateTime lastNotifyTime;

    private String remark;
}
