package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("member_coupon")
public class MemberCoupon {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private Long couponId;
    private String status;
    private LocalDateTime obtainedAt;
    private LocalDateTime usedAt;
    private Long usedTransactionId;
}
