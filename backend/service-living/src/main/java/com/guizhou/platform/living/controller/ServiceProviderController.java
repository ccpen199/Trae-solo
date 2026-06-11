package com.guizhou.platform.living.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.living.dto.request.ProviderApplyDTO;
import com.guizhou.platform.living.dto.response.ProviderDetailVO;
import com.guizhou.platform.living.entity.ServiceProvider;
import com.guizhou.platform.living.enums.ProviderStatusEnum;
import com.guizhou.platform.living.service.ServiceProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "服务商管理", description = "服务商入驻、资质审核、营业管理")
@RestController
@RequestMapping("/api/provider")
public class ServiceProviderController {

    @Resource
    private ServiceProviderService providerService;

    @Operation(summary = "服务商入驻申请")
    @PostMapping("/apply")
    public Result<String> applyProvider(@Valid @RequestBody ProviderApplyDTO dto) {
        return Result.success(providerService.applyProvider(dto));
    }

    @Operation(summary = "审核服务商资质")
    @PostMapping("/{id}/review")
    public Result<Void> reviewProvider(@PathVariable Long id,
                                       @RequestParam Boolean passed,
                                       @RequestParam(required = false) String opinion) {
        providerService.reviewProvider(id, passed, opinion);
        return Result.success();
    }

    @Operation(summary = "获取服务商详情")
    @GetMapping("/{id}")
    public Result<ProviderDetailVO> getProviderDetail(@PathVariable Long id) {
        return Result.success(providerService.getProviderDetail(id));
    }

    @Operation(summary = "按分类查询服务商列表")
    @GetMapping("/category/{categoryCode}")
    public Result<List<ProviderDetailVO>> listProvidersByCategory(@PathVariable String categoryCode) {
        return Result.success(providerService.listProvidersByCategory(categoryCode));
    }

    @Operation(summary = "暂停服务商营业")
    @PostMapping("/{id}/suspend")
    public Result<Void> suspendProvider(@PathVariable Long id, @RequestParam String reason) {
        providerService.suspendProvider(id, reason);
        return Result.success();
    }

    @Operation(summary = "激活服务商")
    @PostMapping("/{id}/activate")
    public Result<Void> activateProvider(@PathVariable Long id) {
        providerService.activateProvider(id);
        return Result.success();
    }

    @Operation(summary = "拉黑服务商")
    @PostMapping("/{id}/blacklist")
    public Result<Void> blacklistProvider(@PathVariable Long id, @RequestParam String reason) {
        providerService.blacklistProvider(id, reason);
        return Result.success();
    }

    @Operation(summary = "分页查询服务商列表")
    @GetMapping("/page")
    public Result<PageResult<ProviderDetailVO>> pageProviders(PageQuery pageQuery,
                                                              @RequestParam(required = false) String categoryCode,
                                                              @RequestParam(required = false) Integer providerStatus,
                                                              @RequestParam(required = false) String providerName) {
        LambdaQueryWrapper<ServiceProvider> wrapper = new LambdaQueryWrapper<>();
        if (categoryCode != null) {
            wrapper.eq(ServiceProvider::getCategoryCode, categoryCode);
        }
        if (providerStatus != null) {
            wrapper.eq(ServiceProvider::getProviderStatus, providerStatus);
        }
        if (providerName != null) {
            wrapper.like(ServiceProvider::getProviderName, providerName);
        }
        wrapper.orderByDesc(ServiceProvider::getCreateTime);

        Page<ServiceProvider> page = providerService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<ProviderDetailVO> voList = page.getRecords().stream().map(provider -> {
            ProviderDetailVO vo = new ProviderDetailVO();
            BeanUtils.copyProperties(provider, vo);
            ProviderStatusEnum statusEnum = ProviderStatusEnum.getByCode(provider.getProviderStatus());
            if (statusEnum != null) {
                vo.setProviderStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }

    @Operation(summary = "获取待审核服务商数量")
    @GetMapping("/pending-count")
    public Result<Long> getPendingCount() {
        long count = providerService.count(new LambdaQueryWrapper<ServiceProvider>()
                .eq(ServiceProvider::getProviderStatus, ProviderStatusEnum.PENDING_REVIEW.getCode()));
        return Result.success(count);
    }
}
