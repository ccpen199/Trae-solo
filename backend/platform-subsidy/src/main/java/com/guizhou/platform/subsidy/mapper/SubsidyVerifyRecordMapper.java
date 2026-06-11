package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.SubsidyVerifyRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;

@Mapper
public interface SubsidyVerifyRecordMapper extends BaseMapper<SubsidyVerifyRecord> {

    @Select("SELECT SUM(subsidy_amount) FROM subsidy_verify_record WHERE deleted = 0")
    BigDecimal sumVerifiedAmount();

    @Select("SELECT COUNT(*) FROM subsidy_verify_record WHERE deleted = 0 AND grant_id = #{grantId}")
    Long countByGrantId(@Param("grantId") Long grantId);
}
