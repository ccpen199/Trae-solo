package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("price_system")
public class PriceSystem extends BaseEntity {

    private String systemName;

    private String systemCode;

    private Integer priority;

    private Integer status;

    private String description;
}
