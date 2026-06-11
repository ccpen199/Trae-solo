package com.guizhou.platform.living.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.living.entity.ServiceProviderStaff;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;

@Mapper
public interface ServiceProviderStaffMapper extends BaseMapper<ServiceProviderStaff> {

    @Select("SELECT COUNT(*) FROM service_provider_staff WHERE deleted = 0 AND provider_id = #{providerId}")
    Long countByProvider(@Param("providerId") Long providerId);

    @Update("UPDATE service_provider_staff SET avg_score = #{avgScore}, total_orders = total_orders + 1 WHERE id = #{id} AND deleted = 0")
    int updateScoreAndIncrementOrders(@Param("id") Long id, @Param("avgScore") BigDecimal avgScore);
}
