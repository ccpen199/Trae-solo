package com.guizhou.platform.payment.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.payment.dto.response.PaymentRecordVO;
import com.guizhou.platform.payment.entity.PaymentRecord;

import java.util.List;
import java.util.Map;

public interface PaymentRecordService extends IService<PaymentRecord> {

    PaymentRecordVO getRecordDetail(Long id);

    List<PaymentRecordVO> listByUserId(Long userId);

    List<PaymentRecordVO> listByOrderId(Long orderId);

    List<Map<String, Object>> getBillTypeStatistics(String startTime);

    List<Map<String, Object>> getMonthlyTrend(String startTime);
}
