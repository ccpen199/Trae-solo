package com.guizhou.platform.government.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.government.dto.response.ServiceCatalogVO;
import com.guizhou.platform.government.entity.ServiceCategory;

import java.util.List;

public interface ServiceCategoryService extends IService<ServiceCategory> {

    List<ServiceCatalogVO> getCatalogTree();

    List<ServiceCatalogVO> getSubCatalog(Long parentId);

    ServiceCategory getCategoryDetail(Long categoryId);

    Long createCategory(ServiceCategory category);

    void updateCategory(ServiceCategory category);

    void deleteCategory(Long categoryId);

    void refreshItemCount(Long categoryId);
}
