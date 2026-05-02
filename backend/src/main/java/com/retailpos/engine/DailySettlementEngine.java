package com.retailpos.engine;

import com.retailpos.dto.DailySettlementDTO;
import com.retailpos.dto.TransactionFlowDTO;
import com.retailpos.entity.*;
import com.retailpos.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailySettlementEngine {

    private final TransactionMapper transactionMapper;
    private final RefundRecordMapper refundRecordMapper;
    private final DailySettlementMapper dailySettlementMapper;
    private final StoreMapper storeMapper;

    @Transactional
    public DailySettlementDTO generateDailySettlement(Long storeId, LocalDate date) {
        DailySettlement existing = dailySettlementMapper.selectOne(
            new LambdaQueryWrapper<DailySettlement>()
                .eq(DailySettlement::getStoreId, storeId)
                .eq(DailySettlement::getSettlementDate, date)
        );

        if (existing != null) {
            log.warn("日结报表已存在: storeId={}, date={}", storeId, date);
            return convertToDTO(existing);
        }

        LocalDateTime startTime = date.atStartOfDay();
        LocalDateTime endTime = date.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionMapper.selectList(
            new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getStoreId, storeId)
                .ge(Transaction::getTransactionTime, startTime)
                .le(Transaction::getTransactionTime, endTime)
                .eq(Transaction::getStatus, "COMPLETED")
        );

        List<Transaction> refundedTransactions = transactionMapper.selectList(
            new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getStoreId, storeId)
                .ge(Transaction::getTransactionTime, startTime)
                .le(Transaction::getTransactionTime, endTime)
                .eq(Transaction::getStatus, "REFUNDED")
        );

        DailySettlement settlement = new DailySettlement();
        settlement.setStoreId(storeId);
        settlement.setSettlementDate(date);

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalRefund = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;
        BigDecimal wechatSales = BigDecimal.ZERO;
        BigDecimal alipaySales = BigDecimal.ZERO;
        int pointsRedeemed = 0;
        int pointsEarned = 0;
        int couponsUsed = 0;
        int transactionCount = transactions.size();
        int refundCount = refundedTransactions.size();

        for (Transaction tx : transactions) {
            totalSales = totalSales.add(tx.getActualAmount());
            totalDiscount = totalDiscount.add(tx.getDiscountAmount());
            pointsRedeemed += tx.getPointsUsed() != null ? tx.getPointsUsed() : 0;
            if (tx.getCouponId() != null) {
                couponsUsed++;
            }

            switch (tx.getPaymentMethod()) {
                case "CASH":
                    cashSales = cashSales.add(tx.getActualAmount());
                    break;
                case "CARD":
                    cardSales = cardSales.add(tx.getActualAmount());
                    break;
                case "WECHAT":
                    wechatSales = wechatSales.add(tx.getActualAmount());
                    break;
                case "ALIPAY":
                    alipaySales = alipaySales.add(tx.getActualAmount());
                    break;
            }
        }

        for (Transaction tx : refundedTransactions) {
            totalRefund = totalRefund.add(tx.getActualAmount());
        }

        settlement.setTotalSales(totalSales);
        settlement.setTotalRefund(totalRefund);
        settlement.setTotalDiscount(totalDiscount);
        settlement.setCashSales(cashSales);
        settlement.setCardSales(cardSales);
        settlement.setWechatSales(wechatSales);
        settlement.setAlipaySales(alipaySales);
        settlement.setPointsRedeemed(pointsRedeemed);
        settlement.setPointsEarned(pointsEarned);
        settlement.setCouponsUsed(couponsUsed);
        settlement.setTransactionCount(transactionCount);
        settlement.setRefundCount(refundCount);

        dailySettlementMapper.insert(settlement);

        log.info("日结生成成功: storeId={}, date={}, totalSales={}, transactions={}",
                storeId, date, totalSales, transactionCount);

        return convertToDTO(settlement);
    }

    public List<TransactionFlowDTO> getTransactionFlow(Long storeId, LocalDate date) {
        LocalDateTime startTime = date.atStartOfDay();
        LocalDateTime endTime = date.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionMapper.selectList(
            new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getStoreId, storeId)
                .ge(Transaction::getTransactionTime, startTime)
                .le(Transaction::getTransactionTime, endTime)
                .orderByDesc(Transaction::getTransactionTime)
        );

        return transactions.stream().map(this::convertToFlowDTO).collect(Collectors.toList());
    }

    public Map<String, Object> getSettlementSummary(Long storeId, LocalDate startDate, LocalDate endDate) {
        List<DailySettlement> settlements = dailySettlementMapper.selectList(
            new LambdaQueryWrapper<DailySettlement>()
                .eq(DailySettlement::getStoreId, storeId)
                .ge(DailySettlement::getSettlementDate, startDate)
                .le(DailySettlement::getSettlementDate, endDate)
        );

        Map<String, Object> summary = new HashMap<>();

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalRefund = BigDecimal.ZERO;
        int totalTransactions = 0;
        int totalRefunds = 0;

        for (DailySettlement s : settlements) {
            totalSales = totalSales.add(s.getTotalSales());
            totalRefund = totalRefund.add(s.getTotalRefund());
            totalTransactions += s.getTransactionCount();
            totalRefunds += s.getRefundCount();
        }

        summary.put("totalSales", totalSales);
        summary.put("totalRefund", totalRefund);
        summary.put("netSales", totalSales.subtract(totalRefund));
        summary.put("totalTransactions", totalTransactions);
        summary.put("totalRefunds", totalRefunds);
        summary.put("avgTransactionAmount", totalTransactions > 0
                ? totalSales.divide(new BigDecimal(totalTransactions), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO);

        return summary;
    }

    private DailySettlementDTO convertToDTO(DailySettlement settlement) {
        DailySettlementDTO dto = new DailySettlementDTO();
        dto.setId(settlement.getId());
        dto.setStoreId(settlement.getStoreId());
        dto.setSettlementDate(settlement.getSettlementDate());
        dto.setTotalSales(settlement.getTotalSales());
        dto.setTotalRefund(settlement.getTotalRefund());
        dto.setTotalDiscount(settlement.getTotalDiscount());
        dto.setCashSales(settlement.getCashSales());
        dto.setCardSales(settlement.getCardSales());
        dto.setWechatSales(settlement.getWechatSales());
        dto.setAlipaySales(settlement.getAlipaySales());
        dto.setPointsRedeemed(settlement.getPointsRedeemed());
        dto.setPointsEarned(settlement.getPointsEarned());
        dto.setCouponsUsed(settlement.getCouponsUsed());
        dto.setTransactionCount(settlement.getTransactionCount());
        dto.setRefundCount(settlement.getRefundCount());

        Store store = storeMapper.selectById(settlement.getStoreId());
        if (store != null) {
            dto.setStoreName(store.getStoreName());
        }

        return dto;
    }

    private TransactionFlowDTO convertToFlowDTO(Transaction tx) {
        TransactionFlowDTO dto = new TransactionFlowDTO();
        dto.setTransactionNo(tx.getTransactionNo());
        dto.setTotalAmount(tx.getTotalAmount());
        dto.setDiscountAmount(tx.getDiscountAmount());
        dto.setActualAmount(tx.getActualAmount());
        dto.setPaymentMethod(tx.getPaymentMethod());
        dto.setStatus(tx.getStatus());
        dto.setTransactionTime(tx.getTransactionTime());
        return dto;
    }
}
