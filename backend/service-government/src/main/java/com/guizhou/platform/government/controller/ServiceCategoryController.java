package com.guizhou.platform.government.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.government.dto.response.ServiceCatalogVO;
import com.guizhou.platform.government.entity.ServiceCategory;
import com.guizhou.platform.government.service.ServiceCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "服务分类管理", description = "政务服务分类目录树管理：社保/医保/不动产/户籍/公积金/税务等")
@RestController
@RequestMapping("/api/category")
public class ServiceCategoryController {

    @Resource
    private ServiceCategoryService serviceCategoryService;

    @Operation(summary = "获取服务分类树")
    @GetMapping("/tree")
    public Result<List<ServiceCatalogVO>> getCatalogTree() {
        return Result.success(serviceCategoryService.getCatalogTree());
    }

    @Operation(summary = "获取子分类列表")
    @GetMapping("/sub/{parentId}")
    public Result<List<ServiceCatalogVO>> getSubCatalog(@PathVariable Long parentId) {
        return Result.success(serviceCategoryService.getSubCatalog(parentId));
    }

    @Operation(summary = "获取分类详情")
    @GetMapping("/{id}")
    public Result<ServiceCategory> getCategoryDetail(@PathVariable Long id) {
        return Result.success(serviceCategoryService.getCategoryDetail(id));
    }

    @Operation(summary = "创建服务分类")
    @PostMapping
    public Result<Long> createCategory(@RequestBody ServiceCategory category) {
        return Result.success(serviceCategoryService.createCategory(category));
    }

    @Operation(summary = "更新服务分类")
    @PutMapping
    public Result<Void> updateCategory(@RequestBody ServiceCategory category) {
        serviceCategoryService.updateCategory(category);
        return Result.success();
    }

    @Operation(summary = "删除服务分类")
    @DeleteMapping("/{id}")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        serviceCategoryService.deleteCategory(id);
        return Result.success();
    }

    @Operation(summary = "刷新分类下事项数量")
    @PostMapping("/{id}/refresh-count")
    public Result<Void> refreshItemCount(@PathVariable Long id) {
        serviceCategoryService.refreshItemCount(id);
        return Result.success();
    }
}
