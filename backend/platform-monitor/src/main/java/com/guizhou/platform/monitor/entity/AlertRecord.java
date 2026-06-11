package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("alert_record")
public class AlertRecord extends BaseEntity {

    private String alertNo;

    private Long ruleId;

    private String ruleCode;

    private String ruleName;

    private Long serviceId;

    private String serviceCode;

    private String serviceName;

    private String alertLevel;

    private String alertType;

    private String metricName;

    private String currentValue;

    private String thresholdValue;

    private String alertMessage;

    private LocalDateTime alertTime;

    private String alertStatus;

    private String handlerId;

    private String handlerName;

    private LocalDateTime handleTime;

    private String handleOpinion;

    private String notifyChannels;

    private String notifyResult;
}
