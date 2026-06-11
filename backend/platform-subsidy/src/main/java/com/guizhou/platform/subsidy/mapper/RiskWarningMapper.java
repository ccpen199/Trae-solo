package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.RiskWarning;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface RiskWarningMapper extends BaseMapper<RiskWarning> {

    @Select("SELECT COUNT(*) FROM risk_warning WHERE deleted = 0 AND warning_status = 0")
    Long countPending();

    @Select("SELECT COUNT(*) FROM risk_warning WHERE deleted = 0 AND risk_level >= 3")
    Long countHighRisk();

    @Select("SELECT COUNT(*) FROM risk_warning WHERE deleted = 0 AND create_time >= #{startTime}")
    Long countByCreateTime(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT risk_type, COUNT(*) as count FROM risk_warning WHERE deleted = 0 GROUP BY risk_type")
    List<Map<String, Object>> countByRiskType();

    @Select("SELECT * FROM risk_warning WHERE deleted = 0 AND beneficiary_id = #{beneficiaryId} ORDER BY create_time DESC")
    List<RiskWarning> findByBeneficiaryId(@Param("beneficiaryId") String beneficiaryId);

    @Select("SELECT * FROM risk_warning WHERE deleted = 0 AND warning_status = 0 AND risk_level >= 3 ORDER BY risk_level DESC, create_time")
    List<RiskWarning> findHighRiskPending();
}
