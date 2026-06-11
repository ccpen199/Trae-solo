package com.guizhou.platform.subsidyverify.service;

import java.math.BigDecimal;
import java.util.Map;

public interface SubsidyClientService {

    boolean verifyEligibility(Long beneficiaryId, Long policyId);

    boolean deductBalance(Long grantId, BigDecimal amount);

    Map<String, Object> getSubsidyDetail(Long grantId);

    Map<String, Object> getPolicyDetail(Long policyId);
}
