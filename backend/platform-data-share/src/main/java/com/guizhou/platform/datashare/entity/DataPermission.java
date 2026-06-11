package com.guizhou.platform.datashare.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("data_permission")
public class DataPermission extends BaseEntity {

    private static final long serialVersionUID = 1L;

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
