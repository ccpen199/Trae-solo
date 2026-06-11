package com.guizhou.platform.living.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.living.dto.request.ProviderApplyDTO;
import com.guizhou.platform.living.dto.response.ProviderDetailVO;
import com.guizhou.platform.living.entity.ServiceProvider;

import java.util.List;

public interface ServiceProviderService extends IService<ServiceProvider> {

    String applyProvider(ProviderApplyDTO dto);

    void reviewProvider(Long providerId, Boolean passed, String opinion);

    ProviderDetailVO getProviderDetail(Long providerId);

    List<ProviderDetailVO> listProvidersByCategory(String categoryCode);

    void suspendProvider(Long providerId, String reason);

    void activateProvider(Long providerId);

    void blacklistProvider(Long providerId, String reason);
}
