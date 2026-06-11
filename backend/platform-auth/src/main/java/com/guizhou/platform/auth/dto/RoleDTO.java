package com.guizhou.platform.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "角色DTO")
public class RoleDTO {

    @Schema(description = "角色ID(新增时为空)")
    private Long id;

    @Schema(description = "角色编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "角色编码不能为空")
    private String roleCode;

    @Schema(description = "角色名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "角色名称不能为空")
    private String roleName;

    @Schema(description = "角色描述")
    private String roleDesc;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "排序")
    private Integer sort;

    @Schema(description = "数据权限范围: all-全部 dept-本部门 dept_and_child-本部门及下级 self-仅本人")
    private String dataScope;

    @Schema(description = "权限ID列表")
    private List<Long> permissionIds;

    @Schema(description = "备注")
    private String remark;
}
