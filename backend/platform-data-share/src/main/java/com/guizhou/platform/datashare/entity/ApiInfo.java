package com.guizhou.platform.datashare.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("api_info")
public class ApiInfo extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String apiCode;

    private String apiName;

    private String apiVersion;

    private String apiDesc;

    private String requestMethod;

    private String requestUrl;

    private String deptCode;

    private String deptName;

    private String datasourceCode;

    private Integer status;

    private Integer qpsLimit;

    private Boolean needAuth;

    private Boolean needDesensitize;

    private String requestParam;

    private String responseParam;

    private String requestExample;

    private String responseExample;

    private LocalDateTime publishTime;

    private LocalDateTime offlineTime;

    private String remark;
}
