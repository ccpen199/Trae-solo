package com.fooddelivery.engine;

import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.entity.PrintTask;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.mapper.PrintTaskMapper;
import com.fooddelivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class AutoPrintEngine {

    private final PrintTaskMapper printTaskMapper;
    private final OrderMainMapper orderMainMapper;
    private final RabbitTemplate rabbitTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLogService auditLogService;

    @Value("${print.engine.default-copies:2}")
    private Integer defaultCopies;

    @Value("${print.engine.kitchen-template:default-kitchen}")
    private String kitchenTemplate;

    @Value("${print.engine.receipt-template:default-receipt}")
    private String receiptTemplate;

    private static final String PRINT_QUEUE = "print.task.queue";
    private static final String PRINT_CACHE_PREFIX = "print:task:";

    public PrintResult autoPrintKitchenOrder(OrderMain order, String printerSn, String printerName) {
        log.info("自动打印引擎处理厨房单: orderId={}, printer={}", order.getId(), printerSn);
        
        PrintTask kitchenTask = createPrintTask(order, printerSn, printerName, 1, kitchenTemplate);
        
        String printContent = generateKitchenPrintContent(order);
        kitchenTask.setPrintContent(printContent);
        
        printTaskMapper.insert(kitchenTask);

        sendToPrintQueue(kitchenTask);

        updateOrderPrintStatus(order.getId(), 1);

        auditLogService.logEngineProcess(
            "AUTO_PRINT",
            order.getId(),
            order.getOrderNo(),
            "KITCHEN_PRINT",
            "厨房单已发送至打印机: " + printerName,
            buildCalculationBasis(order, kitchenTask, "厨房单")
        );

        PrintResult result = new PrintResult();
        result.setOrderId(order.getId());
        result.setOrderNo(order.getOrderNo());
        result.setPrintTaskId(kitchenTask.getId());
        result.setPrintType(1);
        result.setPrinterSn(printerSn);
        result.setPrinterName(printerName);
        result.setStatus("QUEUED");
        result.setMessage("打印任务已入队");
        result.setPrintTime(LocalDateTime.now());

        log.info("厨房单打印任务已创建: taskId={}", kitchenTask.getId());
        return result;
    }

    public PrintResult autoPrintReceipt(OrderMain order, String printerSn, String printerName) {
        log.info("自动打印引擎处理收银小票: orderId={}, printer={}", order.getId(), printerSn);
        
        PrintTask receiptTask = createPrintTask(order, printerSn, printerName, 2, receiptTemplate);
        
        String printContent = generateReceiptPrintContent(order);
        receiptTask.setPrintContent(printContent);
        
        printTaskMapper.insert(receiptTask);

        sendToPrintQueue(receiptTask);

        updateOrderPrintStatus(order.getId(), order.getPrintCount() + 1);

        auditLogService.logEngineProcess(
            "AUTO_PRINT",
            order.getId(),
            order.getOrderNo(),
            "RECEIPT_PRINT",
            "收银小票已发送至打印机: " + printerName,
            buildCalculationBasis(order, receiptTask, "收银小票")
        );

        PrintResult result = new PrintResult();
        result.setOrderId(order.getId());
        result.setOrderNo(order.getOrderNo());
        result.setPrintTaskId(receiptTask.getId());
        result.setPrintType(2);
        result.setPrinterSn(printerSn);
        result.setPrinterName(printerName);
        result.setStatus("QUEUED");
        result.setMessage("打印任务已入队");
        result.setPrintTime(LocalDateTime.now());

        log.info("收银小票打印任务已创建: taskId={}", receiptTask.getId());
        return result;
    }

    public PrintResult manualPrint(OrderMain order, Integer printType, String printerSn, String printerName) {
        log.info("手动打印: orderId={}, printType={}", order.getId(), printType);
        
        PrintTask task = createPrintTask(order, printerSn, printerName, printType, 
            printType == 1 ? kitchenTemplate : receiptTemplate);
        
        String printContent = printType == 1 
            ? generateKitchenPrintContent(order) 
            : generateReceiptPrintContent(order);
        task.setPrintContent(printContent);
        
        printTaskMapper.insert(task);
        sendToPrintQueue(task);

        auditLogService.logEngineProcess(
            "AUTO_PRINT",
            order.getId(),
            order.getOrderNo(),
            "MANUAL_PRINT",
            "手动打印" + (printType == 1 ? "厨房单" : "收银小票"),
            buildCalculationBasis(order, task, printType == 1 ? "厨房单(手动)" : "收银小票(手动)")
        );

        PrintResult result = new PrintResult();
        result.setOrderId(order.getId());
        result.setOrderNo(order.getOrderNo());
        result.setPrintTaskId(task.getId());
        result.setPrintType(printType);
        result.setPrinterSn(printerSn);
        result.setPrinterName(printerName);
        result.setStatus("QUEUED");
        result.setMessage("手动打印任务已入队");
        result.setPrintTime(LocalDateTime.now());

        return result;
    }

    public void updatePrintStatus(Long taskId, Integer status, String result, String errorMsg) {
        PrintTask task = printTaskMapper.selectById(taskId);
        if (task == null) {
            log.warn("打印任务不存在: taskId={}", taskId);
            return;
        }

        task.setPrintStatus(status);
        task.setPrintResult(result);
        task.setErrorMessage(errorMsg);
        if (status == 2) {
            task.setPrintTime(LocalDateTime.now());
        }
        printTaskMapper.updateById(task);

        if (status == 2) {
            log.info("打印任务成功: taskId={}", taskId);
            auditLogService.logEngineProcess(
                "AUTO_PRINT",
                task.getOrderId(),
                task.getOrderNo(),
                "PRINT_SUCCESS",
                "打印任务完成",
                "{\"taskId\":" + taskId + ",\"status\":\"SUCCESS\"}"
            );
        } else if (status == 3) {
            log.warn("打印任务失败: taskId={}, error={}", taskId, errorMsg);
            auditLogService.logEngineProcess(
                "AUTO_PRINT",
                task.getOrderId(),
                task.getOrderNo(),
                "PRINT_FAILED",
                "打印任务失败: " + errorMsg,
                "{\"taskId\":" + taskId + ",\"status\":\"FAILED\",\"error\":\"" + errorMsg + "\"}"
            );
        }
    }

    private PrintTask createPrintTask(OrderMain order, String printerSn, String printerName, 
                                       Integer printType, String templateCode) {
        PrintTask task = new PrintTask();
        task.setOrderId(order.getId());
        task.setOrderNo(order.getOrderNo());
        task.setStoreId(order.getStoreId());
        task.setPrintType(printType);
        task.setPrinterSn(printerSn);
        task.setPrinterName(printerName);
        task.setTemplateCode(templateCode);
        task.setCopies(defaultCopies);
        task.setPrintStatus(1);
        task.setRetryCount(0);
        task.setSendTime(LocalDateTime.now());
        return task;
    }

    private void sendToPrintQueue(PrintTask task) {
        rabbitTemplate.convertAndSend(PRINT_QUEUE, task);
        
        String cacheKey = PRINT_CACHE_PREFIX + task.getId();
        redisTemplate.opsForValue().set(cacheKey, task, 30, TimeUnit.MINUTES);
        
        log.debug("打印任务已发送至队列: taskId={}", task.getId());
    }

    private void updateOrderPrintStatus(Long orderId, Integer printCount) {
        OrderMain order = orderMainMapper.selectById(orderId);
        if (order != null) {
            order.setPrinted(1);
            order.setPrintCount(printCount);
            order.setLastPrintTime(LocalDateTime.now());
            orderMainMapper.updateById(order);
        }
    }

    private String generateKitchenPrintContent(OrderMain order) {
        StringBuilder sb = new StringBuilder();
        sb.append("================================\n");
        sb.append("          厨房制作单\n");
        sb.append("================================\n");
        sb.append("订单号: ").append(order.getOrderNo()).append("\n");
        sb.append("平台单号: ").append(order.getPlatformOrderNo()).append("\n");
        sb.append("下单时间: ").append(order.getCreateTime()).append("\n");
        sb.append("顾客: ").append(order.getCustomerName()).append("\n");
        sb.append("电话: ").append(maskPhone(order.getCustomerPhone())).append("\n");
        sb.append("地址: ").append(order.getDeliveryAddress()).append("\n");
        if (order.getOrderRemark() != null && !order.getOrderRemark().isEmpty()) {
            sb.append("备注: ").append(order.getOrderRemark()).append("\n");
        }
        sb.append("--------------------------------\n");
        sb.append("【菜品明细】\n");
        sb.append("--------------------------------\n");
        sb.append("* 此处为菜品列表占位\n");
        sb.append("* 实际使用时需从OrderDetail读取\n");
        sb.append("================================\n");
        sb.append("打印时间: ").append(LocalDateTime.now()).append("\n");
        return sb.toString();
    }

    private String generateReceiptPrintContent(OrderMain order) {
        StringBuilder sb = new StringBuilder();
        sb.append("================================\n");
        sb.append("          收银小票\n");
        sb.append("================================\n");
        sb.append("订单号: ").append(order.getOrderNo()).append("\n");
        sb.append("平台单号: ").append(order.getPlatformOrderNo()).append("\n");
        sb.append("下单时间: ").append(order.getCreateTime()).append("\n");
        sb.append("顾客: ").append(order.getCustomerName()).append("\n");
        sb.append("电话: ").append(maskPhone(order.getCustomerPhone())).append("\n");
        sb.append("地址: ").append(order.getDeliveryAddress()).append("\n");
        sb.append("--------------------------------\n");
        sb.append("【金额明细】\n");
        sb.append("--------------------------------\n");
        sb.append("商品金额: ").append(order.getGoodsAmount()).append("元\n");
        sb.append("配送费: ").append(order.getDeliveryFee()).append("元\n");
        sb.append("打包费: ").append(order.getPackageFee()).append("元\n");
        sb.append("优惠金额: ").append(order.getDiscountAmount()).append("元\n");
        sb.append("--------------------------------\n");
        sb.append("实付金额: ").append(order.getPaidAmount()).append("元\n");
        sb.append("================================\n");
        sb.append("打印时间: ").append(LocalDateTime.now()).append("\n");
        return sb.toString();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    private String buildCalculationBasis(OrderMain order, PrintTask task, String printTypeName) {
        return "{" +
            "\"orderId\":" + order.getId() + "," +
            "\"orderNo\":\"" + order.getOrderNo() + "\"," +
            "\"printTaskId\":" + task.getId() + "," +
            "\"printType\":" + task.getPrintType() + "," +
            "\"printTypeName\":\"" + printTypeName + "\"," +
            "\"printerSn\":\"" + task.getPrinterSn() + "\"," +
            "\"printerName\":\"" + task.getPrinterName() + "\"," +
            "\"templateCode\":\"" + task.getTemplateCode() + "\"," +
            "\"copies\":" + task.getCopies() + "," +
            "\"sendTime\":\"" + task.getSendTime() + "\"" +
            "}";
    }

    @lombok.Data
    public static class PrintResult {
        private Long orderId;
        private String orderNo;
        private Long printTaskId;
        private Integer printType;
        private String printerSn;
        private String printerName;
        private String status;
        private String message;
        private LocalDateTime printTime;
    }
}
