package com.guizhou.platform.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.payment.entity.PaymentRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface PaymentRecordMapper extends BaseMapper<PaymentRecord> {

    @Select("SELECT COUNT(*) FROM payment_record WHERE deleted = 0 AND user_id = #{userId} AND bill_type = #{billType}")
    Long countByUserAndType(@Param("userId") Long userId, @Param("billType") Integer billType);

    @Select("SELECT SUM(pay_amount) FROM payment_record WHERE deleted = 0 AND user_id = #{userId} AND payment_status = 2")
    BigDecimal sumUserPaidAmount(@Param("userId") Long userId);

    @Select("SELECT bill_type, COUNT(*) as count, SUM(pay_amount) as amount FROM payment_record " +
            "WHERE deleted = 0 AND payment_status = 2 AND pay_time >= #{startTime} " +
            "GROUP BY bill_type ORDER BY bill_type")
    List<Map<String, Object>> getBillTypeStatistics(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT DATE_FORMAT(pay_time, '%Y-%m') as month, COUNT(*) as count, SUM(pay_amount) as amount " +
            "FROM payment_record WHERE deleted = 0 AND payment_status = 2 AND pay_time >= #{startTime} " +
            "GROUP BY DATE_FORMAT(pay_time, '%Y-%m') ORDER BY month")
    List<Map<String, Object>> getMonthlyTrend(@Param("startTime") LocalDateTime startTime);
}
