package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("risk_rule")
public class RiskRule extends BaseEntity {

    private String ruleCode;

    private String ruleName;

    private String ruleType;

    private Integer riskLevel;

    private Integer riskScore;

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
