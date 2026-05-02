package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("platform_auth")
public class PlatformAuth extends BaseEntity {

    private Long storeId;

    private Integer platformType;

    private String platformStoreId;

    private String platformStoreName;

    private String appId;

    private String appSecret;

    private String accessToken;

    private String refreshToken;

    private java.time.LocalDateTime expireTime;

    private String authUrl;

    private String callbackUrl;

    private Integer authStatus;

    private String extInfo;
}
