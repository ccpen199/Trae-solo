package com.fooddelivery.service;

import com.fooddelivery.entity.PlatformAuth;
import com.fooddelivery.enums.PlatformType;

import java.util.List;

public interface PlatformAuthService {

    String generateAuthUrl(Long storeId, PlatformType platformType);

    PlatformAuth handleCallback(Long storeId, PlatformType platformType, String code, String state);

    PlatformAuth getAuthByStoreAndPlatform(Long storeId, Integer platformType);

    List<PlatformAuth> getAuthsByStore(Long storeId);

    boolean refreshToken(Long authId);

    boolean revokeAuth(Long authId);

    boolean isAuthValid(Long storeId, Integer platformType);
}
