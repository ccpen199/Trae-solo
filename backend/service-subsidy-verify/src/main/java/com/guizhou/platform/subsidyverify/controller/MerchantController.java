package com.guizhou.platform.subsidyverify.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidyverify.dto.request.MerchantApplyDTO;
import com.guizhou.platform.subsidyverify.dto.response.MerchantDetailVO;
import com.guizhou.platform.subsidyverify.entity.Merchant;
import com.guizhou.platform.subsidyverify.enums.MerchantStatusEnum;
import com.guizhou.platform.subsidyverify.service.MerchantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "商户管理", description = "商户入驻、资质审核、商户查询")
@RestController
@RequestMapping("/api/merchant")
public class MerchantController {

    @Resource
    private MerchantService merchantService;

    @Operation(summary = "商户入驻申请")
    @PostMapping("/apply")
    public Result<String> apply(@Valid @RequestBody MerchantApplyDTO dto) {
        return Result.success(merchantService.apply(dto));
    }

    @Operation(summary = "获取商户详情")
    @GetMapping("/{id}")
    public Result<MerchantDetailVO> getDetail(@PathVariable Long id) {
        return Result.success(merchantService.getDetail(id));
    }

    @Operation(summary = "审核通过")
    @PostMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable Long id, @RequestParam String opinion) {
        merchantService.approve(id, opinion);
        return Result.success();
    }

    @Operation(summary = "审核驳回")
    @PostMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable Long id, @RequestParam String opinion) {
        merchantService.reject(id, opinion);
        return Result.success();
    }

    @Operation(summary = "禁用商户")
    @PostMapping("/{id}/disable")
    public Result<Void> disable(@PathVariable Long id, @RequestParam String reason) {
        merchantService.disable(id, reason);
        return Result.success();
    }

    @Operation(summary = "恢复商户")
    @PostMapping("/{id}/enable")
    public Result<Void> enable(@PathVariable Long id) {
        merchantService.enable(id);
        return Result.success();
    }

    @Operation(summary = "拉黑商户")
    @PostMapping("/{id}/blacklist")
    public Result<Void> blacklist(@PathVariable Long id, @RequestParam String reason) {
        merchantService.blacklist(id, reason);
        return Result.success();
    }

    @Operation(summary = "按分类查询商户")
    @GetMapping("/category/{categoryCode}")
    public Result<List<MerchantDetailVO>> listByCategory(@PathVariable String categoryCode) {
        return Result.success(merchantService.listByCategory(categoryCode));
    }

    @Operation(summary = "按状态查询商户")
    @GetMapping("/status/{status}")
    public Result<List<MerchantDetailVO>> listByStatus(@PathVariable Integer status) {
        return Result.success(merchantService.listByStatus(status));
    }

    @Operation(summary = "分页查询商户列表")
    @GetMapping("/page")
    public Result<PageResult<MerchantDetailVO>> pageMerchants(PageQuery pageQuery,
                                                              @RequestParam(required = false) String merchantName,
                                                              @RequestParam(required = false) String categoryCode,
                                                              @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Merchant> wrapper = new LambdaQueryWrapper<>();
        if (merchantName != null) {
            wrapper.like(Merchant::getMerchantName, merchantName);
        }
        if (categoryCode != null) {
            wrapper.eq(Merchant::getCategoryCode, categoryCode);
        }
        if (status != null) {
            wrapper.eq(Merchant::getStatus, status);
        }
        wrapper.orderByDesc(Merchant::getCreateTime);

        Page<Merchant> page = merchantService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<MerchantDetailVO> voList = page.getRecords().stream().map(merchant -> {
            MerchantDetailVO vo = new MerchantDetailVO();
            BeanUtils.copyProperties(merchant, vo);
            MerchantStatusEnum statusEnum = MerchantStatusEnum.getByCode(merchant.getStatus());
            if (statusEnum != null) {
                vo.setStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }
}
