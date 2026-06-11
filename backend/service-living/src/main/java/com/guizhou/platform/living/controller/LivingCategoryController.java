package com.guizhou.platform.living.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.living.entity.LivingCategory;
import com.guizhou.platform.living.service.LivingCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "生活服务分类", description = "分类管理、启用/禁用")
@RestController
@RequestMapping("/api/category")
public class LivingCategoryController {

    @Resource
    private LivingCategoryService categoryService;

    @Operation(summary = "获取所有启用的分类")
    @GetMapping("/enabled")
    public Result<List<LivingCategory>> listEnabledCategories() {
        return Result.success(categoryService.listEnabledCategories());
    }

    @Operation(summary = "获取子分类列表")
    @GetMapping("/{parentId}/sub")
    public Result<List<LivingCategory>> listSubCategories(@PathVariable Long parentId) {
        return Result.success(categoryService.listSubCategories(parentId));
    }

    @Operation(summary = "获取分类详情")
    @GetMapping("/detail/{id}")
    public Result<LivingCategory> getCategoryDetail(@PathVariable Long id) {
        return Result.success(categoryService.getById(id));
    }

    @Operation(summary = "创建分类")
    @PostMapping("/create")
    public Result<Void> createCategory(@RequestBody LivingCategory category) {
        categoryService.createCategory(category);
        return Result.success();
    }

    @Operation(summary = "更新分类")
    @PutMapping("/update")
    public Result<Void> updateCategory(@RequestBody LivingCategory category) {
        categoryService.updateCategory(category);
        return Result.success();
    }

    @Operation(summary = "启用/禁用分类")
    @PostMapping("/{id}/toggle")
    public Result<Void> toggleCategory(@PathVariable Long id, @RequestParam Boolean enabled) {
        categoryService.toggleCategory(id, enabled);
        return Result.success();
    }

    @Operation(summary = "获取所有分类（含禁用）")
    @GetMapping("/all")
    public Result<List<LivingCategory>> listAllCategories() {
        return Result.success(categoryService.list());
    }
}
