package com.guizhou.platform.living.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.living.dto.request.EvaluateCreateDTO;
import com.guizhou.platform.living.dto.response.EvaluateVO;
import com.guizhou.platform.living.entity.ServiceEvaluate;
import com.guizhou.platform.living.service.ServiceEvaluateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "服务评价管理", description = "评价提交、查看、回复")
@RestController
@RequestMapping("/api/evaluate")
public class ServiceEvaluateController {

    @Resource
    private ServiceEvaluateService evaluateService;

    @Operation(summary = "提交服务评价")
    @PostMapping("/submit")
    public Result<Long> submitEvaluate(@Valid @RequestBody EvaluateCreateDTO dto,
                                       @RequestHeader("X-User-Id") Long userId) {
        return Result.success(evaluateService.submitEvaluate(dto, userId));
    }

    @Operation(summary = "获取评价详情")
    @GetMapping("/{id}")
    public Result<EvaluateVO> getEvaluateDetail(@PathVariable Long id) {
        return Result.success(evaluateService.getEvaluateDetail(id));
    }

    @Operation(summary = "查询服务商评价列表")
    @GetMapping("/provider/{providerId}")
    public Result<List<EvaluateVO>> listEvaluatesByProvider(@PathVariable Long providerId) {
        return Result.success(evaluateService.listEvaluatesByProvider(providerId));
    }

    @Operation(summary = "查询服务人员评价列表")
    @GetMapping("/staff/{staffId}")
    public Result<List<EvaluateVO>> listEvaluatesByStaff(@PathVariable Long staffId) {
        return Result.success(evaluateService.listEvaluatesByStaff(staffId));
    }

    @Operation(summary = "查询订单评价")
    @GetMapping("/booking/{bookingId}")
    public Result<List<EvaluateVO>> listEvaluatesByBooking(@PathVariable Long bookingId) {
        return Result.success(evaluateService.listEvaluatesByBooking(bookingId));
    }

    @Operation(summary = "服务商回复评价")
    @PostMapping("/{id}/reply")
    public Result<Void> replyEvaluate(@PathVariable Long id,
                                      @RequestParam String replyContent,
                                      @RequestHeader("X-User-Id") Long replyBy) {
        evaluateService.replyEvaluate(id, replyContent, replyBy);
        return Result.success();
    }

    @Operation(summary = "分页查询评价列表")
    @GetMapping("/page")
    public Result<PageResult<EvaluateVO>> pageEvaluates(PageQuery pageQuery,
                                                         @RequestParam(required = false) Long providerId,
                                                         @RequestParam(required = false) Long staffId) {
        LambdaQueryWrapper<ServiceEvaluate> wrapper = new LambdaQueryWrapper<>();
        if (providerId != null) {
            wrapper.eq(ServiceEvaluate::getProviderId, providerId);
        }
        if (staffId != null) {
            wrapper.eq(ServiceEvaluate::getStaffId, staffId);
        }
        wrapper.orderByDesc(ServiceEvaluate::getCreateTime);

        Page<ServiceEvaluate> page = evaluateService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<EvaluateVO> voList = page.getRecords().stream().map(evaluate -> {
            EvaluateVO vo = new EvaluateVO();
            BeanUtils.copyProperties(evaluate, vo);
            if (Boolean.TRUE.equals(evaluate.getAnonymous())) {
                vo.setUserName("***");
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }
}
