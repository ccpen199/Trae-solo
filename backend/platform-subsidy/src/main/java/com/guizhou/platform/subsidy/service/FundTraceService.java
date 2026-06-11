package com.guizhou.platform.subsidy.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidy.dto.response.FundTraceVO;
import com.guizhou.platform.subsidy.entity.FundFlow;

import java.math.BigDecimal;
import java.util.List;

public interface FundTraceService extends IService<FundFlow> {

    String createFundFlow(Long grantId, Integer flowType,
                          String fromAccount, String fromAccountName, String fromType,
                          String toAccount, String toAccountName, String toType,
                          BigDecimal amount, String transactionNo);

    List<FundTraceVO> getFundTraceByGrantId(Long grantId);

    List<FundTraceVO> getFundTraceTree(String traceId);

    List<FundTraceVO> getFundTraceByAccount(String account);

    void syncFundFlowToEs(FundFlow fundFlow);

    void syncPendingOnChain();
}
