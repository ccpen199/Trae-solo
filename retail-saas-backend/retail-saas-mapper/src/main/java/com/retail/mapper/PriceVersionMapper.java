package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.PriceVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PriceVersionMapper extends BaseMapper<PriceVersion> {

    @Select("SELECT * FROM price_version WHERE product_id = #{productId} AND price_system_id = #{priceSystemId} " +
            "AND status = 'ACTIVE' AND effective_time <= #{now} AND (expire_time IS NULL OR expire_time > #{now}) " +
            "ORDER BY effective_time DESC LIMIT 1")
    PriceVersion selectCurrentActivePrice(@Param("productId") Long productId, 
                                           @Param("priceSystemId") Long priceSystemId,
                                           @Param("now") LocalDateTime now);

    @Select("SELECT * FROM price_version WHERE product_id = #{productId} ORDER BY create_time DESC")
    List<PriceVersion> selectByProductId(@Param("productId") Long productId);

    @Select("SELECT * FROM price_version WHERE status = #{status} ORDER BY create_time")
    List<PriceVersion> selectByStatus(@Param("status") String status);
}
