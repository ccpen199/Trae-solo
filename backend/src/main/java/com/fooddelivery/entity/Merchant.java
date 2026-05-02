package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("merchant")
public class Merchant extends BaseEntity {

    private String merchantName;

    private String contactName;

    private String contactPhone;

    private String businessLicense;

    private String foodServiceLicense;

    private Integer status;

    private Long ownerId;
}
