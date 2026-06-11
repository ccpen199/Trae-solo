package com.guizhou.platform.datashare.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("api_visit_log")
public class ApiVisitLog extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String traceId;

    private Long apiId;

    private String apiCode;

    private String apiName;

    private String requestMethod;

    private String requestUrl;

    private String requestParam;

    private String responseData;

    private String clientIp;

    private String userAgent;

    private String userId;

    private String userName;

    private String deptCode;

    private String deptName;

    private LocalDateTime requestTime;

    private LocalDateTime responseTime;

    private Long costTime;

    private Integer httpStatus;

    private String responseCode;

    private String responseMsg;

    private Boolean success;

    private String blockchainHash;

    private String errorMsg;

    private String extendInfo;
}
