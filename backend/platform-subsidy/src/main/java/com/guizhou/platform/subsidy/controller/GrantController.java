package com.guizhou.platform.subsidy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidy.dto.request.GrantApplyDTO;
import com.guizhou.platform.subsidy.dto.request.GrantReviewDTO;
import com.guizhou.platform.subsidy.dto.response.GrantDetailVO;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.enums.GrantStatusEnum;
import com.guizhou.platform.subsidy.service.GrantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "补贴发放管理", description = "补贴申请、审核、审批、发放、冻结、撤销")
@RestController
@RequestMapping("/api/grant")
public class GrantController {

    @Resource
    private GrantService grantService;

    @Operation(summary = "提交补贴申请")
    @PostMapping("/apply")
    public Result<String> applyGrant(@Valid @RequestBody GrantApplyDTO dto) {
        return Result.success(grantService.applyGrant(dto));
    }

    @Operation(summary = "审核补贴申请")
    @PostMapping("/review")
    public Result<Void> reviewGrant(@Valid @RequestBody GrantReviewDTO dto) {
        grantService.reviewGrant(dto);
        return Result.success();
    }

    @Operation(summary = "审批补贴申请")
    @PostMapping("/approve")
    public Result<Void> approveGrant(@Valid @RequestBody GrantReviewDTO dto) {
        grantService.approveGrant(dto);
        return Result.success();
    }

    @Operation(summary = "执行补贴发放")
    @PostMapping("/{id}/execute")
    public Result<String> executeGrant(@PathVariable Long id) {
        return Result.success(grantService.executeGrant(id));
    }

    @Operation(summary = "冻结补贴")
    @PostMapping("/{id}/freeze")
    public Result<Void> freezeGrant(@PathVariable Long id, @RequestParam String reason) {
        grantService.freezeGrant(id, reason);
        return Result.success();
    }

    @Operation(summary = "解冻补贴")
    @PostMapping("/{id}/unfreeze")
    public Result<Void> unfreezeGrant(@PathVariable Long id) {
        grantService.unfreezeGrant(id);
        return Result.success();
    }

    @Operation(summary = "撤销补贴")
    @PostMapping("/{id}/revoke")
    public Result<Void> revokeGrant(@PathVariable Long id, @RequestParam String reason) {
        grantService.revokeGrant(id, reason);
        return Result.success();
    }

    @Operation(summary = "获取补贴申请详情")
    @GetMapping("/{id}")
    public Result<GrantDetailVO> getGrantDetail(@PathVariable Long id) {
        return Result.success(grantService.getGrantDetail(id));
    }

    @Operation(summary = "获取政策下的补贴列表")
    @GetMapping("/policy/{policyId}")
    public Result<List<GrantDetailVO>> listGrantsByPolicy(@PathVariable Long policyId) {
        return Result.success(grantService.listGrantsByPolicy(policyId));
    }

    @Operation(summary = "获取受益人补贴列表")
    @GetMapping("/beneficiary/{beneficiaryId}")
    public Result<List<GrantDetailVO>> listGrantsByBeneficiary(@PathVariable String beneficiaryId) {
        return Result.success(grantService.listGrantsByBeneficiary(beneficiaryId));
    }

    @Operation(summary = "分页查询补贴申请列表")
    @GetMapping("/page")
    public Result<PageResult<GrantDetailVO>> pageGrants(PageQuery pageQuery,
                                                        @RequestParam(required = false) Long policyId,
                                                        @RequestParam(required = false) Integer grantStatus,
                                                        @RequestParam(required = false) String beneficiaryName,
                                                        @RequestParam(required = false) String idCard,
                                                        @RequestParam(required = false) Boolean riskFlag) {
        LambdaQueryWrapper<SubsidyGrant> wrapper = new LambdaQueryWrapper<>();
        if (policyId != null) {
            wrapper.eq(SubsidyGrant::getPolicyId, policyId);
        }
        if (grantStatus != null) {
            wrapper.eq(SubsidyGrant::getGrantStatus, grantStatus);
        }
        if (beneficiaryName != null) {
            wrapper.like(SubsidyGrant::getBeneficiaryName, beneficiaryName);
        }
        if (idCard != null) {
            wrapper.eq(SubsidyGrant::getIdCard, idCard);
        }
        if (riskFlag != null) {
            wrapper.eq(SubsidyGrant::getRiskFlag, riskFlag);
        }
        wrapper.orderByDesc(SubsidyGrant::getCreateTime);

        Page<SubsidyGrant> page = grantService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<GrantDetailVO> voList = page.getRecords().stream().map(grant -> {
            GrantDetailVO vo = new GrantDetailVO();
            BeanUtils.copyProperties(grant, vo);
            vo.setGrantStatusDesc(GrantStatusEnum.getByCode(grant.getGrantStatus()).getDesc());
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList));
    }

    @Operation(summary = "获取待审核数量")
    @GetMapping("/pending-count")
    public Result<Long> getPendingCount() {
        long count = grantService.count(new LambdaQueryWrapper<SubsidyGrant>()
                .eq(SubsidyGrant::getGrantStatus, GrantStatusEnum.PENDING_REVIEW.getCode())
                .or()
                .eq(SubsidyGrant::getGrantStatus, GrantStatusEnum.PENDING_APPROVAL.getCode()));
        return Result.success(count);
    }
}
