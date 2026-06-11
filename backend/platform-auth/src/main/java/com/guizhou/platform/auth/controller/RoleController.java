package com.guizhou.platform.auth.controller;

import com.guizhou.platform.auth.dto.RoleDTO;
import com.guizhou.platform.auth.service.RoleService;
import com.guizhou.platform.auth.vo.RoleVO;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "角色管理", description = "角色CRUD、权限分配")
@RestController
@RequestMapping("/api/role")
public class RoleController {

    @Resource
    private RoleService roleService;

    @Operation(summary = "创建角色")
    @PostMapping
    public Result<Long> createRole(@Valid @RequestBody RoleDTO dto) {
        return Result.success(roleService.createRole(dto));
    }

    @Operation(summary = "更新角色")
    @PutMapping
    public Result<Void> updateRole(@Valid @RequestBody RoleDTO dto) {
        roleService.updateRole(dto);
        return Result.success();
    }

    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    public Result<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return Result.success();
    }

    @Operation(summary = "获取角色详情")
    @GetMapping("/{id}")
    public Result<RoleVO> getRoleDetail(@PathVariable Long id) {
        return Result.success(roleService.getRoleDetail(id));
    }

    @Operation(summary = "分页查询角色列表")
    @GetMapping("/page")
    public Result<PageResult<RoleVO>> pageRoles(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) Integer status) {
        return Result.success(roleService.pageRoles(pageNum, pageSize, roleName, roleCode, status));
    }

    @Operation(summary = "查询所有启用角色")
    @GetMapping("/list")
    public Result<List<RoleVO>> listAllRoles() {
        return Result.success(roleService.listAllRoles());
    }

    @Operation(summary = "分配权限")
    @PutMapping("/{id}/permissions")
    public Result<Void> assignPermissions(@PathVariable Long id, @RequestBody List<Long> permissionIds) {
        roleService.assignPermissions(id, permissionIds);
        return Result.success();
    }
}
