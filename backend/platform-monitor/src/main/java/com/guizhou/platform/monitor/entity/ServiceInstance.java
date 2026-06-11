package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_instance")
public class ServiceInstance extends BaseEntity {

    private String serviceCode;

    private String serviceName;

    private String serviceGroup;

    private String healthUrl;

    private String instanceHost;

    private Integer instancePort;

    private String instanceUri;

    private String status;

    private LocalDateTime lastProbeTime;

    private Long lastResponseTime;

    private Integer consecutiveFailures;

    private String metadata;
}
