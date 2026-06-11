package com.guizhou.platform.payment.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.payment.dto.response.PaymentRecordVO;
import com.guizhou.platform.payment.entity.PaymentRecord;
import com.guizhou.platform.payment.enums.PaymentStatusEnum;
import com.guizhou.platform.payment.service.PaymentRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "缴费记录管理", description = "缴费记录查询、统计分析")
@RestController
@RequestMapping("/api/record")
public class PaymentRecordController {

    @Resource
    private PaymentRecordService paymentRecordService;

    @Operation(summary = "获取缴费记录详情")
    @GetMapping("/{id}")
    public Result<PaymentRecordVO> getRecordDetail(@PathVariable Long id) {
        return Result.success(paymentRecordService.getRecordDetail(id));
    }

    @Operation(summary = "查询用户缴费记录")
    @GetMapping("/user/{userId}")
    public Result<List<PaymentRecordVO>> listByUserId(@PathVariable Long userId) {
        return Result.success(paymentRecordService.listByUserId(userId));
    }

    @Operation(summary = "查询订单的缴费记录")
    @GetMapping("/order/{orderId}")
    public Result<List<PaymentRecordVO>> listByOrderId(@PathVariable Long orderId) {
        return Result.success(paymentRecordService.listByOrderId(orderId));
    }

    @Operation(summary = "分页查询缴费记录")
    @GetMapping("/page")
    public Result<PageResult<PaymentRecordVO>> pageRecords(PageQuery pageQuery,
                                                           @RequestParam(required = false) Long userId,
                                                           @RequestParam(required = false) Integer billType,
                                                           @RequestParam(required = false) Integer paymentStatus,
                                                           @RequestParam(required = false) String accountNo) {
        LambdaQueryWrapper<PaymentRecord> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) {
            wrapper.eq(PaymentRecord::getUserId, userId);
        }
        if (billType != null) {
            wrapper.eq(PaymentRecord::getBillType, billType);
        }
        if (paymentStatus != null) {
            wrapper.eq(PaymentRecord::getPaymentStatus, paymentStatus);
        }
        if (accountNo != null) {
            wrapper.eq(PaymentRecord::getAccountNo, accountNo);
        }
        wrapper.orderByDesc(PaymentRecord::getCreateTime);

        Page<PaymentRecord> page = paymentRecordService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<PaymentRecordVO> voList = page.getRecords().stream().map(record -> {
            PaymentRecordVO vo = new PaymentRecordVO();
            BeanUtils.copyProperties(record, vo);
            PaymentStatusEnum statusEnum = PaymentStatusEnum.getByCode(record.getPaymentStatus());
            if (statusEnum != null) {
                vo.setPaymentStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }

    @Operation(summary = "按账单类型统计缴费")
    @GetMapping("/statistics/type")
    public Result<List<Map<String, Object>>> getBillTypeStatistics(@RequestParam(defaultValue = "2024-01-01") String startTime) {
        return Result.success(paymentRecordService.getBillTypeStatistics(startTime));
    }

    @Operation(summary = "按月统计缴费趋势")
    @GetMapping("/statistics/monthly")
    public Result<List<Map<String, Object>>> getMonthlyTrend(@RequestParam(defaultValue = "2024-01-01") String startTime) {
        return Result.success(paymentRecordService.getMonthlyTrend(startTime));
    }
}
