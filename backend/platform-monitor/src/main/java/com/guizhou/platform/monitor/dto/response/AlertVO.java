package com.guizhou.platform.monitor.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AlertVO {

    private Long id;

    private String alertNo;

    private String ruleCode;

    private String ruleName;

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

    private String handlerName;

    private LocalDateTime handleTime;
}
