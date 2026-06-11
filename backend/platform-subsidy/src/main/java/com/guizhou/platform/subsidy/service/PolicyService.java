package com.guizhou.platform.subsidy.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidy.dto.request.PolicyCreateDTO;
import com.guizhou.platform.subsidy.dto.response.PolicyDetailVO;
import com.guizhou.platform.subsidy.entity.SubsidyPolicy;

import java.util.List;

public interface PolicyService extends IService<SubsidyPolicy> {

    Long createPolicy(PolicyCreateDTO dto);

    void publishPolicy(Long policyId);

    void pausePolicy(Long policyId);

    void cancelPolicy(Long policyId);

    PolicyDetailVO getPolicyDetail(Long policyId);

    List<PolicyDetailVO> listActivePolicies();

    boolean checkEligibility(Long policyId, String beneficiaryId);
}
