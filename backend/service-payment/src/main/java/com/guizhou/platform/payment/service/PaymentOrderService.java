package com.guizhou.platform.payment.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.payment.dto.request.CreateOrderDTO;
import com.guizhou.platform.payment.dto.request.PayCallbackDTO;
import com.guizhou.platform.payment.dto.response.PaymentOrderVO;
import com.guizhou.platform.payment.entity.PaymentOrder;

import java.util.List;

public interface PaymentOrderService extends IService<PaymentOrder> {

    PaymentOrderVO createOrder(CreateOrderDTO dto);

    PaymentOrderVO payOrder(Long orderId, Integer paymentChannel);

    void handleCallback(PayCallbackDTO dto);

    PaymentOrderVO getOrderDetail(Long orderId);

    PaymentOrderVO getOrderByOrderNo(String orderNo);

    List<PaymentOrderVO> listByUserId(Long userId);

    void closeOrder(Long orderId);

    void closeExpiredOrders();
}
