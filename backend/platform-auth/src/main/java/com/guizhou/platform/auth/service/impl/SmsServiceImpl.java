package com.guizhou.platform.auth.service.impl;

import com.guizhou.platform.auth.service.SmsService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    private static final String SMS_CODE_PREFIX = "auth:sms:";
    private static final int CODE_LENGTH = 6;
    private static final int EXPIRE_MINUTES = 5;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public void sendCode(String phone, String bizType) {
        String code = generateCode();
        String key = SMS_CODE_PREFIX + bizType + ":" + phone;
        redisTemplate.opsForValue().set(key, code, EXPIRE_MINUTES, TimeUnit.MINUTES);
        log.info("发送短信验证码: phone={}, bizType={}, code={}", phone, bizType, code);
    }

    @Override
    public boolean verifyCode(String phone, String code, String bizType) {
        String key = SMS_CODE_PREFIX + bizType + ":" + phone;
        Object storedCode = redisTemplate.opsForValue().get(key);
        if (storedCode == null) {
            return false;
        }
        if (storedCode.toString().equals(code)) {
            redisTemplate.delete(key);
            return true;
        }
        return false;
    }

    private String generateCode() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}
