package com.retailpos.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
public class BarcodeScannerService {

    private final ConcurrentLinkedQueue<String> barcodeQueue = new ConcurrentLinkedQueue<>();
    private StringBuilder barcodeBuffer = new StringBuilder();

    public void processBarcodeInput(char input) {
        if (input == '\n' || input == '\r') {
            String barcode = barcodeBuffer.toString();
            if (!barcode.isEmpty()) {
                barcodeQueue.offer(barcode);
                log.info("扫码成功: {}", barcode);
                barcodeBuffer.setLength(0);
            }
        } else {
            barcodeBuffer.append(input);
        }
    }

    public String getNextBarcode() {
        return barcodeQueue.poll();
    }

    public boolean hasBarcode() {
        return !barcodeQueue.isEmpty();
    }

    public void clearBuffer() {
        barcodeBuffer.setLength(0);
    }

    public void clearQueue() {
        barcodeQueue.clear();
    }
}
