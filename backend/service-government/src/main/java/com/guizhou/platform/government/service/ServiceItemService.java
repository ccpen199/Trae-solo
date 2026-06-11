package com.guizhou.platform.government.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.government.dto.response.ServiceItemVO;
import com.guizhou.platform.government.entity.ServiceItem;

import java.util.List;

public interface ServiceItemService extends IService<ServiceItem> {

    ServiceItemVO getItemDetail(Long itemId);

    PageResult<ServiceItemVO> pageItems(Integer pageNum, Integer pageSize, String itemName,
                                         String categoryCode, Integer serviceStatus,
                                         String departmentCode, String keyword);

    List<ServiceItemVO> searchItems(String keyword);

    void publishItem(Long itemId);

    void suspendItem(Long itemId);

    void deprecateItem(Long itemId);

    void syncToEs(Long itemId);

    void batchSyncToEs();
}
