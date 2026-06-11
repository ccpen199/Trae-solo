package com.guizhou.platform.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class PayCallbackDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "订单号不能为空")
    private String orderNo;

    @NotNull(message = "缴费渠道不能为空")
    private Integer paymentChannel;

    @NotBlank(message = "渠道订单号不能为空")
    private String channelOrderNo;

    private String callbackData;

    private Integer paymentStatus;

    private String failReason;
}
