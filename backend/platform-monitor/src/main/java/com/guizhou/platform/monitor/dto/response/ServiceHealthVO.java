package com.guizhou.platform.monitor.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ServiceHealthVO {

    private Long serviceId;

    private String serviceCode;

    private String serviceName;

    private String serviceGroup;

    private String status;

    private LocalDateTime lastProbeTime;

    private Long lastResponseTime;

    private Integer consecutiveFailures;

    private Double availability;

    private Double avgResponseTime;

    private Double errorRate;

    private String instanceHost;

    private Integer instancePort;
}
