package com.guizhou.platform.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class CreateOrderDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    private String userName;

    @NotNull(message = "账单类型不能为空")
    private Integer billType;

    @NotBlank(message = "户号不能为空")
    private String accountNo;

    private String accountName;

    private String accountAddr;

    @NotBlank(message = "缴费金额不能为空")
    private String payAmount;

    private String penaltyAmount;

    @NotNull(message = "缴费渠道不能为空")
    private Integer paymentChannel;

    private String billPeriod;

    private String billNo;

    private String companyCode;

    private String remark;
}
