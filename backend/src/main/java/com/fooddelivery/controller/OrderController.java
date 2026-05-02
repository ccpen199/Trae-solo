package com.fooddelivery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fooddelivery.dto.CommonResponse;
import com.fooddelivery.entity.OrderDetail;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.entity.OrderStatusLog;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.mapper.OrderDetailMapper;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.mapper.OrderStatusLogMapper;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.OrderStateMachineService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderMainMapper orderMainMapper;
    private final OrderDetailMapper orderDetailMapper;
    private final OrderStatusLogMapper orderStatusLogMapper;
    private final OrderStateMachineService orderStateMachineService;
    private final AuditLogService auditLogService;

    @GetMapping("/list")
    public CommonResponse.Result<CommonResponse.PageData<OrderMain>> getOrderList(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keyword) {
        
        LambdaQueryWrapper<OrderMain> wrapper = new LambdaQueryWrapper<>();
        
        if (storeId != null) {
            wrapper.eq(OrderMain::getStoreId, storeId);
        }
        if (status != null) {
            wrapper.eq(OrderMain::getOrderStatus, status);
        }
        if (startDate != null && !startDate.isEmpty()) {
            LocalDate date = LocalDate.parse(startDate);
            wrapper.ge(OrderMain::getCreateTime, date.atStartOfDay());
        }
        if (endDate != null && !endDate.isEmpty()) {
            LocalDate date = LocalDate.parse(endDate);
            wrapper.le(OrderMain::getCreateTime, date.atTime(LocalTime.MAX));
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w
                .like(OrderMain::getOrderNo, keyword)
                .or()
                .like(OrderMain::getPlatformOrderNo, keyword)
                .or()
                .like(OrderMain::getCustomerName, keyword)
                .or()
                .like(OrderMain::getCustomerPhone, keyword)
            );
        }
        
        wrapper.orderByDesc(OrderMain::getCreateTime);
        
        Page<OrderMain> pageResult = orderMainMapper.selectPage(new Page<>(page, size), wrapper);
        
        CommonResponse.PageData<OrderMain> result = new CommonResponse.PageData<>();
        result.setTotal(pageResult.getTotal());
        result.setPage(pageResult.getCurrent());
        result.setSize(pageResult.getSize());
        result.setTotalPages(pageResult.getPages());
        result.setRecords(pageResult.getRecords());
        
        return CommonResponse.Result.success(result);
    }

    @GetMapping("/{id}")
    public CommonResponse.Result<OrderDetailResponse> getOrderDetail(@PathVariable Long id) {
        OrderMain order = orderMainMapper.selectById(id);
        if (order == null) {
            return CommonResponse.Result.error("订单不存在");
        }
        
        List<OrderDetail> details = orderDetailMapper.selectList(
            new LambdaQueryWrapper<OrderDetail>()
                .eq(OrderDetail::getOrderId, id)
                .orderByAsc(OrderDetail::getId)
        );
        
        List<OrderStatusLog> statusHistory = orderStatusLogMapper.selectList(
            new LambdaQueryWrapper<OrderStatusLog>()
                .eq(OrderStatusLog::getOrderId, id)
                .orderByAsc(OrderStatusLog::getCreateTime)
        );
        
        var auditLogs = auditLogService.getTraceLog("ORDER", id);
        
        OrderDetailResponse response = new OrderDetailResponse();
        response.setOrder(order);
        response.setDetails(details);
        response.setStatusHistory(statusHistory);
        response.setAuditTrail(auditLogs);
        
        return CommonResponse.Result.success(response);
    }

    @GetMapping("/by-no/{orderNo}")
    public CommonResponse.Result<OrderMain> getOrderByNo(@PathVariable String orderNo) {
        OrderMain order = orderMainMapper.selectOne(
            new LambdaQueryWrapper<OrderMain>()
                .eq(OrderMain::getOrderNo, orderNo)
        );
        if (order == null) {
            return CommonResponse.Result.error("订单不存在");
        }
        return CommonResponse.Result.success(order);
    }

    @PostMapping("/{id}/receive")
    public CommonResponse.Result<Null> receiveOrder(
            @PathVariable Long id,
            @RequestBody ReceiveRequest request,
            @RequestAttribute(required = false) Long userId) {
        
        OrderMain order = orderMainMapper.selectById(id);
        if (order == null) {
            return CommonResponse.Result.error("订单不存在");
        }
        
        boolean success;
        if ("auto".equals(request.getType())) {
            order.setReceiveType(1);
            success = orderStateMachineService.triggerEvent(
                id, OrderEvent.RECEIVE_ORDER, userId, AuditSource.SYSTEM_AUTO, "自动接单"
            );
        } else {
            order.setReceiveType(2);
            success = orderStateMachineService.triggerEvent(
                id, OrderEvent.RECEIVE_ORDER, userId, AuditSource.MERCHANT_PORTAL, "手动接单"
            );
        }
        
        if (success) {
            orderMainMapper.updateById(order);
            log.info("订单接单成功: orderId={}, type={}", id, request.getType());
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("接单失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/cancel")
    public CommonResponse.Result<Null> cancelOrder(
            @PathVariable Long id,
            @RequestBody CancelRequest request,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.CANCEL_ORDER, userId, AuditSource.MERCHANT_PORTAL, request.getReason()
        );
        
        if (success) {
            log.info("订单取消成功: orderId={}, reason={}", id, request.getReason());
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("取消失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/complete")
    public CommonResponse.Result<Null> completeOrder(
            @PathVariable Long id,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.COMPLETE_ORDER, userId, AuditSource.MERCHANT_PORTAL, "商家确认完成"
        );
        
        if (success) {
            log.info("订单完成: orderId={}", id);
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("操作失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/start-prepare")
    public CommonResponse.Result<Null> startPrepare(
            @PathVariable Long id,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.START_PREPARE, userId, AuditSource.MERCHANT_PORTAL, "开始制作"
        );
        
        if (success) {
            log.info("订单开始制作: orderId={}", id);
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("操作失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/finish-prepare")
    public CommonResponse.Result<Null> finishPrepare(
            @PathVariable Long id,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.FINISH_PREPARE, userId, AuditSource.MERCHANT_PORTAL, "制作完成"
        );
        
        if (success) {
            log.info("订单制作完成: orderId={}", id);
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("操作失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/rider-take")
    public CommonResponse.Result<Null> riderTakeOrder(
            @PathVariable Long id,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.RIDER_TAKE_ORDER, userId, AuditSource.RIDER_APP, "骑手取餐"
        );
        
        if (success) {
            log.info("骑手取餐: orderId={}", id);
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("操作失败，订单状态不允许");
        }
    }

    @PostMapping("/{id}/start-delivery")
    public CommonResponse.Result<Null> startDelivery(
            @PathVariable Long id,
            @RequestAttribute(required = false) Long userId) {
        
        boolean success = orderStateMachineService.triggerEvent(
            id, OrderEvent.START_DELIVERY, userId, AuditSource.RIDER_APP, "开始配送"
        );
        
        if (success) {
            log.info("开始配送: orderId={}", id);
            return CommonResponse.Result.success();
        } else {
            return CommonResponse.Result.error("操作失败，订单状态不允许");
        }
    }

    @Data
    public static class OrderDetailResponse {
        private OrderMain order;
        private List<OrderDetail> details;
        private List<OrderStatusLog> statusHistory;
        private List<?> auditTrail;
    }

    @Data
    public static class ReceiveRequest {
        private String type;
    }

    @Data
    public static class CancelRequest {
        private String reason;
    }
}
