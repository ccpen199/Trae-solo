package com.guizhou.platform.auth.service;

public interface SmsService {

    void sendCode(String phone, String bizType);

    boolean verifyCode(String phone, String code, String bizType);
}
