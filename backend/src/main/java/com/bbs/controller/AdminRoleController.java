package com.bbs.controller;

import com.bbs.common.PageResult;
import com.bbs.common.Result;
import com.bbs.entity.Permission;
import com.bbs.entity.Role;
import com.bbs.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {
    
    private final RoleService roleService;
    
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<PageResult<Role>> getRoles(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword) {
        PageResult<Role> result = roleService.getRolePage(current, size, keyword);
        return Result.success(result);
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<List<Role>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        return Result.success(roles);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Role> getRole(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        return Result.success(role);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Role> createRole(@RequestBody Role role) {
        Role created = roleService.createRole(role);
        return Result.success("创建成功", created);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Role> updateRole(@PathVariable Long id, @RequestBody Role role) {
        role.setId(id);
        Role updated = roleService.updateRole(role);
        return Result.success("更新成功", updated);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return Result.success();
    }
    
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Void> assignPermissions(@PathVariable Long id, @RequestBody List<Long> permissionIds) {
        roleService.assignPermissions(id, permissionIds);
        return Result.success();
    }
    
    @GetMapping("/permissions/all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<List<Permission>> getAllPermissions() {
        List<Permission> permissions = roleService.getAllPermissions();
        return Result.success(permissions);
    }
}
