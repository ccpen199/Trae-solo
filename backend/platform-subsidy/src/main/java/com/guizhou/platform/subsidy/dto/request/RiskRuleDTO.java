package com.guizhou.platform.subsidy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RiskRuleDTO {

    @NotBlank(message = "规则编码不能为空")
    private String ruleCode;

    @NotBlank(message = "规则名称不能为空")
    private String ruleName;

    @NotBlank(message = "规则类型不能为空")
    private String ruleType;

    @NotNull(message = "风险等级不能为空")
    private Integer riskLevel;

    @NotNull(message = "风险分值不能为空")
    private Integer riskScore;

    @NotBlank(message = "规则表达式不能为空")
    private String ruleExpression;

    private String ruleDescription;

    private BigDecimal thresholdValue;

    private String thresholdUnit;

    private Integer timeWindow;

    private String timeWindowUnit;

    private Boolean enabled;

    private Boolean autoFreeze;

    private String warningTemplate;

    private Integer priority;

    private String remark;
}
