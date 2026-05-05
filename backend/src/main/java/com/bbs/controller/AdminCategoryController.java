package com.bbs.controller;

import com.bbs.common.PageResult;
import com.bbs.common.Result;
import com.bbs.entity.Category;
import com.bbs.entity.SubCategory;
import com.bbs.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    
    private final CategoryService categoryService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<PageResult<Category>> getCategories(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        PageResult<Category> result = categoryService.getCategoryPage(current, size);
        return Result.success(result);
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategoriesWithSub();
        return Result.success(categories);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<Category> getCategory(@PathVariable Long id) {
        Category category = categoryService.getCategoryById(id);
        return Result.success(category);
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<Category> createCategory(@RequestBody Category category) {
        Category created = categoryService.createCategory(category);
        return Result.success("创建成功", created);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        category.setId(id);
        Category updated = categoryService.updateCategory(category);
        return Result.success("更新成功", updated);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return Result.success();
    }
    
    @GetMapping("/{categoryId}/sub-categories")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<List<SubCategory>> getSubCategories(@PathVariable Long categoryId) {
        List<SubCategory> subCategories = categoryService.getSubCategoriesByCategory(categoryId);
        return Result.success(subCategories);
    }
    
    @GetMapping("/sub-categories/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<SubCategory> getSubCategory(@PathVariable Long id) {
        SubCategory subCategory = categoryService.getSubCategoryById(id);
        return Result.success(subCategory);
    }
    
    @PostMapping("/sub-categories")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<SubCategory> createSubCategory(@RequestBody SubCategory subCategory) {
        SubCategory created = categoryService.createSubCategory(subCategory);
        return Result.success("创建成功", created);
    }
    
    @PutMapping("/sub-categories/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<SubCategory> updateSubCategory(@PathVariable Long id, @RequestBody SubCategory subCategory) {
        subCategory.setId(id);
        SubCategory updated = categoryService.updateSubCategory(subCategory);
        return Result.success("更新成功", updated);
    }
    
    @DeleteMapping("/sub-categories/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<Void> deleteSubCategory(@PathVariable Long id) {
        categoryService.deleteSubCategory(id);
        return Result.success();
    }
}
