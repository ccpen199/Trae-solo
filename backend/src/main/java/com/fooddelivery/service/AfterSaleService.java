package com.fooddelivery.service;

import com.fooddelivery.entity.AfterSale;

import java.math.BigDecimal;
import java.util.List;

public interface AfterSaleService {

    AfterSale createAfterSale(AfterSale afterSale);

    AfterSale getAfterSaleById(Long afterSaleId);

    AfterSale getAfterSaleByNo(String afterSaleNo);

    List<AfterSale> getAfterSalesByOrder(Long orderId);

    List<AfterSale> getAfterSalesByStore(Long storeId, Integer status, Integer page, Integer size);

    boolean applyRefund(Long orderId, BigDecimal applyAmount, String reason, String evidence, Long userId);

    boolean approveRefund(Long afterSaleId, BigDecimal approvedAmount, String remark, Long operatorId);

    boolean rejectRefund(Long afterSaleId, String reason, Long operatorId);

    boolean syncFromPlatform(Long afterSaleId);

    boolean syncToPlatform(Long afterSaleId);
}
