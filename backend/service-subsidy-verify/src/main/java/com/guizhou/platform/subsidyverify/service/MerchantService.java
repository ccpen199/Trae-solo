package com.guizhou.platform.subsidyverify.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidyverify.dto.request.MerchantApplyDTO;
import com.guizhou.platform.subsidyverify.dto.response.MerchantDetailVO;
import com.guizhou.platform.subsidyverify.entity.Merchant;

import java.util.List;

public interface MerchantService extends IService<Merchant> {

    String apply(MerchantApplyDTO dto);

    MerchantDetailVO getDetail(Long id);

    void approve(Long id, String opinion);

    void reject(Long id, String opinion);

    void disable(Long id, String reason);

    void enable(Long id);

    void blacklist(Long id, String reason);

    List<MerchantDetailVO> listByCategory(String categoryCode);

    List<MerchantDetailVO> listByStatus(Integer status);
}
