package com.fooddelivery.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fooddelivery.entity.AfterSale;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.mapper.AfterSaleMapper;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.service.AfterSaleService;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.OrderStateMachineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AfterSaleServiceImpl implements AfterSaleService {

    private final AfterSaleMapper afterSaleMapper;
    private final OrderMainMapper orderMainMapper;
    private final OrderStateMachineService orderStateMachineService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AfterSale createAfterSale(AfterSale afterSale) {
        log.info("创建售后单: orderId={}", afterSale.getOrderId());
        
        afterSale.setAfterSaleNo(generateAfterSaleNo());
        afterSale.setAfterSaleStatus(1);
        afterSale.setApplyTime(LocalDateTime.now());
        afterSaleMapper.insert(afterSale);

        OrderMain order = orderMainMapper.selectById(afterSale.getOrderId());
        if (order != null) {
            order.setHasAfterSale(1);
            orderMainMapper.updateById(order);
        }

        auditLogService.logCreate(
            "AFTER_SALE",
            afterSale.getId(),
            afterSale.getAfterSaleNo(),
            afterSale.getApplyUserId(),
            "CUSTOMER",
            AuditSource.PLATFORM_CALLBACK,
            "售后单创建, 类型=" + afterSale.getAfterSaleType()
        );

        return afterSale;
    }

    @Override
    public AfterSale getAfterSaleById(Long afterSaleId) {
        return afterSaleMapper.selectById(afterSaleId);
    }

    @Override
    public AfterSale getAfterSaleByNo(String afterSaleNo) {
        return afterSaleMapper.selectOne(
            new LambdaQueryWrapper<AfterSale>()
                .eq(AfterSale::getAfterSaleNo, afterSaleNo)
        );
    }

    @Override
    public List<AfterSale> getAfterSalesByOrder(Long orderId) {
        return afterSaleMapper.selectList(
            new LambdaQueryWrapper<AfterSale>()
                .eq(AfterSale::getOrderId, orderId)
                .orderByDesc(AfterSale::getCreateTime)
        );
    }

    @Override
    public List<AfterSale> getAfterSalesByStore(Long storeId, Integer status, Integer page, Integer size) {
        LambdaQueryWrapper<AfterSale> wrapper = new LambdaQueryWrapper<AfterSale>()
            .eq(AfterSale::getStoreId, storeId)
            .orderByDesc(AfterSale::getCreateTime);

        if (status != null) {
            wrapper.eq(AfterSale::getAfterSaleStatus, status);
        }

        Page<AfterSale> pageResult = new Page<>(page, size);
        return afterSaleMapper.selectPage(pageResult, wrapper).getRecords();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean applyRefund(Long orderId, BigDecimal applyAmount, String reason, String evidence, Long userId) {
        log.info("申请退款: orderId={}, amount={}", orderId, applyAmount);
        
        OrderMain order = orderMainMapper.selectById(orderId);
        if (order == null) {
            return false;
        }

        AfterSale afterSale = new AfterSale();
        afterSale.setOrderId(orderId);
        afterSale.setOrderNo(order.getOrderNo());
        afterSale.setPlatformAfterSaleNo("PS" + System.currentTimeMillis());
        afterSale.setStoreId(order.getStoreId());
        afterSale.setMerchantId(order.getMerchantId());
        afterSale.setPlatformType(order.getPlatformType());
        afterSale.setAfterSaleType(1);
        afterSale.setApplyAmount(applyAmount);
        afterSale.setApplyReason(reason);
        afterSale.setApplyEvidence(evidence);
        afterSale.setApplyUserId(userId);

        AfterSale created = createAfterSale(afterSale);

        boolean stateSuccess = orderStateMachineService.triggerEvent(
            orderId,
            OrderEvent.APPLY_REFUND,
            userId,
            AuditSource.PLATFORM_CALLBACK,
            reason
        );

        return created != null && stateSuccess;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean approveRefund(Long afterSaleId, BigDecimal approvedAmount, String remark, Long operatorId) {
        log.info("同意退款: afterSaleId={}, amount={}", afterSaleId, approvedAmount);
        
        AfterSale afterSale = afterSaleMapper.selectById(afterSaleId);
        if (afterSale == null) {
            return false;
        }

        afterSale.setAfterSaleStatus(3);
        afterSale.setApprovedAmount(approvedAmount);
        afterSale.setProcessUserId(operatorId);
        afterSale.setProcessResult("APPROVE");
        afterSale.setProcessRemark(remark);
        afterSale.setProcessTime(LocalDateTime.now());
        afterSaleMapper.updateById(afterSale);

        boolean stateSuccess = orderStateMachineService.triggerEvent(
            afterSale.getOrderId(),
            OrderEvent.REFUND_COMPLETE,
            operatorId,
            AuditSource.MERCHANT_PORTAL,
            remark
        );

        auditLogService.logStatusChange(
            "AFTER_SALE",
            afterSaleId,
            afterSale.getAfterSaleNo(),
            1, "待处理",
            3, "已同意",
            "APPROVE", "同意退款",
            operatorId, "MERCHANT",
            AuditSource.MERCHANT_PORTAL,
            remark,
            "{\"approvedAmount\":" + approvedAmount + "}"
        );

        return stateSuccess;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean rejectRefund(Long afterSaleId, String reason, Long operatorId) {
        log.info("拒绝退款: afterSaleId={}, reason={}", afterSaleId, reason);
        
        AfterSale afterSale = afterSaleMapper.selectById(afterSaleId);
        if (afterSale == null) {
            return false;
        }

        afterSale.setAfterSaleStatus(4);
        afterSale.setProcessUserId(operatorId);
        afterSale.setProcessResult("REJECT");
        afterSale.setProcessRemark(reason);
        afterSale.setProcessTime(LocalDateTime.now());
        afterSaleMapper.updateById(afterSale);

        boolean stateSuccess = orderStateMachineService.triggerEvent(
            afterSale.getOrderId(),
            OrderEvent.REJECT_REFUND,
            operatorId,
            AuditSource.MERCHANT_PORTAL,
            reason
        );

        auditLogService.logStatusChange(
            "AFTER_SALE",
            afterSaleId,
            afterSale.getAfterSaleNo(),
            1, "待处理",
            4, "已拒绝",
            "REJECT", "拒绝退款",
            operatorId, "MERCHANT",
            AuditSource.MERCHANT_PORTAL,
            reason,
            null
        );

        return stateSuccess;
    }

    @Override
    public boolean syncFromPlatform(Long afterSaleId) {
        log.info("从平台同步售后单: afterSaleId={}", afterSaleId);
        return true;
    }

    @Override
    public boolean syncToPlatform(Long afterSaleId) {
        log.info("同步售后单到平台: afterSaleId={}", afterSaleId);
        return true;
    }

    private String generateAfterSaleNo() {
        return "AS" + System.currentTimeMillis();
    }
}
