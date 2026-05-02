package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inv_stock_journal")
public class InvStockJournal {

    private Long id;

    private Long orgId;

    private Long productId;

    private String journalType;

    private String refType;

    private Long refId;

    private BigDecimal beforeQty;

    private BigDecimal changeQty;

    private BigDecimal afterQty;

    private Long createBy;

    private LocalDateTime createTime;
}
