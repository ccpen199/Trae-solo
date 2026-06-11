package com.guizhou.platform.living.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.living.entity.LivingCategory;
import com.guizhou.platform.living.mapper.LivingCategoryMapper;
import com.guizhou.platform.living.service.LivingCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class LivingCategoryServiceImpl extends ServiceImpl<LivingCategoryMapper, LivingCategory> implements LivingCategoryService {

    @Override
    public List<LivingCategory> listEnabledCategories() {
        return this.list(new LambdaQueryWrapper<LivingCategory>()
                .eq(LivingCategory::getEnabled, 1)
                .orderByAsc(LivingCategory::getSortNum));
    }

    @Override
    public List<LivingCategory> listSubCategories(Long parentId) {
        return this.list(new LambdaQueryWrapper<LivingCategory>()
                .eq(LivingCategory::getParentId, parentId)
                .eq(LivingCategory::getEnabled, 1)
                .orderByAsc(LivingCategory::getSortNum));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createCategory(LivingCategory category) {
        long exists = this.count(new LambdaQueryWrapper<LivingCategory>()
                .eq(LivingCategory::getCategoryCode, category.getCategoryCode()));
        if (exists > 0) {
            throw new BusinessException("分类编码已存在");
        }
        if (category.getEnabled() == null) {
            category.setEnabled(1);
        }
        this.save(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCategory(LivingCategory category) {
        LivingCategory existing = this.getById(category.getId());
        if (existing == null) {
            throw new BusinessException("分类不存在");
        }
        this.updateById(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void toggleCategory(Long categoryId, Boolean enabled) {
        LivingCategory category = this.getById(categoryId);
        if (category == null) {
            throw new BusinessException("分类不存在");
        }
        category.setEnabled(enabled ? 1 : 0);
        this.updateById(category);
    }
}
