package com.guizhou.platform.living.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.living.dto.request.BookingCreateDTO;
import com.guizhou.platform.living.dto.response.BookingDetailVO;
import com.guizhou.platform.living.entity.ServiceBooking;
import com.guizhou.platform.living.enums.BookingStatusEnum;
import com.guizhou.platform.living.service.ServiceBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Tag(name = "服务预约管理", description = "预约、派单、服务过程管理")
@RestController
@RequestMapping("/api/booking")
public class ServiceBookingController {

    @Resource
    private ServiceBookingService bookingService;

    @Operation(summary = "创建服务预约")
    @PostMapping("/create")
    public Result<String> createBooking(@Valid @RequestBody BookingCreateDTO dto,
                                        @RequestHeader("X-User-Id") Long userId) {
        return Result.success(bookingService.createBooking(dto, userId));
    }

    @Operation(summary = "服务商派单")
    @PostMapping("/{id}/assign")
    public Result<Void> assignStaff(@PathVariable Long id,
                                    @RequestParam Long staffId,
                                    @RequestHeader("X-User-Id") Long assignBy) {
        bookingService.assignStaff(id, staffId, assignBy);
        return Result.success();
    }

    @Operation(summary = "用户确认服务")
    @PostMapping("/{id}/confirm")
    public Result<Void> confirmService(@PathVariable Long id) {
        bookingService.confirmService(id);
        return Result.success();
    }

    @Operation(summary = "开始服务")
    @PostMapping("/{id}/start")
    public Result<Void> startService(@PathVariable Long id) {
        bookingService.startService(id);
        return Result.success();
    }

    @Operation(summary = "完成服务")
    @PostMapping("/{id}/complete")
    public Result<Void> completeService(@PathVariable Long id,
                                        @RequestParam(required = false) BigDecimal actualPrice) {
        bookingService.completeService(id, actualPrice);
        return Result.success();
    }

    @Operation(summary = "取消预约")
    @PostMapping("/{id}/cancel")
    public Result<Void> cancelBooking(@PathVariable Long id, @RequestParam String reason) {
        bookingService.cancelBooking(id, reason);
        return Result.success();
    }

    @Operation(summary = "获取预约详情")
    @GetMapping("/{id}")
    public Result<BookingDetailVO> getBookingDetail(@PathVariable Long id) {
        return Result.success(bookingService.getBookingDetail(id));
    }

    @Operation(summary = "查询用户预约列表")
    @GetMapping("/user")
    public Result<List<BookingDetailVO>> listBookingsByUser(@RequestHeader("X-User-Id") Long userId) {
        return Result.success(bookingService.listBookingsByUser(userId));
    }

    @Operation(summary = "查询服务商预约列表")
    @GetMapping("/provider/{providerId}")
    public Result<List<BookingDetailVO>> listBookingsByProvider(@PathVariable Long providerId) {
        return Result.success(bookingService.listBookingsByProvider(providerId));
    }

    @Operation(summary = "分页查询预约列表")
    @GetMapping("/page")
    public Result<PageResult<BookingDetailVO>> pageBookings(PageQuery pageQuery,
                                                             @RequestParam(required = false) Long providerId,
                                                             @RequestParam(required = false) Integer bookingStatus,
                                                             @RequestParam(required = false) String categoryCode) {
        LambdaQueryWrapper<ServiceBooking> wrapper = new LambdaQueryWrapper<>();
        if (providerId != null) {
            wrapper.eq(ServiceBooking::getProviderId, providerId);
        }
        if (bookingStatus != null) {
            wrapper.eq(ServiceBooking::getBookingStatus, bookingStatus);
        }
        if (categoryCode != null) {
            wrapper.eq(ServiceBooking::getCategoryCode, categoryCode);
        }
        wrapper.orderByDesc(ServiceBooking::getCreateTime);

        Page<ServiceBooking> page = bookingService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<BookingDetailVO> voList = page.getRecords().stream().map(booking -> {
            BookingDetailVO vo = new BookingDetailVO();
            BeanUtils.copyProperties(booking, vo);
            BookingStatusEnum statusEnum = BookingStatusEnum.getByCode(booking.getBookingStatus());
            if (statusEnum != null) {
                vo.setBookingStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList, pageQuery.getPageNum(), pageQuery.getPageSize()));
    }

    @Operation(summary = "获取待派单数量")
    @GetMapping("/pending-count")
    public Result<Long> getPendingCount() {
        long count = bookingService.count(new LambdaQueryWrapper<ServiceBooking>()
                .eq(ServiceBooking::getBookingStatus, BookingStatusEnum.PENDING_ASSIGN.getCode()));
        return Result.success(count);
    }
}
