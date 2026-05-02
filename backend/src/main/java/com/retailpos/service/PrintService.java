package com.retailpos.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrintService {

    private static final byte[] ESC = {0x1B};
    private static final byte[] LF = {0x0A};
    private static final byte[] GS = {0x1D};
    private static final byte[] RESET = {0x1B, 0x40};
    private static final byte[] CENTER = {0x1B, 0x61, 0x01};
    private static final byte[] BOLD_ON = {0x1B, 0x45, 0x01};
    private static final byte[] BOLD_OFF = {0x1B, 0x45, 0x00};
    private static final byte[] DOUBLE_HEIGHT = {0x1B, 0x21, 0x10};
    private static final byte[] NORMAL_HEIGHT = {0x1B, 0x21, 0x00};
    private static final byte[] CUT = {0x1D, 0x56, 0x00};

    public void printReceipt(String content, String printerIp, int printerPort) {
        try (Socket socket = new Socket(printerIp, printerPort);
             OutputStream outputStream = socket.getOutputStream()) {

            byte[] receiptData = generateReceiptData(content);
            outputStream.write(receiptData);
            outputStream.flush();

            log.info("小票打印成功: printer={}:{}", printerIp, printerPort);

        } catch (IOException e) {
            log.error("打印失败: {}", e.getMessage(), e);
            throw new RuntimeException("打印失败: " + e.getMessage(), e);
        }
    }

    private byte[] generateReceiptData(String content) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            // 重置打印机
            baos.write(RESET);
            
            // 标题
            baos.write(CENTER);
            baos.write(BOLD_ON);
            baos.write(DOUBLE_HEIGHT);
            baos.write("RetailPOS".getBytes());
            baos.write(LF);
            baos.write("线下门店管理系统".getBytes());
            baos.write(LF);
            baos.write(NORMAL_HEIGHT);
            baos.write(BOLD_OFF);
            baos.write(LF);

            // 内容
            baos.write(content.getBytes());
            baos.write(LF);
            baos.write(LF);

            // 底部
            baos.write(CENTER);
            baos.write("感谢您的光临!".getBytes());
            baos.write(LF);
            baos.write("欢迎再次光临!".getBytes());
            baos.write(LF);
            baos.write(LF);

            // 切纸
            baos.write(CUT);

        } catch (IOException e) {
            log.error("生成打印数据失败", e);
        }
        return baos.toByteArray();
    }

    public String generateReceiptContent(String transactionNo, String storeName, String cashierName,
                                       String transactionTime, String memberName, int memberPoints,
                                       String paymentMethod, double totalAmount, double discountAmount,
                                       double actualAmount, int pointsEarned, int pointsUsed) {
        StringBuilder sb = new StringBuilder();

        sb.append("====================================\n");
        sb.append("交易号: " + transactionNo + "\n");
        sb.append("门店: " + storeName + "\n");
        sb.append("收银员: " + cashierName + "\n");
        sb.append("交易时间: " + transactionTime + "\n");
        if (memberName != null) {
            sb.append("会员: " + memberName + "\n");
            sb.append("会员积分: " + memberPoints + "\n");
        }
        sb.append("====================================\n");
        sb.append("商品金额: ¥" + String.format("%.2f", totalAmount) + "\n");
        sb.append("折扣金额: ¥" + String.format("%.2f", discountAmount) + "\n");
        if (pointsUsed > 0) {
            sb.append("积分抵扣: " + pointsUsed + "点\n");
        }
        sb.append("====================================\n");
        sb.append("实收金额: ¥" + String.format("%.2f", actualAmount) + "\n");
        sb.append("支付方式: " + paymentMethod + "\n");
        if (pointsEarned > 0) {
            sb.append("获得积分: " + pointsEarned + "点\n");
        }
        sb.append("====================================\n");

        return sb.toString();
    }
}