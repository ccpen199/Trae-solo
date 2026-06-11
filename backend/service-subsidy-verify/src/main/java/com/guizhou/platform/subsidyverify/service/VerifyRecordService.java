package com.guizhou.platform.subsidyverify.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;

import java.util.List;
import java.util.Map;

public interface VerifyRecordService extends IService<VerifyRecord> {

    VerifyResultVO getDetail(Long id);

    List<VerifyResultVO> listByVoucher(Long voucherId);

    List<VerifyResultVO> listByBeneficiary(Long beneficiaryId);

    List<VerifyResultVO> listByMerchant(Long merchantId);

    Map<String, Object> getDailyTrend(int days);
}
