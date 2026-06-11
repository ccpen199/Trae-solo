package com.guizhou.platform.living.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.living.entity.ServiceProvider;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ServiceProviderMapper extends BaseMapper<ServiceProvider> {

    @Select("SELECT COUNT(*) FROM service_provider WHERE deleted = 0 AND category_code = #{categoryCode}")
    Long countByCategoryCode(@Param("categoryCode") String categoryCode);

    @Update("UPDATE service_provider SET avg_score = #{avgScore}, total_evaluates = #{totalEvaluates} WHERE id = #{id} AND deleted = 0")
    int updateScore(@Param("id") Long id, @Param("avgScore") java.math.BigDecimal avgScore, @Param("totalEvaluates") Integer totalEvaluates);

    @Update("UPDATE service_provider SET total_orders = total_orders + 1 WHERE id = #{id} AND deleted = 0")
    int incrementOrderCount(@Param("id") Long id);
}
