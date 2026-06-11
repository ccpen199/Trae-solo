package com.guizhou.platform.living.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.living.entity.ServiceEvaluate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;

@Mapper
public interface ServiceEvaluateMapper extends BaseMapper<ServiceEvaluate> {

    @Select("SELECT AVG(score) FROM service_evaluate WHERE deleted = 0 AND provider_id = #{providerId}")
    BigDecimal avgScoreByProvider(@Param("providerId") Long providerId);

    @Select("SELECT AVG(score) FROM service_evaluate WHERE deleted = 0 AND staff_id = #{staffId}")
    BigDecimal avgScoreByStaff(@Param("staffId") Long staffId);

    @Select("SELECT COUNT(*) FROM service_evaluate WHERE deleted = 0 AND provider_id = #{providerId}")
    Long countByProvider(@Param("providerId") Long providerId);
}
