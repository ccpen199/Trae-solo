package com.guizhou.platform.monitor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AlertRuleDTO {

    @NotBlank(message = "规则编码不能为空")
    private String ruleCode;

    @NotBlank(message = "规则名称不能为空")
    private String ruleName;

    @NotBlank(message = "规则类型不能为空")
    private String ruleType;

    @NotBlank(message = "告警级别不能为空")
    private String alertLevel;

    @NotBlank(message = "指标名称不能为空")
    private String metricName;

    @NotBlank(message = "比较运算符不能为空")
    private String operator;

    @NotNull(message = "阈值不能为空")
    private BigDecimal threshold;

    private Integer durationSeconds;

    private Integer consecutiveCount;

    @NotNull(message = "是否启用不能为空")
    private Boolean enabled;

    private String notifyChannels;

    private String description;
}
