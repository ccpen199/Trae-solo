package com.retailpos.controller;

import com.retailpos.dto.*;
import com.retailpos.engine.CashierEngine;
import com.retailpos.engine.DiscountEngine;
import com.retailpos.engine.MemberPointsEngine;
import com.retailpos.entity.Inventory;
import com.retailpos.entity.Product;
import com.retailpos.entity.Transaction;
import com.retailpos.entity.TransactionItem;
import com.retailpos.mapper.InventoryMapper;
import com.retailpos.mapper.ProductMapper;
import com.retailpos.mapper.TransactionItemMapper;
import com.retailpos.mapper.TransactionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/pos")
@RequiredArgsConstructor
public class PosController {

    private final CashierEngine cashierEngine;
    private final DiscountEngine discountEngine;
    private final MemberPointsEngine memberPointsEngine;
    private final TransactionMapper transactionMapper;
    private final TransactionItemMapper transactionItemMapper;
    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;

    @GetMapping("/products")
    public Result<List<Map<String, Object>>> getProducts(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String keyword) {
        
        LambdaQueryWrapper<Product> queryWrapper = new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, "ACTIVE")
                .orderByDesc(Product::getId);
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            queryWrapper.and(w -> w
                .like(Product::getProductName, keyword)
                .or()
                .like(Product::getBarcode, keyword)
            );
        }
        
        List<Product> products = productMapper.selectList(queryWrapper);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Product product : products) {
            Map<String, Object> item = new HashMap<>();
            item.put("productId", product.getId());
            item.put("id", product.getId());
            item.put("barcode", product.getBarcode());
            item.put("productName", product.getProductName());
            item.put("name", product.getProductName());
            item.put("price", product.getStandardPrice());
            item.put("standardPrice", product.getStandardPrice());
            item.put("unit", product.getUnit());
            
            if (storeId != null) {
                Inventory inventory = inventoryMapper.selectOne(
                    new LambdaQueryWrapper<Inventory>()
                        .eq(Inventory::getStoreId, storeId)
                        .eq(Inventory::getProductId, product.getId())
                );
                item.put("availableStock", inventory != null ? inventory.getQuantity() : 0);
                item.put("lowStockThreshold", inventory != null ? inventory.getLowStockThreshold() : 10);
            } else {
                item.put("availableStock", 0);
                item.put("lowStockThreshold", 10);
            }
            
            result.add(item);
        }
        
        return Result.success(result);
    }

    @PostMapping("/scan")
    public Result<ScanResultDTO> scanBarcode(@RequestBody Map<String, Object> params) {
        String barcode = (String) params.get("barcode");
        Long storeId = Long.valueOf(params.get("storeId").toString());
        Long memberId = params.get("memberId") != null
                ? Long.valueOf(params.get("memberId").toString()) : null;

        ScanResultDTO result;
        if (memberId != null) {
            result = cashierEngine.scanBarcodeWithMemberPrice(barcode, storeId, memberId);
        } else {
            result = cashierEngine.scanBarcode(barcode, storeId);
        }

        return Result.success(result);
    }

    @PostMapping("/order/create")
    public Result<OrderDTO> createOrder(@RequestBody OrderDTO order) {
        DiscountResultDTO discountResult = discountEngine.calculateDiscount(order);
        order.setDiscountAmount(discountResult.getDiscountAmount());
        order.setActualAmount(discountResult.getFinalAmount());

        if (order.getPointsToUse() != null && order.getPointsToUse() > 0) {
            BigDecimal pointsDiscount = memberPointsEngine.calculatePointsDiscount(order.getPointsToUse());
            order.setPointsDiscount(pointsDiscount);
            order.setActualAmount(order.getActualAmount().subtract(pointsDiscount));
        }

        return Result.success(order);
    }

    @PostMapping("/order/pay")
    public Result<PaymentResultDTO> processPayment(@RequestBody Map<String, Object> params) {
        OrderDTO order = convertToOrderDTO((Map<String, Object>) params.get("order"));
        PaymentDTO payment = convertToPaymentDTO((Map<String, Object>) params.get("payment"));

        PaymentResultDTO result = cashierEngine.processPayment(order, payment);
        return Result.success(result);
    }

    @PostMapping("/order/refund")
    public Result<RefundDTO> processRefund(@RequestBody RefundDTO refundDTO) {
        RefundDTO result = cashierEngine.processRefund(refundDTO.getTransactionId(), refundDTO);
        return Result.success(result);
    }

    @GetMapping("/receipt/{transactionId}")
    public Result<Map<String, Object>> getReceipt(@PathVariable Long transactionId) {
        Transaction transaction = transactionMapper.selectById(transactionId);
        if (transaction == null) {
            return Result.fail("交易不存在");
        }

        ReceiptDTO receipt = cashierEngine.getReceiptData(transaction.getTransactionNo());

        List<TransactionItem> items = transactionItemMapper.selectList(
            new LambdaQueryWrapper<TransactionItem>()
                .eq(TransactionItem::getTransactionId, transactionId)
        );

        Map<String, Object> result = new HashMap<>();
        result.put("receipt", receipt);
        result.put("items", items);

        return Result.success(result);
    }

    @GetMapping("/receipt/no/{transactionNo}")
    public Result<Map<String, Object>> getReceiptByNo(@PathVariable String transactionNo) {
        Transaction transaction = transactionMapper.selectOne(
            new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getTransactionNo, transactionNo)
        );

        if (transaction == null) {
            return Result.fail("交易不存在");
        }

        ReceiptDTO receipt = cashierEngine.getReceiptData(transactionNo);

        List<TransactionItem> items = transactionItemMapper.selectList(
            new LambdaQueryWrapper<TransactionItem>()
                .eq(TransactionItem::getTransactionId, transaction.getId())
        );

        Map<String, Object> result = new HashMap<>();
        result.put("receipt", receipt);
        result.put("items", items);

        return Result.success(result);
    }

    @PostMapping("/receipt/print")
    public Result<String> printReceipt(@RequestBody Map<String, Object> params) {
        String transactionNo = (String) params.get("transactionNo");
        log.info("打印小票请求: transactionNo={}", transactionNo);
        return Result.success("打印指令已发送");
    }

    @PostMapping("/discount/calculate")
    public Result<DiscountResultDTO> calculateDiscount(@RequestBody OrderDTO order) {
        DiscountResultDTO result = discountEngine.calculateDiscount(order);
        return Result.success(result);
    }

    private OrderDTO convertToOrderDTO(Map<String, Object> map) {
        OrderDTO order = new OrderDTO();
        order.setStoreId(Long.valueOf(map.get("storeId").toString()));
        order.setCashierId(Long.valueOf(map.get("cashierId").toString()));
        if (map.get("memberId") != null) {
            order.setMemberId(Long.valueOf(map.get("memberId").toString()));
        }
        if (map.get("pointsToUse") != null) {
            order.setPointsToUse(Integer.valueOf(map.get("pointsToUse").toString()));
        }
        if (map.get("couponId") != null) {
            order.setCouponId(Long.valueOf(map.get("couponId").toString()));
        }

        List<Map<String, Object>> items = (List<Map<String, Object>>) map.get("items");
        if (items != null) {
            List<OrderItemDTO> orderItems = items.stream().map(itemMap -> {
                OrderItemDTO item = new OrderItemDTO();
                item.setProductId(Long.valueOf(itemMap.get("productId").toString()));
                item.setBarcode((String) itemMap.get("barcode"));
                item.setProductName((String) itemMap.get("productName"));
                item.setQuantity(Integer.valueOf(itemMap.get("quantity").toString()));
                item.setUnitPrice(new BigDecimal(itemMap.get("unitPrice").toString()));
                item.setSubtotal(new BigDecimal(itemMap.get("subtotal").toString()));
                return item;
            }).collect(Collectors.toList());
            order.setItems(orderItems);

            BigDecimal total = orderItems.stream()
                    .map(OrderItemDTO::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(total);
        }

        return order;
    }

    private PaymentDTO convertToPaymentDTO(Map<String, Object> map) {
        PaymentDTO payment = new PaymentDTO();
        payment.setOrderNo((String) map.get("orderNo"));
        payment.setPaymentMethod((String) map.get("paymentMethod"));
        payment.setAmount(new BigDecimal(map.get("amount").toString()));
        if (map.get("pointsToUse") != null) {
            payment.setPointsToUse(Integer.valueOf(map.get("pointsToUse").toString()));
        }
        if (map.get("couponId") != null) {
            payment.setCouponId(Long.valueOf(map.get("couponId").toString()));
        }
        return payment;
    }
}
