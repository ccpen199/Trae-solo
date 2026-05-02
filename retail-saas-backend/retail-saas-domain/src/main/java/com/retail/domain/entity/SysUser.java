package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class SysUser extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String username;

    private String password;

    private String realName;

    private String avatar;

    private String phone;

    private String email;

    private Long orgId;

    private String dataScope;

    private Integer status;

    private LocalDateTime lastLoginTime;

    private String lastLoginIp;

    private Integer loginFailCount;

    private LocalDateTime lockTime;

    @TableField(exist = false)
    private List<Long> roleIds;

    @TableField(exist = false)
    private List<SysRole> roles;

    @TableField(exist = false)
    private List<String> permissions;

    @TableField(exist = false)
    private String orgName;

    @TableField(exist = false)
    private String orgPath;

    public interface Status {
        Integer ENABLED = 1;
        Integer DISABLED = 0;
        Integer LOCKED = 2;
    }

    public interface DataScope {
        String ALL = "ALL";
        String CUSTOM = "CUSTOM";
        String THIS_LEVEL = "THIS_LEVEL";
        String THIS_LEVEL_CHILDREN = "THIS_LEVEL_CHILDREN";
        String SELF = "SELF";
    }
}
