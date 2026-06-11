package com.guizhou.platform.government.controller;

import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.government.dto.request.ServiceApplyDTO;
import com.guizhou.platform.government.entity.ServiceApply;
import com.guizhou.platform.government.service.ServiceApplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "在线申办", description = "政务服务在线申办、撤回、补正、受理、办结")
@RestController
@RequestMapping("/api/apply")
public class ServiceApplyController {

    @Resource
    private ServiceApplyService serviceApplyService;

    @Operation(summary = "提交申办")
    @PostMapping
    public Result<Long> submitApply(@Valid @RequestBody ServiceApplyDTO dto) {
        return Result.success(serviceApplyService.submitApply(dto));
    }

    @Operation(summary = "撤回申办")
    @PostMapping("/{id}/withdraw")
    public Result<Void> withdrawApply(@PathVariable Long id) {
        serviceApplyService.withdrawApply(id);
        return Result.success();
    }

    @Operation(summary = "补正材料")
    @PostMapping("/{id}/supplement")
    public Result<Void> supplementMaterial(@PathVariable Long id, @Valid @RequestBody ServiceApplyDTO dto) {
        serviceApplyService.supplementMaterial(id, dto);
        return Result.success();
    }

    @Operation(summary = "受理申办")
    @PostMapping("/{id}/accept")
    public Result<Void> acceptApply(@PathVariable Long id, @RequestParam String opinion) {
        serviceApplyService.acceptApply(id, opinion);
        return Result.success();
    }

    @Operation(summary = "不予受理")
    @PostMapping("/{id}/reject")
    public Result<Void> rejectApply(@PathVariable Long id, @RequestParam String opinion) {
        serviceApplyService.rejectApply(id, opinion);
        return Result.success();
    }

    @Operation(summary = "开始办理")
    @PostMapping("/{id}/start")
    public Result<Void> startProcess(@PathVariable Long id) {
        serviceApplyService.startProcess(id);
        return Result.success();
    }

    @Operation(summary = "办结")
    @PostMapping("/{id}/complete")
    public Result<Void> completeApply(@PathVariable Long id,
                                       @RequestParam String completeResult,
                                       @RequestParam(required = false) String resultDocumentNo) {
        serviceApplyService.completeApply(id, completeResult, resultDocumentNo);
        return Result.success();
    }

    @Operation(summary = "分页查询申办记录")
    @GetMapping("/page")
    public Result<PageResult<ServiceApply>> pageApplies(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String applyNo,
            @RequestParam(required = false) String applicantName,
            @RequestParam(required = false) String applicantIdCard,
            @RequestParam(required = false) Integer applyStatus,
            @RequestParam(required = false) Long itemId) {
        return Result.success(serviceApplyService.pageApplies(pageNum, pageSize, applyNo,
                applicantName, applicantIdCard, applyStatus, itemId));
    }

    @Operation(summary = "获取申办详情")
    @GetMapping("/{id}")
    public Result<ServiceApply> getApplyDetail(@PathVariable Long id) {
        return Result.success(serviceApplyService.getApplyDetail(id));
    }
}
