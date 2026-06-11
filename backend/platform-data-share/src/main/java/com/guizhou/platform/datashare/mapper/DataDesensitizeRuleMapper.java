package com.guizhou.platform.datashare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.datashare.entity.DataDesensitizeRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DataDesensitizeRuleMapper extends BaseMapper<DataDesensitizeRule> {

    @Select("SELECT * FROM data_desensitize_rule WHERE api_id = #{apiId} AND enabled = 1 AND deleted = 0 ORDER BY sort ASC")
    List<DataDesensitizeRule> selectByApiId(@Param("apiId") Long apiId);

    @Select("SELECT * FROM data_desensitize_rule WHERE api_code = #{apiCode} AND enabled = 1 AND deleted = 0 ORDER BY sort ASC")
    List<DataDesensitizeRule> selectByApiCode(@Param("apiCode") String apiCode);

    @Select("SELECT * FROM data_desensitize_rule WHERE api_id IS NULL AND enabled = 1 AND deleted = 0 ORDER BY sort ASC")
    List<DataDesensitizeRule> selectGlobalRules();
}
