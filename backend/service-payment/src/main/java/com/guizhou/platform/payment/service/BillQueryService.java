package com.guizhou.platform.payment.service;

import com.guizhou.platform.payment.dto.request.QueryBillDTO;
import com.guizhou.platform.payment.dto.response.BillInfoVO;

import java.util.List;

public interface BillQueryService {

    List<BillInfoVO> queryBills(QueryBillDTO dto);

    BillInfoVO queryBillDetail(String billNo);

    List<BillInfoVO> queryUserBills(Long userId, Integer billType);
}
