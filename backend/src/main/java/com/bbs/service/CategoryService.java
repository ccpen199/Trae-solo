package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bbs.common.PageResult;
import com.bbs.entity.Category;
import com.bbs.entity.SubCategory;
import com.bbs.mapper.CategoryMapper;
import com.bbs.mapper.SubCategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryMapper categoryMapper;
    private final SubCategoryMapper subCategoryMapper;
    
    public List<Category> getAllCategoriesWithSub() {
        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getStatus, 1)
                        .eq(Category::getDeleted, false)
                        .orderByAsc(Category::getSort)
        );
        
        for (Category category : categories) {
            List<SubCategory> subCategories = subCategoryMapper.selectList(
                    new LambdaQueryWrapper<SubCategory>()
                            .eq(SubCategory::getCategoryId, category.getId())
                            .eq(SubCategory::getStatus, 1)
                            .eq(SubCategory::getDeleted, false)
                            .orderByAsc(SubCategory::getSort)
            );
            category.setSubCategories(subCategories);
        }
        
        return categories;
    }
    
    public PageResult<Category> getCategoryPage(Long current, Long size) {
        Page<Category> page = new Page<>(current, size);
        Page<Category> result = categoryMapper.selectPage(
                page,
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getDeleted, false)
                        .orderByAsc(Category::getSort)
        );
        
        return PageResult.of(result.getRecords(), result.getTotal(), result.getSize(), result.getCurrent());
    }
    
    public Category getCategoryById(Long id) {
        return categoryMapper.selectById(id);
    }
    
    @Transactional
    public Category createCategory(Category category) {
        category.setStatus(1);
        category.setDeleted(false);
        categoryMapper.insert(category);
        return category;
    }
    
    @Transactional
    public Category updateCategory(Category category) {
        Category existing = categoryMapper.selectById(category.getId());
        if (existing == null || existing.getDeleted()) {
            throw new IllegalArgumentException("分类不存在");
        }
        categoryMapper.updateById(category);
        return category;
    }
    
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryMapper.selectById(id);
        if (category == null || category.getDeleted()) {
            throw new IllegalArgumentException("分类不存在");
        }
        
        Long subCount = subCategoryMapper.selectCount(
                new LambdaQueryWrapper<SubCategory>()
                        .eq(SubCategory::getCategoryId, id)
                        .eq(SubCategory::getDeleted, false)
        );
        
        if (subCount > 0) {
            throw new IllegalArgumentException("该分类下还有子分类，无法删除");
        }
        
        category.setDeleted(true);
        categoryMapper.updateById(category);
    }
    
    public List<SubCategory> getSubCategoriesByCategory(Long categoryId) {
        return subCategoryMapper.selectList(
                new LambdaQueryWrapper<SubCategory>()
                        .eq(SubCategory::getCategoryId, categoryId)
                        .eq(SubCategory::getStatus, 1)
                        .eq(SubCategory::getDeleted, false)
                        .orderByAsc(SubCategory::getSort)
        );
    }
    
    public SubCategory getSubCategoryById(Long id) {
        return subCategoryMapper.selectById(id);
    }
    
    @Transactional
    public SubCategory createSubCategory(SubCategory subCategory) {
        Category category = categoryMapper.selectById(subCategory.getCategoryId());
        if (category == null || category.getDeleted()) {
            throw new IllegalArgumentException("所属大类不存在");
        }
        
        subCategory.setStatus(1);
        subCategory.setDeleted(false);
        subCategoryMapper.insert(subCategory);
        return subCategory;
    }
    
    @Transactional
    public SubCategory updateSubCategory(SubCategory subCategory) {
        SubCategory existing = subCategoryMapper.selectById(subCategory.getId());
        if (existing == null || existing.getDeleted()) {
            throw new IllegalArgumentException("子分类不存在");
        }
        subCategoryMapper.updateById(subCategory);
        return subCategory;
    }
    
    @Transactional
    public void deleteSubCategory(Long id) {
        SubCategory subCategory = subCategoryMapper.selectById(id);
        if (subCategory == null || subCategory.getDeleted()) {
            throw new IllegalArgumentException("子分类不存在");
        }
        subCategory.setDeleted(true);
        subCategoryMapper.updateById(subCategory);
    }
}
