package com.guizhou.platform.subsidyverify.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidyverify.entity.Merchant;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MerchantMapper extends BaseMapper<Merchant> {

    @Select("SELECT COUNT(*) FROM merchant WHERE deleted = 0 AND status = #{status}")
    Long countByStatus(@Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM merchant WHERE deleted = 0 AND category_code = #{categoryCode}")
    Long countByCategoryCode(@Param("categoryCode") String categoryCode);

    @Update("UPDATE merchant SET status = #{status}, update_time = NOW() WHERE id = #{id} AND deleted = 0")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Update("UPDATE merchant SET verify_count = verify_count + 1, update_time = NOW() WHERE id = #{id} AND deleted = 0")
    int incrementVerifyCount(@Param("id") Long id);
}
