package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("store")
public class Store extends BaseEntity {

    private Long merchantId;

    private String storeName;

    private String storeAddress;

    private String contactPhone;

    private String longitude;

    private String latitude;

    private Integer businessStatus;

    private String openTime;

    private String closeTime;

    private String storeLogo;
}
