package com.guizhou.platform.subsidy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidy.dto.request.PolicyCreateDTO;
import com.guizhou.platform.subsidy.dto.response.PolicyDetailVO;
import com.guizhou.platform.subsidy.entity.SubsidyPolicy;
import com.guizhou.platform.subsidy.service.PolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "补贴政策管理", description = "补贴政策的创建、发布、查询、管理")
@RestController
@RequestMapping("/api/policy")
public class PolicyController {

    @Resource
    private PolicyService policyService;

    @Operation(summary = "创建补贴政策")
    @PostMapping
    public Result<Long> createPolicy(@Valid @RequestBody PolicyCreateDTO dto) {
        return Result.success(policyService.createPolicy(dto));
    }

    @Operation(summary = "发布补贴政策")
    @PostMapping("/{id}/publish")
    public Result<Void> publishPolicy(@PathVariable Long id) {
        policyService.publishPolicy(id);
        return Result.success();
    }

    @Operation(summary = "暂停补贴政策")
    @PostMapping("/{id}/pause")
    public Result<Void> pausePolicy(@PathVariable Long id) {
        policyService.pausePolicy(id);
        return Result.success();
    }

    @Operation(summary = "取消补贴政策")
    @PostMapping("/{id}/cancel")
    public Result<Void> cancelPolicy(@PathVariable Long id) {
        policyService.cancelPolicy(id);
        return Result.success();
    }

    @Operation(summary = "获取政策详情")
    @GetMapping("/{id}")
    public Result<PolicyDetailVO> getPolicyDetail(@PathVariable Long id) {
        return Result.success(policyService.getPolicyDetail(id));
    }

    @Operation(summary = "获取生效政策列表")
    @GetMapping("/active")
    public Result<List<PolicyDetailVO>> listActivePolicies() {
        return Result.success(policyService.listActivePolicies());
    }

    @Operation(summary = "分页查询政策列表")
    @GetMapping("/page")
    public Result<PageResult<PolicyDetailVO>> pagePolicies(PageQuery pageQuery,
                                                           @RequestParam(required = false) String policyName,
                                                           @RequestParam(required = false) Integer policyStatus,
                                                           @RequestParam(required = false) String department) {
        LambdaQueryWrapper<SubsidyPolicy> wrapper = new LambdaQueryWrapper<>();
        if (policyName != null) {
            wrapper.like(SubsidyPolicy::getPolicyName, policyName);
        }
        if (policyStatus != null) {
            wrapper.eq(SubsidyPolicy::getPolicyStatus, policyStatus);
        }
        if (department != null) {
            wrapper.eq(SubsidyPolicy::getDepartment, department);
        }
        wrapper.orderByDesc(SubsidyPolicy::getCreateTime);

        Page<SubsidyPolicy> page = policyService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<PolicyDetailVO> voList = page.getRecords().stream().map(policy -> {
            PolicyDetailVO vo = new PolicyDetailVO();
            BeanUtils.copyProperties(policy, vo);
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList));
    }

    @Operation(summary = "检查申领资格")
    @GetMapping("/{id}/eligibility")
    public Result<Boolean> checkEligibility(@PathVariable Long id, @RequestParam String beneficiaryId) {
        return Result.success(policyService.checkEligibility(id, beneficiaryId));
    }
}
