package com.guizhou.platform.subsidy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.subsidy.dto.request.GrantApplyDTO;
import com.guizhou.platform.subsidy.dto.request.GrantReviewDTO;
import com.guizhou.platform.subsidy.dto.response.GrantDetailVO;
import com.guizhou.platform.subsidy.entity.FundFlow;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.entity.SubsidyPolicy;
import com.guizhou.platform.subsidy.enums.FundFlowTypeEnum;
import com.guizhou.platform.subsidy.enums.GrantStatusEnum;
import com.guizhou.platform.subsidy.enums.PolicyStatusEnum;
import com.guizhou.platform.subsidy.mapper.SubsidyGrantMapper;
import com.guizhou.platform.subsidy.mapper.SubsidyPolicyMapper;
import com.guizhou.platform.subsidy.service.*;
import io.seata.spring.annotation.GlobalTransactional;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GrantServiceImpl extends ServiceImpl<SubsidyGrantMapper, SubsidyGrant> implements GrantService {

    @Resource
    private SubsidyPolicyMapper policyMapper;

    @Resource
    private PolicyService policyService;

    @Resource
    private RiskEngineService riskEngineService;

    @Resource
    private FundTraceService fundTraceService;

    @Resource
    private BlockchainService blockchainService;

    @Resource
    private SuperviseService superviseService;

    @Override
    @GlobalTransactional(name = "subsidy-grant-apply", rollbackFor = Exception.class)
    @Transactional(rollbackFor = Exception.class)
    public String applyGrant(GrantApplyDTO dto) {
        SubsidyPolicy policy = policyMapper.selectById(dto.getPolicyId());
        if (policy == null) {
            throw new BusinessException("补贴政策不存在");
        }
        if (!PolicyStatusEnum.ACTIVE.getCode().equals(policy.getPolicyStatus())) {
            throw new BusinessException("补贴政策未生效");
        }

        if (!policyService.checkEligibility(dto.getPolicyId(), dto.getBeneficiaryId())) {
            throw new BusinessException("不符合补贴申领条件");
        }

        if (riskEngineService.checkDuplicateGrant(dto.getPolicyId(), dto.getBeneficiaryId())) {
            throw new BusinessException("该受益人已申领过此补贴");
        }

        if (riskEngineService.checkAbnormalAmount(dto.getApplyAmount(), dto.getPolicyId())) {
            throw new BusinessException("申请金额异常");
        }

        SubsidyGrant grant = new SubsidyGrant();
        BeanUtils.copyProperties(dto, grant);
        grant.setGrantNo("GR" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        grant.setPolicyCode(policy.getPolicyCode());
        grant.setPolicyName(policy.getPolicyName());
        grant.setGrantStatus(GrantStatusEnum.PENDING_REVIEW.getCode());
        grant.setRiskFlag(false);
        grant.setApprovedAmount(BigDecimal.ZERO);
        grant.setGrantedAmount(BigDecimal.ZERO);
        this.save(grant);

        Integer riskScore = riskEngineService.evaluateGrantRisk(grant);
        if (riskScore >= 60) {
            grant.setRiskFlag(true);
            grant.setRiskLevel(com.guizhou.platform.subsidy.enums.RiskLevelEnum.getByScore(riskScore).getDesc());
            grant.setRiskDesc("风险评分: " + riskScore);
            this.updateById(grant);
        }

        superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                1, "提交申请", null, "系统", "补贴服务",
                null, grant.toString(), "创建补贴申请记录");

        return grant.getGrantNo();
    }

    @Override
    @GlobalTransactional(name = "subsidy-grant-review", rollbackFor = Exception.class)
    @Transactional(rollbackFor = Exception.class)
    public void reviewGrant(GrantReviewDTO dto) {
        SubsidyGrant grant = this.getById(dto.getGrantId());
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        if (!GrantStatusEnum.PENDING_REVIEW.getCode().equals(grant.getGrantStatus())) {
            throw new BusinessException("当前状态不允许审核");
        }

        String beforeData = grant.toString();
        grant.setReviewOpinion(dto.getReviewOpinion());
        grant.setReviewerName(dto.getReviewerName());
        grant.setReviewTime(LocalDateTime.now());

        if (dto.getPassed()) {
            grant.setApprovedAmount(dto.getApprovedAmount() != null ? dto.getApprovedAmount() : grant.getApplyAmount());
            grant.setGrantStatus(GrantStatusEnum.PENDING_APPROVAL.getCode());
        } else {
            grant.setGrantStatus(GrantStatusEnum.REVIEW_REJECTED.getCode());
        }

        this.updateById(grant);

        superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                2, dto.getPassed() ? "审核通过" : "审核驳回",
                null, dto.getReviewerName(), "补贴服务",
                beforeData, grant.toString(), dto.getReviewOpinion());
    }

    @Override
    @GlobalTransactional(name = "subsidy-grant-approve", rollbackFor = Exception.class)
    @Transactional(rollbackFor = Exception.class)
    public void approveGrant(GrantReviewDTO dto) {
        SubsidyGrant grant = this.getById(dto.getGrantId());
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        if (!GrantStatusEnum.PENDING_APPROVAL.getCode().equals(grant.getGrantStatus())) {
            throw new BusinessException("当前状态不允许审批");
        }

        String beforeData = grant.toString();
        grant.setApproveOpinion(dto.getReviewOpinion());
        grant.setApproverName(dto.getReviewerName());
        grant.setApproveTime(LocalDateTime.now());

        if (dto.getPassed()) {
            grant.setGrantStatus(GrantStatusEnum.PENDING_GRANT.getCode());
        } else {
            grant.setGrantStatus(GrantStatusEnum.APPROVAL_REJECTED.getCode());
        }

        this.updateById(grant);

        superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                3, dto.getPassed() ? "审批通过" : "审批驳回",
                null, dto.getReviewerName(), "补贴服务",
                beforeData, grant.toString(), dto.getReviewOpinion());
    }

    @Override
    @GlobalTransactional(name = "subsidy-grant-execute", rollbackFor = Exception.class)
    @Transactional(rollbackFor = Exception.class)
    public String executeGrant(Long grantId) {
        SubsidyGrant grant = this.getById(grantId);
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        if (!GrantStatusEnum.PENDING_GRANT.getCode().equals(grant.getGrantStatus())) {
            throw new BusinessException("当前状态不允许发放");
        }
        if (Boolean.TRUE.equals(grant.getRiskFlag()) && grant.getRiskLevel() != null
                && grant.getRiskLevel().contains("严重")) {
            throw new BusinessException("存在高风险，禁止发放");
        }

        SubsidyPolicy policy = policyMapper.selectById(grant.getPolicyId());
        if (policy.getRemainingBudget().compareTo(grant.getApprovedAmount()) < 0) {
            throw new BusinessException("预算不足");
        }

        String beforeData = grant.toString();
        grant.setGrantStatus(GrantStatusEnum.GRANTING.getCode());
        this.updateById(grant);

        String transactionNo = "TXN" + System.currentTimeMillis();
        try {
            String flowNo = fundTraceService.createFundFlow(
                    grant.getId(),
                    FundFlowTypeEnum.SUBSIDY_GRANT.getCode(),
                    policy.getDepartmentCode(),
                    policy.getDepartment(),
                    "BANK",
                    grant.getBankAccount(),
                    grant.getBeneficiaryName(),
                    "BENEFICIARY",
                    grant.getApprovedAmount(),
                    transactionNo
            );

            policyMapper.updateGrantedAmount(grant.getPolicyId(), grant.getApprovedAmount());

            grant.setGrantStatus(GrantStatusEnum.GRANTED.getCode());
            grant.setGrantedAmount(grant.getApprovedAmount());
            grant.setGrantTime(LocalDateTime.now());
            grant.setTransactionNo(transactionNo);
            this.updateById(grant);

            blockchainService.uploadGrantToChain(grant);

            FundFlow fundFlow = new FundFlow();
            fundFlow.setFlowNo(flowNo);
            blockchainService.uploadFundFlowToChain(fundFlow);

            superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                    4, "补贴发放", null, "系统", "补贴服务",
                    beforeData, grant.toString(), "交易号: " + transactionNo);

            return transactionNo;
        } catch (Exception e) {
            log.error("补贴发放失败", e);
            grant.setGrantStatus(GrantStatusEnum.GRANT_FAILED.getCode());
            grant.setRemark("发放失败: " + e.getMessage());
            this.updateById(grant);
            throw new BusinessException("补贴发放失败: " + e.getMessage());
        }
    }

    @Override
    public void freezeGrant(Long grantId, String reason) {
        SubsidyGrant grant = this.getById(grantId);
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        grant.setGrantStatus(GrantStatusEnum.FROZEN.getCode());
        this.updateById(grant);

        superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                5, "冻结补贴", null, "系统", "补贴服务",
                null, grant.toString(), reason);
    }

    @Override
    public void unfreezeGrant(Long grantId) {
        SubsidyGrant grant = this.getById(grantId);
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        if (!GrantStatusEnum.FROZEN.getCode().equals(grant.getGrantStatus())) {
            throw new BusinessException("当前状态不允许解冻");
        }
        grant.setGrantStatus(GrantStatusEnum.PENDING_GRANT.getCode());
        this.updateById(grant);
    }

    @Override
    public void revokeGrant(Long grantId, String reason) {
        SubsidyGrant grant = this.getById(grantId);
        if (grant == null) {
            throw new BusinessException("补贴申请不存在");
        }
        grant.setGrantStatus(GrantStatusEnum.REVOKED.getCode());
        this.updateById(grant);

        superviseService.recordAuditLog("GRANT", grant.getId(), grant.getGrantNo(),
                6, "撤销补贴", null, "系统", "补贴服务",
                null, grant.toString(), reason);
    }

    @Override
    public GrantDetailVO getGrantDetail(Long grantId) {
        SubsidyGrant grant = this.getById(grantId);
        if (grant == null) {
            return null;
        }
        GrantDetailVO vo = new GrantDetailVO();
        BeanUtils.copyProperties(grant, vo);
        vo.setGrantStatusDesc(GrantStatusEnum.getByCode(grant.getGrantStatus()).getDesc());
        return vo;
    }

    @Override
    public List<GrantDetailVO> listGrantsByPolicy(Long policyId) {
        List<SubsidyGrant> list = this.list(new LambdaQueryWrapper<SubsidyGrant>()
                .eq(SubsidyGrant::getPolicyId, policyId)
                .orderByDesc(SubsidyGrant::getCreateTime));
        return list.stream().map(grant -> {
            GrantDetailVO vo = new GrantDetailVO();
            BeanUtils.copyProperties(grant, vo);
            vo.setGrantStatusDesc(GrantStatusEnum.getByCode(grant.getGrantStatus()).getDesc());
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<GrantDetailVO> listGrantsByBeneficiary(String beneficiaryId) {
        List<SubsidyGrant> list = this.list(new LambdaQueryWrapper<SubsidyGrant>()
                .eq(SubsidyGrant::getBeneficiaryId, beneficiaryId)
                .orderByDesc(SubsidyGrant::getCreateTime));
        return list.stream().map(grant -> {
            GrantDetailVO vo = new GrantDetailVO();
            BeanUtils.copyProperties(grant, vo);
            vo.setGrantStatusDesc(GrantStatusEnum.getByCode(grant.getGrantStatus()).getDesc());
            return vo;
        }).collect(Collectors.toList());
    }
}
