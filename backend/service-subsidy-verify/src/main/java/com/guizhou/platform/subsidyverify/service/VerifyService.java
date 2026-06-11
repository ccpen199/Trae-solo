package com.guizhou.platform.subsidyverify.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidyverify.dto.request.VerifyRequestDTO;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;

import java.util.List;

public interface VerifyService extends IService<VerifyRecord> {

    VerifyResultVO scanVerify(VerifyRequestDTO dto);

    VerifyResultVO manualVerify(VerifyRequestDTO dto);

    VerifyResultVO getVerifyDetail(Long id);

    List<VerifyResultVO> listByBeneficiary(Long beneficiaryId);

    List<VerifyResultVO> listByMerchant(Long merchantId);

    void cancelVerify(Long id, String reason);
}
