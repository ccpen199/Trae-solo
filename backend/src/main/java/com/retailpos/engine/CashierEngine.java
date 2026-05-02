package com.retailpos.engine;

import com.retailpos.dto.*;
import com.retailpos.entity.*;
import com.retailpos.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashierEngine {

    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;
    private final MemberMapper memberMapper;
    private final MemberPriceMapper memberPriceMapper;
    private final TransactionMapper transactionMapper;
    private final TransactionItemMapper transactionItemMapper;
    private final InventoryService inventoryService;
    private final DiscountEngine discountEngine;
    private final MemberPointsEngine memberPointsEngine;

    public ScanResultDTO scanBarcode(String barcode, Long storeId) {
        ScanResultDTO result = new ScanResultDTO();

        Product product = productMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Product>()
                .eq(Product::getBarcode, barcode)
                .eq(Product::getStatus, "ACTIVE")
        );

        if (product == null) {
            result.setFound(false);
            result.setMessage("商品未找到");
            return result;
        }

        Inventory inventory = inventoryMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .eq(Inventory::getProductId, product.getId())
        );

        result.setFound(true);
        result.setProductId(product.getId());
        result.setBarcode(product.getBarcode());
        result.setProductName(product.getProductName());
        result.setPrice(product.getStandardPrice());
        result.setUnit(product.getUnit());
        result.setQuantity(1);
        result.setAvailableStock(inventory != null ? inventory.getQuantity() : 0);
        result.setMessage("商品已找到");

        log.info("扫描商品: barcode={}, productId={}, price={}", barcode, product.getId(), product.getStandardPrice());
        return result;
    }

    public ScanResultDTO scanBarcodeWithMemberPrice(String barcode, Long storeId, Long memberId) {
        ScanResultDTO result = scanBarcode(barcode, storeId);

        if (result.isFound() && memberId != null) {
            Member member = memberMapper.selectById(memberId);
            if (member != null) {
                MemberPrice memberPrice = memberPriceMapper.selectOne(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<MemberPrice>()
                        .eq(MemberPrice::getProductId, result.getProductId())
                        .eq(MemberPrice::getMemberLevel, member.getLevel())
                );
                if (memberPrice != null) {
                    result.setMemberPrice(memberPrice.getMemberPrice());
                }
            }
        }

        return result;
    }

    @Transactional
    public PaymentResultDTO processPayment(OrderDTO order, PaymentDTO payment) {
        PaymentResultDTO result = new PaymentResultDTO();

        try {
            String transactionNo = generateTransactionNo();

            Transaction transaction = new Transaction();
            transaction.setTransactionNo(transactionNo);
            transaction.setStoreId(order.getStoreId());
            transaction.setCashierId(order.getCashierId());
            transaction.setMemberId(order.getMemberId());
            transaction.setTotalAmount(order.getTotalAmount());
            transaction.setDiscountAmount(order.getDiscountAmount());
            transaction.setActualAmount(order.getActualAmount());
            transaction.setPaymentMethod(payment.getPaymentMethod());
            transaction.setPointsUsed(order.getPointsToUse() != null ? order.getPointsToUse() : 0);
            transaction.setPointsDiscount(order.getPointsDiscount() != null ? order.getPointsDiscount() : BigDecimal.ZERO);
            transaction.setCouponId(order.getCouponId());
            transaction.setCouponDiscount(order.getCouponDiscount() != null ? order.getCouponDiscount() : BigDecimal.ZERO);
            transaction.setStatus("COMPLETED");
            transaction.setTransactionTime(LocalDateTime.now());

            transactionMapper.insert(transaction);

            for (OrderItemDTO item : order.getItems()) {
                TransactionItem txItem = new TransactionItem();
                txItem.setTransactionId(transaction.getId());
                txItem.setProductId(item.getProductId());
                txItem.setProductName(item.getProductName());
                txItem.setBarcode(item.getBarcode());
                txItem.setQuantity(item.getQuantity());
                txItem.setUnitPrice(item.getUnitPrice());
                txItem.setDiscountRate(item.getDiscountRate());
                txItem.setSubtotal(item.getSubtotal());
                transactionItemMapper.insert(txItem);

                inventoryService.deductStock(order.getStoreId(), item.getProductId(), item.getQuantity());
            }

            if (order.getMemberId() != null && order.getPointsToUse() != null && order.getPointsToUse() > 0) {
                memberPointsEngine.deductPoints(order.getMemberId(), order.getPointsToUse());
            }

            if (order.getMemberId() != null) {
                int earnedPoints = memberPointsEngine.calculateEarnedPoints(order.getActualAmount());
                memberPointsEngine.addPoints(order.getMemberId(), earnedPoints);
            }

            if (order.getCouponId() != null) {
                memberPointsEngine.useCoupon(order.getMemberId(), order.getCouponId(), transaction.getId());
            }

            result.setSuccess(true);
            result.setTransactionNo(transactionNo);
            result.setActualAmount(order.getActualAmount());
            result.setPaymentMethod(payment.getPaymentMethod());
            result.setTransactionTime(transaction.getTransactionTime());
            result.setMessage("支付成功");

            log.info("支付成功: transactionNo={}, amount={}", transactionNo, order.getActualAmount());

        } catch (Exception e) {
            log.error("支付失败", e);
            result.setSuccess(false);
            result.setMessage("支付失败: " + e.getMessage());
        }

        return result;
    }

    @Transactional
    public RefundDTO processRefund(Long transactionId, RefundDTO refundDTO) {
        Transaction original = transactionMapper.selectById(transactionId);
        if (original == null) {
            throw new RuntimeException("原交易不存在");
        }

        if (!"COMPLETED".equals(original.getStatus())) {
            throw new RuntimeException("该交易不可退款");
        }

        original.setStatus("REFUNDED");
        transactionMapper.updateById(original);

        RefundRecord refundRecord = new RefundRecord();
        refundRecord.setOriginalTransactionId(transactionId);
        refundRecord.setRefundNo(generateRefundNo());
        refundRecord.setRefundAmount(refundDTO.getRefundAmount());
        refundRecord.setRefundReason(refundDTO.getRefundReason());
        refundRecord.setRefundMethod(refundDTO.getRefundMethod());
        refundRecord.setOperatorId(refundDTO.getOperatorId());
        refundRecord.setRefundTime(LocalDateTime.now());

        List<TransactionItem> items = transactionItemMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<TransactionItem>()
                .eq(TransactionItem::getTransactionId, transactionId)
        );

        for (TransactionItem item : items) {
            inventoryService.addStock(original.getStoreId(), item.getProductId(), item.getQuantity());
        }

        if (original.getMemberId() != null) {
            if (original.getPointsUsed() != null && original.getPointsUsed() > 0) {
                memberPointsEngine.addPoints(original.getMemberId(), original.getPointsUsed());
            }

            int earnedPoints = memberPointsEngine.calculateEarnedPoints(original.getActualAmount());
            memberPointsEngine.deductPoints(original.getMemberId(), earnedPoints);
        }

        log.info("退款成功: transactionId={}, refundAmount={}", transactionId, refundDTO.getRefundAmount());
        return refundDTO;
    }

    public ReceiptDTO getReceiptData(String transactionNo) {
        Transaction transaction = transactionMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getTransactionNo, transactionNo)
        );

        if (transaction == null) {
            return null;
        }

        ReceiptDTO receipt = new ReceiptDTO();
        receipt.setTransactionNo(transaction.getTransactionNo());
        receipt.setPaymentMethod(transaction.getPaymentMethod());
        receipt.setTotalAmount(transaction.getTotalAmount());
        receipt.setDiscountAmount(transaction.getDiscountAmount());
        receipt.setActualAmount(transaction.getActualAmount());
        receipt.setTransactionTime(transaction.getTransactionTime());
        receipt.setPointsUsed(transaction.getPointsUsed());

        if (transaction.getMemberId() != null) {
            Member member = memberMapper.selectById(transaction.getMemberId());
            if (member != null) {
                receipt.setMemberName(member.getName());
                receipt.setMemberPoints(member.getPointsBalance());
            }
        }

        return receipt;
    }

    private String generateTransactionNo() {
        return "TX" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
               + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String generateRefundNo() {
        return "RF" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
               + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
