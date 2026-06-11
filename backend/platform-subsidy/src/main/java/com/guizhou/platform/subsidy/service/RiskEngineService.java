package com.guizhou.platform.subsidy.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidy.dto.request.RiskRuleDTO;
import com.guizhou.platform.subsidy.entity.RiskRule;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;

import java.util.List;

public interface RiskEngineService extends IService<RiskRule> {

    Long createRiskRule(RiskRuleDTO dto);

    void enableRiskRule(Long ruleId);

    void disableRiskRule(Long ruleId);

    Integer evaluateGrantRisk(SubsidyGrant grant);

    void scanRisk();

    void processRiskWarning(Long warningId, String handlerId, String handlerName,
                            String opinion, String result);

    List<RiskRule> getEnabledRules();

    boolean checkDuplicateGrant(Long policyId, String beneficiaryId);

    boolean checkAbnormalAmount(BigDecimal amount, Long policyId);

    boolean checkSuspiciousAccount(String account);
}
