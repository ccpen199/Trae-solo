package com.guizhou.platform.subsidy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GrantApplyDTO {

    @NotNull(message = "政策ID不能为空")
    private Long policyId;

    @NotBlank(message = "受益对象类型不能为空")
    private String beneficiaryType;

    @NotBlank(message = "受益对象ID不能为空")
    private String beneficiaryId;

    @NotBlank(message = "受益对象姓名不能为空")
    private String beneficiaryName;

    @NotBlank(message = "身份证号不能为空")
    private String idCard;

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "银行账号不能为空")
    private String bankAccount;

    @NotBlank(message = "开户行名称不能为空")
    private String bankName;

    private String bankCode;

    @NotNull(message = "申请金额不能为空")
    private BigDecimal applyAmount;

    private String applyReason;

    private String applyMaterials;
}
