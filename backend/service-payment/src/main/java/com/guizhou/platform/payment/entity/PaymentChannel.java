package com.guizhou.platform.payment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("payment_channel")
public class PaymentChannel extends BaseEntity {

    private String channelCode;

    private String channelName;

    private Integer channelType;

    private String appId;

    private String mchId;

    private String apiKey;

    private String certPath;

    private String notifyUrl;

    private BigDecimal feeRate;

    private Integer enabled;

    private Integer supportedBillTypes;

    private Integer priority;

    private BigDecimal singleLimit;

    private BigDecimal dailyLimit;

    private BigDecimal dailyUsed;

    private String remark;
}
