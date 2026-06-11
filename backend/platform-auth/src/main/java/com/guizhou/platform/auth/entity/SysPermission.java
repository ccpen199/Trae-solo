package com.guizhou.platform.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_permission")
public class SysPermission extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long parentId;

    private String permissionCode;

    private String permissionName;

    private String permissionType;

    private String path;

    private String component;

    private String icon;

    private Integer sort;

    private String perms;

    private Integer status;

    private String remark;
}
