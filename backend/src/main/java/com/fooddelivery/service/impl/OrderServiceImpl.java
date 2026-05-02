package com.fooddelivery.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fooddelivery.entity.OrderDetail;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.mapper.OrderDetailMapper;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.OrderService;
import com.fooddelivery.service.OrderStateMachineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderMainMapper orderMainMapper;
    private final OrderDetailMapper orderDetailMapper;
    private final OrderStateMachineService orderStateMachineService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderMain createOrder(OrderMain order, List<OrderDetail> details) {
        log.info("创建订单: orderNo={}", order.getOrderNo());
        
        orderStateMachineService.initializeOrderState(order);
        orderMainMapper.insert(order);

        if (details != null && !details.isEmpty()) {
            for (OrderDetail detail : details) {
                detail.setOrderId(order.getId());
                detail.setOrderNo(order.getOrderNo());
                orderDetailMapper.insert(detail);
            }
        }

        auditLogService.logCreate(
            "ORDER",
            order.getId(),
            order.getOrderNo(),
            null,
            "SYSTEM",
            AuditSource.PLATFORM_CALLBACK,
            "订单创建, 平台单号=" + order.getPlatformOrderNo()
        );

        return order;
    }

    @Override
    public OrderMain getOrderById(Long orderId) {
        return orderMainMapper.selectById(orderId);
    }

    @Override
    public OrderMain getOrderByNo(String orderNo) {
        return orderMainMapper.selectOne(
            new LambdaQueryWrapper<OrderMain>()
                .eq(OrderMain::getOrderNo, orderNo)
        );
    }

    @Override
    public List<OrderMain> getOrdersByStore(Long storeId, Integer status, Integer page, Integer size) {
        LambdaQueryWrapper<OrderMain> wrapper = new LambdaQueryWrapper<OrderMain>()
            .eq(OrderMain::getStoreId, storeId)
            .orderByDesc(OrderMain::getCreateTime);

        if (status != null) {
            wrapper.eq(OrderMain::getOrderStatus, status);
        }

        Page<OrderMain> pageResult = new Page<>(page, size);
        return orderMainMapper.selectPage(pageResult, wrapper).getRecords();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean autoReceiveOrder(Long orderId, Long operatorId) {
        log.info("自动接单: orderId={}, operatorId={}", orderId, operatorId);
        
        OrderMain order = orderMainMapper.selectById(orderId);
        if (order == null) {
            return false;
        }

        order.setReceiveType(1);
        order.setReceiveBy(operatorId);
        orderMainMapper.updateById(order);

        boolean success = orderStateMachineService.triggerEvent(
            orderId,
            OrderEvent.RECEIVE_ORDER,
            operatorId,
            AuditSource.SYSTEM_AUTO,
            "自动接单"
        );

        if (success) {
            auditLogService.logUpdate(
                "ORDER",
                orderId,
                order.getOrderNo(),
                operatorId,
                "SYSTEM",
                AuditSource.SYSTEM_AUTO,
                "自动接单完成"
            );
        }

        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean manualReceiveOrder(Long orderId, Long operatorId) {
        log.info("手动接单: orderId={}, operatorId={}", orderId, operatorId);
        
        OrderMain order = orderMainMapper.selectById(orderId);
        if (order == null) {
            return false;
        }

        order.setReceiveType(2);
        order.setReceiveBy(operatorId);
        orderMainMapper.updateById(order);

        boolean success = orderStateMachineService.triggerEvent(
            orderId,
            OrderEvent.RECEIVE_ORDER,
            operatorId,
            AuditSource.MERCHANT_PORTAL,
            "手动接单"
        );

        if (success) {
            auditLogService.logUpdate(
                "ORDER",
                orderId,
                order.getOrderNo(),
                operatorId,
                "MERCHANT",
                AuditSource.MERCHANT_PORTAL,
                "手动接单完成"
            );
        }

        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrder(Long orderId, Long operatorId, String reason, AuditSource source) {
        log.info("取消订单: orderId={}, operatorId={}, reason={}", orderId, operatorId, reason);
        
        return orderStateMachineService.triggerEvent(
            orderId,
            OrderEvent.CANCEL_ORDER,
            operatorId,
            source,
            reason
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean completeOrder(Long orderId, Long operatorId) {
        log.info("完成订单: orderId={}, operatorId={}", orderId, operatorId);
        
        return orderStateMachineService.triggerEvent(
            orderId,
            OrderEvent.COMPLETE_ORDER,
            operatorId,
            AuditSource.RIDER_APP,
            "骑手确认送达"
        );
    }

    @Override
    public List<OrderDetail> getOrderDetails(Long orderId) {
        return orderDetailMapper.selectList(
            new LambdaQueryWrapper<OrderDetail>()
                .eq(OrderDetail::getOrderId, orderId)
                .orderByAsc(OrderDetail::getId)
        );
    }

    @Override
    public OrderDetail getOrderDetailById(Long detailId) {
        return orderDetailMapper.selectById(detailId);
    }
}
