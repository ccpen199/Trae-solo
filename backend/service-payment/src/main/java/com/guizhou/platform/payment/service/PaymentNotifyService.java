package com.guizhou.platform.payment.service;

import com.guizhou.platform.payment.dto.request.PayCallbackDTO;

public interface PaymentNotifyService {

    void sendPaySuccessNotify(PayCallbackDTO dto);

    void sendPayFailNotify(PayCallbackDTO dto);

    void retryNotify(String orderNo);
}
