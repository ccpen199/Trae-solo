package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("member_price")
public class MemberPrice {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private String memberLevel;
    private BigDecimal memberPrice;
}
