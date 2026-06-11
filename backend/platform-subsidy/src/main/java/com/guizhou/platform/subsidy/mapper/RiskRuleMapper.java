package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.RiskRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RiskRuleMapper extends BaseMapper<RiskRule> {

    @Select("SELECT * FROM risk_rule WHERE deleted = 0 AND enabled = 1 ORDER BY priority DESC")
    List<RiskRule> findAllEnabled();

    @Select("SELECT * FROM risk_rule WHERE deleted = 0 AND enabled = 1 AND rule_type = #{ruleType} ORDER BY priority DESC")
    List<RiskRule> findByType(String ruleType);
}
