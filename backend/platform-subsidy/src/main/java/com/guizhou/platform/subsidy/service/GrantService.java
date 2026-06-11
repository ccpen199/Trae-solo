package com.guizhou.platform.subsidy.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.subsidy.dto.request.GrantApplyDTO;
import com.guizhou.platform.subsidy.dto.request.GrantReviewDTO;
import com.guizhou.platform.subsidy.dto.response.GrantDetailVO;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;

import java.util.List;

public interface GrantService extends IService<SubsidyGrant> {

    String applyGrant(GrantApplyDTO dto);

    void reviewGrant(GrantReviewDTO dto);

    void approveGrant(GrantReviewDTO dto);

    String executeGrant(Long grantId);

    void freezeGrant(Long grantId, String reason);

    void unfreezeGrant(Long grantId);

    void revokeGrant(Long grantId, String reason);

    GrantDetailVO getGrantDetail(Long grantId);

    List<GrantDetailVO> listGrantsByPolicy(Long policyId);

    List<GrantDetailVO> listGrantsByBeneficiary(String beneficiaryId);
}
