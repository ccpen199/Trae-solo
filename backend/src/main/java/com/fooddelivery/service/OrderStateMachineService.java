package com.fooddelivery.service;

import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.entity.OrderStatusLog;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.enums.OrderStatus;

import java.util.List;

public interface OrderStateMachineService {

    boolean triggerEvent(Long orderId, OrderEvent event, Long operatorId, AuditSource source, String reason);

    boolean triggerEventWithLog(Long orderId, OrderEvent event, Long operatorId, AuditSource source, String reason, String extInfo);

    OrderStatus getCurrentStatus(Long orderId);

    List<OrderStatusLog> getStatusHistory(Long orderId);

    void initializeOrderState(OrderMain order);

    boolean canTransition(OrderStatus currentStatus, OrderEvent event);
}
