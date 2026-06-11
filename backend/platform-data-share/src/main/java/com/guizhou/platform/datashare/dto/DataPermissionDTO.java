package com.guizhou.platform.datashare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class DataPermissionDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    @NotNull(message = "API ID不能为空")
    private Long apiId;

    private String apiCode;

    private String roleCode;

    private String roleName;

    private String deptCode;

    private String deptName;

    private String userId;

    private String userName;

    private String permissionType;

    private String dataScope;

    private String fieldPermissions;

    private Boolean canQuery;

    private Boolean canExport;

    private Integer rowLimit;

    private String conditionExpression;

    private Integer priority;

    private String status;

    private String remark;
}
