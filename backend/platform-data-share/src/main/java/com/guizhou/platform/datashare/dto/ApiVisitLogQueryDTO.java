package com.guizhou.platform.datashare.dto;

import com.guizhou.platform.common.base.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApiVisitLogQueryDTO extends PageQuery {

    private static final long serialVersionUID = 1L;

    private String traceId;

    private String apiCode;

    private String apiName;

    private String userId;

    private String deptCode;

    private String clientIp;

    private Boolean success;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}
