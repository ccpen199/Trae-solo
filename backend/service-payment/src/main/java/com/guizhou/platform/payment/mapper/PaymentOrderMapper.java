package com.guizhou.platform.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.payment.entity.PaymentOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Mapper
public interface PaymentOrderMapper extends BaseMapper<PaymentOrder> {

    @Select("SELECT COUNT(*) FROM payment_order WHERE deleted = 0 AND payment_status = #{status}")
    Long countByStatus(@Param("status") Integer status);

    @Select("SELECT SUM(pay_amount) FROM payment_order WHERE deleted = 0 AND payment_status = 2")
    BigDecimal sumSuccessAmount();

    @Select("SELECT SUM(pay_amount) FROM payment_order WHERE deleted = 0 AND pay_time >= #{startTime}")
    BigDecimal sumAmountByTime(@Param("startTime") LocalDateTime startTime);

    @Update("UPDATE payment_order SET payment_status = #{status}, update_time = NOW() WHERE order_no = #{orderNo} AND deleted = 0")
    int updateStatusByOrderNo(@Param("orderNo") String orderNo, @Param("status") Integer status);
}
