package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.Coupon;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CouponMapper extends BaseMapper<Coupon> {
}
