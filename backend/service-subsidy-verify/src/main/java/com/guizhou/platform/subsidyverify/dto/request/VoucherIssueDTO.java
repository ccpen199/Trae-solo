package com.guizhou.platform.subsidyverify.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class VoucherIssueDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "政策ID不能为空")
    private Long policyId;

    @NotBlank(message = "政策编号不能为空")
    private String policyCode;

    @NotBlank(message = "政策名称不能为空")
    private String policyName;

    @NotNull(message = "受益人ID不能为空")
    private Long beneficiaryId;

    @NotBlank(message = "受益人姓名不能为空")
    private String beneficiaryName;

    @NotBlank(message = "身份证号不能为空")
    private String idCard;

    @NotNull(message = "凭证金额不能为空")
    @DecimalMin(value = "0.01", message = "凭证金额必须大于0")
    private BigDecimal totalAmount;

    private String issueBatchNo;

    private String issueReason;

    private String remark;
}
