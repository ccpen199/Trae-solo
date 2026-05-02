package com.fooddelivery.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.entity.OrderStatusLog;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.mapper.OrderStatusLogMapper;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.OrderStateMachineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.statemachine.persist.StateMachinePersister;
import org.springframework.statemachine.support.DefaultStateMachineContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderStateMachineServiceImpl implements OrderStateMachineService {

    private final StateMachineFactory<Integer, String> stateMachineFactory;
    private final StateMachinePersister<Integer, String, String> stateMachinePersister;
    private final OrderMainMapper orderMainMapper;
    private final OrderStatusLogMapper orderStatusLogMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean triggerEvent(Long orderId, OrderEvent event, Long operatorId, AuditSource source, String reason) {
        return triggerEventWithLog(orderId, event, operatorId, source, reason, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean triggerEventWithLog(Long orderId, OrderEvent event, Long operatorId, AuditSource source, String reason, String extInfo) {
        OrderMain order = orderMainMapper.selectById(orderId);
        if (order == null) {
            log.error("订单不存在: orderId={}", orderId);
            return false;
        }

        OrderStatus currentStatus = OrderStatus.fromCode(order.getOrderStatus());
        log.info("触发状态机事件: orderId={}, currentStatus={}, event={}, source={}", 
                orderId, currentStatus.getName(), event.getName(), source.getName());

        if (!canTransition(currentStatus, event)) {
            log.warn("状态转换不允许: orderId={}, from={}, event={}", orderId, currentStatus.getName(), event.getName());
            return false;
        }

        try {
            String machineId = "order-" + orderId;
            StateMachine<Integer, String> stateMachine = stateMachineFactory.getStateMachine(machineId);
            
            stateMachine.stop();
            
            stateMachine.getStateMachineAccessor()
                .doWithAllRegions(access -> {
                    access.resetStateMachine(new DefaultStateMachineContext<>(
                        currentStatus.getCode(), null, null, null, null, machineId));
                });
            
            stateMachine.start();

            boolean result = stateMachine.sendEvent(event.getCode());
            
            if (result) {
                Integer targetState = stateMachine.getState().getId();
                OrderStatus toStatus = OrderStatus.fromCode(targetState);
                
                order.setOrderStatus(targetState);
                updateOrderTimestamps(order, event);
                orderMainMapper.updateById(order);
                
                saveStatusLog(order, currentStatus, toStatus, event, operatorId, source, reason);
                
                auditLogService.logStatusChange(
                    "ORDER", orderId, order.getOrderNo(),
                    currentStatus.getCode(), currentStatus.getName(),
                    targetState, toStatus.getName(),
                    event.getCode(), event.getName(),
                    operatorId, getOperatorRole(operatorId),
                    source, reason, extInfo
                );
                
                log.info("状态转换成功: orderId={}, from={} -> to={}", 
                        orderId, currentStatus.getName(), toStatus.getName());
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("状态机事件处理失败: orderId={}, event={}", orderId, event.getName(), e);
            return false;
        }
    }

    private void updateOrderTimestamps(OrderMain order, OrderEvent event) {
        LocalDateTime now = LocalDateTime.now();
        switch (event) {
            case RECEIVE_ORDER:
                order.setReceiveTime(now);
                break;
            case START_PREPARE:
                order.setPrepareStartTime(now);
                break;
            case FINISH_PREPARE:
                order.setPrepareEndTime(now);
                break;
            case RIDER_TAKE_ORDER:
                order.setRiderTakeTime(now);
                break;
            case START_DELIVERY:
                order.setDeliveryStartTime(now);
                break;
            case COMPLETE_ORDER:
                order.setDeliveryEndTime(now);
                order.setCompleteTime(now);
                break;
            default:
                break;
        }
    }

    private void saveStatusLog(OrderMain order, OrderStatus fromStatus, OrderStatus toStatus,
                                OrderEvent event, Long operatorId, AuditSource source, String reason) {
        OrderStatusLog log = new OrderStatusLog();
        log.setOrderId(order.getId());
        log.setOrderNo(order.getOrderNo());
        log.setFromStatus(fromStatus.getCode());
        log.setToStatus(toStatus.getCode());
        log.setEventCode(event.getCode());
        log.setEventName(event.getName());
        log.setSourceType(source.getCode());
        log.setSourceName(source.getName());
        log.setOperatorId(operatorId);
        log.setReason(reason);
        orderStatusLogMapper.insert(log);
    }

    private String getOperatorRole(Long operatorId) {
        if (operatorId == null) {
            return RoleType.SYSTEM_AUTO.getName();
        }
        return RoleType.MERCHANT.getName();
    }

    @Override
    public OrderStatus getCurrentStatus(Long orderId) {
        OrderMain order = orderMainMapper.selectById(orderId);
        return order != null ? OrderStatus.fromCode(order.getOrderStatus()) : null;
    }

    @Override
    public List<OrderStatusLog> getStatusHistory(Long orderId) {
        return orderStatusLogMapper.selectList(
            new LambdaQueryWrapper<OrderStatusLog>()
                .eq(OrderStatusLog::getOrderId, orderId)
                .orderByAsc(OrderStatusLog::getCreateTime)
        );
    }

    @Override
    public void initializeOrderState(OrderMain order) {
        order.setOrderStatus(OrderStatus.WAITING_PAYMENT.getCode());
        log.info("初始化订单状态: orderId={}, status={}", order.getId(), OrderStatus.WAITING_PAYMENT.getName());
    }

    @Override
    public boolean canTransition(OrderStatus currentStatus, OrderEvent event) {
        return switch (event) {
            case PAYMENT_CONFIRMED -> currentStatus == OrderStatus.WAITING_PAYMENT;
            case RECEIVE_ORDER -> currentStatus == OrderStatus.PENDING_RECEIVE;
            case START_PREPARE -> currentStatus == OrderStatus.RECEIVED;
            case FINISH_PREPARE -> currentStatus == OrderStatus.PREPARING;
            case RIDER_TAKE_ORDER -> currentStatus == OrderStatus.PREPARED;
            case START_DELIVERY -> currentStatus == OrderStatus.TAKING;
            case COMPLETE_ORDER -> currentStatus == OrderStatus.DELIVERING;
            case CANCEL_ORDER -> 
                currentStatus == OrderStatus.PENDING_RECEIVE ||
                currentStatus == OrderStatus.RECEIVED ||
                currentStatus == OrderStatus.PREPARING ||
                currentStatus == OrderStatus.PREPARED;
            case APPLY_REFUND ->
                currentStatus == OrderStatus.PENDING_RECEIVE ||
                currentStatus == OrderStatus.RECEIVED ||
                currentStatus == OrderStatus.PREPARING ||
                currentStatus == OrderStatus.PREPARED ||
                currentStatus == OrderStatus.DELIVERING;
            case REFUND_COMPLETE -> currentStatus == OrderStatus.REFUNDING;
            case REJECT_REFUND -> currentStatus == OrderStatus.REFUNDING;
            default -> false;
        };
    }
}
