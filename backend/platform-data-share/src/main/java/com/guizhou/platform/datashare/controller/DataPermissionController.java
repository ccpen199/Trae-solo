package com.guizhou.platform.datashare.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.datashare.dto.DataPermissionDTO;
import com.guizhou.platform.datashare.entity.DataPermission;
import com.guizhou.platform.datashare.service.DataPermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "数据权限管理", description = "数据权限配置和访问控制接口")
@RestController
@RequestMapping("/permission")
@RequiredArgsConstructor
public class DataPermissionController {

    private final DataPermissionService dataPermissionService;

    @Operation(summary = "保存权限配置")
    @PostMapping("/save")
    public Result<Long> savePermission(@RequestBody DataPermissionDTO dto) {
        return Result.success(dataPermissionService.savePermission(dto));
    }

    @Operation(summary = "获取权限详情")
    @GetMapping("/{id}")
    public Result<DataPermission> getPermission(@Parameter(description = "权限ID") @PathVariable Long id) {
        return Result.success(dataPermissionService.getPermission(id));
    }

    @Operation(summary = "获取API权限列表")
    @GetMapping("/api/{apiId}")
    public Result<List<DataPermission>> getPermissionsByApiId(@Parameter(description = "API ID") @PathVariable Long apiId) {
        return Result.success(dataPermissionService.getPermissionsByApiId(apiId));
    }

    @Operation(summary = "查询权限列表")
    @GetMapping("/query")
    public Result<List<DataPermission>> queryPermissions(
            @Parameter(description = "API ID") @RequestParam(required = false) Long apiId,
            @Parameter(description = "角色编码") @RequestParam(required = false) String roleCode,
            @Parameter(description = "部门编码") @RequestParam(required = false) String deptCode) {
        return Result.success(dataPermissionService.queryPermissions(apiId, roleCode, deptCode));
    }

    @Operation(summary = "检查用户权限")
    @GetMapping("/check")
    public Result<Boolean> checkPermission(
            @Parameter(description = "API编码", required = true) @RequestParam String apiCode,
            @Parameter(description = "用户ID") @RequestParam(required = false) String userId,
            @Parameter(description = "角色编码") @RequestParam(required = false) String roleCode,
            @Parameter(description = "部门编码") @RequestParam(required = false) String deptCode,
            @Parameter(description = "操作类型: query/export", required = true) @RequestParam String operation) {
        return Result.success(dataPermissionService.checkPermission(apiCode, userId, roleCode, deptCode, operation));
    }

    @Operation(summary = "删除权限配置")
    @DeleteMapping("/{id}")
    public Result<Void> deletePermission(@Parameter(description = "权限ID") @PathVariable Long id) {
        dataPermissionService.deletePermission(id);
        return Result.success();
    }
}
