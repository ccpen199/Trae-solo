package com.guizhou.platform.subsidyverify.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidyverify.entity.MerchantCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MerchantCategoryMapper extends BaseMapper<MerchantCategory> {

    @Select("SELECT * FROM merchant_category WHERE deleted = 0 AND enabled = 1 ORDER BY sort_order")
    List<MerchantCategory> listEnabled();

    @Select("SELECT * FROM merchant_category WHERE deleted = 0 AND category_code = #{categoryCode}")
    MerchantCategory getByCode(@Param("categoryCode") String categoryCode);
}
