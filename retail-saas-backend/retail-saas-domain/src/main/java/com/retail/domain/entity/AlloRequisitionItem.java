package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("allo_requisition_item")
public class AlloRequisitionItem {

    private Long id;

    private Long requisitionId;

    private Long productId;

    private BigDecimal reqQty;

    private BigDecimal actualOutQty;

    private BigDecimal actualInQty;

    private String remark;

    private LocalDateTime createTime;
}
