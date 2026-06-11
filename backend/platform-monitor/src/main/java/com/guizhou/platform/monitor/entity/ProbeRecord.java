package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("probe_record")
public class ProbeRecord extends BaseEntity {

    private Long serviceId;

    private String serviceCode;

    private String probeType;

    private String probeUrl;

    private Integer statusCode;

    private Long responseTime;

    private Boolean success;

    private String errorMessage;

    private LocalDateTime probeTime;
}
