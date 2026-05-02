package com.fooddelivery.service;

import com.fooddelivery.entity.OrderDetail;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.enums.AuditSource;

import java.util.List;

public interface OrderService {

    OrderMain createOrder(OrderMain order, List<OrderDetail> details);

    OrderMain getOrderById(Long orderId);

    OrderMain getOrderByNo(String orderNo);

    List<OrderMain> getOrdersByStore(Long storeId, Integer status, Integer page, Integer size);

    boolean autoReceiveOrder(Long orderId, Long operatorId);

    boolean manualReceiveOrder(Long orderId, Long operatorId);

    boolean cancelOrder(Long orderId, Long operatorId, String reason, AuditSource source);

    boolean completeOrder(Long orderId, Long operatorId);

    List<OrderDetail> getOrderDetails(Long orderId);

    OrderDetail getOrderDetailById(Long detailId);
}
