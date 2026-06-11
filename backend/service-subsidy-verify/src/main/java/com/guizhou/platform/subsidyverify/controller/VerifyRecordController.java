package com.guizhou.platform.subsidyverify.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;
import com.guizhou.platform.subsidyverify.enums.VerifyStatusEnum;
import com.guizhou.platform.subsidyverify.service.VerifyRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "核销记录", description = "核销记录查询、统计趋势")
@RestController
@RequestMapping("/api/verify-record")
public class VerifyRecordController {

    @Resource
    private VerifyRecordService verifyRecordService;

    @Operation(summary = "获取核销记录详情")
    @GetMapping("/{id}")
    public Result<VerifyResultVO> getDetail(@PathVariable Long id) {
        return Result.success(verifyRecordService.getDetail(id));
    }

    @Operation(summary = "查询凭证核销记录")
    @GetMapping("/voucher/{voucherId}")
    public Result<List<VerifyResultVO>> listByVoucher(@PathVariable Long voucherId) {
        return Result.success(verifyRecordService.listByVoucher(voucherId));
    }

    @Operation(summary = "查询受益人核销记录")
    @GetMapping("/beneficiary/{beneficiaryId}")
    public Result<List<VerifyResultVO>> listByBeneficiary(@PathVariable Long beneficiaryId) {
        return Result.success(verifyRecordService.listByBeneficiary(beneficiaryId));
    }

    @Operation(summary = "查询商户核销记录")
    @GetMapping("/merchant/{merchantId}")
    public Result<List<VerifyResultVO>> listByMerchant(@PathVariable Long merchantId) {
        return Result.success(verifyRecordService.listByMerchant(merchantId));
    }

    @Operation(summary = "获取核销趋势")
    @GetMapping("/trend")
    public Result<Map<String, Object>> getDailyTrend(@RequestParam(defaultValue = "30") Integer days) {
        return Result.success(verifyRecordService.getDailyTrend(days));
    }

    @Operation(summary = "分页查询核销记录")
    @GetMapping("/page")
    public Result<PageResult<VerifyResultVO>> pageRecords(PageQuery pageQuery,
                                                          @RequestParam(required = false) Long voucherId,
                                                          @RequestParam(required = false) Long beneficiaryId,
                                                          @RequestParam(required = false) Long merchantId,
                                                          @RequestParam(required = false) Integer verifyStatus) {
        LambdaQueryWrapper<VerifyRecord> wrapper = new LambdaQueryWrapper<>();
        if (voucherId != null) {
            wrapper.eq(VerifyRecord::getVoucherId, voucherId);
        }
        if (beneficiaryId != null) {
            wrapper.eq(VerifyRecord::getBeneficiaryId, beneficiaryId);
        }
        if (merchantId != null) {
            wrapper.eq(VerifyRecord::getMerchantId, merchantId);
        }
        if (verifyStatus != null) {
            wrapper.eq(VerifyRecord::getVerifyStatus, verifyStatus);
        }
        wrapper.orderByDesc(VerifyRecord::getVerifyTime);

        Page<VerifyRecord> page = verifyRecordService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<VerifyResultVO> voList = page.getRecords().stream().map(record -> {
            VerifyResultVO vo = new VerifyResultVO();
            BeanUtils.copyProperties(record, vo);
            VerifyStatusEnum statusEnum = VerifyStatusEnum.getByCode(record.getVerifyStatus());
            if (statusEnum != null) {
                vo.setVerifyStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }
}
