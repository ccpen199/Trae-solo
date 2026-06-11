package com.guizhou.platform.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_role")
public class SysRole extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String roleCode;

    private String roleName;

    private String roleDesc;

    private Integer status;

    private Integer sort;

    private String dataScope;

    private String remark;
}
