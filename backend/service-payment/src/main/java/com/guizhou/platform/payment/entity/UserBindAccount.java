package com.guizhou.platform.payment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_bind_account")
public class UserBindAccount extends BaseEntity {

    private Long userId;

    private String accountNo;

    private String accountName;

    private Integer billType;

    private String billTypeName;

    private String companyCode;

    private String companyName;

    private String accountAddr;

    private Integer isDefault;

    private String remark;
}
