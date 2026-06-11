package com.guizhou.platform.monitor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SlaReportVO {

    private Long agreementId;

    private String agreementCode;

    private String serviceCode;

    private String serviceName;

    private LocalDate checkMonth;

    private BigDecimal actualAvailability;

    private BigDecimal availabilityTarget;

    private BigDecimal avgResponseTime;

    private BigDecimal responseTimeTarget;

    private BigDecimal errorRate;

    private BigDecimal errorRateTarget;

    private Long totalRequests;

    private Long failedRequests;

    private BigDecimal downtimeMinutes;

    private String checkStatus;

    private String checkResult;
}
