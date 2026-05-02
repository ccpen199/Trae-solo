package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_role")
public class SysRole extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String roleName;

    private String roleCode;

    private String roleType;

    private Long orgId;

    private String dataScope;

    private Integer status;

    private String description;

    private Integer sortOrder;

    @TableField(exist = false)
    private List<Long> menuIds;

    @TableField(exist = false)
    private List<Long> dataScopeOrgIds;

    @TableField(exist = false)
    private List<SysMenu> menus;

    public interface RoleType {
        String SYSTEM = "SYSTEM";
        String CUSTOM = "CUSTOM";
    }

    public interface Status {
        Integer ENABLED = 1;
        Integer DISABLED = 0;
    }

    public interface DataScope {
        String ALL = "ALL";
        String CUSTOM = "CUSTOM";
        String THIS_LEVEL = "THIS_LEVEL";
        String THIS_LEVEL_CHILDREN = "THIS_LEVEL_CHILDREN";
        String SELF = "SELF";
    }
}
