package com.guizhou.platform.living.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.living.entity.LivingCategory;

import java.util.List;

public interface LivingCategoryService extends IService<LivingCategory> {

    List<LivingCategory> listEnabledCategories();

    List<LivingCategory> listSubCategories(Long parentId);

    void createCategory(LivingCategory category);

    void updateCategory(LivingCategory category);

    void toggleCategory(Long categoryId, Boolean enabled);
}
