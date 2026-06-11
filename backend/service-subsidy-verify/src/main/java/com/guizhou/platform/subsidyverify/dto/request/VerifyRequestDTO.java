package com.guizhou.platform.subsidyverify.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class VerifyRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "补贴凭证ID不能为空")
    private Long voucherId;

    @NotNull(message = "商户ID不能为空")
    private Long merchantId;

    @NotNull(message = "原始金额不能为空")
    @DecimalMin(value = "0.01", message = "原始金额必须大于0")
    private BigDecimal originalAmount;

    @NotNull(message = "补贴金额不能为空")
    @DecimalMin(value = "0.01", message = "补贴金额必须大于0")
    private BigDecimal subsidyAmount;

    private BigDecimal selfPayAmount;

    private Integer verifyType;

    private String verifyPlace;

    private String verifyDevice;

    private String verifyItems;

    private String remark;
}
