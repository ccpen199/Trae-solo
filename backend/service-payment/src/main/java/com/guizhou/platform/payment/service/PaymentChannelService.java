package com.guizhou.platform.payment.service;

import com.guizhou.platform.payment.entity.PaymentChannel;

import java.util.List;

public interface PaymentChannelService {

    List<PaymentChannel> listEnabledChannels();

    PaymentChannel getChannelByType(Integer channelType);

    String createChannelOrder(PaymentChannel channel, String orderNo, String amount, String subject, String notifyUrl);

    boolean verifyCallback(Integer channelType, String callbackData);

    void updateDailyUsed(Integer channelType, String amount);
}
