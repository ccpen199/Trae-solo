package com.guizhou.platform.datashare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.datashare.entity.DataPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DataPermissionMapper extends BaseMapper<DataPermission> {

    @Select("SELECT * FROM data_permission WHERE api_id = #{apiId} AND status = '1' AND deleted = 0 ORDER BY priority DESC")
    List<DataPermission> selectByApiId(@Param("apiId") Long apiId);

    @Select("SELECT * FROM data_permission WHERE api_code = #{apiCode} AND (user_id = #{userId} OR role_code = #{roleCode} OR dept_code = #{deptCode}) AND status = '1' AND deleted = 0 ORDER BY priority DESC")
    List<DataPermission> selectByApiCodeAndUser(@Param("apiCode") String apiCode, @Param("userId") String userId,
                                                @Param("roleCode") String roleCode, @Param("deptCode") String deptCode);
}
