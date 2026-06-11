package com.guizhou.platform.subsidyverify.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface VerifyRecordMapper extends BaseMapper<VerifyRecord> {

    @Select("SELECT COUNT(*) FROM verify_record WHERE deleted = 0 AND verify_status = #{status}")
    Long countByStatus(@Param("status") Integer status);

    @Select("SELECT SUM(subsidy_amount) FROM verify_record WHERE deleted = 0 AND verify_status = 2")
    BigDecimal sumSubsidyAmount();

    @Select("SELECT SUM(subsidy_amount) FROM verify_record WHERE deleted = 0 AND verify_status = 2 AND verify_time >= #{startTime}")
    BigDecimal sumSubsidyAmountByTime(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT DATE_FORMAT(verify_time, '%Y-%m-%d') as date, COUNT(*) as count, SUM(subsidy_amount) as amount " +
            "FROM verify_record WHERE deleted = 0 AND verify_status = 2 AND verify_time >= #{startTime} " +
            "GROUP BY DATE_FORMAT(verify_time, '%Y-%m-%d') ORDER BY date")
    List<Map<String, Object>> getDailyVerifyTrend(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT merchant_category, COUNT(*) as count, SUM(subsidy_amount) as amount " +
            "FROM verify_record WHERE deleted = 0 AND verify_status = 2 " +
            "GROUP BY merchant_category ORDER BY count DESC")
    List<Map<String, Object>> getVerifyCountByCategory();

    @Update("UPDATE verify_record SET verify_status = #{status}, update_time = NOW() WHERE id = #{id} AND deleted = 0")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);
}
