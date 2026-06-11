package com.guizhou.platform.datashare.dto;

import com.guizhou.platform.common.base.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApiQueryDTO extends PageQuery {

    private static final long serialVersionUID = 1L;

    private String apiCode;

    private String apiName;

    private String apiVersion;

    private String deptCode;

    private String datasourceCode;

    private Integer status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}
