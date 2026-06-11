package com.guizhou.platform.datashare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class ApiRegisterDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    @NotBlank(message = "API编码不能为空")
    private String apiCode;

    @NotBlank(message = "API名称不能为空")
    private String apiName;

    @NotBlank(message = "API版本不能为空")
    private String apiVersion;

    private String apiDesc;

    @NotBlank(message = "请求方式不能为空")
    private String requestMethod;

    @NotBlank(message = "请求URL不能为空")
    private String requestUrl;

    @NotBlank(message = "部门编码不能为空")
    private String deptCode;

    @NotBlank(message = "部门名称不能为空")
    private String deptName;

    @NotBlank(message = "数据源编码不能为空")
    private String datasourceCode;

    @NotNull(message = "QPS限制不能为空")
    private Integer qpsLimit;

    private Boolean needAuth;

    private Boolean needDesensitize;

    private String requestParam;

    private String responseParam;

    private String requestExample;

    private String responseExample;

    private String remark;
}
