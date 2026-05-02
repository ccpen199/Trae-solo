package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.SysOrg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysOrgMapper extends BaseMapper<SysOrg> {

    @Select("SELECT * FROM sys_org WHERE parent_id = #{parentId} AND deleted = 0 ORDER BY sort_order")
    List<SysOrg> selectByParentId(@Param("parentId") Long parentId);

    @Select("SELECT * FROM sys_org WHERE path LIKE CONCAT(#{path}, '%') AND deleted = 0 ORDER BY path")
    List<SysOrg> selectByPathLike(@Param("path") String path);

    @Select("SELECT * FROM sys_org WHERE org_type = #{orgType} AND deleted = 0 ORDER BY sort_order")
    List<SysOrg> selectByOrgType(@Param("orgType") String orgType);

    @Select("SELECT * FROM sys_org WHERE org_code = #{orgCode} AND deleted = 0")
    SysOrg selectByOrgCode(@Param("orgCode") String orgCode);
}
