package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inv_stock")
public class InvStock extends BaseEntity {

    private Long orgId;

    private Long productId;

    private BigDecimal quantity;

    private BigDecimal lockedQuantity;

    private BigDecimal safetyStock;

    private LocalDateTime lastSyncTime;
}
