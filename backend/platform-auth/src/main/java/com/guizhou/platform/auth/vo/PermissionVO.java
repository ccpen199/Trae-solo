package com.guizhou.platform.auth.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "权限视图对象")
public class PermissionVO {

    @Schema(description = "权限ID")
    private Long id;

    @Schema(description = "父级ID")
    private Long parentId;

    @Schema(description = "权限编码")
    private String permissionCode;

    @Schema(description = "权限名称")
    private String permissionName;

    @Schema(description = "权限类型: menu-菜单 button-按钮 api-接口")
    private String permissionType;

    @Schema(description = "路由路径")
    private String path;

    @Schema(description = "组件路径")
    private String component;

    @Schema(description = "图标")
    private String icon;

    @Schema(description = "排序")
    private Integer sort;

    @Schema(description = "权限标识")
    private String perms;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "子权限列表")
    private List<PermissionVO> children;
}
