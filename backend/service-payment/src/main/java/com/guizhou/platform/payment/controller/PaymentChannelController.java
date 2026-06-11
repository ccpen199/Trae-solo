package com.guizhou.platform.payment.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.payment.entity.PaymentChannel;
import com.guizhou.platform.payment.enums.PaymentChannelEnum;
import com.guizhou.platform.payment.service.PaymentChannelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "缴费渠道管理", description = "微信/支付宝/银联/云闪付等支付渠道配置")
@RestController
@RequestMapping("/api/channel")
public class PaymentChannelController {

    @Resource
    private PaymentChannelService paymentChannelService;

    @Operation(summary = "获取所有启用的缴费渠道")
    @GetMapping("/enabled")
    public Result<List<PaymentChannel>> listEnabledChannels() {
        return Result.success(paymentChannelService.listEnabledChannels());
    }

    @Operation(summary = "根据渠道类型查询渠道配置")
    @GetMapping("/{channelType}")
    public Result<PaymentChannel> getChannelByType(@PathVariable Integer channelType) {
        return Result.success(paymentChannelService.getChannelByType(channelType));
    }

    @Operation(summary = "获取支持的支付渠道类型")
    @GetMapping("/types")
    public Result<PaymentChannelEnum[]> getChannelTypes() {
        return Result.success(PaymentChannelEnum.values());
    }

    @Operation(summary = "新增缴费渠道配置")
    @PostMapping
    public Result<Void> addChannel(@RequestBody PaymentChannel channel) {
        paymentChannelService.save(channel);
        return Result.success();
    }

    @Operation(summary = "更新缴费渠道配置")
    @PutMapping
    public Result<Void> updateChannel(@RequestBody PaymentChannel channel) {
        paymentChannelService.updateById(channel);
        return Result.success();
    }

    @Operation(summary = "启用/禁用缴费渠道")
    @PutMapping("/{id}/toggle")
    public Result<Void> toggleChannel(@PathVariable Long id, @RequestParam Integer enabled) {
        PaymentChannel channel = new PaymentChannel();
        channel.setId(id);
        channel.setEnabled(enabled);
        paymentChannelService.updateById(channel);
        return Result.success();
    }
}
