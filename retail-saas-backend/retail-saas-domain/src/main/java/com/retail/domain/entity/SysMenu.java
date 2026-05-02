package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_menu")
public class SysMenu extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long parentId;

    private String menuName;

    private String menuType;

    private String path;

    private String component;

    private String permission;

    private String icon;

    private String redirect;

    private Integer sort;

    private Integer status;

    private Integer visible;

    private Integer keepAlive;

    private String query;

    private Integer isCache;

    @TableField(exist = false)
    private List<SysMenu> children;

    @TableField(exist = false)
    private String parentName;

    public interface MenuType {
        String DIRECTORY = "DIRECTORY";
        String MENU = "MENU";
        String BUTTON = "BUTTON";
    }

    public interface Status {
        Integer ENABLED = 1;
        Integer DISABLED = 0;
    }

    public interface Visible {
        Integer SHOW = 1;
        Integer HIDE = 0;
    }
}
