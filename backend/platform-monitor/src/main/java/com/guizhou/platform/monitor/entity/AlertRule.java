package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("alert_rule")
public class AlertRule extends BaseEntity {

    private String ruleCode;

    private String ruleName;

    private String ruleType;

    private String alertLevel;

    private String metricName;

    private String operator;

    private BigDecimal threshold;

    private Integer durationSeconds;

    private Integer consecutiveCount;

    private Boolean enabled;

    private String notifyChannels;

    private String description;
}
