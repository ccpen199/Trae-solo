package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface SubsidyGrantMapper extends BaseMapper<SubsidyGrant> {

    @Select("SELECT COUNT(*) FROM subsidy_grant WHERE deleted = 0 AND grant_status = #{status}")
    Long countByStatus(@Param("status") Integer status);

    @Select("SELECT SUM(granted_amount) FROM subsidy_grant WHERE deleted = 0 AND grant_status >= 7")
    BigDecimal sumGrantedAmount();

    @Select("SELECT SUM(granted_amount) FROM subsidy_grant WHERE deleted = 0 AND grant_time >= #{startTime}")
    BigDecimal sumGrantedAmountByTime(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT COUNT(*) FROM subsidy_grant WHERE deleted = 0 AND create_time >= #{startTime}")
    Long countByCreateTime(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT DATE_FORMAT(create_time, '%Y-%m') as month, COUNT(*) as count, SUM(granted_amount) as amount " +
            "FROM subsidy_grant WHERE deleted = 0 AND create_time >= #{startTime} " +
            "GROUP BY DATE_FORMAT(create_time, '%Y-%m') ORDER BY month")
    List<Map<String, Object>> getMonthlyTrend(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT beneficiary_id, COUNT(*) as cnt FROM subsidy_grant " +
            "WHERE deleted = 0 AND policy_id = #{policyId} AND grant_status >= 5 " +
            "GROUP BY beneficiary_id HAVING cnt > 1")
    List<Map<String, Object>> findDuplicateGrants(@Param("policyId") Long policyId);

    BigDecimal getAverageReviewTime();
}
