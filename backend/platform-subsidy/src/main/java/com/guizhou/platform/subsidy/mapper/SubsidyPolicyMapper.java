package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.SubsidyPolicy;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface SubsidyPolicyMapper extends BaseMapper<SubsidyPolicy> {

    @Select("SELECT policy_type, COUNT(*) as count FROM subsidy_policy WHERE deleted = 0 GROUP BY policy_type")
    List<Map<String, Object>> countByPolicyType();

    @Select("SELECT department, SUM(total_budget) as total FROM subsidy_policy WHERE deleted = 0 GROUP BY department")
    List<Map<String, Object>> sumBudgetByDepartment();

    @Select("SELECT SUM(remaining_budget) FROM subsidy_policy WHERE deleted = 0 AND policy_status = 2")
    BigDecimal sumRemainingBudget();

    int updateGrantedAmount(@Param("policyId") Long policyId, @Param("amount") BigDecimal amount);
}
