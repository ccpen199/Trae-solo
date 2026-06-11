package com.guizhou.platform.payment.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.payment.dto.request.CreateOrderDTO;
import com.guizhou.platform.payment.dto.request.PayCallbackDTO;
import com.guizhou.platform.payment.dto.response.PaymentOrderVO;
import com.guizhou.platform.payment.entity.PaymentOrder;
import com.guizhou.platform.payment.enums.PaymentStatusEnum;
import com.guizhou.platform.payment.service.PaymentOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "缴费订单管理", description = "缴费订单创建、支付、回调、关闭")
@RestController
@RequestMapping("/api/order")
public class PaymentOrderController {

    @Resource
    private PaymentOrderService paymentOrderService;

    @Operation(summary = "创建缴费订单")
    @PostMapping("/create")
    public Result<PaymentOrderVO> createOrder(@Valid @RequestBody CreateOrderDTO dto) {
        return Result.success(paymentOrderService.createOrder(dto));
    }

    @Operation(summary = "发起支付")
    @PostMapping("/{id}/pay")
    public Result<PaymentOrderVO> payOrder(@PathVariable Long id, @RequestParam Integer paymentChannel) {
        return Result.success(paymentOrderService.payOrder(id, paymentChannel));
    }

    @Operation(summary = "支付回调处理")
    @PostMapping("/callback")
    public Result<Void> handleCallback(@Valid @RequestBody PayCallbackDTO dto) {
        paymentOrderService.handleCallback(dto);
        return Result.success();
    }

    @Operation(summary = "获取订单详情")
    @GetMapping("/{id}")
    public Result<PaymentOrderVO> getOrderDetail(@PathVariable Long id) {
        return Result.success(paymentOrderService.getOrderDetail(id));
    }

    @Operation(summary = "根据订单号查询")
    @GetMapping("/no/{orderNo}")
    public Result<PaymentOrderVO> getOrderByOrderNo(@PathVariable String orderNo) {
        return Result.success(paymentOrderService.getOrderByOrderNo(orderNo));
    }

    @Operation(summary = "查询用户订单列表")
    @GetMapping("/user/{userId}")
    public Result<List<PaymentOrderVO>> listByUserId(@PathVariable Long userId) {
        return Result.success(paymentOrderService.listByUserId(userId));
    }

    @Operation(summary = "关闭订单")
    @PostMapping("/{id}/close")
    public Result<Void> closeOrder(@PathVariable Long id) {
        paymentOrderService.closeOrder(id);
        return Result.success();
    }

    @Operation(summary = "分页查询订单列表")
    @GetMapping("/page")
    public Result<PageResult<PaymentOrderVO>> pageOrders(PageQuery pageQuery,
                                                         @RequestParam(required = false) Long userId,
                                                         @RequestParam(required = false) Integer billType,
                                                         @RequestParam(required = false) Integer paymentStatus,
                                                         @RequestParam(required = false) String orderNo) {
        LambdaQueryWrapper<PaymentOrder> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) {
            wrapper.eq(PaymentOrder::getUserId, userId);
        }
        if (billType != null) {
            wrapper.eq(PaymentOrder::getBillType, billType);
        }
        if (paymentStatus != null) {
            wrapper.eq(PaymentOrder::getPaymentStatus, paymentStatus);
        }
        if (orderNo != null) {
            wrapper.eq(PaymentOrder::getOrderNo, orderNo);
        }
        wrapper.orderByDesc(PaymentOrder::getCreateTime);

        Page<PaymentOrder> page = paymentOrderService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<PaymentOrderVO> voList = page.getRecords().stream().map(order -> {
            PaymentOrderVO vo = new PaymentOrderVO();
            BeanUtils.copyProperties(order, vo);
            PaymentStatusEnum statusEnum = PaymentStatusEnum.getByCode(order.getPaymentStatus());
            if (statusEnum != null) {
                vo.setPaymentStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }

    @Operation(summary = "获取待支付订单数")
    @GetMapping("/pending-count")
    public Result<Long> getPendingCount(@RequestParam Long userId) {
        long count = paymentOrderService.count(new LambdaQueryWrapper<PaymentOrder>()
                .eq(PaymentOrder::getUserId, userId)
                .eq(PaymentOrder::getPaymentStatus, PaymentStatusEnum.PENDING_PAY.getCode()));
        return Result.success(count);
    }
}
