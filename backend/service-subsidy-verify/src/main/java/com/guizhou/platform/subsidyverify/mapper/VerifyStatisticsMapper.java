package com.guizhou.platform.subsidyverify.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidyverify.entity.VerifyStatistics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface VerifyStatisticsMapper extends BaseMapper<VerifyStatistics> {

    @Select("SELECT COALESCE(SUM(verify_count), 0) FROM verify_statistics WHERE deleted = 0 AND stat_date = #{statDate}")
    Long sumVerifyCountByDate(@Param("statDate") String statDate);

    @Select("SELECT COALESCE(SUM(total_subsidy_amount), 0) FROM verify_statistics WHERE deleted = 0 AND stat_date BETWEEN #{startDate} AND #{endDate}")
    BigDecimal sumSubsidyAmountByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    @Select("SELECT merchant_category, SUM(verify_count) as total_count, SUM(total_subsidy_amount) as total_amount " +
            "FROM verify_statistics WHERE deleted = 0 AND stat_date BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY merchant_category ORDER BY total_count DESC")
    List<Map<String, Object>> getCategoryStatistics(@Param("startDate") String startDate, @Param("endDate") String endDate);
}
